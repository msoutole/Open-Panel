#!/bin/bash
# ============================================================================
# OpenPanel - Script de Instalação para Servidor Ubuntu
# ============================================================================
# Instalação completa do OpenPanel em servidor Ubuntu com suporte multi-ambiente
# Configura dev, pre e prod automaticamente
#
# Uso:
#   chmod +x install-server.sh
#   ./install-server.sh
# ============================================================================

set -e
set -o pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
ARROW="${BLUE}➜${NC}"
WARN="${YELLOW}⚠${NC}"
INFO="${CYAN}ℹ${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="${PROJECT_DIR}/install-server.log"

# Funções de log
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" >> "${LOG_FILE}"
    
    case $level in
        ERROR)   echo -e "${CROSS} ${RED}${message}${NC}" ;;
        SUCCESS) echo -e "${CHECK} ${GREEN}${message}${NC}" ;;
        WARN)    echo -e "${WARN} ${YELLOW}${message}${NC}" ;;
        INFO)    echo -e "${INFO} ${CYAN}${message}${NC}" ;;
        *)       echo -e "${message}" ;;
    esac
}

error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Verificar se está rodando como root ou com sudo
check_sudo() {
    if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
        log "WARN" "Este script precisa de privilégios sudo para algumas operações"
        log "INFO" "Você será solicitado a inserir sua senha quando necessário"
    fi
}

# Detectar sistema operacional
detect_os() {
    log "INFO" "Detectando sistema operacional..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_DIST=$ID
        OS_VERSION=$VERSION_ID
        
        if [ "$OS_DIST" != "ubuntu" ] && [ "$OS_DIST" != "debian" ]; then
            error_exit "Este script é otimizado para Ubuntu/Debian. Sistema detectado: $OS_DIST"
        fi
        
        log "SUCCESS" "Sistema detectado: $OS_DIST $OS_VERSION"
    else
        error_exit "Não foi possível detectar o sistema operacional"
    fi
}

# Instalar dependências do sistema
install_system_dependencies() {
    log "INFO" "Atualizando pacotes do sistema..."
    sudo apt-get update -qq || error_exit "Falha ao atualizar pacotes"
    
    log "INFO" "Instalando dependências básicas..."
    sudo apt-get install -y -qq \
        curl \
        wget \
        git \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        || error_exit "Falha ao instalar dependências"
    
    log "SUCCESS" "Dependências do sistema instaladas"
}

# Instalar Tailscale
install_tailscale() {
    log "INFO" "Verificando Tailscale..."
    
    if command -v tailscale >/dev/null 2>&1; then
        log "INFO" "Tailscale já está instalado"
        return 0
    fi
    
    log "INFO" "Instalando Tailscale..."
    
    # Adicionar repositório Tailscale
    curl -fsSL https://tailscale.com/install.sh | sh || error_exit "Falha ao instalar Tailscale"
    
    # Habilitar IP forwarding
    echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
    echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    
    log "SUCCESS" "Tailscale instalado"
    log "WARN" "⚠️  IMPORTANTE: Configure TAILSCALE_AUTHKEY no .env antes de iniciar os containers!"
    log "INFO" "   Obtenha uma auth key em: https://login.tailscale.com/admin/settings/keys"
}

# Instalar Node.js
install_nodejs() {
    log "INFO" "Verificando Node.js..."
    
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node -v | sed 's/v//')
        log "INFO" "Node.js $NODE_VERSION já está instalado"
        
        # Verificar versão mínima (18.0.0)
        if [ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" != "18.0.0" ]; then
            log "WARN" "Node.js versão muito antiga. Atualizando..."
        else
            log "SUCCESS" "Node.js versão adequada"
            return 0
        fi
    fi
    
    log "INFO" "Instalando Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - || error_exit "Falha ao configurar repositório Node.js"
    sudo apt-get install -y -qq nodejs || error_exit "Falha ao instalar Node.js"
    
    log "SUCCESS" "Node.js $(node -v) instalado"
}

# Instalar Docker
install_docker() {
    log "INFO" "Verificando Docker..."
    
    if command -v docker >/dev/null 2>&1; then
        DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        log "INFO" "Docker $DOCKER_VERSION já está instalado"
        
        # Verificar se Docker está rodando
        if docker info >/dev/null 2>&1; then
            log "SUCCESS" "Docker está rodando"
            return 0
        else
            log "WARN" "Docker instalado mas não está rodando. Iniciando..."
            sudo systemctl start docker || error_exit "Falha ao iniciar Docker"
            sudo systemctl enable docker || log "WARN" "Falha ao habilitar Docker no boot"
        fi
    else
        log "INFO" "Instalando Docker..."
        curl -fsSL https://get.docker.com -o /tmp/get-docker.sh || error_exit "Falha ao baixar script Docker"
        sudo sh /tmp/get-docker.sh || error_exit "Falha ao instalar Docker"
        rm /tmp/get-docker.sh
        
        # Adicionar usuário ao grupo docker
        sudo usermod -aG docker $USER || log "WARN" "Falha ao adicionar usuário ao grupo docker"
        
        # Iniciar Docker
        sudo systemctl start docker || error_exit "Falha ao iniciar Docker"
        sudo systemctl enable docker || log "WARN" "Falha ao habilitar Docker no boot"
        
        log "SUCCESS" "Docker instalado"
    fi
}

# Configurar firewall
configure_firewall() {
    log "INFO" "Configurando firewall (UFW)..."
    
    # Verificar se UFW está ativo
    if sudo ufw status | grep -q "Status: active"; then
        log "INFO" "UFW já está ativo"
    else
        log "INFO" "Habilitando UFW..."
        sudo ufw --force enable || log "WARN" "Falha ao habilitar UFW"
    fi
    
    # Permitir portas necessárias
    sudo ufw allow 22/tcp comment 'SSH' || true
    sudo ufw allow 80/tcp comment 'HTTP' || true
    sudo ufw allow 443/tcp comment 'HTTPS' || true
    sudo ufw allow 8080/tcp comment 'Traefik Dashboard' || true
    
    log "SUCCESS" "Firewall configurado"
}

# Criar arquivos de ambiente
create_env_files() {
    log "INFO" "Criando arquivos de ambiente..."
    
    cd "$PROJECT_DIR"
    
    # Perguntar sobre Tailscale Auth Key
    echo ""
    echo -e "${CYAN}🔐 Configuração do Tailscale (VPN)${NC}"
    echo -e "${INFO} Tailscale permite acesso remoto seguro ao servidor."
    echo -e "${INFO} Se você já tem uma auth key, digite agora (ou pressione Enter para pular):"
    read -p "TAILSCALE_AUTHKEY (ou Enter para pular): " TAILSCALE_KEY
    
    # Criar .env.dev se não existir
    if [ ! -f .env.dev ]; then
        if [ -f .env.dev.example ]; then
            cp .env.dev.example .env.dev
            log "SUCCESS" "Arquivo .env.dev criado"
        else
            log "WARN" "Arquivo .env.dev.example não encontrado"
        fi
    fi
    
    # Adicionar Tailscale Auth Key se fornecida
    if [ -n "$TAILSCALE_KEY" ]; then
        # Adicionar ou atualizar em .env.dev
        if grep -q "^TAILSCALE_AUTHKEY=" .env.dev 2>/dev/null; then
            sed -i "s|^TAILSCALE_AUTHKEY=.*|TAILSCALE_AUTHKEY=$TAILSCALE_KEY|" .env.dev
        else
            echo "" >> .env.dev
            echo "# Tailscale (VPN)" >> .env.dev
            echo "TAILSCALE_AUTHKEY=$TAILSCALE_KEY" >> .env.dev
        fi
        log "SUCCESS" "Tailscale Auth Key adicionada ao .env.dev"
    fi
    
    # Criar .env.pre se não existir
    if [ ! -f .env.pre ]; then
        if [ -f .env.pre.example ]; then
            cp .env.pre.example .env.pre
            log "SUCCESS" "Arquivo .env.pre criado"
        else
            log "WARN" "Arquivo .env.pre.example não encontrado"
        fi
    fi
    
    # Adicionar Tailscale Auth Key em .env.pre se fornecida
    if [ -n "$TAILSCALE_KEY" ]; then
        if grep -q "^TAILSCALE_AUTHKEY=" .env.pre 2>/dev/null; then
            sed -i "s|^TAILSCALE_AUTHKEY=.*|TAILSCALE_AUTHKEY=$TAILSCALE_KEY|" .env.pre
        else
            echo "" >> .env.pre
            echo "# Tailscale (VPN)" >> .env.pre
            echo "TAILSCALE_AUTHKEY=$TAILSCALE_KEY" >> .env.pre
        fi
        log "SUCCESS" "Tailscale Auth Key adicionada ao .env.pre"
    fi
    
    # Criar .env.prod se não existir
    if [ ! -f .env.prod ]; then
        if [ -f .env.prod.example ]; then
            cp .env.prod.example .env.prod
            log "WARN" "Arquivo .env.prod criado com senhas padrão!"
            log "WARN" "⚠️  IMPORTANTE: Altere todas as senhas em .env.prod antes de usar em produção!"
        else
            log "WARN" "Arquivo .env.prod.example não encontrado"
        fi
    fi
    
    # Adicionar Tailscale Auth Key em .env.prod se fornecida
    if [ -n "$TAILSCALE_KEY" ]; then
        if grep -q "^TAILSCALE_AUTHKEY=" .env.prod 2>/dev/null; then
            sed -i "s|^TAILSCALE_AUTHKEY=.*|TAILSCALE_AUTHKEY=$TAILSCALE_KEY|" .env.prod
        else
            echo "" >> .env.prod
            echo "# Tailscale (VPN)" >> .env.prod
            echo "TAILSCALE_AUTHKEY=$TAILSCALE_KEY" >> .env.prod
        fi
        log "SUCCESS" "Tailscale Auth Key adicionada ao .env.prod"
    fi
    
    if [ -z "$TAILSCALE_KEY" ]; then
        log "INFO" "Tailscale não configurado. Você pode adicionar depois editando os arquivos .env"
        log "INFO" "Obtenha uma auth key em: https://login.tailscale.com/admin/settings/keys"
    fi
    
    log "SUCCESS" "Arquivos de ambiente criados"
}

# Gerar senhas seguras
generate_secrets() {
    log "INFO" "Gerando senhas seguras..."
    
    cd "$PROJECT_DIR"
    
    # Função para gerar senha aleatória
    generate_password() {
        openssl rand -hex 32 2>/dev/null || \
        node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || \
        echo "changeme-$(date +%s)"
    }
    
    # Atualizar senhas em .env.dev se ainda estiverem como padrão
    if [ -f .env.dev ] && grep -q "changeme" .env.dev; then
        POSTGRES_PASSWORD=$(generate_password)
        REDIS_PASSWORD=$(generate_password)
        JWT_SECRET=$(openssl rand -hex 64 2>/dev/null || node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
        
        sed -i "s/POSTGRES_PASSWORD=changeme/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env.dev
        sed -i "s/REDIS_PASSWORD=changeme/REDIS_PASSWORD=$REDIS_PASSWORD/" .env.dev
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://openpanel:$POSTGRES_PASSWORD@openpanel-postgres:5432/openpanel|" .env.dev
        sed -i "s|REDIS_URL=.*|REDIS_URL=redis://:$REDIS_PASSWORD@openpanel-redis:6379/0|" .env.dev
        
        log "SUCCESS" "Senhas geradas para .env.dev"
    fi
    
    # Repetir para .env.pre
    if [ -f .env.pre ] && grep -q "changeme" .env.pre; then
        POSTGRES_PASSWORD=$(generate_password)
        REDIS_PASSWORD=$(generate_password)
        JWT_SECRET=$(openssl rand -hex 64 2>/dev/null || node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
        
        sed -i "s/POSTGRES_PASSWORD=changeme/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env.pre
        sed -i "s/REDIS_PASSWORD=changeme/REDIS_PASSWORD=$REDIS_PASSWORD/" .env.pre
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://openpanel:$POSTGRES_PASSWORD@openpanel-postgres:5432/openpanel|" .env.pre
        sed -i "s|REDIS_URL=.*|REDIS_URL=redis://:$REDIS_PASSWORD@openpanel-redis:6379/0|" .env.pre
        
        log "SUCCESS" "Senhas geradas para .env.pre"
    fi
    
    log "INFO" "⚠️  Lembre-se de gerar senhas fortes para .env.prod manualmente!"
}

# Instalar dependências do projeto
install_project_dependencies() {
    log "INFO" "Instalando dependências do projeto..."
    
    cd "$PROJECT_DIR"
    
    if [ ! -f package.json ]; then
        error_exit "package.json não encontrado. Certifique-se de estar no diretório correto."
    fi
    
    npm install || error_exit "Falha ao instalar dependências"
    
    log "SUCCESS" "Dependências do projeto instaladas"
}

# Tornar scripts executáveis
make_scripts_executable() {
    log "INFO" "Tornando scripts executáveis..."
    
    chmod +x scripts/server/*.sh 2>/dev/null || true
    chmod +x scripts/setup/*.sh 2>/dev/null || true
    
    log "SUCCESS" "Scripts tornados executáveis"
}

# Iniciar infraestrutura compartilhada
start_infrastructure() {
    log "INFO" "Iniciando infraestrutura compartilhada..."
    
    cd "$PROJECT_DIR"
    
    docker compose up -d postgres redis traefik || error_exit "Falha ao iniciar infraestrutura"
    
    # Iniciar Tailscale se auth key estiver configurada
    if [ -n "${TAILSCALE_AUTHKEY:-}" ]; then
        log "INFO" "Iniciando Tailscale..."
        docker compose --profile tailscale up -d tailscale || log "WARN" "Tailscale não iniciado (opcional)"
    fi
    
    # Aguardar PostgreSQL estar pronto
    log "INFO" "Aguardando PostgreSQL estar pronto..."
    timeout=60
    elapsed=0
    until docker exec openpanel-postgres pg_isready -U openpanel > /dev/null 2>&1; do
        if [ $elapsed -ge $timeout ]; then
            error_exit "Timeout aguardando PostgreSQL"
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    echo ""
    
    log "SUCCESS" "Infraestrutura compartilhada iniciada"
}

# Configurar domínios locais
configure_local_domains() {
    log "INFO" "Configurando domínios locais..."
    
    HOSTS_FILE="/etc/hosts"
    DOMAINS=("dev.openpanel.local" "pre.openpanel.local" "openpanel.local")
    
    for domain in "${DOMAINS[@]}"; do
        if ! grep -q "$domain" "$HOSTS_FILE" 2>/dev/null; then
            echo "127.0.0.1  $domain" | sudo tee -a "$HOSTS_FILE" > /dev/null
            log "SUCCESS" "Domínio $domain adicionado ao /etc/hosts"
        else
            log "INFO" "Domínio $domain já existe em /etc/hosts"
        fi
    done
}

# Resumo da instalação
print_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           INSTALAÇÃO CONCLUÍDA COM SUCESSO! 🎉                ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}📋 Próximos Passos:${NC}"
    echo ""
    echo -e "   ${ARROW} 1. Configure Tailscale (opcional):"
    echo -e "      ${WHITE}Obtenha uma auth key: https://login.tailscale.com/admin/settings/keys${NC}"
    echo -e "      ${WHITE}Adicione TAILSCALE_AUTHKEY nos arquivos .env${NC}"
    echo ""
    echo -e "   ${ARROW} 2. Configure os arquivos .env:"
    echo -e "      ${WHITE}- .env.dev${NC} (desenvolvimento)"
    echo -e "      ${WHITE}- .env.pre${NC} (staging)"
    echo -e "      ${WHITE}- .env.prod${NC} (produção - ${RED}⚠️ altere senhas!${NC})"
    echo ""
    echo -e "   ${ARROW} 3. Nota: Banco PostgreSQL e Redis são compartilhados entre todos os ambientes"
    echo ""
    echo -e "   ${ARROW} 4. Inicie os ambientes:"
    echo -e "      ${WHITE}./scripts/server/start-dev.sh${NC}    # Ambiente DEV"
    echo -e "      ${WHITE}./scripts/server/start-pre.sh${NC}    # Ambiente PRE"
    echo -e "      ${WHITE}./scripts/server/start-prod.sh${NC}   # Ambiente PROD"
    echo ""
    echo -e "   ${ARROW} 5. Acesse os ambientes:"
    echo -e "      ${WHITE}http://dev.openpanel.local${NC}       # DEV"
    echo -e "      ${WHITE}http://pre.openpanel.local${NC}       # PRE"
    echo -e "      ${WHITE}https://openpanel.local${NC}          # PROD"
    echo ""
    echo -e "   ${ARROW} 6. Verifique o status:"
    echo -e "      ${WHITE}./scripts/server/status.sh${NC}"
    echo ""
    echo -e "${CYAN}📚 Documentação:${NC}"
    echo -e "   ${ARROW} docs/INSTALACAO_SERVIDOR.md"
    echo -e "   ${ARROW} docs/DESENVOLVIMENTO_REMOTO.md"
    echo ""
}

# Função principal
main() {
    echo "==================================" > "${LOG_FILE}"
    echo "OpenPanel Server Installation Log" >> "${LOG_FILE}"
    echo "Started: $(date)" >> "${LOG_FILE}"
    echo "==================================" >> "${LOG_FILE}"
    
    log "INFO" "Iniciando instalação do OpenPanel no servidor..."
    
    check_sudo
    detect_os
    install_system_dependencies
    install_tailscale
    install_nodejs
    install_docker
    configure_firewall
    create_env_files
    generate_secrets
    install_project_dependencies
    make_scripts_executable
    start_infrastructure
    configure_local_domains
    
    log "SUCCESS" "Instalação concluída!"
    
    print_summary
    
    echo "==================================" >> "${LOG_FILE}"
    echo "Completed: $(date)" >> "${LOG_FILE}"
    echo "==================================" >> "${LOG_FILE}"
}

# Executar
main "$@"

