#!/bin/bash

################################################################################
# Open-Panel Configuration
#
# Arquivo centralizado com todas as constantes e configurações dos scripts
# Inclua com: source "$(dirname "$0")/config.sh"
################################################################################

# ============================================================================
# INFORMAÇÕES DO PROJETO
# ============================================================================

PROJECT_NAME="Open-Panel"
PROJECT_REPO="https://github.com/msoutole/openpanel"
PROJECT_VERSION="1.0.0"

# ============================================================================
# PORTAS
# ============================================================================

PORT_WEB=3000
PORT_API=3001
PORT_TRAEFIK_DASHBOARD=8080
PORT_POSTGRES=5432
PORT_REDIS=6379
PORT_OLLAMA=11434

# ============================================================================
# NOMES DE CONTAINERS DOCKER
# ============================================================================

CONTAINER_POSTGRES="openpanel-postgres"
CONTAINER_REDIS="openpanel-redis"
CONTAINER_OLLAMA="openpanel-ollama"
CONTAINER_TRAEFIK="openpanel-traefik"
CONTAINER_API="openpanel-api"
CONTAINER_WEB="openpanel-web"

# Array de containers principais (em ordem de inicialização)
CONTAINERS_MAIN=(
    "$CONTAINER_POSTGRES"
    "$CONTAINER_REDIS"
    "$CONTAINER_OLLAMA"
    "$CONTAINER_TRAEFIK"
)

# ============================================================================
# TIMEOUTS E RETRIES
# ============================================================================

# Timeout padrão para Docker Compose iniciar
TIMEOUT_DOCKER_COMPOSE=60

# Retries para health checks (com 2s de intervalo = 60s total)
HEALTHCHECK_RETRIES=30
HEALTHCHECK_INTERVAL=2

# Timeout para esperar porta
TIMEOUT_PORT=30

# Timeout para esperar HTTP endpoint
TIMEOUT_HTTP=30

# ============================================================================
# VARIÁVEIS DE AMBIENTE
# ============================================================================

# Arquivo de environment
ENV_FILE=".env"
ENV_EXAMPLE_FILE=".env.example"
ENV_BACKUP_DIR=".env.backups"

# Variáveis críticas que devem estar em .env
REQUIRED_ENV_VARS=(
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET"
    "NODE_ENV"
)

# ============================================================================
# CREDENCIAIS PADRÃO
# ============================================================================

DEFAULT_ADMIN_EMAIL="admin@openpanel.dev"
DEFAULT_ADMIN_PASSWORD="admin123"

# ============================================================================
# DISCO E RECURSOS
# ============================================================================

# Mínimo de espaço em disco necessário (MB)
MIN_DISK_SPACE_MB=5000

# ============================================================================
# VERSÕES MÍNIMAS
# ============================================================================

MIN_NODE_VERSION="18.0.0"
MIN_DOCKER_VERSION="20.10.0"
MIN_DOCKER_COMPOSE_VERSION="2.0.0"

# ============================================================================
# ENDPOINTS API
# ============================================================================

API_URL="http://localhost:${PORT_API}"
API_HEALTH_ENDPOINT="${API_URL}/api/health"
API_AUTH_STATUS_ENDPOINT="${API_URL}/api/auth/status"
API_ADMIN_REGISTER_ENDPOINT="${API_URL}/api/auth/register"

# URLs de acesso
URL_WEB="http://localhost:${PORT_WEB}"
URL_API="http://localhost:${PORT_API}"
URL_TRAEFIK="http://localhost:${PORT_TRAEFIK_DASHBOARD}"

# ============================================================================
# DIRETÓRIOS
# ============================================================================

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPTS_DIR")"
LOG_DIR="${LOG_DIR:-./.logs}"

# ============================================================================
# FUNÇÕES DE VALIDAÇÃO DE VERSÃO
# ============================================================================

##
# Compara duas versões (v1 >= v2)
# Uso: version_gte "20.10.0" "20.5.0" && echo "OK"
#
version_gte() {
    printf '%s\n%s' "$2" "$1" | sort -V -C
}

##
# Valida versão mínima
# Uso: validate_min_version "node" "20.10.5" "18.0.0"
#
validate_min_version() {
    local app="$1"
    local actual_version="$2"
    local min_version="$3"

    if ! version_gte "$actual_version" "$min_version"; then
        echo "false"
        return 1
    fi

    echo "true"
    return 0
}

# ============================================================================
# GIT
# ============================================================================

GIT_MAIN_BRANCH="main"
GIT_ORIGIN="origin"

# ============================================================================
# DATABASE
# ============================================================================

POSTGRES_CONTAINER=$CONTAINER_POSTGRES
POSTGRES_USER="${POSTGRES_USER:-openpanel}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-changeme}"
POSTGRES_DB="${POSTGRES_DB:-openpanel}"
POSTGRES_PORT=$PORT_POSTGRES

# ============================================================================
# REDIS
# ============================================================================

REDIS_CONTAINER=$CONTAINER_REDIS
REDIS_PASSWORD="${REDIS_PASSWORD:-changeme}"
REDIS_PORT=$PORT_REDIS

# ============================================================================
# OLLAMA (Optional LLM)
# ============================================================================

OLLAMA_CONTAINER=$CONTAINER_OLLAMA
OLLAMA_PORT=$PORT_OLLAMA
OLLAMA_URL="http://localhost:${OLLAMA_PORT}"

# ============================================================================
# BUILD & PACKAGE
# ============================================================================

# Diretório de node_modules
NODE_MODULES_DIR="${PROJECT_ROOT}/node_modules"

# Verificar se dependencies estão instalados
needs_npm_install() {
    [ ! -d "$NODE_MODULES_DIR" ] || \
    [ ! -f "${PROJECT_ROOT}/node_modules/.package-lock.json" ]
}

# ============================================================================
# FEATURE FLAGS
# ============================================================================

# Habilitar/desabilitar Ollama durante setup
SETUP_OLLAMA="${SETUP_OLLAMA:-false}"

# Habilitar/desabilitar confirmação antes de sobrescrever .env
SETUP_CONFIRM_ENV_OVERWRITE="${SETUP_CONFIRM_ENV_OVERWRITE:-true}"

# Modo silencioso (sem outputs de cor, apenas INFO+)
SILENT_MODE="${SILENT_MODE:-false}"

# Modo verbose (logs DEBUG ativados)
VERBOSE_MODE="${VERBOSE_MODE:-false}"

# ============================================================================
# EXPORT VARIABLES
# ============================================================================

export PROJECT_NAME PROJECT_REPO PROJECT_VERSION
export PORT_WEB PORT_API PORT_TRAEFIK_DASHBOARD PORT_POSTGRES PORT_REDIS PORT_OLLAMA
export CONTAINER_POSTGRES CONTAINER_REDIS CONTAINER_OLLAMA CONTAINER_TRAEFIK
export CONTAINERS_MAIN
export HEALTHCHECK_RETRIES HEALTHCHECK_INTERVAL
export ENV_FILE ENV_EXAMPLE_FILE ENV_BACKUP_DIR
export DEFAULT_ADMIN_EMAIL DEFAULT_ADMIN_PASSWORD
export MIN_DISK_SPACE_MB
export MIN_NODE_VERSION MIN_DOCKER_VERSION MIN_DOCKER_COMPOSE_VERSION
export API_URL API_HEALTH_ENDPOINT API_AUTH_STATUS_ENDPOINT
export URL_WEB URL_API URL_TRAEFIK
export SCRIPTS_DIR PROJECT_ROOT
export POSTGRES_CONTAINER POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB
export REDIS_CONTAINER REDIS_PASSWORD
export OLLAMA_CONTAINER OLLAMA_URL
export SETUP_OLLAMA SETUP_CONFIRM_ENV_OVERWRITE SILENT_MODE VERBOSE_MODE
