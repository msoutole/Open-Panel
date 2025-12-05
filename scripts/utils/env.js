const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { print, printError, icons } = require('./logger');

/**
 * Gera uma senha segura aleatória
 * @param {number} length - Comprimento da senha (padrão: 32)
 * @returns {string} Senha hexadecimal gerada
 */
function generateSecurePassword(length = 32) {
  try {
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    printError('Erro ao gerar senha segura', error);
    // Fallback para senha menos segura mas funcional
    return crypto.createHash('sha256').update(Date.now().toString()).digest('hex').substring(0, length);
  }
}

/**
 * Carrega variáveis de ambiente do arquivo .env da raiz do projeto
 * @returns {number} Número de variáveis carregadas, ou 0 se houver erro
 */
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      return 0;
    }

    const result = dotenv.config({ path: envPath });
    if (result.error) {
      throw result.error;
    }

    return Object.keys(result.parsed || {}).length;
  } catch (error) {
    print(`${icons.warn} Erro ao carregar .env: ${error.message}`, 'yellow');
    return 0;
  }
}

/**
 * Valida arquivo .env existente
 * @param {string} envPath - Caminho do arquivo .env
 * @returns {boolean} true se válido, false caso contrário
 */
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

/**
 * Cria arquivo .env com valores seguros
 */
function createEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  // Se .env já existe, validar
  if (fs.existsSync(envPath)) {
    if (validateExistingEnv(envPath)) {
      print(`${icons.info} Arquivo .env já existe e está válido`, 'cyan');
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
REDIS_URL=redis://:${redisPassword}@localhost:6379/0
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
VITE_APP_VERSION=0.3.0
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_TERMINAL=true
VITE_ENABLE_MONITORING=true
VITE_GEMINI_API_KEY=
`;

    fs.writeFileSync(envPath, envContent, { mode: 0o600 }); // Permissões restritas
    print(`${icons.check} Arquivo .env criado com sucesso`, 'green');
    print(`${icons.info} API e Web agora leem diretamente do .env da raiz`, 'cyan');
  } catch (error) {
    printError('Erro ao criar arquivo .env', error, [
      'Verifique permissões de escrita no diretório',
      'Tente executar como administrador (Windows) ou com sudo (Linux)'
    ]);
    process.exit(1);
  }
}

/**
 * Garante que workspaces dependentes leiam o mesmo .env da raiz.
 * - Cria symlink apps/api/.env -> ../.env (fallback para cópia se symlink falhar)
 * - Gera apps/web/.env.local com variáveis VITE_ derivadas do .env da raiz
 */
function syncWorkspaceEnvFiles() {
  const rootDir = process.cwd();
  const rootEnvPath = path.join(rootDir, '.env');
  const apiEnvPath = path.join(rootDir, 'apps', 'api', '.env');
  const webEnvPath = path.join(rootDir, 'apps', 'web', '.env.local');

  if (!fs.existsSync(rootEnvPath)) {
    print(`${icons.warn} .env da raiz não encontrado; pulei sincronização com workspaces`, 'yellow');
    return;
  }

  // apps/api/.env -> symlink (fallback para cópia se symlink não for permitido)
  try {
    if (fs.existsSync(apiEnvPath) || fs.lstatSync(apiEnvPath).isSymbolicLink()) {
      fs.unlinkSync(apiEnvPath);
    }
  } catch {/* ignore */ }

  try {
    fs.symlinkSync(path.relative(path.dirname(apiEnvPath), rootEnvPath), apiEnvPath, 'file');
    print(`${icons.check} apps/api/.env sincronizado (symlink)`, 'green');
  } catch (error) {
    try {
      fs.copyFileSync(rootEnvPath, apiEnvPath);
      print(`${icons.warn} Symlink não permitido; apps/api/.env copiado da raiz`, 'yellow');
    } catch (copyError) {
      printError('Falha ao sincronizar apps/api/.env', copyError);
    }
  }

  // apps/web/.env.local -> derive only VITE_* vars
  try {
    const parsed = dotenv.parse(fs.readFileSync(rootEnvPath, 'utf-8'));
    const viteEntries = Object.entries(parsed).filter(([key]) => key.startsWith('VITE_'));

    if (viteEntries.length === 0) {
      print(`${icons.warn} Nenhuma variável VITE_ encontrada para gerar apps/web/.env.local`, 'yellow');
    }

    const content = viteEntries.map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
    fs.mkdirSync(path.dirname(webEnvPath), { recursive: true });
    fs.writeFileSync(webEnvPath, content, { mode: 0o600 });
    print(`${icons.check} apps/web/.env.local gerado a partir do .env da raiz`, 'green');
  } catch (error) {
    printError('Falha ao gerar apps/web/.env.local', error);
  }
}

/**
 * Garante diretório de logs da API (evita erros em volumes read-only).
 */
function ensureApiLogDir() {
  const logDir = path.join(process.cwd(), 'apps', 'api', 'logs');
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true, mode: 0o755 });
      print(`${icons.check} Diretório de logs criado: ${logDir}`, 'green');
    }
  } catch (error) {
    printError('Falha ao garantir diretório de logs da API', error);
  }
}

module.exports = {
  loadEnv,
  validateExistingEnv,
  createEnvFile,
  generateSecurePassword,
  syncWorkspaceEnvFiles,
  ensureApiLogDir,
};

