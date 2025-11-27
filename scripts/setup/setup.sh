#!/bin/bash

################################################################################
# Open-Panel Setup Script - 100% Automatizado
#
# Este script configura completamente o Open-Panel com ZERO intervenção manual
# Características:
# - ✅ 100% Automatizado (sem prompts interativos)
# - ✅ Multi-plataforma (Linux, macOS, WSL)
# - ✅ Idempotente (seguro rodar múltiplas vezes)
# - ✅ Robusto com tratamento de erros
# - ✅ Health checks completos
# - ✅ Criação automática de admin
# - ✅ Notificação de erros por email
#
# Uso: ./scripts/setup/setup.sh [options]
# Opções:
#   --debug               Ativa logs DEBUG
#   --reset-state         Reseta estado de instalação
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
source "$SCRIPT_DIR/../lib/installation-state.sh"

# Variáveis locais do script
RESET_STATE=false

# ============================================================================
# PARSE ARGUMENTOS
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --debug)
            LOG_LEVEL="DEBUG"
            shift
            ;;
        --reset-state)
            RESET_STATE=true
            shift
            ;;
        --help)
            echo "Uso: $0 [options]"
            echo "Opções:"
            echo "  --debug         Ativa logs DEBUG"
            echo "  --reset-state   Reseta estado de instalação"
            echo "  --help          Exibe esta ajuda"
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

print_section "🚀 Open-Panel Setup - Instalação Automática"
log_info "Iniciando setup do Open-Panel"
log_info "Projeto: $PROJECT_ROOT"
log_info "Sistema: $OS ($DISTRO ${DISTRO_VERSION:-unknown})"

# Resetar estado se solicitado
if [ "$RESET_STATE" = true ]; then
    print_warn "Resetando estado de instalação..."
    reset_installation_state
fi

# Inicializar estado de instalação
init_installation_state

# ============================================================================
# STEP 0: PRÉ-VERIFICAÇÃO E INSTALAÇÃO DE DEPENDÊNCIAS
# ============================================================================

print_subsection "Verificando e instalando dependências"

# Lista de comandos necessários
REQUIRED_COMMANDS=("curl" "git" "openssl")

# Verificar e instalar cada comando
for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! command_exists "$cmd"; then
        print_warn "$cmd não encontrado. Instalando automaticamente..."
        if ! install_command "$cmd"; then
            handle_install_failure "$cmd" "Falha ao instalar via gerenciador de pacotes"
            exit 1
        fi
    else
        print_success "$cmd detectado"
    fi
done

# Atualizar estado
if ! is_step_completed "dependencies_installed"; then
    update_state "dependencies_installed" "true"
fi

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
    print_warn "Node.js não encontrado. Instalando automaticamente..."
    log_info "Node.js não instalado. Tentando instalar..."

    if ! install_command "node"; then
        handle_install_failure "node" "Falha ao instalar Node.js"
        exit 1
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
    print_warn "Docker não encontrado. Instalando automaticamente..."
    log_info "Docker não instalado. Tentando instalar..."

    if ! install_command "docker"; then
        handle_install_failure "docker" "Falha ao instalar Docker"
        exit 1
    fi

    print_success "Docker instalado"
fi

# Verificar Docker Compose
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    print_success "Docker Compose detectado"
    log_info "Docker Compose disponível"
else
    print_warn "Docker Compose não encontrado. Instalando..."

    if ! install_command "docker-compose"; then
        handle_install_failure "docker-compose" "Falha ao instalar Docker Compose"
        exit 1
    fi
fi

# Verificar Docker daemon
print_info "Verificando Docker daemon..."
if ! is_docker_running; then
    print_warn "Docker daemon não está rodando. Tentando iniciar..."
    log_warn "Docker daemon is not running. Attempting to start..."

    if command_exists systemctl; then
        sudo systemctl start docker || log_error "Falha ao iniciar Docker (systemctl)"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        open -a Docker || log_error "Falha ao iniciar Docker Desktop (macOS)"
        sleep 10
    fi

    # Verificar novamente
    sleep 5
    if ! is_docker_running; then
        handle_install_failure "docker-daemon" "Docker daemon não está rodando após tentativa de inicialização"
        exit 1
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
# STEP 2: GERENCIAMENTO INTELIGENTE DE CREDENCIAIS
# ============================================================================

print_subsection "Configurando credenciais do sistema"

# Arquivo de metadados de credenciais
CREDENTIALS_META_FILE=".env.backups/.credentials.meta"
ensure_dir ".env.backups"

# Função para verificar se credenciais já foram geradas
credentials_already_generated() {
    [ -f "$CREDENTIALS_META_FILE" ] && grep -q "GENERATED=true" "$CREDENTIALS_META_FILE"
}

# Carregar credenciais existentes do .env se existir
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE" 2>/dev/null || true
    set +a
    EXISTING_POSTGRES_PASSWORD="$POSTGRES_PASSWORD"
    EXISTING_REDIS_PASSWORD="$REDIS_PASSWORD"
    EXISTING_JWT_SECRET="$JWT_SECRET"
fi

# Decidir se precisa gerar novas credenciais
if credentials_already_generated && [ -n "$EXISTING_POSTGRES_PASSWORD" ] && [ "$EXISTING_POSTGRES_PASSWORD" != "changeme" ]; then
    print_success "Credenciais existentes detectadas. Reutilizando..."
    POSTGRES_PASSWORD="$EXISTING_POSTGRES_PASSWORD"
    REDIS_PASSWORD="$EXISTING_REDIS_PASSWORD"
    JWT_SECRET="$EXISTING_JWT_SECRET"
    log_info "Reusing existing credentials"
else
    print_info "Gerando novas credenciais criptográficas..."

    # Gerar credenciais seguras
    POSTGRES_PASSWORD=$(generate_random_string 32)
    REDIS_PASSWORD=$(generate_random_string 32)
    JWT_SECRET=$(generate_random_string 64)

    # Salvar metadata
    cat > "$CREDENTIALS_META_FILE" <<EOF
GENERATED=true
GENERATED_AT=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)
POSTGRES_PASSWORD_HASH=$(echo -n "$POSTGRES_PASSWORD" | sha256sum 2>/dev/null | cut -d' ' -f1 || echo "no-hash")
REDIS_PASSWORD_HASH=$(echo -n "$REDIS_PASSWORD" | sha256sum 2>/dev/null | cut -d' ' -f1 || echo "no-hash")
JWT_SECRET_HASH=$(echo -n "$JWT_SECRET" | sha256sum 2>/dev/null | cut -d' ' -f1 || echo "no-hash")
EOF

    print_success "Novas credenciais geradas"
    log_info "Generated new cryptographically secure credentials"

    # Marcar no estado
    update_state "credentials_generated" "true"
fi

# Criar ou atualizar .env
if [ ! -f "$ENV_FILE" ]; then
    if [ ! -f "$ENV_EXAMPLE_FILE" ]; then
        log_fatal "Arquivo $ENV_EXAMPLE_FILE não encontrado"
    fi
    cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
    print_info ".env criado a partir de .env.example"
fi

# Atualizar credenciais no .env (uso de sed cross-platform)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" "$ENV_FILE"
    sed -i '' "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|g" "$ENV_FILE"
    sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" "$ENV_FILE"
    # Atualizar DATABASE_URL completa
    sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=postgresql://openpanel:$POSTGRES_PASSWORD@localhost:5432/openpanel|g" "$ENV_FILE"
    # Atualizar REDIS_URL completa
    sed -i '' "s|REDIS_URL=.*|REDIS_URL=redis://:$REDIS_PASSWORD@localhost:6379|g" "$ENV_FILE"
else
    # Linux
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" "$ENV_FILE"
    sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|g" "$ENV_FILE"
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" "$ENV_FILE"
    # Atualizar DATABASE_URL completa
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://openpanel:$POSTGRES_PASSWORD@localhost:5432/openpanel|g" "$ENV_FILE"
    # Atualizar REDIS_URL completa
    sed -i "s|REDIS_URL=.*|REDIS_URL=redis://:$REDIS_PASSWORD@localhost:6379|g" "$ENV_FILE"
fi

print_success "Arquivo .env configurado com credenciais"
log_info "DATABASE_URL e REDIS_URL atualizados com senhas geradas"

# Recarregar variáveis de ambiente
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    log_debug ".env reloaded into environment"
fi

# ============================================================================
# STEP 3: INSTALAR DEPENDÊNCIAS NPM
# ============================================================================

print_subsection "Instalando dependências do projeto"

if [ ! -d "$NODE_MODULES_DIR" ] || [ ! -f "package-lock.json" ]; then
    print_info "Instalando npm dependencies..."
    log_info "Running: npm install"

    if ! npm install --prefer-offline 2>&1 | tee -a "$LOG_FILE"; then
        log_fatal "Falha ao instalar dependências npm"
    fi

    print_success "Dependências instaladas"
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

print_info "Iniciando containers Docker..."
log_info "Running: docker-compose up -d"

if ! docker-compose up -d 2>&1 | tee -a "$LOG_FILE"; then
    log_fatal "Falha ao iniciar docker-compose"
fi

print_success "Containers Docker iniciados"

# ============================================================================
# STEP 6: AGUARDAR SERVIÇOS FICAREM HEALTHY (OBRIGATÓRIO)
# ============================================================================

print_subsection "Aguardando serviços ficarem saudáveis (obrigatório)"

# Lista de todos os containers críticos
CRITICAL_CONTAINERS=(
    "openpanel-postgres"
    "openpanel-redis"
    "openpanel-traefik"
)

# Verificar containers críticos
all_healthy=true
for container in "${CRITICAL_CONTAINERS[@]}"; do
    print_info "Verificando: $container..."

    # Verificar se container está rodando
    if ! docker ps --filter "name=$container" --format "{{.Names}}" | grep -q "$container"; then
        print_error "$container não está rodando!"
        all_healthy=false

        # Tentar ver por que falhou
        print_info "Verificando logs de $container:"
        docker logs --tail 30 "$container" 2>&1 | sed 's/^/  /' | tee -a "$LOG_FILE"
        continue
    fi

    # Aguardar ficar healthy
    if wait_for_container_health "$container" 120; then
        print_success "$container está saudável ✓"
    else
        print_error "$container não ficou saudável em 120s"
        all_healthy=false

        # Mostrar logs do container com falha
        print_info "Últimas 30 linhas de log de $container:"
        docker logs --tail 30 "$container" 2>&1 | sed 's/^/  /' | tee -a "$LOG_FILE"
    fi
done

if [ "$all_healthy" = false ]; then
    print_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_error "❌ ALGUNS SERVIÇOS CRÍTICOS NÃO ESTÃO SAUDÁVEIS"
    print_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    print_info "📝 AÇÕES RECOMENDADAS:"
    echo "  1. Verifique os logs acima para identificar o problema"
    echo "  2. Execute: docker-compose logs -f [container-name]"
    echo "  3. Tente reiniciar os serviços: docker-compose restart"
    echo "  4. Se o problema persistir: msoutole@hotmail.com"
    echo ""
    print_info "📧 Um email de erro foi enviado automaticamente."
    echo ""

    # Enviar email de erro
    send_error_email "docker-services" "Um ou mais containers não ficaram healthy. Veja logs em $LOG_FILE"

    log_fatal "Instalação falhou: Serviços não ficaram saudáveis"
fi

print_success "Todos os serviços críticos estão saudáveis!"
update_state "docker_services_healthy" "true"

# ============================================================================
# STEP 7: CONFIGURAR BANCO DE DADOS
# ============================================================================

print_subsection "Configurando banco de dados"

if ! is_step_completed "database_initialized"; then
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
    update_state "database_initialized" "true"
else
    print_success "Banco de dados já está inicializado"
fi

# ============================================================================
# STEP 8: CRIAR USUÁRIO ADMINISTRADOR AUTOMATICAMENTE
# ============================================================================

print_subsection "Criando usuário administrador"

if ! is_step_completed "admin_created"; then
    print_info "Criando usuário admin padrão..."

    # Definir credenciais padrão
    export ADMIN_EMAIL="admin@admin.com.br"
    export ADMIN_PASSWORD="admin123"

    # Executar script de criação de admin
    if npm run create:admin 2>&1 | tee -a "$LOG_FILE"; then
        print_success "Usuário administrador criado com sucesso!"
        echo ""
        print_warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        print_warn "⚠️  IMPORTANTE - CREDENCIAIS PADRÃO"
        print_warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "  Email:    ${COLOR_CYAN}$ADMIN_EMAIL${COLOR_NC}"
        echo "  Senha:    ${COLOR_CYAN}$ADMIN_PASSWORD${COLOR_NC}"
        echo ""
        print_warn "🔒 VOCÊ DEVE ALTERAR A SENHA IMEDIATAMENTE APÓS O LOGIN!"
        print_warn "   A senha será solicitada na tela de boas-vindas."
        echo ""

        update_state "admin_created" "true"
        log_info "Admin user created: $ADMIN_EMAIL"
    else
        print_warn "Falha ao criar usuário administrador (pode já existir)"
        log_warn "Failed to create admin user - may already exist"
        # Não bloquear instalação, admin pode já existir
    fi
else
    print_success "Usuário administrador já foi criado"
fi

# ============================================================================
# STEP 9: VERIFICAÇÃO FINAL
# ============================================================================

print_subsection "Verificação final"

# Aguardar API iniciar (opcional, não bloqueia)
print_info "Aguardando API ficar pronta (opcional)..."
sleep 5

if wait_for_port "$PORT_API" 30; then
    print_success "API está respondendo na porta $PORT_API"
    log_info "API responding on port $PORT_API"
else
    print_warn "API ainda não está respondendo (será iniciada com 'npm run dev')"
    log_warn "API not responding yet - will start with npm run dev"
fi

# ============================================================================
# SUCESSO - MARCAR INSTALAÇÃO COMO COMPLETA
# ============================================================================

mark_installation_complete

print_section "✅ Setup Concluído com Sucesso!"

echo ""
print_info "Informações de acesso:"
echo "  Web Interface:  ${COLOR_CYAN}http://localhost:${PORT_WEB}${COLOR_NC}"
echo "  API Endpoint:   ${COLOR_CYAN}http://localhost:${PORT_API}${COLOR_NC}"
echo "  Traefik Panel:  ${COLOR_CYAN}http://localhost:${PORT_TRAEFIK_DASHBOARD}${COLOR_NC}"

echo ""
print_info "Credenciais de Admin:"
echo "  Email:    ${COLOR_CYAN}admin@admin.com.br${COLOR_NC}"
echo "  Senha:    ${COLOR_CYAN}admin123${COLOR_NC}"
echo "  ${COLOR_YELLOW}⚠️  Altere a senha no primeiro login!${COLOR_NC}"

echo ""
print_info "Próximos passos:"
echo "  1. Inicie a aplicação: ${COLOR_CYAN}npm run dev${COLOR_NC}"
echo "  2. Abra ${COLOR_CYAN}http://localhost:${PORT_WEB}${COLOR_NC} no navegador"
echo "  3. Faça login com as credenciais acima"
echo "  4. Complete o onboarding (configurar IA, alterar senha)"
echo "  5. Comece a gerenciar seus containers!"

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
log_info "Installation state: $STATE_FILE"

print_section "Happy coding! 🎉"
