#!/bin/bash

################################################################################
# Open-Panel Restart Script
# Reinicia todos os serviços de forma segura
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

source "$SCRIPT_DIR/config.sh"
source "$SCRIPT_DIR/lib/common.sh"

print_section "🔄 Restarting Open-Panel Services"

# Parar tudo
print_subsection "Parando serviços"
docker compose down || docker-compose down || log_error "Erro ao parar serviços"

# Aguardar um pouco
sleep 2

# Iniciar novamente com recriação
print_subsection "Reiniciando e recriando serviços (build + force-recreate)"
if command -v docker_compose_recreate >/dev/null 2>&1; then
    docker_compose_recreate
else
    docker compose up -d --build --force-recreate || docker-compose up -d --build --force-recreate || log_fatal "Erro ao reiniciar docker-compose"
fi

# Aguardar saúde
print_subsection "Aguardando containers"
wait_for_container_health "$CONTAINER_POSTGRES" 60 || log_warn "PostgreSQL timeout"
wait_for_container_health "$CONTAINER_REDIS" 60 || log_warn "Redis timeout"

# Sincronizar DB
npm run db:push 2>&1 | tail -5 || log_warn "DB push warning"

print_success "Restart concluído!"
print_info "Acesse: http://localhost:3000"
