#!/usr/bin/env node

/**
 * OpenPanel - Script de Inicialização Unificado
 * 
 * Este script faz tudo automaticamente:
 * 1. Verifica pré-requisitos (Node.js, Docker)
 * 2. Cria .env automaticamente com valores seguros
 * 3. Instala dependências npm
 * 4. Inicia containers Docker
 * 5. Aguarda serviços ficarem prontos
 * 6. Configura banco de dados (Prisma)
 * 7. Cria usuário admin padrão
 * 8. Inicia aplicação (API + Web)
 * 
 * Uso: npm start ou node start.js
 */

// Importar módulos utilitários
const logger = require('./scripts/utils/logger');
const checks = require('./scripts/utils/checks');
const env = require('./scripts/utils/env');
const docker = require('./scripts/utils/docker');
const database = require('./scripts/utils/database');
const { processManager, checkAPI } = require('./scripts/utils/process');

const { print, printError, printHeader, icons } = logger;

/**
 * Função principal que orquestra todo o processo de inicialização
 * 1. Verifica pré-requisitos
 * 2. Cria/configura .env
 * 3. Instala dependências
 * 4. Inicia serviços Docker
 * 5. Configura banco de dados
 * 6. Cria usuário admin
 * 7. Inicia API e Web
 */
async function main() {
  try {
    printHeader();

    // Passo 0: Verificar estrutura do projeto
    checks.checkProjectStructure();
    checks.checkWritePermissions();

    // Passo 1: Verificar e instalar pré-requisitos
    print(`${icons.rocket} Verificando e instalando pré-requisitos...`, 'blue');
    console.log();
    await checks.checkNodeVersion();
    await checks.checkDocker();
    console.log();

    // Passo 2: Criar .env
    print(`${icons.rocket} Configurando ambiente...`, 'blue');
    console.log();
    env.createEnvFile();
    console.log();

    // Carregar variáveis de ambiente do .env
    const envCount = env.loadEnv();
    if (envCount > 0) {
      print(`${icons.check} ${envCount} variáveis de ambiente carregadas do .env da raiz`, 'green');
    }

    // Passo 3: Instalar dependências
    print(`${icons.rocket} Instalando dependências...`, 'blue');
    console.log();
    await checks.installDependencies();
    console.log();

    // Passo 4: Iniciar containers Docker
    print(`${icons.rocket} Iniciando serviços Docker...`, 'blue');
    console.log();
    await docker.startDockerServices();
    console.log();

    // Passo 5: Configurar banco de dados
    print(`${icons.rocket} Configurando banco de dados...`, 'blue');
    console.log();
    await database.setupDatabase();
    console.log();

    // Passo 6: Criar usuário admin
    print(`${icons.rocket} Criando usuário administrador...`, 'blue');
    console.log();
    database.createAdminUser();
    console.log();

    // Passo 7: Iniciar aplicação
    print(`${icons.rocket} Iniciando aplicação...`, 'blue');
    console.log();
    print(`${icons.info} Iniciando API e Web em modo desenvolvimento...`, 'cyan');
    print(`${icons.info} Variáveis de ambiente carregadas do .env da raiz`, 'dim');
    print(`${icons.info} Pressione Ctrl+C para parar os serviços`, 'cyan');
    console.log();

    // Garantir que variáveis de ambiente estão carregadas para processos filhos
    env.loadEnv();

    // Iniciar processos usando ProcessManager
    processManager.markProcessesStarted();
    processManager.startAPI({});
    processManager.startWeb({});

    // Aguardar um pouco e verificar se os processos ainda estão rodando
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verificar se os processos ainda estão rodando
    const { api, web } = processManager.areProcessesRunning();
    
    if (!api || !web) {
      if (!api) {
        print(`\n${icons.warn} API não está rodando`, 'yellow');
        if (processManager.apiProcess && processManager.apiProcess.exitCode !== null) {
          print(`   Código de saída: ${processManager.apiProcess.exitCode}`, 'dim');
        }
        print(`   Verifique os logs acima para identificar o problema`, 'dim');
      }
      if (!web) {
        print(`\n${icons.warn} Web não está rodando`, 'yellow');
        if (processManager.webProcess && processManager.webProcess.exitCode !== null) {
          print(`   Código de saída: ${processManager.webProcess.exitCode}`, 'dim');
        }
        print(`   Verifique os logs acima para identificar o problema`, 'dim');
      }
      processManager.cleanup();
      process.exit(1);
    }

    // Verificar se API está respondendo
    await checkAPI();

    // Mostrar informações finais apenas se tudo estiver funcionando
    const { api: apiRunning, web: webRunning } = processManager.areProcessesRunning();
    if (apiRunning && webRunning) {
      console.log();
      print('╔══════════════════════════════════════════════════════════════╗', 'green');
      print('║                  ✅ OpenPanel Iniciado!                     ║', 'green');
      print('╚══════════════════════════════════════════════════════════════╝', 'green');
      console.log();
      print(`${icons.info} URLs de Acesso:`, 'cyan');
      print(`   🌐 Web Interface:    http://localhost:3000`, 'white');
      print(`   🔌 API Endpoint:     http://localhost:3001`, 'white');
      print(`   📊 Traefik Panel:    http://localhost:8080`, 'white');
      console.log();
      print(`${icons.info} Credenciais Padrão:`, 'cyan');
      print(`   📧 Email:    admin@admin.com.br`, 'white');
      print(`   🔑 Senha:   admin123`, 'white');
      print(`${icons.warn} ⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!`, 'yellow');
      console.log();
      print(`${icons.info} Para parar os serviços, pressione Ctrl+C`, 'cyan');
      console.log();
    } else {
      print(`\n${icons.warn} Serviços não iniciaram corretamente`, 'yellow');
      print(`   Verifique os logs acima para mais detalhes`, 'dim');
      processManager.cleanup();
      process.exit(1);
    }

  } catch (error) {
    printError('Erro durante inicialização', error, [
      'Verifique os logs acima para mais detalhes',
      'Tente executar novamente: npm start',
      'Se o problema persistir, abra uma issue no GitHub'
    ]);
    processManager.cleanup();
    process.exit(1);
  }
}

// Executar
main().catch((error) => {
  printError('Erro fatal', error);
  processManager.cleanup();
  process.exit(1);
});
