#!/bin/bash

################################################################################
# Open-Panel Stop Script
# Para todos os serviços de forma segura
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

source "$SCRIPT_DIR/config.sh"
source "$SCRIPT_DIR/lib/common.sh"

print_section "🛑 Stopping Open-Panel Services"

# Confirmar se há dados em-flight
print_info "Parando containers e preservando dados..."

# Stop gracefully
print_subsection "Aguardando graceful shutdown (30s)"
timeout 30 docker-compose down || {
    log_warn "Timeout no graceful shutdown, forçando..."
    docker-compose down --force-kill
}

print_success "Serviços parados com segurança!"
print_info "Para iniciar novamente: ./scripts/start.sh"
