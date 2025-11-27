#!/bin/bash

################################################################################
# Open-Panel Common Utilities for Bash/Shell Scripts
#
# Este arquivo contém funções reutilizáveis para todos os scripts shell do projeto
# Inclua com: source "$(dirname "$0")/../lib/common.sh"
################################################################################

# ============================================================================
# CORES E FORMATAÇÃO DE OUTPUT
# ============================================================================

# Define cores ANSI
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_MAGENTA='\033[0;35m'
readonly COLOR_WHITE='\033[1;37m'
readonly COLOR_GRAY='\033[0;37m'
readonly COLOR_NC='\033[0m' # No Color

# Símbolos visuais
readonly SYMBOL_SUCCESS='✓'
readonly SYMBOL_ERROR='✗'
readonly SYMBOL_WARNING='⚠'
readonly SYMBOL_INFO='ℹ'
readonly SYMBOL_ARROW='→'
readonly SYMBOL_BULLET='•'

# ============================================================================
# LOGGING E OUTPUT
# ============================================================================

# Log file variables
SCRIPT_NAME="${0##*/}"
LOG_DIR="${LOG_DIR:-./.logs}"
LOG_FILE="${LOG_DIR}/$(date +%Y-%m-%d-%H-%M-%S)-${SCRIPT_NAME%.*}.log"
LOG_LEVEL="${LOG_LEVEL:-INFO}" # DEBUG, INFO, WARN, ERROR, FATAL

# Garante que diretório de logs existe
mkdir -p "$LOG_DIR" 2>/dev/null || true

##
# Log com nível, timestamp e cor
# Salva em arquivo sem cores
#
log_write() {
    local level="$1"
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Determina cor baseada no nível
    local color=""
    case "$level" in
        DEBUG)  color=$COLOR_GRAY ;;
        INFO)   color=$COLOR_BLUE ;;
        WARN)   color=$COLOR_YELLOW ;;
        ERROR)  color=$COLOR_RED ;;
        FATAL)  color=$COLOR_RED ;;
        *)      color=$COLOR_WHITE ;;
    esac

    # Output para stdout com cores
    echo -e "${color}[${timestamp}] [${level}] ${message}${COLOR_NC}" >&2

    # Salva em arquivo sem cores (remove escape codes)
    echo "[${timestamp}] [${level}] ${message}" | sed 's/\x1b\[[0-9;]*m//g' >> "$LOG_FILE"
}

##
# Log DEBUG (apenas se DEBUG está ativado)
#
log_debug() {
    [[ "$LOG_LEVEL" == "DEBUG" ]] && log_write "DEBUG" "$@"
}

##
# Log INFO
#
log_info() {
    log_write "INFO" "$@"
}

##
# Log WARN
#
log_warn() {
    log_write "WARN" "$@"
}

##
# Log ERROR
#
log_error() {
    log_write "ERROR" "$@"
}

##
# Log FATAL e exit
#
log_fatal() {
    log_write "FATAL" "$@"
    exit 1
}

# ============================================================================
# PRINTING COM CORES
# ============================================================================

##
# Print sucesso
#
print_success() {
    echo -e "${COLOR_GREEN}${SYMBOL_SUCCESS} $@${COLOR_NC}"
}

##
# Print erro
#
print_error() {
    echo -e "${COLOR_RED}${SYMBOL_ERROR} $@${COLOR_NC}" >&2
}

##
# Print aviso
#
print_warn() {
    echo -e "${COLOR_YELLOW}${SYMBOL_WARNING} $@${COLOR_NC}" >&2
}

##
# Print info
#
print_info() {
    echo -e "${COLOR_CYAN}${SYMBOL_INFO} $@${COLOR_NC}"
}

##
# Print seção (com linha)
#
print_section() {
    echo ""
    echo -e "${COLOR_BLUE}════════════════════════════════════════════════${COLOR_NC}"
    echo -e "${COLOR_BLUE}  $@${COLOR_NC}"
    echo -e "${COLOR_BLUE}════════════════════════════════════════════════${COLOR_NC}"
    echo ""
}

##
# Print subsection
#
print_subsection() {
    echo ""
    echo -e "${COLOR_CYAN}─── $@ ───${COLOR_NC}"
}

# ============================================================================
# VERIFICAÇÕES DE COMANDO
# ============================================================================

##
# Verifica se um comando existe
#
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

##
# Verifica se um comando existe, se não, exibe erro
#
require_command() {
    local cmd="$1"
    local error_msg="${2:-Comando obrigatório '$cmd' não encontrado}"

    if ! command_exists "$cmd"; then
        print_error "$error_msg"
        return 1
    fi
    return 0
}

##
# Verifica e retorna versão de um comando
#
get_command_version() {
    local cmd="$1"
    local flag="${2:---version}"

    if command_exists "$cmd"; then
        $cmd $flag 2>/dev/null | head -n 1
    else
        echo "not installed"
    fi
}

# ============================================================================
# RETRY E RETRY COM EXPONENTIAL BACKOFF
# ============================================================================

##
# Retry com exponential backoff
# Uso: retry_with_backoff 5 "echo 'test'"
#
retry_with_backoff() {
    local max_attempts=$1
    local delay=2
    local attempt=1
    shift

    while true; do
        log_debug "Tentativa $attempt/$max_attempts: $@"

        if "$@"; then
            return 0
        fi

        if [ $attempt -ge $max_attempts ]; then
            log_error "Falha após $max_attempts tentativas: $@"
            return 1
        fi

        log_warn "Tentativa $attempt falhou. Aguardando ${delay}s antes de tentar novamente..."
        sleep $delay
        delay=$((delay * 2))
        attempt=$((attempt + 1))
    done
}

##
# Retry simples (sem backoff)
# Uso: retry 3 "echo 'test'"
#
retry() {
    local max_attempts=$1
    local attempt=1
    shift

    while true; do
        if "$@"; then
            return 0
        fi

        if [ $attempt -ge $max_attempts ]; then
            return 1
        fi

        attempt=$((attempt + 1))
        sleep 1
    done
}

# ============================================================================
# SLEEP CROSS-PLATFORM
# ============================================================================

##
# Sleep com suporte a Windows (msys2/git bash)
#
sleep_crossplatform() {
    local seconds=$1
    if command_exists sleep; then
        sleep "$seconds"
    else
        # Fallback para Windows (PowerShell)
        powershell -Command "Start-Sleep -Seconds $seconds" 2>/dev/null || sleep "$seconds"
    fi
}

# ============================================================================
# SPINNER E PROGRESS
# ============================================================================

# Variável global para spinner
_SPINNER_PID=""
_SPINNER_FRAMES=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")

##
# Inicia spinner
# Uso: start_spinner "Aguardando..."; sleep 5; stop_spinner
#
start_spinner() {
    local message="${1:-Aguardando...}"

    # Função que anima o spinner
    {
        local i=0
        while kill -0 $$ 2>/dev/null; do
            echo -ne "\r${COLOR_CYAN}${_SPINNER_FRAMES[$((i % 10))]} ${message}${COLOR_NC}"
            i=$((i + 1))
            sleep 0.1
        done
        echo -ne "\r"
    } &

    _SPINNER_PID=$!
}

##
# Para o spinner
#
stop_spinner() {
    if [ -n "$_SPINNER_PID" ]; then
        kill $_SPINNER_PID 2>/dev/null
        wait $_SPINNER_PID 2>/dev/null
        _SPINNER_PID=""
    fi
}

##
# Spinner com resultado
# Uso: spinner_with_result "Mensagem" command arg1 arg2
#
spinner_with_result() {
    local message="$1"
    shift

    start_spinner "$message"

    if "$@"; then
        stop_spinner
        print_success "$message"
        return 0
    else
        stop_spinner
        print_error "$message"
        return 1
    fi
}

# ============================================================================
# VALIDAÇÕES E CHECKS
# ============================================================================

##
# Verifica se arquivo/diretório existe
#
file_exists() {
    [ -f "$1" ]
}

##
# Verifica se diretório existe
#
dir_exists() {
    [ -d "$1" ]
}

##
# Verifica espaço em disco
# Uso: check_disk_space "/path" 5000 (5000 MB)
#
check_disk_space() {
    local path="${1:-.}"
    local required_mb="${2:-5000}"

    if ! command_exists df; then
        log_warn "Comando 'df' não encontrado. Pulando verificação de espaço em disco"
        return 0
    fi

    local available=$(df "$path" | tail -1 | awk '{print $4}')
    available=$((available / 1024)) # Converter de KB para MB

    if [ "$available" -lt "$required_mb" ]; then
        log_error "Espaço em disco insuficiente: ${available}MB disponível (${required_mb}MB necessário)"
        return 1
    fi

    log_debug "Espaço em disco OK: ${available}MB disponível"
    return 0
}

##
# Verifica se variável de ambiente está definida
#
check_env_var() {
    local var_name="$1"
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        log_error "Variável de ambiente obrigatória não está definida: $var_name"
        return 1
    fi

    return 0
}

# ============================================================================
# DOCKER UTILITIES
# ============================================================================

##
# Verifica se Docker daemon está rodando
#
is_docker_running() {
    docker info >/dev/null 2>&1
}

##
# Aguarda container ficar saudável
# Uso: wait_for_container_health "openpanel-postgres" 30
#
wait_for_container_health() {
    local container_name="$1"
    local max_wait="${2:-30}"
    local waited=0
    local interval=2

    while [ $waited -lt $max_wait ]; do
        local status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null)

        if [ "$status" = "healthy" ]; then
            log_debug "Container $container_name está saudável"
            return 0
        fi

        log_debug "Container $container_name: $status (aguardado: ${waited}s/${max_wait}s)"
        sleep $interval
        waited=$((waited + interval))
    done

    log_error "Container $container_name não ficou saudável em ${max_wait}s"
    return 1
}

##
# Aguarda porta estar acessível
# Uso: wait_for_port 3001 30
#
wait_for_port() {
    local port="$1"
    local max_wait="${2:-30}"
    local waited=0
    local interval=1

    while [ $waited -lt $max_wait ]; do
        if command_exists nc; then
            nc -z localhost "$port" >/dev/null 2>&1 && {
                log_debug "Porta $port está respondendo"
                return 0
            }
        elif command_exists bash; then
            (echo >/dev/tcp/localhost/$port) 2>/dev/null && {
                log_debug "Porta $port está respondendo"
                return 0
            }
        fi

        log_debug "Aguardando porta $port (${waited}s/${max_wait}s)"
        sleep $interval
        waited=$((waited + interval))
    done

    log_error "Porta $port não ficou acessível em ${max_wait}s"
    return 1
}

##
# Aguarda endpoint HTTP responder
# Uso: wait_for_http "http://localhost:3001/api/health" 30
#
wait_for_http() {
    local url="$1"
    local max_wait="${2:-30}"
    local waited=0
    local interval=2

    require_command curl "Comando 'curl' é obrigatório para verificar endpoints HTTP" || return 1

    while [ $waited -lt $max_wait ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            log_debug "Endpoint $url está respondendo"
            return 0
        fi

        log_debug "Aguardando endpoint $url (${waited}s/${max_wait}s)"
        sleep $interval
        waited=$((waited + interval))
    done

    log_error "Endpoint $url não ficou acessível em ${max_wait}s"
    return 1
}

# ============================================================================
# FILE UTILITIES
# ============================================================================

##
# Cria backup de arquivo
# Uso: backup_file "/path/to/file"
#
backup_file() {
    local file="$1"
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="${file}.backup.${timestamp}"

    if [ -f "$file" ]; then
        cp "$file" "$backup_file"
        log_info "Backup criado: $backup_file"
        echo "$backup_file"
        return 0
    else
        log_warn "Arquivo não existe, não é possível fazer backup: $file"
        return 1
    fi
}

##
# Cria diretório recursivamente
#
ensure_dir() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        log_debug "Diretório criado: $dir"
    fi
}

##
# Remove linhas com prefixo de um arquivo
# Uso: remove_line_from_file ".env" "JWT_SECRET="
#
remove_line_from_file() {
    local file="$1"
    local pattern="$2"

    if [ ! -f "$file" ]; then
        return 0
    fi

    sed -i.bak "/^${pattern}/d" "$file" 2>/dev/null || sed -i "" "/^${pattern}/d" "$file"
    rm -f "${file}.bak" 2>/dev/null
}

# ============================================================================
# RANDOM GENERATION (Seguro)
# ============================================================================

##
# Gera string aleatória
# Uso: generate_random_string 32
#
generate_random_string() {
    local length="${1:-32}"

    if command_exists openssl; then
        openssl rand -hex $((length / 2)) | head -c "$length"
    elif command_exists urandom; then
        head -c "$length" /dev/urandom | base64 | tr -d '\n' | cut -c1-$length
    else
        # Fallback: usar date + random
        date +%s%N | sha256sum | head -c "$length"
    fi
}

##
# Gera UUID v4
#
generate_uuid() {
    if command_exists uuidgen; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    elif command_exists python3; then
        python3 -c "import uuid; print(uuid.uuid4())"
    else
        # Fallback: gerar pseudo-uuid
        local n=""
        local b=""
        for (( i=0; i < 16; i++ )); do
            b=$(( RANDOM%256 ))
            n=$(printf "%s\x$(printf %x $b)" "$n")
        done
        echo -n "$n" | od -An -tx1 | tr ' ' '-' | sed 's/^-//'
    fi
}

# ============================================================================
# CLEANUP E SIGNAL HANDLERS
# ============================================================================

# Array global para registrar cleanup functions
_CLEANUP_FUNCTIONS=()

##
# Registra função de cleanup
# Uso: on_exit cleanup_function
#
on_exit() {
    _CLEANUP_FUNCTIONS+=("$1")
}

##
# Executa todas as funções de cleanup
#
_run_cleanup() {
    log_debug "Executando cleanup..."

    for func in "${_CLEANUP_FUNCTIONS[@]}"; do
        if declare -f "$func" >/dev/null; then
            log_debug "Executando: $func"
            "$func" || log_warn "Cleanup function falhou: $func"
        fi
    done
}

# Configura trap para cleanup em EXIT
trap _run_cleanup EXIT

##
# Configura graceful shutdown
#
setup_signal_handlers() {
    trap 'log_warn "Script interrompido pelo usuário"; exit 130' SIGINT SIGTERM
}

# ============================================================================
# MENU E INPUT
# ============================================================================

##
# Exibe menu de escolha
# Uso: choose_option "Qual opção?" "Opção 1" "Opção 2" "Opção 3"
# Retorna: 1, 2 ou 3
#
choose_option() {
    local prompt="$1"
    shift
    local options=("$@")
    local choice

    echo ""
    echo -e "${COLOR_CYAN}${prompt}${COLOR_NC}"
    for i in "${!options[@]}"; do
        echo "  $((i+1)). ${options[$i]}"
    done
    echo ""

    read -p "Digite o número da sua escolha (1-${#options[@]}): " choice

    if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt ${#options[@]} ]; then
        print_error "Opção inválida"
        return 1
    fi

    echo "$choice"
}

##
# Prompt yes/no
#
confirm() {
    local prompt="$1"
    local response

    read -p "$(echo -e ${COLOR_YELLOW}${prompt}${COLOR_NC}) (y/n) " response

    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# ============================================================================
# EXPORT LOG FILE PATH
# ============================================================================

# Export para que scripts child possam acessar
export LOG_FILE

# Print de inicialização
log_info "=== Iniciando $SCRIPT_NAME ==="
log_debug "Log file: $LOG_FILE"
