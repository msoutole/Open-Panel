const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { print, printError, icons } = require('./logger');
const { commandExists } = require('./checks');
const { retryUntilCondition } = require('./retry');

/**
 * Verifica o status de um container Docker
 * @param {string} serviceName - Nome do serviço/container
 * @returns {{status: string, health: string}} Status do container
 */
function getDockerContainerStatus(serviceName) {
  try {
    const status = execSync(
      `docker inspect --format='{{.State.Status}}' ${serviceName}`,
      { stdio: ['pipe', 'pipe', 'ignore'], timeout: 1500, encoding: 'utf-8' }
    ).trim();
    
    let health = '';
    try {
      health = execSync(
        `docker inspect --format='{{.State.Health.Status}}' ${serviceName}`,
        { stdio: ['pipe', 'pipe', 'ignore'], timeout: 1000, encoding: 'utf-8' }
      ).trim();
    } catch {
      // Sem healthcheck configurado
    }
    
    return { status, health };
  } catch {
    return { status: '', health: '' };
  }
}

/**
 * Aguarda um serviço Docker ficar pronto usando retryUntilCondition
 * @param {string} serviceName - Nome do serviço/container
 * @param {number} maxRetries - Número máximo de tentativas (padrão: 15)
 * @returns {Promise<boolean>} true se o serviço está pronto, false caso contrário
 */
async function waitForDockerService(serviceName, maxRetries = 15) {
  return retryUntilCondition(
    async () => {
      const { status, health } = getDockerContainerStatus(serviceName);
      
      // Se não está rodando, continuar tentando
      if (status !== 'running') {
        return false;
      }
      
      // Container está rodando - verificar healthcheck
      if (!health || health === 'healthy') {
        return true;
      }
      
      // Se está starting ou vazio, continuar tentando
      if (health === 'starting' || health === '') {
        return false;
      }
      
      // Se unhealthy, tentar algumas vezes mas não bloquear muito
      if (health === 'unhealthy') {
        // Retornar true após algumas tentativas para não bloquear
        return false; // Continuar tentando
      }
      
      // Status desconhecido mas container está running
      return true;
    },
    {
      maxRetries,
      delay: 1500,
      timeout: maxRetries * 2000,
    }
  );
}

/**
 * Detecta o comando docker-compose disponível (v1 ou v2)
 * @returns {string|null} Comando docker-compose ou null se não encontrado
 */
function getDockerComposeCommand() {
  // Tentar docker compose (v2) primeiro
  if (commandExists('docker')) {
    try {
      execSync('docker compose version', { stdio: 'ignore', timeout: 5000 });
      return 'docker compose';
    } catch {
      // Continuar para verificar docker-compose
    }
  }

  // Tentar docker-compose (v1)
  if (commandExists('docker-compose')) {
    return 'docker-compose';
  }

  return null;
}

/**
 * Verifica se serviços Docker estão prontos
 * @param {string[]} services - Array de nomes de serviços
 * @returns {Promise<boolean>} true se todos estão prontos
 */
async function verifyServicesReady(services) {
  let allReady = true;
  
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const isReady = await waitForDockerService(service, 15);
    
    if (!isReady) {
      // Verificar se pelo menos está rodando
      try {
        const status = execSync(
          `docker inspect --format='{{.State.Status}}' ${service}`,
          { stdio: ['pipe', 'pipe', 'ignore'], timeout: 2000, encoding: 'utf-8' }
        ).trim();
        
        if (status === 'running') {
          // Para PostgreSQL, fazer verificação rápida de conexão
          if (service === 'openpanel-postgres') {
            try {
              execSync(
                `docker exec ${service} pg_isready -U openpanel -t 2`,
                { stdio: 'ignore', timeout: 3000 }
              );
              print(`${icons.check} ${service} está aceitando conexões`, 'green');
              continue;
            } catch {
              print(`${icons.warn} ${service} está rodando mas ainda não aceita conexões`, 'yellow');
              print(`   Continuando mesmo assim (banco pode estar inicializando)...`, 'dim');
              continue;
            }
          } else {
            // Para outros serviços, se está running, considerar pronto
            print(`${icons.info} ${service} está rodando, continuando...`, 'cyan');
            continue;
          }
        }
      } catch {
        // Ignorar erro de verificação
      }
      allReady = false;
    }
  }
  
  return allReady;
}

/**
 * Inicia containers Docker
 * @returns {Promise<void>}
 */
async function startDockerServices() {
  print(`${icons.info} Iniciando containers Docker...`, 'cyan');

  try {
    const composeCommand = getDockerComposeCommand();
    
    if (!composeCommand) {
      printError(
        'docker-compose não encontrado',
        null,
        [
          'Instale Docker Compose: https://docs.docker.com/compose/install/',
          'Ou use Docker Desktop que inclui Compose'
        ]
      );
      process.exit(1);
    }

    // Verificar se docker-compose.yml existe
    const composeFile = path.join(process.cwd(), 'docker-compose.yml');
    if (!fs.existsSync(composeFile)) {
      printError(
        'docker-compose.yml não encontrado',
        null,
        [
          'Certifique-se de estar no diretório raiz do projeto'
        ]
      );
      process.exit(1);
    }

    print(`${icons.info} Usando: ${composeCommand}`, 'dim');

    // Sempre recriar containers para garantir que usem as configurações mais recentes do .env
    print(`${icons.info} Recriando containers para garantir configurações atualizadas...`, 'cyan');
    
    try {
      // Parar containers existentes (se houver)
      try {
        execSync(`${composeCommand} down`, { stdio: 'ignore', timeout: 60000 });
      } catch (error) {
        // Ignorar erro se não houver containers rodando
      }
      
      // Recriar containers com --force-recreate para garantir senhas corretas
      execSync(`${composeCommand} up -d --force-recreate`, { 
        stdio: 'inherit', 
        timeout: 120000,
        env: { ...process.env }
      });
    } catch (error) {
      // Se falhar, tentar apenas up -d
      print(`${icons.warn} Erro ao recriar, tentando iniciar normalmente...`, 'yellow');
      try {
        execSync(`${composeCommand} up -d`, { 
          stdio: 'inherit', 
          timeout: 120000,
          env: { ...process.env }
        });
      } catch (retryError) {
        printError('Erro ao iniciar containers', retryError, [
          'Verifique se o Docker está rodando',
          'Tente manualmente: docker-compose up -d'
        ]);
        throw retryError;
      }
    }

    print(`${icons.check} Containers Docker iniciados`, 'green');

    // Aguardar serviços críticos
    print(`${icons.info} Aguardando serviços ficarem prontos (máximo 30 segundos)...`, 'cyan');
    const services = ['openpanel-postgres', 'openpanel-redis'];
    
    // Verificar todos os serviços em paralelo
    const servicePromises = services.map(service => waitForDockerService(service, 15));
    const results = await Promise.all(servicePromises);
    
    // Verificar resultados
    const allReady = await verifyServicesReady(services);

    if (!allReady) {
      print(`${icons.warn} Alguns serviços não ficaram completamente prontos, mas continuando...`, 'yellow');
      print(`   O banco pode ainda estar inicializando - isso é normal na primeira vez`, 'dim');
      print(`   Se houver problemas, aguarde alguns segundos e verifique: docker logs openpanel-postgres`, 'dim');
    }

    // Traefik não tem healthcheck, aguardar um pouco
    print(`${icons.info} Aguardando Traefik iniciar...`, 'cyan');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Aguardar um pouco mais para garantir que PostgreSQL está completamente inicializado
    print(`${icons.info} Aguardando PostgreSQL inicializar completamente...`, 'cyan');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    if (error.message.includes('Cannot connect')) {
      printError(
        'Não foi possível conectar ao Docker',
        error,
        [
          'Certifique-se de que o Docker Desktop está rodando',
          'Verifique com: docker info'
        ]
      );
    } else if (error.message.includes('port is already allocated')) {
      printError(
        'Porta já está em uso',
        error,
        [
          'Pare outros containers usando as mesmas portas',
          'Ou altere as portas no docker-compose.yml'
        ]
      );
    } else {
      printError('Erro ao iniciar containers Docker', error, [
        'Verifique logs: docker-compose logs',
        'Verifique se as portas estão disponíveis',
        'Tente: docker-compose down && docker-compose up -d'
      ]);
    }
    process.exit(1);
  }
}

module.exports = {
  getDockerContainerStatus,
  waitForDockerService,
  getDockerComposeCommand,
  startDockerServices,
};

