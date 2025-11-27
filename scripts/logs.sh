#!/bin/bash

################################################################################
# Open-Panel Log Viewer
# Visualiza e filtra logs dos serviços
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

source "$SCRIPT_DIR/config.sh"
source "$SCRIPT_DIR/lib/common.sh"

# Opções
SERVICE="${1:-all}"
FOLLOW="${2:---tail 50}"
FILTER="${3:-}"

print_section "📋 Open-Panel Logs"

case "$SERVICE" in
    postgres|api|redis|web|traefik|all|help)
        ;;
    *)
        echo "Uso: $0 [service] [options]"
        echo "Services: postgres, redis, api, web, traefik, all (default)"
        echo "Options: --follow (tail -f), --tail N, --grep PATTERN"
        exit 1
        ;;
esac

if [ "$SERVICE" = "help" ]; then
    echo "Uso: $0 [service] [lines]"
    echo ""
    echo "Services:"
    echo "  postgres    PostgreSQL logs"
    echo "  redis       Redis logs"
    echo "  api         API container logs"
    echo "  web         Web UI container logs"
    echo "  traefik     Traefik reverse proxy logs"
    echo "  all         All logs (default)"
    echo ""
    echo "Examples:"
    echo "  $0 postgres"
    echo "  $0 postgres --follow"
    echo "  $0 all --tail 100"
    exit 0
fi

show_logs() {
    local container=$1
    if docker ps -a | grep -q "$container"; then
        echo ""
        print_subsection "Logs: $container"
        if [[ "$FOLLOW" == *"follow"* ]]; then
            docker logs -f "$container"
        else
            docker logs $FOLLOW "$container"
        fi
    fi
}

if [ "$SERVICE" = "all" ]; then
    for container in "${CONTAINERS_MAIN[@]}"; do
        show_logs "$container"
    done
    echo ""
    if [ -f "$LOG_FILE" ]; then
        print_subsection "Setup Logs: $LOG_FILE"
        tail -50 "$LOG_FILE"
    fi
else
    show_logs "$SERVICE"
fi

log_info "Logs viewed"
