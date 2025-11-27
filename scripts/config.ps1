# ============================================================================
# Open-Panel Configuration for PowerShell
#
# Arquivo centralizado com todas as constantes e configurações dos scripts
# Inclua com: . "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\config.ps1"
# ============================================================================

# ============================================================================
# INFORMAÇÕES DO PROJETO
# ============================================================================

$PROJECT_NAME = "Open-Panel"
$PROJECT_REPO = "https://github.com/msoutole/openpanel"
$PROJECT_VERSION = "1.0.0"

# ============================================================================
# PORTAS
# ============================================================================

$PORT_WEB = 3000
$PORT_API = 3001
$PORT_TRAEFIK_DASHBOARD = 8080
$PORT_POSTGRES = 5432
$PORT_REDIS = 6379
$PORT_OLLAMA = 11434

# ============================================================================
# NOMES DE CONTAINERS DOCKER
# ============================================================================

$CONTAINER_POSTGRES = "openpanel-postgres"
$CONTAINER_REDIS = "openpanel-redis"
$CONTAINER_OLLAMA = "openpanel-ollama"
$CONTAINER_TRAEFIK = "openpanel-traefik"
$CONTAINER_API = "openpanel-api"
$CONTAINER_WEB = "openpanel-web"

# Array de containers principais (em ordem de inicialização)
$CONTAINERS_MAIN = @(
    $CONTAINER_POSTGRES,
    $CONTAINER_REDIS,
    $CONTAINER_OLLAMA,
    $CONTAINER_TRAEFIK
)

# ============================================================================
# TIMEOUTS E RETRIES
# ============================================================================

# Timeout padrão para Docker Compose iniciar (segundos)
$TIMEOUT_DOCKER_COMPOSE = 60

# Retries para health checks (com 2s de intervalo = 60s total)
$HEALTHCHECK_RETRIES = 30
$HEALTHCHECK_INTERVAL = 2

# Timeout para esperar porta
$TIMEOUT_PORT = 30

# Timeout para esperar HTTP endpoint
$TIMEOUT_HTTP = 30

# ============================================================================
# VARIÁVEIS DE AMBIENTE
# ============================================================================

# Arquivo de environment
$ENV_FILE = ".env"
$ENV_EXAMPLE_FILE = ".env.example"
$ENV_BACKUP_DIR = ".env.backups"

# Variáveis críticas que devem estar em .env
$REQUIRED_ENV_VARS = @(
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_SECRET",
    "NODE_ENV"
)

# ============================================================================
# CREDENCIAIS PADRÃO
# ============================================================================

$DEFAULT_ADMIN_EMAIL = "admin@openpanel.dev"
$DEFAULT_ADMIN_PASSWORD = "admin123"

# ============================================================================
# DISCO E RECURSOS
# ============================================================================

# Mínimo de espaço em disco necessário (MB)
$MIN_DISK_SPACE_MB = 5000

# ============================================================================
# VERSÕES MÍNIMAS
# ============================================================================

$MIN_NODE_VERSION = "18.0.0"
$MIN_DOCKER_VERSION = "20.10.0"
$MIN_DOCKER_COMPOSE_VERSION = "2.0.0"

# ============================================================================
# ENDPOINTS API
# ============================================================================

$API_URL = "http://localhost:$PORT_API"
$API_HEALTH_ENDPOINT = "$API_URL/api/health"
$API_AUTH_STATUS_ENDPOINT = "$API_URL/api/auth/status"
$API_ADMIN_REGISTER_ENDPOINT = "$API_URL/api/auth/register"

# URLs de acesso
$URL_WEB = "http://localhost:$PORT_WEB"
$URL_API = "http://localhost:$PORT_API"
$URL_TRAEFIK = "http://localhost:$PORT_TRAEFIK_DASHBOARD"

# ============================================================================
# DIRETÓRIOS
# ============================================================================

$SCRIPTS_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPTS_DIR
$LOG_DIR = if ($LOG_DIR) { $LOG_DIR } else { ".\logs" }

# ============================================================================
# FUNÇÕES DE VALIDAÇÃO DE VERSÃO
# ============================================================================

##
# Compara duas versões (v1 >= v2)
#
function Test-VersionGte {
    param(
        [string]$Version1,
        [string]$Version2
    )

    $v1 = [version]$Version1
    $v2 = [version]$Version2

    return $v1 -ge $v2
}

##
# Valida versão mínima
#
function Test-MinVersion {
    param(
        [string]$AppName,
        [string]$ActualVersion,
        [string]$MinVersion
    )

    if (-not (Test-VersionGte $ActualVersion $MinVersion)) {
        return $false
    }

    return $true
}

# ============================================================================
# GIT
# ============================================================================

$GIT_MAIN_BRANCH = "main"
$GIT_ORIGIN = "origin"

# ============================================================================
# DATABASE
# ============================================================================

$POSTGRES_CONTAINER = $CONTAINER_POSTGRES
$POSTGRES_USER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "openpanel" }
$POSTGRES_PASSWORD = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "changeme" }
$POSTGRES_DB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "openpanel" }
$POSTGRES_PORT = $PORT_POSTGRES

# ============================================================================
# REDIS
# ============================================================================

$REDIS_CONTAINER = $CONTAINER_REDIS
$REDIS_PASSWORD = if ($env:REDIS_PASSWORD) { $env:REDIS_PASSWORD } else { "changeme" }
$REDIS_PORT = $PORT_REDIS

# ============================================================================
# OLLAMA (Optional LLM)
# ============================================================================

$OLLAMA_CONTAINER = $CONTAINER_OLLAMA
$OLLAMA_PORT = $PORT_OLLAMA
$OLLAMA_URL = "http://localhost:$OLLAMA_PORT"

# ============================================================================
# BUILD & PACKAGE
# ============================================================================

# Diretório de node_modules
$NODE_MODULES_DIR = "$PROJECT_ROOT\node_modules"

##
# Verifica se dependencies precisam ser instalados
#
function Test-NeedNpmInstall {
    return (-not (Test-Path $NODE_MODULES_DIR)) -or `
           (-not (Test-Path "$PROJECT_ROOT\node_modules\.package-lock.json"))
}

# ============================================================================
# FEATURE FLAGS
# ============================================================================

# Habilitar/desabilitar Ollama durante setup
$SETUP_OLLAMA = if ($env:SETUP_OLLAMA) { $env:SETUP_OLLAMA } else { $false }

# Habilitar/desabilitar confirmação antes de sobrescrever .env
$SETUP_CONFIRM_ENV_OVERWRITE = if ($env:SETUP_CONFIRM_ENV_OVERWRITE) { $env:SETUP_CONFIRM_ENV_OVERWRITE } else { $true }

# Modo silencioso (sem outputs de cor, apenas INFO+)
$SILENT_MODE = if ($env:SILENT_MODE) { $env:SILENT_MODE } else { $false }

# Modo verbose (logs DEBUG ativados)
$VERBOSE_MODE = if ($env:VERBOSE_MODE) { $env:VERBOSE_MODE } else { $false }

# ============================================================================
# DOCKER HOST (Windows-specific)
# ============================================================================

# Definir Docker Host para Windows
if ($IsWindows) {
    $env:DOCKER_HOST = "npipe:////./pipe/docker_engine"
}

# Exportar variáveis para uso em scripts child
$null = @(
    'PROJECT_NAME', 'PROJECT_REPO', 'PROJECT_VERSION',
    'PORT_WEB', 'PORT_API', 'PORT_TRAEFIK_DASHBOARD', 'PORT_POSTGRES', 'PORT_REDIS', 'PORT_OLLAMA',
    'CONTAINER_POSTGRES', 'CONTAINER_REDIS', 'CONTAINER_OLLAMA', 'CONTAINER_TRAEFIK',
    'CONTAINERS_MAIN',
    'HEALTHCHECK_RETRIES', 'HEALTHCHECK_INTERVAL',
    'ENV_FILE', 'ENV_EXAMPLE_FILE', 'ENV_BACKUP_DIR',
    'DEFAULT_ADMIN_EMAIL', 'DEFAULT_ADMIN_PASSWORD',
    'MIN_DISK_SPACE_MB',
    'MIN_NODE_VERSION', 'MIN_DOCKER_VERSION', 'MIN_DOCKER_COMPOSE_VERSION',
    'API_URL', 'API_HEALTH_ENDPOINT', 'API_AUTH_STATUS_ENDPOINT',
    'URL_WEB', 'URL_API', 'URL_TRAEFIK',
    'SCRIPTS_DIR', 'PROJECT_ROOT',
    'POSTGRES_CONTAINER', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB',
    'REDIS_CONTAINER', 'REDIS_PASSWORD',
    'OLLAMA_CONTAINER', 'OLLAMA_URL',
    'SETUP_OLLAMA', 'SETUP_CONFIRM_ENV_OVERWRITE', 'SILENT_MODE', 'VERBOSE_MODE'
) | ForEach-Object {
    Set-Variable -Name $_ -Scope Global -Option ReadOnly -Force -ErrorAction SilentlyContinue
}
