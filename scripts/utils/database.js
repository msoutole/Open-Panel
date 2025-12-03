const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { print, printError, icons } = require('./logger');
const { getDockerComposeCommand, waitForDockerService } = require('./docker');

/**
 * Verifica se Prisma está instalado e instala se necessário
 */
function ensurePrismaInstalled() {
  const prismaPath = path.join(process.cwd(), 'node_modules', '.bin', 'prisma');
  const prismaPathWin = path.join(process.cwd(), 'node_modules', '.bin', 'prisma.cmd');
  const prismaInstalled = fs.existsSync(prismaPath) || fs.existsSync(prismaPathWin);
  
  if (!prismaInstalled) {
    print(`${icons.warn} Prisma não encontrado, tentando instalar...`, 'yellow');
    try {
      execSync('npm install prisma @prisma/client', { stdio: 'inherit', timeout: 120000 });
    } catch (error) {
      print(`${icons.warn} Erro ao instalar Prisma, continuando...`, 'yellow');
    }
  }
}

/**
 * Gera o Prisma Client
 */
function generatePrismaClient() {
  print(`${icons.info} Gerando Prisma Client...`, 'cyan');
  try {
    execSync('npm run db:generate', { stdio: 'inherit', timeout: 60000 });
    print(`${icons.check} Prisma Client gerado`, 'green');
  } catch (error) {
    if (error.message.includes('ENOENT')) {
      printError(
        'Script db:generate não encontrado',
        error,
        [
          'Verifique se package.json tem o script db:generate',
          'Execute manualmente: npx prisma generate'
        ]
      );
      throw error;
    }
    throw error;
  }
}

/**
 * Tenta recuperar de erro de autenticação do PostgreSQL recriando containers
 * @returns {Promise<boolean>} true se recuperado com sucesso
 */
async function recoverFromAuthError() {
  try {
    const composeCommand = getDockerComposeCommand();
    if (!composeCommand) return false;

    print(`${icons.info} Parando containers e removendo volumes...`, 'cyan');
    execSync(`${composeCommand} down -v`, { 
      stdio: 'inherit', 
      timeout: 60000,
      env: { ...process.env }
    });
    
    print(`${icons.info} Recriando containers com novas credenciais...`, 'cyan');
    execSync(`${composeCommand} up -d`, { 
      stdio: 'inherit', 
      timeout: 120000,
      env: { ...process.env }
    });
    
    print(`${icons.check} Containers recriados, aguardando PostgreSQL inicializar...`, 'green');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const isReady = await waitForDockerService('openpanel-postgres', 20);
    if (isReady) {
      print(`${icons.check} PostgreSQL está pronto, tentando db:push novamente...`, 'green');
      execSync('npm run db:push', { stdio: 'inherit', timeout: 60000 });
      print(`${icons.check} Schema sincronizado`, 'green');
      return true;
    }
  } catch (recoveryError) {
    print(`${icons.warn} Não foi possível resolver automaticamente`, 'yellow');
  }
  return false;
}

/**
 * Sincroniza o schema do banco de dados
 * @returns {Promise<void>}
 */
async function syncDatabaseSchema() {
  print(`${icons.info} Sincronizando schema do banco de dados...`, 'cyan');
  try {
    execSync('npm run db:push', { stdio: 'inherit', timeout: 60000 });
    print(`${icons.check} Schema sincronizado`, 'green');
  } catch (error) {
    const errorMessage = error.message || error.toString() || '';
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
    const fullError = errorMessage + ' ' + errorOutput;
    
    if (errorMessage.includes('P1001') || fullError.includes('P1001') || 
        errorMessage.includes('Can\'t reach database') || fullError.includes('Can\'t reach database')) {
      printError(
        'Não foi possível conectar ao banco de dados',
        error,
        [
          'Verifique se PostgreSQL está rodando: docker ps',
          'Verifique logs: docker logs openpanel-postgres',
          'Aguarde alguns segundos e tente: npm run db:push'
        ]
      );
      throw error;
    }
    
    if (errorMessage.includes('P1000') || fullError.includes('P1000') ||
        fullError.includes('Authentication failed') || fullError.includes('password authentication failed') ||
        (fullError.includes('database credentials') && fullError.includes('not valid'))) {
      print(`${icons.warn} Erro de autenticação detectado - tentando resolver automaticamente...`, 'yellow');
      
      const recovered = await recoverFromAuthError();
      if (recovered) {
        return; // Sucesso após recuperação
      }
      
      printError(
        'Erro de autenticação no banco de dados',
        error,
        [
          'As credenciais do banco estão desatualizadas',
          'Execute manualmente: docker-compose down -v && docker-compose up -d',
          'Depois execute: npm run db:push'
        ]
      );
      throw error;
    }
    
    printError('Erro ao sincronizar schema', error, [
      'Tente manualmente: npm run db:push',
      'Verifique se o banco está acessível'
    ]);
    throw error;
  }
}

/**
 * Configura o banco de dados (instala Prisma, gera client e sincroniza schema)
 * @returns {Promise<void>}
 */
async function setupDatabase() {
  print(`${icons.info} Configurando banco de dados...`, 'cyan');

  try {
    ensurePrismaInstalled();
    generatePrismaClient();
    await syncDatabaseSchema();
  } catch (error) {
    print(`${icons.warn} Erro ao configurar banco de dados`, 'yellow');
    print(`   Você pode tentar manualmente mais tarde:`, 'yellow');
    print(`   npm run db:generate && npm run db:push`, 'dim');
    // Não bloquear, continuar execução
  }
}

/**
 * Cria o usuário administrador padrão no sistema
 */
function createAdminUser() {
  print(`${icons.info} Criando usuário administrador padrão...`, 'cyan');

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com.br';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Definir variáveis de ambiente temporariamente
    process.env.ADMIN_EMAIL = adminEmail;
    process.env.ADMIN_PASSWORD = adminPassword;

    execSync('npm run create:admin', { stdio: 'inherit', timeout: 30000 });
    print(`${icons.check} Usuário administrador criado`, 'green');
    print(`${icons.warn} Credenciais padrão:`, 'yellow');
    print(`   Email: ${adminEmail}`, 'cyan');
    print(`   Senha: ${adminPassword}`, 'cyan');
    print(`${icons.warn} ⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!`, 'yellow');
  } catch (error) {
    if (error.message.includes('Unique constraint') || error.message.includes('already exists')) {
      print(`${icons.info} Usuário admin já existe`, 'cyan');
    } else if (error.message.includes('P1001') || error.message.includes('Can\'t reach database')) {
      print(`${icons.warn} Não foi possível criar usuário admin (banco não acessível)`, 'yellow');
      print(`   Tente manualmente depois: npm run create:admin`, 'dim');
    } else {
      print(`${icons.warn} Erro ao criar usuário admin: ${error.message}`, 'yellow');
      print(`   Tente manualmente: npm run create:admin`, 'dim');
    }
    // Não bloquear, continuar execução
  }
}

module.exports = {
  ensurePrismaInstalled,
  generatePrismaClient,
  syncDatabaseSchema,
  recoverFromAuthError,
  setupDatabase,
  createAdminUser,
};

