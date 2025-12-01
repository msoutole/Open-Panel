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

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const icons = {
  check: '✓',
  cross: '✗',
  warn: '⚠',
  info: 'ℹ',
  rocket: '🚀',
};

// Variáveis globais para cleanup
let apiProcess = null;
let webProcess = null;
let cleanupExecuted = false;
let apiProcessExited = false;
let webProcessExited = false;
let processesStarted = false;

// Função para imprimir com cor
function print(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para imprimir erro detalhado
function printError(message, error = null, suggestions = []) {
  print(`\n${icons.cross} ${message}`, 'red');
  if (error) {
    print(`   Detalhes: ${error.message}`, 'dim');
    if (process.env.DEBUG && error.stack) {
      print(`   Stack: ${error.stack}`, 'dim');
    }
  }
  if (suggestions.length > 0) {
    print(`\n   Sugestões:`, 'yellow');
    suggestions.forEach(suggestion => {
      print(`   • ${suggestion}`, 'cyan');
    });
  }
  console.log();
}

// Função para cleanup de recursos
function cleanup() {
  if (cleanupExecuted) return;
  cleanupExecuted = true;

  print(`\n${icons.info} Limpando recursos...`, 'yellow');
  
  try {
    if (apiProcess && !apiProcess.killed) {
      apiProcess.kill('SIGTERM');
    }
    if (webProcess && !webProcess.killed) {
      webProcess.kill('SIGTERM');
    }
  } catch (error) {
    // Ignorar erros de cleanup
  }
}

// Registrar handlers de cleanup
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  printError('Erro não tratado:', error, [
    'Verifique os logs acima para mais detalhes',
    'Tente executar novamente: npm start',
    'Se o problema persistir, abra uma issue no GitHub'
  ]);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  printError('Promise rejeitada não tratada:', reason, [
    'Verifique os logs acima para mais detalhes',
    'Tente executar novamente: npm start'
  ]);
  cleanup();
  process.exit(1);
});

function printHeader() {
  try {
    console.clear();
  } catch {
    // Ignorar erro se clear não estiver disponível
  }
  print('╔═══════════════════════════════════════════════════════════════╗', 'blue');
  print('║                                                               ║', 'blue');
  print('║   ██████╗ ██████╗ ███████╗███╗   ██╗██████╗  █████╗ ███╗   ██╗║', 'blue');
  print('║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗██╔══██╗████╗  ██║║', 'blue');
  print('║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██████╔╝███████║██╔██╗ ██║║', 'blue');
  print('║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔═══╝ ██╔══██║██║╚██╗██║║', 'blue');
  print('║  ╚██████╔╝██║     ███████╗██║ ╚████║██║     ██║  ██║██║ ╚████║║', 'blue');
  print('║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝║', 'blue');
  print('║                                                               ║', 'blue');
  print('║            Inicialização Automática Simplificada              ║', 'blue');
  print('║                                                               ║', 'blue');
  print('╚═══════════════════════════════════════════════════════════════╝', 'blue');
  console.log();
}

// Função para verificar se um comando existe
function commandExists(command) {
  try {
    if (process.platform === 'win32') {
      execSync(`where ${command}`, { stdio: 'ignore', timeout: 5000 });
    } else {
      execSync(`which ${command}`, { stdio: 'ignore', timeout: 5000 });
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Função para tentar instalar Node.js (apenas Linux/macOS com gerenciadores de pacote)
async function tryInstallNodeJS() {
  if (process.platform === 'win32') {
    return false; // Windows requer instalação manual
  }

  print(`${icons.info} Tentando instalar Node.js automaticamente...`, 'cyan');
  
  try {
    // Detectar gerenciador de pacote
    let installCommand = null;
    
    if (commandExists('apt-get')) {
      // Ubuntu/Debian
      print(`${icons.info} Detectado: apt-get (Ubuntu/Debian)`, 'cyan');
      print(`${icons.info} Instalando Node.js via NodeSource...`, 'cyan');
      try {
        execSync('curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -', { 
          stdio: 'inherit', 
          timeout: 60000 
        });
        execSync('sudo apt-get install -y nodejs', { stdio: 'inherit', timeout: 120000 });
        return true;
      } catch {
        return false;
      }
    } else if (commandExists('brew')) {
      // macOS
      print(`${icons.info} Detectado: Homebrew (macOS)`, 'cyan');
      print(`${icons.info} Instalando Node.js via Homebrew...`, 'cyan');
      try {
        execSync('brew install node@20', { stdio: 'inherit', timeout: 300000 });
        return true;
      } catch {
        return false;
      }
    } else if (commandExists('yum')) {
      // CentOS/RHEL
      print(`${icons.info} Detectado: yum (CentOS/RHEL)`, 'cyan');
      print(`${icons.info} Instalando Node.js...`, 'cyan');
      try {
        execSync('curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -', { 
          stdio: 'inherit', 
          timeout: 60000 
        });
        execSync('sudo yum install -y nodejs', { stdio: 'inherit', timeout: 120000 });
        return true;
      } catch {
        return false;
      }
    } else if (commandExists('dnf')) {
      // Fedora
      print(`${icons.info} Detectado: dnf (Fedora)`, 'cyan');
      print(`${icons.info} Instalando Node.js...`, 'cyan');
      try {
        execSync('sudo dnf install -y nodejs npm', { stdio: 'inherit', timeout: 120000 });
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Função para verificar versão do Node.js
async function checkNodeVersion() {
  try {
    const version = execSync('node -v', { encoding: 'utf-8', timeout: 5000 }).trim();
    const versionMatch = version.match(/v?(\d+)\.(\d+)\.(\d+)/);
    
    if (!versionMatch) {
      throw new Error('Não foi possível determinar a versão do Node.js');
    }

    const major = parseInt(versionMatch[1]);
    const minor = parseInt(versionMatch[2]);
    
    if (major < 18 || (major === 18 && minor < 0)) {
      print(`${icons.warn} Node.js ${version} detectado. Requer Node.js 18.0.0 ou superior`, 'yellow');
      
      // Tentar instalar automaticamente
      const installed = await tryInstallNodeJS();
      if (installed) {
        // Verificar novamente
        const newVersion = execSync('node -v', { encoding: 'utf-8', timeout: 5000 }).trim();
        print(`${icons.check} Node.js ${newVersion} instalado com sucesso`, 'green');
        return true;
      }
      
      printError(
        `Node.js versão ${version} detectada. Requer Node.js 18.0.0 ou superior`,
        null,
        [
          'Baixe Node.js LTS: https://nodejs.org/',
          'Ou use nvm: nvm install 20',
          'Windows: Baixe o instalador de https://nodejs.org/'
        ]
      );
      process.exit(1);
    }
    
    print(`${icons.check} Node.js ${version} detectado`, 'green');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT' || error.message.includes('não encontrado')) {
      print(`${icons.warn} Node.js não encontrado`, 'yellow');
      
      // Tentar instalar automaticamente
      const installed = await tryInstallNodeJS();
      if (installed) {
        // Verificar novamente
        try {
          const version = execSync('node -v', { encoding: 'utf-8', timeout: 5000 }).trim();
          print(`${icons.check} Node.js ${version} instalado com sucesso`, 'green');
          return true;
        } catch {
          // Continuar para erro
        }
      }
      
      printError(
        'Node.js não encontrado',
        error,
        [
          'Instale Node.js 18+ de: https://nodejs.org/',
          'Ou use nvm: nvm install 20',
          'Windows: Execute o instalador baixado de https://nodejs.org/'
        ]
      );
    } else {
      printError('Erro ao verificar versão do Node.js', error);
    }
    process.exit(1);
  }
}

// Função para tentar instalar Docker (apenas Linux)
async function tryInstallDocker() {
  if (process.platform === 'win32' || process.platform === 'darwin') {
    return false; // Windows/macOS requer Docker Desktop manual
  }

  print(`${icons.info} Tentando instalar Docker automaticamente...`, 'cyan');
  
  try {
    if (commandExists('apt-get')) {
      // Ubuntu/Debian
      print(`${icons.info} Instalando Docker via script oficial...`, 'cyan');
      try {
        execSync('curl -fsSL https://get.docker.com -o get-docker.sh', { 
          stdio: 'inherit', 
          timeout: 30000 
        });
        execSync('sudo sh get-docker.sh', { stdio: 'inherit', timeout: 300000 });
        execSync('sudo usermod -aG docker $USER', { stdio: 'inherit', timeout: 5000 });
        print(`${icons.check} Docker instalado. Você precisa fazer logout/login para usar Docker sem sudo`, 'green');
        return true;
      } catch {
        return false;
      }
    } else if (commandExists('yum')) {
      // CentOS/RHEL
      print(`${icons.info} Instalando Docker...`, 'cyan');
      try {
        execSync('sudo yum install -y docker', { stdio: 'inherit', timeout: 120000 });
        execSync('sudo systemctl start docker', { stdio: 'inherit', timeout: 10000 });
        execSync('sudo systemctl enable docker', { stdio: 'inherit', timeout: 5000 });
        execSync('sudo usermod -aG docker $USER', { stdio: 'inherit', timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    } else if (commandExists('dnf')) {
      // Fedora
      print(`${icons.info} Instalando Docker...`, 'cyan');
      try {
        execSync('sudo dnf install -y docker', { stdio: 'inherit', timeout: 120000 });
        execSync('sudo systemctl start docker', { stdio: 'inherit', timeout: 10000 });
        execSync('sudo systemctl enable docker', { stdio: 'inherit', timeout: 5000 });
        execSync('sudo usermod -aG docker $USER', { stdio: 'inherit', timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Função para verificar Docker
async function checkDocker() {
  if (!commandExists('docker')) {
    print(`${icons.warn} Docker não encontrado`, 'yellow');
    
    // Tentar instalar automaticamente (apenas Linux)
    const installed = await tryInstallDocker();
    if (installed) {
      // Verificar novamente
      if (commandExists('docker')) {
        try {
          execSync('docker info', { stdio: 'ignore', timeout: 10000 });
          print(`${icons.check} Docker instalado e rodando`, 'green');
          return true;
        } catch {
          print(`${icons.warn} Docker instalado mas precisa ser iniciado`, 'yellow');
          print(`${icons.info} Execute: sudo systemctl start docker (Linux)`, 'cyan');
        }
      }
    }
    
    printError(
      'Docker não encontrado',
      null,
      [
        'Windows/macOS: Instale Docker Desktop: https://www.docker.com/products/docker-desktop',
        'Linux: Execute: curl -fsSL https://get.docker.com | sh',
        'Certifique-se de que o Docker está no PATH'
      ]
    );
    process.exit(1);
  }

  try {
    execSync('docker info', { stdio: 'ignore', timeout: 10000 });
    print(`${icons.check} Docker está instalado e rodando`, 'green');
    
    // Verificar versão do Docker
    try {
      const version = execSync('docker --version', { encoding: 'utf-8', timeout: 5000 }).trim();
      print(`   ${version}`, 'dim');
    } catch {
      // Ignorar erro de versão
    }
    
    return true;
  } catch (error) {
    if (error.message.includes('Cannot connect') || error.message.includes('connection refused')) {
      // Tentar iniciar Docker (Linux)
      if (process.platform !== 'win32' && process.platform !== 'darwin') {
        print(`${icons.info} Tentando iniciar Docker...`, 'cyan');
        try {
          execSync('sudo systemctl start docker', { stdio: 'ignore', timeout: 10000 });
          // Verificar novamente
          execSync('docker info', { stdio: 'ignore', timeout: 10000 });
          print(`${icons.check} Docker iniciado com sucesso`, 'green');
          return true;
        } catch {
          // Continuar para erro
        }
      }
      
      printError(
        'Docker está instalado mas não está rodando',
        error,
        [
          'Windows/macOS: Inicie o Docker Desktop',
          'Linux: Execute: sudo systemctl start docker',
          'Aguarde até que o Docker esteja completamente iniciado',
          'Verifique com: docker info'
        ]
      );
    } else {
      printError('Erro ao verificar Docker', error, [
        'Certifique-se de que o Docker Desktop está rodando',
        'Verifique permissões: sudo usermod -aG docker $USER (Linux)'
      ]);
    }
    process.exit(1);
  }
}

// Função para verificar permissões de escrita
function checkWritePermissions() {
  try {
    const testFile = path.join(process.cwd(), '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return true;
  } catch (error) {
    printError(
      'Sem permissão de escrita no diretório atual',
      error,
      [
        'Verifique as permissões do diretório',
        'Execute: chmod 755 . (Linux/macOS)',
        'Ou execute como administrador (Windows)'
      ]
    );
    process.exit(1);
  }
}

// Função para gerar senha segura
function generateSecurePassword(length = 32) {
  try {
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    printError('Erro ao gerar senha segura', error);
    // Fallback para senha menos segura mas funcional
    return crypto.createHash('sha256').update(Date.now().toString()).digest('hex').substring(0, length);
  }
}

// Função para validar arquivo .env existente
function validateExistingEnv(envPath) {
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'POSTGRES_PASSWORD', 'REDIS_PASSWORD'];
    const missing = [];

    for (const varName of requiredVars) {
      if (!content.includes(`${varName}=`)) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      print(`${icons.warn} Arquivo .env existe mas faltam variáveis: ${missing.join(', ')}`, 'yellow');
      print('   O script irá criar um novo .env com valores seguros', 'yellow');
      return false;
    }

    // Verificar se JWT_SECRET tem tamanho mínimo
    const jwtMatch = content.match(/JWT_SECRET=(.+)/);
    if (jwtMatch && jwtMatch[1].trim().length < 32) {
      print(`${icons.warn} JWT_SECRET no .env é muito curto (< 32 caracteres)`, 'yellow');
      print('   O script irá gerar um novo valor seguro', 'yellow');
      return false;
    }

    return true;
  } catch (error) {
    printError('Erro ao validar arquivo .env', error);
    return false;
  }
}

// Função para criar arquivo .env
function createEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  // Se .env já existe, validar
  if (fs.existsSync(envPath)) {
    if (validateExistingEnv(envPath)) {
      print(`${icons.info} Arquivo .env já existe e está válido`, 'cyan');
      // Sincronizar mesmo se já existe (para garantir que subprojetos estão atualizados)
      try {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        let postgresPassword = '';
        let redisPassword = '';
        let jwtSecret = '';
        
        // Extrair valores do .env existente
        envContent.split('\n').forEach(line => {
          const match = line.match(/^([^#=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            if (key === 'POSTGRES_PASSWORD') postgresPassword = value;
            if (key === 'REDIS_PASSWORD') redisPassword = value;
            if (key === 'JWT_SECRET') jwtSecret = value;
          }
        });
        
        // Gerar valores se não encontrados
        if (!postgresPassword) postgresPassword = generateSecurePassword(24);
        if (!redisPassword) redisPassword = generateSecurePassword(24);
        if (!jwtSecret) jwtSecret = generateSecurePassword(64);
        
        syncEnvToSubprojects(envPath, postgresPassword, redisPassword, jwtSecret);
      } catch (error) {
        // Ignorar erro de sincronização
      }
      return;
    } else {
      // Fazer backup do .env existente
      const backupPath = `${envPath}.backup.${Date.now()}`;
      try {
        fs.copyFileSync(envPath, backupPath);
        print(`${icons.info} Backup do .env criado: ${path.basename(backupPath)}`, 'cyan');
      } catch (error) {
        print(`${icons.warn} Não foi possível fazer backup do .env`, 'yellow');
      }
    }
  }

  print(`${icons.info} Criando arquivo .env com valores seguros...`, 'cyan');

  try {
    // Gerar valores seguros
    const jwtSecret = generateSecurePassword(64);
    const postgresPassword = generateSecurePassword(24);
    const redisPassword = generateSecurePassword(24);

    // Template do .env
    const envContent = `# OpenPanel - Variáveis de Ambiente
# Gerado automaticamente pelo script start.js
# Data: ${new Date().toISOString()}

# Ambiente
NODE_ENV=development

# Servidor
API_PORT=3001
APP_URL=http://localhost:3000
APP_PORT=3000

# Banco de Dados PostgreSQL
# Nota: Usa localhost porque a API roda localmente (não em container)
DATABASE_URL=postgresql://openpanel:${postgresPassword}@localhost:5432/openpanel
POSTGRES_USER=openpanel
POSTGRES_PASSWORD=${postgresPassword}
POSTGRES_DB=openpanel
POSTGRES_PORT=5432

# Redis
# Nota: Usa localhost porque a API roda localmente (não em container)
REDIS_URL=redis://:${redisPassword}@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${redisPassword}

# JWT (gerado automaticamente - seguro)
JWT_SECRET=${jwtSecret}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Docker
DOCKER_HOST=

# Traefik
TRAEFIK_DASHBOARD=false
TRAEFIK_API_URL=http://localhost:8080

# SSL
SSL_STORAGE_PATH=/etc/letsencrypt
SSL_EMAIL=

# Backups
BACKUP_PATH=/var/lib/openpanel/backups

# Git
GIT_WORKSPACE_PATH=/tmp/openpanel/git

# Ollama (opcional - use profile: ollama no docker-compose)
# Nota: Usa localhost porque a API roda localmente (não em container)
OLLAMA_HOST=http://localhost:11434
OLLAMA_PORT=11434

# Logs
LOG_LEVEL=info
LOG_FORMAT=json

# Feature Flags
ENABLE_WEBHOOKS=true
ENABLE_AUTO_DEPLOY=true
ENABLE_AGENTS=true

# ============================================================================
# VITE (Frontend - Web)
# ============================================================================
# Variáveis para o frontend (Vite requer prefixo VITE_)
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=OpenPanel
VITE_APP_VERSION=0.1.0
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_TERMINAL=true
VITE_ENABLE_MONITORING=true
VITE_GEMINI_API_KEY=
`;

    fs.writeFileSync(envPath, envContent, { mode: 0o600 }); // Permissões restritas
    print(`${icons.check} Arquivo .env criado com sucesso`, 'green');
    
    // Sincronizar com subprojetos
    syncEnvToSubprojects(envPath, postgresPassword, redisPassword, jwtSecret);
  } catch (error) {
    printError('Erro ao criar arquivo .env', error, [
      'Verifique permissões de escrita no diretório',
      'Tente executar como administrador (Windows) ou com sudo (Linux)'
    ]);
    process.exit(1);
  }
}

// Função para sincronizar .env da raiz com subprojetos
function syncEnvToSubprojects(rootEnvPath, postgresPassword, redisPassword, jwtSecret) {
  try {
    // Ler .env da raiz
    const rootEnvContent = fs.readFileSync(rootEnvPath, 'utf-8');
    const envVars = {};
    
    // Parsear variáveis do .env da raiz
    rootEnvContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      // Ignorar linhas vazias e comentários
      if (!trimmedLine || trimmedLine.startsWith('#')) return;
      
      const match = trimmedLine.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remover aspas se houver
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key] = value;
      }
    });
    
    // Usar valores fornecidos como fallback
    if (!envVars.POSTGRES_PASSWORD && postgresPassword) envVars.POSTGRES_PASSWORD = postgresPassword;
    if (!envVars.REDIS_PASSWORD && redisPassword) envVars.REDIS_PASSWORD = redisPassword;
    if (!envVars.JWT_SECRET && jwtSecret) envVars.JWT_SECRET = jwtSecret;

    // Sincronizar apps/api/.env
    const apiEnvPath = path.join(process.cwd(), 'apps', 'api', '.env');
    const defaultDockerSock = process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock';
    
    const apiEnvLines = [
      '# ============================================================================',
      '# ⚠️  ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITE MANUALMENTE',
      '# ============================================================================',
      '# 🔒 SEGURANÇA: Este arquivo contém credenciais sensíveis!',
      '#',
      '# ⚠️  NUNCA commite este arquivo no Git!',
      '# ⚠️  Este arquivo está no .gitignore e NÃO deve ser versionado.',
      '#',
      '# Este arquivo é sincronizado automaticamente do .env da raiz do projeto.',
      '# Qualquer alteração manual será perdida na próxima execução de "npm start".',
      '#',
      '# ✅ Para fazer alterações, edite o arquivo .env na raiz do projeto.',
      '#',
      '# 📖 Veja docs/SECURITY.md para informações sobre segurança e rotação de credenciais.',
      '# ============================================================================',
      '',
      '',
      '# === SERVER ===',
      `NODE_ENV=${envVars.NODE_ENV || 'development'}`,
      `PORT=${envVars.API_PORT || '3001'}`,
      '',
      '# === DATABASE ===',
      `DATABASE_URL=${envVars.DATABASE_URL || `postgresql://openpanel:${envVars.POSTGRES_PASSWORD || postgresPassword}@localhost:5432/openpanel`}`,
      '',
      '# === REDIS ===',
      `REDIS_URL=${envVars.REDIS_URL || `redis://:${envVars.REDIS_PASSWORD || redisPassword}@localhost:6379`}`,
      `REDIS_HOST=${envVars.REDIS_HOST || 'localhost'}`,
      `REDIS_PORT=${envVars.REDIS_PORT || '6379'}`,
      `REDIS_PASSWORD=${envVars.REDIS_PASSWORD || redisPassword}`,
      '',
      '# === JWT ===',
      `JWT_SECRET=${envVars.JWT_SECRET || jwtSecret}`,
      `JWT_ACCESS_EXPIRES_IN=${envVars.JWT_ACCESS_EXPIRES_IN || '15m'}`,
      `JWT_REFRESH_EXPIRES_IN=${envVars.JWT_REFRESH_EXPIRES_IN || '7d'}`,
      '',
      '# === CORS ===',
      `CORS_ORIGIN=${envVars.CORS_ORIGIN || 'http://localhost:3000'}`,
      'CORS_CREDENTIALS=true',
      '',
      '# === DOCKER ===',
      `DOCKER_SOCK=${envVars.DOCKER_SOCK || defaultDockerSock}`,
      'DOCKER_SOCK_TARGET=/var/run/docker.sock',
    ];
    
    if (envVars.DOCKER_HOST) apiEnvLines.push(`DOCKER_HOST=${envVars.DOCKER_HOST}`);
    if (envVars.DOCKER_PORT) apiEnvLines.push(`DOCKER_PORT=${envVars.DOCKER_PORT}`);
    
    apiEnvLines.push(
      '',
      '# === AI PROVIDERS ===',
      `OLLAMA_HOST=${envVars.OLLAMA_HOST || 'http://localhost:11434'}`,
    );
    
    if (envVars.GEMINI_API_KEY) apiEnvLines.push(`GEMINI_API_KEY=${envVars.GEMINI_API_KEY}`);
    if (envVars.OPENAI_API_KEY) apiEnvLines.push(`OPENAI_API_KEY=${envVars.OPENAI_API_KEY}`);
    if (envVars.ANTHROPIC_API_KEY) apiEnvLines.push(`ANTHROPIC_API_KEY=${envVars.ANTHROPIC_API_KEY}`);
    
    apiEnvLines.push(
      '',
      '# === LOGGING ===',
      `LOG_LEVEL=${envVars.LOG_LEVEL || 'info'}`,
      `LOG_FORMAT=${envVars.LOG_FORMAT || 'json'}`,
      '',
      '# === FEATURES ===',
      `ENABLE_WEBHOOKS=${envVars.ENABLE_WEBHOOKS || 'true'}`,
      `ENABLE_AUTO_DEPLOY=${envVars.ENABLE_AUTO_DEPLOY || 'true'}`,
      `ENABLE_AGENTS=${envVars.ENABLE_AGENTS || 'true'}`,
      ''
    );
    
    const apiEnvContent = apiEnvLines.join('\n');

    // Criar diretório se não existir
    const apiEnvDir = path.dirname(apiEnvPath);
    if (!fs.existsSync(apiEnvDir)) {
      fs.mkdirSync(apiEnvDir, { recursive: true });
    }
    fs.writeFileSync(apiEnvPath, apiEnvContent, { mode: 0o600 }); // Permissões restritas (apenas owner pode ler/escrever)
    print(`${icons.check} apps/api/.env sincronizado`, 'green');

    // Sincronizar apps/web/.env.local (Vite)
    const webEnvPath = path.join(process.cwd(), 'apps', 'web', '.env.local');
    const webEnvLines = [
      '# ============================================================================',
      '# ⚠️  ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITE MANUALMENTE',
      '# ============================================================================',
      '# 🔒 SEGURANÇA: Este arquivo pode conter informações sensíveis!',
      '#',
      '# ⚠️  NUNCA commite este arquivo no Git!',
      '# ⚠️  Este arquivo está no .gitignore e NÃO deve ser versionado.',
      '#',
      '# Este arquivo é sincronizado automaticamente do .env da raiz do projeto.',
      '# Qualquer alteração manual será perdida na próxima execução de "npm start".',
      '#',
      '# ✅ Para fazer alterações, edite o arquivo .env na raiz do projeto.',
      '#',
      '# 📖 Veja docs/SECURITY.md para informações sobre segurança.',
      '# ============================================================================',
      '',
      '',
      '# API URL (Vite requer prefixo VITE_)',
      `VITE_API_URL=${envVars.VITE_API_URL || envVars.APP_URL || 'http://localhost:3001'}`,
      '',
      '# App Info',
      `VITE_APP_NAME=${envVars.VITE_APP_NAME || 'OpenPanel'}`,
      `VITE_APP_VERSION=${envVars.VITE_APP_VERSION || '0.1.0'}`,
      '',
      '# Feature Flags',
      `VITE_ENABLE_AI_CHAT=${envVars.VITE_ENABLE_AI_CHAT || 'true'}`,
      `VITE_ENABLE_TERMINAL=${envVars.VITE_ENABLE_TERMINAL || 'true'}`,
      `VITE_ENABLE_MONITORING=${envVars.VITE_ENABLE_MONITORING || 'true'}`,
    ];
    
    if (envVars.VITE_GEMINI_API_KEY) {
      webEnvLines.push('', '# AI Providers (opcional)', `VITE_GEMINI_API_KEY=${envVars.VITE_GEMINI_API_KEY}`);
    }
    
    webEnvLines.push('');
    const webEnvContent = webEnvLines.join('\n');

    // Criar diretório se não existir
    const webEnvDir = path.dirname(webEnvPath);
    if (!fs.existsSync(webEnvDir)) {
      fs.mkdirSync(webEnvDir, { recursive: true });
    }
    fs.writeFileSync(webEnvPath, webEnvContent, { mode: 0o600 }); // Permissões restritas (apenas owner pode ler/escrever)
    print(`${icons.check} apps/web/.env.local sincronizado`, 'green');
  } catch (error) {
    print(`${icons.warn} Erro ao sincronizar .env com subprojetos: ${error.message}`, 'yellow');
    // Não bloquear execução se falhar
  }
}

// Função para verificar se package.json existe
function checkProjectStructure() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    printError(
      'package.json não encontrado',
      null,
      [
        'Certifique-se de estar no diretório raiz do projeto',
        'Execute: cd /caminho/para/openpanel'
      ]
    );
    process.exit(1);
  }
}

// Função para verificar e instalar npm se necessário
function checkNPM() {
  if (!commandExists('npm')) {
    print(`${icons.warn} npm não encontrado`, 'yellow');
    print(`${icons.info} npm geralmente vem com Node.js`, 'cyan');
    print(`${icons.info} Tentando verificar novamente após instalação do Node.js...`, 'cyan');
    
    // Aguardar um pouco e verificar novamente
    return new Promise((resolve) => {
      setTimeout(() => {
        if (commandExists('npm')) {
          print(`${icons.check} npm encontrado`, 'green');
          resolve(true);
        } else {
          printError(
            'npm não encontrado',
            null,
            [
              'npm vem junto com Node.js',
              'Reinstale Node.js de: https://nodejs.org/',
              'Certifique-se de marcar "npm" durante a instalação'
            ]
          );
          resolve(false);
        }
      }, 2000);
    });
  }
  
  // Verificar versão do npm
  try {
    const version = execSync('npm -v', { encoding: 'utf-8', timeout: 5000 }).trim();
    print(`${icons.check} npm ${version} detectado`, 'green');
    return Promise.resolve(true);
  } catch {
    return Promise.resolve(true); // Continuar mesmo se não conseguir verificar versão
  }
}

// Função para instalar dependências
async function installDependencies() {
  print(`${icons.info} Instalando dependências npm...`, 'cyan');
  
  // Verificar npm primeiro
  const npmOk = await checkNPM();
  if (!npmOk) {
    process.exit(1);
  }
  
  try {
    // Verificar se node_modules existe (instalação parcial)
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      print(`${icons.info} node_modules encontrado, verificando dependências...`, 'cyan');
    }

    // Verificar se package.json existe
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      printError(
        'package.json não encontrado',
        null,
        [
          'Certifique-se de estar no diretório raiz do projeto',
          'Execute: cd /caminho/para/openpanel'
        ]
      );
      process.exit(1);
    }

    print(`${icons.info} Isso pode levar alguns minutos na primeira vez...`, 'cyan');
    execSync('npm install', { 
      stdio: 'inherit',
      timeout: 600000, // 10 minutos para primeira instalação
      env: { ...process.env, NODE_ENV: 'development' }
    });
    print(`${icons.check} Dependências instaladas`, 'green');
  } catch (error) {
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      printError(
        'Timeout ao instalar dependências',
        error,
        [
          'Verifique sua conexão com a internet',
          'Tente novamente: npm install',
          'Ou use um mirror: npm install --registry https://registry.npmjs.org/',
          'Aumente timeout: npm install --timeout=600000'
        ]
      );
    } else if (error.code === 'ENOENT') {
      printError(
        'npm não encontrado',
        error,
        [
          'Certifique-se de que npm está instalado',
          'npm vem junto com Node.js',
          'Reinstale Node.js se necessário'
        ]
      );
    } else if (error.message.includes('EACCES') || error.message.includes('permission')) {
      printError(
        'Erro de permissão ao instalar dependências',
        error,
        [
          'Linux/macOS: Use sudo npm install (não recomendado)',
          'Melhor: Corrija permissões: sudo chown -R $USER:$(id -gn $USER) ~/.npm',
          'Ou use um gerenciador de versões: nvm ou n'
        ]
      );
    } else {
      printError('Erro ao instalar dependências', error, [
        'Tente manualmente: npm install',
        'Verifique se há erros de permissão',
        'Limpe cache: npm cache clean --force',
        'Verifique logs acima para mais detalhes'
      ]);
    }
    process.exit(1);
  }
}

// Função otimizada para aguardar serviço Docker ficar pronto
function waitForDockerService(serviceName, maxRetries = 15) {
  return new Promise((resolve) => {
    let retryCount = 0;
    const startTime = Date.now();
    const maxTime = maxRetries * 2000; // Tempo máximo em ms

    const checkService = () => {
      // Verificar timeout total
      if (Date.now() - startTime > maxTime) {
        // Verificação final rápida
        try {
          const status = execSync(
            `docker inspect --format='{{.State.Status}}' ${serviceName}`,
            { stdio: ['pipe', 'pipe', 'ignore'], timeout: 1000, encoding: 'utf-8' }
          ).trim();
          if (status === 'running') {
            resolve(true);
            return;
          }
        } catch {
          // Ignorar
        }
        resolve(false);
        return;
      }

      try {
        // Verificar status do container (otimizado - timeout reduzido)
        let containerStatus = '';
        try {
          containerStatus = execSync(
            `docker inspect --format='{{.State.Status}}' ${serviceName}`,
            { stdio: ['pipe', 'pipe', 'ignore'], timeout: 1500, encoding: 'utf-8' }
          ).trim();
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            // Não mostrar mensagem a cada tentativa para não poluir o output
            setTimeout(checkService, 1500);
            return;
          } else {
            resolve(false);
            return;
          }
        }

        // Se não está rodando, aguardar
        if (containerStatus !== 'running') {
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(checkService, 1500);
            return;
          } else {
            resolve(false);
            return;
          }
        }

        // Container está rodando - verificar healthcheck rapidamente
        let healthStatus = '';
        try {
          healthStatus = execSync(
            `docker inspect --format='{{.State.Health.Status}}' ${serviceName}`,
            { stdio: ['pipe', 'pipe', 'ignore'], timeout: 1000, encoding: 'utf-8' }
          ).trim();
        } catch (error) {
          // Sem healthcheck - se está running, considerar pronto
          resolve(true);
          return;
        }

        // Verificar healthcheck
        if (healthStatus === 'healthy') {
          resolve(true);
          return;
        }

        // Se está starting ou vazio, aguardar um pouco mais
        if (healthStatus === 'starting' || healthStatus === '') {
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(checkService, 1500);
            return;
          } else {
            // Timeout mas está running - considerar pronto
            resolve(true);
            return;
          }
        }

        // Se unhealthy, aguardar um pouco mais mas não bloquear
        if (healthStatus === 'unhealthy') {
          retryCount++;
          if (retryCount < Math.min(maxRetries, 5)) { // Máximo 5 tentativas para unhealthy
            setTimeout(checkService, 2000);
            return;
          } else {
            // Se está running, considerar pronto mesmo unhealthy
            resolve(true);
            return;
          }
        }

        // Status desconhecido mas container está running
        resolve(true);
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(checkService, 1500);
        } else {
          // Verificação final
          try {
            const status = execSync(
              `docker inspect --format='{{.State.Status}}' ${serviceName}`,
              { stdio: ['pipe', 'pipe', 'ignore'], timeout: 1000, encoding: 'utf-8' }
            ).trim();
            resolve(status === 'running');
          } catch {
            resolve(false);
          }
        }
      }
    };

    // Iniciar verificação imediatamente
    checkService();
  });
}

// Função para verificar docker-compose
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

// Função para iniciar containers Docker
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
      // Passar variáveis de ambiente explicitamente para garantir que docker-compose as leia
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

    // Aguardar serviços críticos em paralelo (otimizado)
    print(`${icons.info} Aguardando serviços ficarem prontos (máximo 30 segundos)...`, 'cyan');
    const services = ['openpanel-postgres', 'openpanel-redis'];
    
    // Verificar todos os serviços em paralelo
    const servicePromises = services.map(service => waitForDockerService(service, 15));
    const results = await Promise.all(servicePromises);
    
    // Verificar resultados e fazer verificações adicionais se necessário
    let allReady = true;
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const isReady = results[i];
      
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
                allReady = true;
                continue;
              } catch {
                print(`${icons.warn} ${service} está rodando mas ainda não aceita conexões`, 'yellow');
                print(`   Continuando mesmo assim (banco pode estar inicializando)...`, 'dim');
                allReady = true; // Continuar mesmo assim
                continue;
              }
            } else {
              // Para outros serviços, se está running, considerar pronto
              print(`${icons.info} ${service} está rodando, continuando...`, 'cyan');
              allReady = true;
              continue;
            }
          }
        } catch {
          // Ignorar erro de verificação
        }
        allReady = false;
      }
    }

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

// Função para configurar banco de dados
async function setupDatabase() {
  print(`${icons.info} Configurando banco de dados...`, 'cyan');

  try {
    // Verificar se Prisma está instalado
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

    // Gerar Prisma Client
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

    // Sincronizar schema
    print(`${icons.info} Sincronizando schema do banco de dados...`, 'cyan');
    try {
      execSync('npm run db:push', { stdio: 'inherit', timeout: 60000 });
      print(`${icons.check} Schema sincronizado`, 'green');
    } catch (error) {
      const errorMessage = error.message || error.toString() || '';
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
      const fullError = errorMessage + ' ' + errorOutput;
      
      if (errorMessage.includes('P1001') || errorMessage.includes('Can\'t reach database') || 
          fullError.includes('P1001') || fullError.includes('Can\'t reach database')) {
        printError(
          'Não foi possível conectar ao banco de dados',
          error,
          [
            'Verifique se PostgreSQL está rodando: docker ps',
            'Verifique logs: docker logs openpanel-postgres',
            'Aguarde alguns segundos e tente: npm run db:push'
          ]
        );
      } else if (errorMessage.includes('P1000') || errorMessage.includes('Authentication failed') ||
                 fullError.includes('P1000') || fullError.includes('Authentication failed') ||
                 fullError.includes('password authentication failed') ||
                 (fullError.includes('database credentials') && fullError.includes('not valid'))) {
        print(`${icons.warn} Erro de autenticação detectado - o volume do PostgreSQL pode ter senha antiga`, 'yellow');
        print(`${icons.info} Tentando resolver automaticamente...`, 'cyan');
        
        try {
          const composeCommand = getDockerComposeCommand();
          if (composeCommand) {
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
            
            // Aguardar PostgreSQL ficar pronto
            await new Promise(resolve => setTimeout(resolve, 10000));
            const isReady = await waitForDockerService('openpanel-postgres', 20);
            
            if (isReady) {
              print(`${icons.check} PostgreSQL está pronto, tentando db:push novamente...`, 'green');
              execSync('npm run db:push', { stdio: 'inherit', timeout: 60000 });
              print(`${icons.check} Schema sincronizado`, 'green');
              return; // Sucesso, sair da função
            }
          }
        } catch (recoveryError) {
          print(`${icons.warn} Não foi possível resolver automaticamente`, 'yellow');
        }
        
        printError(
          'Erro de autenticação no banco de dados',
          error,
          [
            'As credenciais do banco estão desatualizadas',
            'Execute manualmente: docker-compose down -v && docker-compose up -d',
            'Depois execute: npm run db:push',
            'Isso removerá os dados antigos e criará um banco novo com as senhas corretas'
          ]
        );
      } else {
        printError('Erro ao sincronizar schema', error, [
          'Tente manualmente: npm run db:push',
          'Verifique se o banco está acessível'
        ]);
      }
      throw error;
    }
  } catch (error) {
    print(`${icons.warn} Erro ao configurar banco de dados`, 'yellow');
    print(`   Você pode tentar manualmente mais tarde:`, 'yellow');
    print(`   npm run db:generate && npm run db:push`, 'dim');
    // Não bloquear, continuar execução
  }
}

// Função para criar usuário admin
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

// Função para verificar se API está respondendo
function checkAPI(maxRetries = 30) {
  return new Promise((resolve) => {
    let retryCount = 0;
    let resolved = false; // Flag para evitar múltiplas resoluções

    const check = () => {
      // Se já foi resolvido, não fazer mais requisições
      if (resolved) return;

      const req = http.request(
        {
          hostname: 'localhost',
          port: 3001,
          path: '/health',
          method: 'GET',
          timeout: 3000,
        },
        (res) => {
          // Se já foi resolvido, ignorar esta resposta
          if (resolved) return;

          if (res.statusCode === 200) {
            resolved = true;
            print(`\n${icons.check} API está respondendo`, 'green');
            resolve(true);
          } else {
            retry();
          }
        }
      );

      req.on('error', () => {
        if (!resolved) retry();
      });
      
      req.on('timeout', () => {
        req.destroy();
        if (!resolved) retry();
      });

      req.end();

      function retry() {
        // Se já foi resolvido, não fazer mais tentativas
        if (resolved) return;

        retryCount++;
        if (retryCount < maxRetries) {
          process.stdout.write(`\r${colors.dim}Aguardando API... (${retryCount}/${maxRetries})${colors.reset}`);
          setTimeout(check, 2000);
        } else {
          if (!resolved) {
            resolved = true;
            print(`\n${icons.warn} API não respondeu a tempo, mas pode estar iniciando...`, 'yellow');
            print(`   Verifique manualmente: http://localhost:3001/health`, 'dim');
            resolve(false);
          }
        }
      }
    };

    check();
  });
}

// Função principal
async function main() {
  try {
    printHeader();

    // Passo 0: Verificar estrutura do projeto
    checkProjectStructure();
    checkWritePermissions();

    // Passo 1: Verificar e instalar pré-requisitos
    print(`${icons.rocket} Verificando e instalando pré-requisitos...`, 'blue');
    console.log();
    await checkNodeVersion();
    await checkDocker();
    console.log();

    // Passo 2: Criar .env
    print(`${icons.rocket} Configurando ambiente...`, 'blue');
    console.log();
    createEnvFile();
    console.log();

    // Carregar variáveis de ambiente do .env
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
          const match = line.match(/^([^#=]+)=(.*)$/);
          if (match && !process.env[match[1].trim()]) {
            process.env[match[1].trim()] = match[2].trim();
          }
        });
      }
    } catch (error) {
      print(`${icons.warn} Erro ao carregar .env, continuando...`, 'yellow');
    }

    // Passo 3: Instalar dependências
    print(`${icons.rocket} Instalando dependências...`, 'blue');
    console.log();
    await installDependencies();
    console.log();

    // Passo 4: Iniciar containers Docker
    print(`${icons.rocket} Iniciando serviços Docker...`, 'blue');
    console.log();
    await startDockerServices();
    console.log();

    // Passo 5: Configurar banco de dados
    print(`${icons.rocket} Configurando banco de dados...`, 'blue');
    console.log();
    await setupDatabase();
    console.log();

    // Passo 6: Criar usuário admin
    print(`${icons.rocket} Criando usuário administrador...`, 'blue');
    console.log();
    createAdminUser();
    console.log();

    // Passo 7: Iniciar aplicação
    print(`${icons.rocket} Iniciando aplicação...`, 'blue');
    console.log();
    print(`${icons.info} Iniciando API e Web em modo desenvolvimento...`, 'cyan');
    print(`${icons.info} Variáveis de ambiente carregadas do .env da raiz`, 'dim');
    print(`${icons.info} Pressione Ctrl+C para parar os serviços`, 'cyan');
    console.log();

    // Iniciar API e Web em paralelo
    processesStarted = true;
    apiProcessExited = false;
    webProcessExited = false;
    
    // Carregar variáveis de ambiente do .env da raiz para garantir que estejam disponíveis
    // Isso garante que os processos filhos (API e Web) tenham acesso a todas as variáveis
    print(`${icons.info} Carregando variáveis de ambiente do .env da raiz...`, 'cyan');
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        let loadedCount = 0;
        envContent.split('\n').forEach(line => {
          const trimmedLine = line.trim();
          // Ignorar linhas vazias e comentários
          if (!trimmedLine || trimmedLine.startsWith('#')) return;
          
          const match = trimmedLine.match(/^([^#=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remover aspas se houver
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            // Respeitar variáveis de ambiente existentes (permite override via shell)
            // Se a variável já está definida no ambiente, não sobrescrever
            // Isso permite que usuários façam override via shell: DATABASE_URL=... npm start
            // Exemplo: DATABASE_URL=postgresql://user:pass@host/db npm start
            if (!process.env[key]) {
              process.env[key] = value;
              loadedCount++;
            }
            // Se a variável já existe, não sobrescrever (permite override via shell)
          }
        });
        print(`${icons.check} ${loadedCount} variáveis de ambiente carregadas do .env da raiz`, 'green');
      } else {
        print(`${icons.warn} Arquivo .env não encontrado na raiz`, 'yellow');
      }
    } catch (error) {
      print(`${icons.warn} Erro ao carregar .env: ${error.message}`, 'yellow');
      print(`   Continuando mesmo assim...`, 'dim');
    }

    apiProcess = spawn('npm', ['run', 'dev:api'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env },
    });

    webProcess = spawn('npm', ['run', 'dev:web'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env },
    });

    // Tratamento de erros dos processos
    apiProcess.on('error', (error) => {
      apiProcessExited = true;
      printError('Erro ao iniciar API', error, [
        'Verifique se a porta 3001 está disponível',
        'Tente: npm run dev:api manualmente'
      ]);
    });

    webProcess.on('error', (error) => {
      webProcessExited = true;
      printError('Erro ao iniciar Web', error, [
        'Verifique se a porta 3000 está disponível',
        'Tente: npm run dev:web manualmente'
      ]);
    });

    // Detectar terminação inesperada dos processos
    // Usar apenas 'exit' para evitar duplicação (close é chamado após exit)
    apiProcess.on('exit', (code, signal) => {
      if (processesStarted && !cleanupExecuted) {
        // Código null geralmente significa que o processo ainda não terminou
        // Código 0 significa sucesso (não é erro)
        // Apenas considerar erro se code !== 0 e code !== null
        if (code !== null && code !== 0) {
          apiProcessExited = true;
          print(`\n${icons.warn} API terminou inesperadamente (código: ${code}, sinal: ${signal || 'N/A'})`, 'yellow');
          print(`   Verifique os logs acima para mais detalhes`, 'dim');
          print(`   Tente executar manualmente: npm run dev:api`, 'dim');
          
          // Se ambos processos terminaram, encerrar script
          if (webProcessExited) {
            print(`\n${icons.warn} Ambos os processos terminaram. Encerrando...`, 'yellow');
            cleanup();
            process.exit(1);
          }
        }
      }
    });

    webProcess.on('exit', (code, signal) => {
      if (processesStarted && !cleanupExecuted) {
        // Código null geralmente significa que o processo ainda não terminou
        // Código 0 significa sucesso (não é erro)
        // Apenas considerar erro se code !== 0 e code !== null
        if (code !== null && code !== 0) {
          webProcessExited = true;
          print(`\n${icons.warn} Web terminou inesperadamente (código: ${code}, sinal: ${signal || 'N/A'})`, 'yellow');
          print(`   Verifique os logs acima para mais detalhes`, 'dim');
          print(`   Tente executar manualmente: npm run dev:web`, 'dim');
          
          // Se ambos processos terminaram, encerrar script
          if (apiProcessExited) {
            print(`\n${icons.warn} Ambos os processos terminaram. Encerrando...`, 'yellow');
            cleanup();
            process.exit(1);
          }
        }
      }
    });

    // Aguardar um pouco e verificar se os processos ainda estão rodando
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verificar se os processos ainda estão rodando antes de mostrar sucesso
    // Verificar se os processos realmente terminaram (não apenas se a flag foi setada)
    const apiStillRunning = apiProcess && !apiProcess.killed && apiProcess.exitCode === null;
    const webStillRunning = webProcess && !webProcess.killed && webProcess.exitCode === null;
    
    if (!apiStillRunning || !webStillRunning || apiProcessExited || webProcessExited) {
      if (!apiStillRunning || apiProcessExited) {
        print(`\n${icons.warn} API não está rodando`, 'yellow');
        if (apiProcess && apiProcess.exitCode !== null) {
          print(`   Código de saída: ${apiProcess.exitCode}`, 'dim');
        }
        print(`   Verifique os logs acima para identificar o problema`, 'dim');
      }
      if (!webStillRunning || webProcessExited) {
        print(`\n${icons.warn} Web não está rodando`, 'yellow');
        if (webProcess && webProcess.exitCode !== null) {
          print(`   Código de saída: ${webProcess.exitCode}`, 'dim');
        }
        print(`   Verifique os logs acima para identificar o problema`, 'dim');
      }
      cleanup();
      process.exit(1);
    }

    // Verificar se API está respondendo
    const apiResponding = await checkAPI();

    // Mostrar informações finais apenas se tudo estiver funcionando
    if (!apiProcessExited && !webProcessExited) {
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
      cleanup();
      process.exit(1);
    }

  } catch (error) {
    printError('Erro durante inicialização', error, [
      'Verifique os logs acima para mais detalhes',
      'Tente executar novamente: npm start',
      'Se o problema persistir, abra uma issue no GitHub'
    ]);
    cleanup();
    process.exit(1);
  }
}

// Executar
main().catch((error) => {
  printError('Erro fatal', error);
  cleanup();
  process.exit(1);
});
