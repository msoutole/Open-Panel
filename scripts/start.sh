#!/bin/bash

################################################################################
# Open-Panel Start Script for Linux/macOS
#
# Inicia todos os serviços do Open-Panel de forma segura e verificada
#
# Uso: ./scripts/start.sh [options]
# Opções:
#   --no-build          Não recompilar aplicações
#   --no-wait           Não aguardar serviços ficarem saudáveis
#   --no-db             Não sincronizar banco de dados
#   --verbose           Output detalhado
#   --help              Exibe ajuda
################################################################################

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

source "$SCRIPT_DIR/config.sh"
source "$SCRIPT_DIR/lib/common.sh"

# Opções
SKIP_BUILD=false
SKIP_WAIT=false
SKIP_DB=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-build) SKIP_BUILD=true; shift ;;
        --no-wait) SKIP_WAIT=true; shift ;;
        --no-db) SKIP_DB=true; shift ;;
        --verbose) LOG_LEVEL="DEBUG"; shift ;;
        --help)
            echo "Uso: $0 [options]"
            echo "Opções:"
            echo "  --no-build      Não recompilar"
            echo "  --no-wait       Não aguardar saúde"
            echo "  --no-db         Não sincronizar BD"
            echo "  --verbose       Debug logging"
            exit 0
            ;;
        *) log_error "Opção desconhecida: $1"; exit 1 ;;
    esac
done

print_section "🚀 Starting Open-Panel Services"

# 1. Validar .env
if [ ! -f "$ENV_FILE" ]; then
    log_fatal ".env não encontrado. Execute setup primeiro: ./scripts/setup/setup.sh"
fi

source "$ENV_FILE"

# 2. Iniciar Docker services
print_subsection "Iniciando Docker containers"
spinner_with_result "Iniciando docker-compose" docker-compose up -d

# 3. Aguardar saúde (se não skipped)
if [ "$SKIP_WAIT" = false ]; then
    print_subsection "Aguardando containers ficarem saudáveis"
    wait_for_container_health "$CONTAINER_POSTGRES" 60 || log_fatal "PostgreSQL não ficou saudável"
    wait_for_container_health "$CONTAINER_REDIS" 60 || log_fatal "Redis não ficou saudável"
fi

# 4. Sincronizar DB (se não skipped)
if [ "$SKIP_DB" = false ]; then
    print_subsection "Sincronizando banco de dados"
    npm run db:push 2>&1 | tee -a "$LOG_FILE" || log_fatal "DB push falhou"
fi

# 5. Build (se não skipped)
if [ "$SKIP_BUILD" = false ]; then
    print_subsection "Compilando aplicações"
    spinner_with_result "Compilando" npm run build || log_fatal "Build falhou"
fi

# 6. Iniciar aplicação
print_subsection "Iniciando aplicação"
print_info "Iniciando npm run dev..."
npm run dev

log_info "Start script completed"
