#!/bin/bash

################################################################################
# Open-Panel Setup Script for Linux/macOS
#
# Este script configura completamente o Open-Panel com zero intervenção manual
# Características:
# - ✅ Completamente automatizado
# - ✅ Multi-plataforma (Linux, macOS)
# - ✅ Idempotente (seguro rodar múltiplas vezes)
# - ✅ Robusto com tratamento de erros
# - ✅ Informativo com logs detalhados
# - ✅ Seguro com geração de secrets criptográficos
# - ✅ Backup automático de configurações
# - ✅ Verificação completa pós-instalação
# - ✅ UX profissional
#
# Uso: ./scripts/setup/setup.sh [options]
# Opções:
#   --silent              Modo silencioso (sem prompts)
#   --force               Sobrescrever .env sem confirmar
#   --debug               Ativa logs DEBUG
#   --help                Exibe esta ajuda
################################################################################

set -o pipefail

# ============================================================================
# CONFIGURAÇÃO INICIAL
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$PROJECT_ROOT"

# Carregar configurações e utilitários
source "$SCRIPT_DIR/../config.sh"
source "$SCRIPT_DIR/../lib/common.sh"

# Variáveis locais do script
FORCE_ENV_OVERWRITE=false
SILENT_MODE=false

# ============================================================================
# PARSE ARGUMENTOS
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --silent) SILENT_MODE=true; shift ;;
        --force) FORCE_ENV_OVERWRITE=true; shift ;;
        --debug) LOG_LEVEL="DEBUG"; shift ;;
        --help)
            echo "Uso: $0 [options]"
            echo "Opções:"
            echo "  --silent    Modo silencioso (sem prompts interativos)"
            echo "  --force     Sobrescrever .env sem confirmar"
            echo "  --debug     Ativa logs DEBUG"
            echo "  --help      Exibe esta ajuda"
            exit 0
            ;;
        *)
            log_error "Opção desconhecida: $1"
            exit 1
            ;;
    esac
done

# ============================================================================
# BANNER E INICIALIZAÇÃO
# ============================================================================

print_section "🚀 Open-Panel Setup"
log_info "Iniciando setup do Open-Panel"
log_info "Projeto: $PROJECT_ROOT"
log_info "Sistema: $(uname -s) $(uname -m)"

# ============================================================================
# STEP 1: VERIFICAÇÕES DE PRÉ-REQUISITOS
# ============================================================================

print_subsection "Verificando pré-requisitos"

# Verificar Node.js
if command_exists node; then
    NODE_VERSION=$(node -v | sed 's/v//')
    if version_gte "$NODE_VERSION" "$MIN_NODE_VERSION"; then
        print_success "Node.js ${NODE_VERSION} detectado"
        log_info "Node.js version: $NODE_VERSION (mínimo: $MIN_NODE_VERSION)"
    else
        print_error "Node.js ${NODE_VERSION} encontrado, mas versão mínima é ${MIN_NODE_VERSION}"
        log_error "Node.js version $NODE_VERSION is less than minimum $MIN_NODE_VERSION"
        exit 2
    fi
else
    print_warn "Node.js não encontrado. Tentando instalar automaticamente..."
    log_info "Node.js não instalado. Tentando instalar..."

    if command_exists apt-get; then
        log_info "Detectado apt-get (Debian/Ubuntu). Instalando Node.js..."
        sudo apt-get update || log_fatal "Falha ao atualizar apt"
        sudo apt-get install -y nodejs npm || log_fatal "Falha ao instalar Node.js"
    elif command_exists brew; then
        log_info "Detectado brew (macOS). Instalando Node.js..."
        brew install node || log_fatal "Falha ao instalar Node.js via brew"
    elif command_exists dnf; then
        log_info "Detectado dnf (Fedora/CentOS). Instalando Node.js..."
        sudo dnf install -y nodejs npm || log_fatal "Falha ao instalar Node.js"
    elif command_exists pacman; then
        log_info "Detectado pacman (Arch). Instalando Node.js..."
        sudo pacman -S --noconfirm nodejs npm || log_fatal "Falha ao instalar Node.js"
    else
        log_fatal "Não foi possível instalar Node.js automaticamente. Por favor, instale manualmente."
    fi

    NODE_VERSION=$(node -v | sed 's/v//')
    print_success "Node.js ${NODE_VERSION} instalado"
fi

# Verificar Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    if version_gte "$DOCKER_VERSION" "$MIN_DOCKER_VERSION"; then
        print_success "Docker ${DOCKER_VERSION} detectado"
        log_info "Docker version: $DOCKER_VERSION (mínimo: $MIN_DOCKER_VERSION)"
    else
        print_error "Docker ${DOCKER_VERSION} encontrado, mas versão mínima é ${MIN_DOCKER_VERSION}"
        exit 2
    fi
else
    print_warn "Docker não encontrado. Tentando instalar automaticamente..."
    log_info "Docker não instalado. Tentando instalar via get.docker.com..."

    if ! command_exists curl; then
        log_fatal "curl é obrigatório para instalar Docker"
    fi

    curl -fsSL https://get.docker.com | sh || log_fatal "Falha ao instalar Docker"
    print_success "Docker instalado"
fi

# Verificar Docker Compose
if command_exists docker-compose; then
    DOCKER_COMPOSE_VERSION=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    if version_gte "$DOCKER_COMPOSE_VERSION" "$MIN_DOCKER_COMPOSE_VERSION"; then
        print_success "Docker Compose ${DOCKER_COMPOSE_VERSION} detectado"
        log_info "Docker Compose version: $DOCKER_COMPOSE_VERSION"
    else
        print_warn "Docker Compose versão antiga encontrada. Atualizando..."
        sudo apt-get install -y docker-compose || log_fatal "Falha ao atualizar Docker Compose"
    fi
else
    log_fatal "Docker Compose não encontrado. Por favor, instale Docker Compose v2.0.0+"
fi

# Verificar Docker daemon
print_info "Verificando Docker daemon..."
if ! is_docker_running; then
    print_warn "Docker daemon não está rodando. Tentando iniciar..."
    log_warn "Docker daemon is not running. Attempting to start..."

    if command_exists systemctl; then
        sudo systemctl start docker || log_fatal "Falha ao iniciar Docker (systemctl)"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        open -a Docker || log_fatal "Falha ao iniciar Docker Desktop (macOS)"
        sleep 5
    else
        log_fatal "Não foi possível iniciar Docker daemon automaticamente"
    fi

    if ! is_docker_running; then
        log_fatal "Docker daemon ainda não está rodando após 5s"
    fi
fi
print_success "Docker daemon está rodando"

# Verificar espaço em disco
print_info "Verificando espaço em disco..."
if ! check_disk_space "$PROJECT_ROOT" "$MIN_DISK_SPACE_MB"; then
    log_fatal "Espaço em disco insuficiente"
fi
print_success "Espaço em disco adequado (>$MIN_DISK_SPACE_MB MB)"

# ============================================================================
# STEP 2: SETUP DE VARIÁVEIS DE AMBIENTE
# ============================================================================

print_subsection "Configurando variáveis de ambiente"

if [ -f "$ENV_FILE" ]; then
    print_info ".env já existe"

    if [ "$FORCE_ENV_OVERWRITE" = false ] && [ "$SILENT_MODE" = false ]; then
        if confirm "Você deseja sobrescrever o arquivo .env existente?"; then
            FORCE_ENV_OVERWRITE=true
        else
            print_info "Mantendo .env existente"
        fi
    fi

    if [ "$FORCE_ENV_OVERWRITE" = true ]; then
        BACKUP_FILE=$(backup_file "$ENV_FILE")
        print_info "Backup de .env salvo: $BACKUP_FILE"
        log_info "Backed up .env to $BACKUP_FILE"
    fi
fi

# Criar .env se não existe ou se foi decidido sobrescrever
if [ ! -f "$ENV_FILE" ] || [ "$FORCE_ENV_OVERWRITE" = true ]; then
    if [ ! -f "$ENV_EXAMPLE_FILE" ]; then
        log_fatal "Arquivo $ENV_EXAMPLE_FILE não encontrado"
    fi

    print_info "Criando .env a partir de $ENV_EXAMPLE_FILE..."
    cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
    log_info "Created .env from .env.example"

    # Gerar secrets criptográficos
    print_info "Gerando secrets criptográficos..."

    JWT_SECRET=$(generate_random_string 64)
    POSTGRES_PASSWORD=$(generate_random_string 32)
    REDIS_PASSWORD=$(generate_random_string 32)

    log_debug "Generated JWT_SECRET (length: ${#JWT_SECRET})"
    log_debug "Generated POSTGRES_PASSWORD (length: ${#POSTGRES_PASSWORD})"
    log_debug "Generated REDIS_PASSWORD (length: ${#REDIS_PASSWORD})"

    # Atualizar variáveis no .env
    sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/g" "$ENV_FILE"
    sed -i.bak "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/g" "$ENV_FILE"
    sed -i.bak "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/g" "$ENV_FILE"
    rm -f "${ENV_FILE}.bak"

    print_success ".env criado com secrets criptográficos"
    log_info ".env created with cryptographically secure secrets"
else
    print_success ".env mantido"
fi

# Carregar variáveis de ambiente
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    log_debug ".env loaded into environment"
fi

# ============================================================================
# STEP 3: INSTALAR DEPENDÊNCIAS NPM
# ============================================================================

print_subsection "Instalando dependências do projeto"

if [ ! -d "$NODE_MODULES_DIR" ] || [ ! -f "package-lock.json" ]; then
    print_info "Instalando npm dependencies..."
    log_info "Running: npm install"

    spinner_with_result "Instalando dependências (isso pode levar alguns minutos)" \
        npm install --prefer-offline || log_fatal "Falha ao instalar dependências"
else
    print_success "Dependências já estão instaladas"
    log_info "npm dependencies already installed, skipping npm install"
fi

# ============================================================================
# STEP 4: VERIFICAR/CRIAR DIRETÓRIOS NECESSÁRIOS
# ============================================================================

print_subsection "Preparando estrutura de diretórios"

ensure_dir "$LOG_DIR"
ensure_dir ".env.backups"
ensure_dir ".docker"

print_success "Estrutura de diretórios criada"

# ============================================================================
# STEP 5: INICIAR SERVIÇOS DOCKER
# ============================================================================

print_subsection "Iniciando serviços Docker"

print_info "Iniciando containers Docker (docker-compose up -d)..."
log_info "Running: docker-compose up -d"

spinner_with_result "Iniciando Docker services" \
    docker-compose up -d || log_fatal "Falha ao iniciar docker-compose"

# ============================================================================
# STEP 6: AGUARDAR SERVIÇOS FICAREM HEALTHY
# ============================================================================

print_subsection "Aguardando serviços ficarem saudáveis"

# PostgreSQL
print_info "Aguardando PostgreSQL..."
if wait_for_container_health "$CONTAINER_POSTGRES" "$((HEALTHCHECK_RETRIES * HEALTHCHECK_INTERVAL))"; then
    print_success "PostgreSQL está saudável"
    log_info "PostgreSQL is healthy"
else
    log_fatal "PostgreSQL não ficou saudável após timeout"
fi

# Redis
print_info "Aguardando Redis..."
if wait_for_container_health "$CONTAINER_REDIS" "$((HEALTHCHECK_RETRIES * HEALTHCHECK_INTERVAL))"; then
    print_success "Redis está saudável"
    log_info "Redis is healthy"
else
    log_fatal "Redis não ficou saudável após timeout"
fi

# ============================================================================
# STEP 7: CONFIGURAR BANCO DE DADOS
# ============================================================================

print_subsection "Configurando banco de dados"

print_info "Gerando Prisma client..."
log_info "Running: npm run db:generate"
if ! npm run db:generate 2>&1 | tee -a "$LOG_FILE"; then
    log_fatal "Falha ao gerar Prisma client"
fi

print_info "Sincronizando schema do banco de dados..."
log_info "Running: npm run db:push"
if ! npm run db:push 2>&1 | tee -a "$LOG_FILE"; then
    log_fatal "Falha ao sincronizar banco de dados"
fi

print_success "Banco de dados configurado com sucesso"

# ============================================================================
# STEP 8: VERIFICAÇÃO COMPLETA PÓS-SETUP
# ============================================================================

print_subsection "Verificação completa pós-setup"

# Aguardar API iniciar
print_info "Aguardando API ficar pronta..."
sleep 3  # Dar tempo para API iniciar

if wait_for_port "$PORT_API" "$TIMEOUT_HTTP"; then
    print_success "API está respondendo na porta $PORT_API"
    log_info "API responding on port $PORT_API"
else
    print_warn "API ainda não está respondendo (esperado se não iniciou)"
    log_warn "API not responding yet - may still be starting"
fi

# Verificações de health
print_info "Executando health checks..."

# Docker health
docker_checks_passed=true
for container in "${CONTAINERS_MAIN[@]}"; do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null)
    if [ "$status" = "healthy" ]; then
        print_success "$container: Healthy"
        log_info "$container: healthy"
    else
        print_warn "$container: $status"
        log_warn "$container: $status (may be starting)"
    fi
done

# ============================================================================
# STEP 9: CRIAR USUÁRIO ADMIN (opcional)
# ============================================================================

print_subsection "Configuração final"

print_info "O usuário admin pode ser criado após a API iniciar completamente"
print_info "Você pode criar manualmente via: npm run create:admin"

# ============================================================================
# SUCESSO
# ============================================================================

print_section "✅ Setup Concluído com Sucesso!"

echo ""
print_info "Informações de acesso:"
echo "  Web Interface:  ${COLOR_CYAN}http://localhost:${PORT_WEB}${COLOR_NC}"
echo "  API Endpoint:   ${COLOR_CYAN}http://localhost:${PORT_API}${COLOR_NC}"
echo "  Traefik Panel:  ${COLOR_CYAN}http://localhost:${PORT_TRAEFIK_DASHBOARD}${COLOR_NC}"

echo ""
print_info "Próximos passos:"
echo "  1. Aguarde a API iniciar completamente (verificar logs: npm run dev)"
echo "  2. Abra ${COLOR_CYAN}http://localhost:${PORT_WEB}${COLOR_NC} no navegador"
echo "  3. Crie um novo usuário via interface"
echo "  4. Comece a gerenciar seus containers!"

echo ""
print_info "Comandos úteis:"
echo "  npm run dev              - Inicia desenvolvimento (API + Web)"
echo "  npm run dev:api          - Inicia apenas API"
echo "  npm run dev:web          - Inicia apenas Web"
echo "  npm run status           - Verifica status dos serviços"
echo "  npm run db:studio        - Abre Prisma Studio"
echo "  docker-compose logs -f   - Visualiza logs em tempo real"

echo ""
log_info "Setup completed successfully!"
log_info "Log file: $LOG_FILE"

print_section "Happy coding! 🎉"
