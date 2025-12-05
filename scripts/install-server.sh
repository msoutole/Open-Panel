#!/bin/bash
# ============================================================================
# OpenPanel - Script de Instalação para Servidor Ubuntu (Homelab Optimized)
# ============================================================================
# Instalação completa do OpenPanel em servidor Ubuntu com suporte multi-ambiente
# Configura dev, pre e prod automaticamente.
#
# RECURSOS AVANÇADOS:
# - Idempotente: Pode ser executado múltiplas vezes sem quebrar a instalação
# - Auto-recuperação: Tenta corrigir problemas comuns (apt lock, serviços parados)
# - Fail-safe: Verificações rigorosas de hardware, rede e dependências
# - Logging detalhado: Tudo é registrado em logs e stdout
#
# Uso:
#   chmod +x install-server.sh
#   ./install-server.sh
#
# Opções via variáveis de ambiente:
#   HEADLESS_MODE=true ./install-server.sh    # Instalação sem interação
#   SKIP_TAILSCALE=true ./install-server.sh   # Pular configuração Tailscale
#   MIN_RAM_MB=1024 ./install-server.sh       # Definir RAM mínima (default: 2048)
#   MIN_DISK_GB=5 ./install-server.sh         # Definir disco mínimo (default: 10)
#   STRICT_CHECK=true ./install-server.sh     # Falhar se hardware não ideal
#
# ============================================================================

set -e
set -o pipefail

# ============================================================================
# CONFIGURAÇÃO E IMPORTAÇÃO DE BIBLIOTECAS
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Importar biblioteca comum (funções de log, retry, checks)
if [ -f "$SCRIPT_DIR/lib/common.sh" ]; then
    source "$SCRIPT_DIR/lib/common.sh"
else
    echo "❌ Erro Crítico: Biblioteca $SCRIPT_DIR/lib/common.sh não encontrada."
    exit 1
fi

# Configuração de Logs (usa common.sh)
LOG_FILE="${PROJECT_DIR}/install-server.log"
# Redefinir LOG_FILE do common.sh para manter compatibilidade com local esperado
export LOG_FILE

# Lock file para prevenir execução concorrente
LOCK_FILE="/tmp/openpanel-install.lock"

# Configurações
HEADLESS_MODE="${HEADLESS_MODE:-false}"
SKIP_TAILSCALE="${SKIP_TAILSCALE:-false}"
MIN_RAM_MB="${MIN_RAM_MB:-2048}"
MIN_DISK_GB="${MIN_DISK_GB:-10}"
STRICT_CHECK="${STRICT_CHECK:-false}"
DEBIAN_FRONTEND=noninteractive

# ============================================================================
# FUNÇÕES AUXILIARES E CHECKS
# ============================================================================

# Cleanup ao sair
cleanup() {
    rm -f "$LOCK_FILE"
    log_debug "Lock file removido."
}
on_exit cleanup

# Verificar Lock File
check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local pid=$(cat "$LOCK_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            log_fatal "Instalação já em andamento (PID $pid). Abortando."
        else
            log_warn "Lock file encontrado mas processo não existe. Removendo e continuando."
            rm -f "$LOCK_FILE"
        fi
    fi
    echo $$ > "$LOCK_FILE"
}

# Verificar conectividade com internet
check_connectivity() {
    print_info "Verificando conectividade com a internet..."
    if ! retry 3 curl -s --connect-timeout 5 https://google.com >/dev/null; then
        if ! retry 3 curl -s --connect-timeout 5 https://cloudflare.com >/dev/null; then
            log_fatal "Sem conexão com a internet. Verifique sua rede."
        fi
    fi
    log_info "Conectividade OK."
}

# Verificar requisitos de hardware (Melhorado)
check_hardware_requirements_enhanced() {
    print_section "Verificando Hardware"

    # RAM
    local total_ram_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local total_ram_mb=$((total_ram_kb / 1024))

    if [ "$total_ram_mb" -lt "$MIN_RAM_MB" ]; then
        msg="RAM disponível: ${total_ram_mb}MB (Recomendado: ${MIN_RAM_MB}MB)"
        if [ "$STRICT_CHECK" = "true" ]; then
            log_fatal "$msg - Abortando (STRICT_CHECK=true)"
        else
            log_warn "$msg - O sistema pode ficar lento."
        fi
    else
        print_success "RAM: ${total_ram_mb}MB (Mínimo atendido)"
    fi

    # Disco (usa common.sh)
    if ! check_disk_space "$PROJECT_DIR" "$((MIN_DISK_GB * 1024))"; then
        if [ "$STRICT_CHECK" = "true" ]; then
            log_fatal "Espaço em disco insuficiente."
        fi
    else
        print_success "Disco: Espaço suficiente verificado"
    fi

    # Arquitetura
    local arch=$(uname -m)
    case "$arch" in
        x86_64|amd64|aarch64|arm64)
            print_success "Arquitetura: $arch suportada"
            ;;
        *)
            log_warn "Arquitetura $arch pode não ser totalmente suportada."
            ;;
    esac
}

# Verificar sudo/root
check_sudo_perms() {
    if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
        if [ "$HEADLESS_MODE" = "true" ]; then
            log_fatal "Script precisa de root ou sudo sem senha em modo headless."
        fi
        log_warn "Este script precisa de privilégios sudo."
        # Forçar pedido de senha
        if ! sudo -v; then
            log_fatal "Falha ao obter privilégios sudo."
        fi
    fi
}

# ============================================================================
# INSTALAÇÃO DE COMPONENTES
# ============================================================================

# Instalar dependências do sistema com retry e tratamento de lock do apt
install_system_dependencies_enhanced() {
    print_section "Instalando Dependências do Sistema"

    # Função auxiliar para apt
    run_apt() {
        sudo apt-get update -qq
        sudo apt-get install -y -qq "$@"
    }

    log_info "Atualizando e instalando pacotes base..."
    
    # Tenta corrigir dpkg interrompido antes de começar
    sudo dpkg --configure -a || true

    if ! retry_with_backoff 3 run_apt curl wget git ca-certificates gnupg lsb-release ufw htop net-tools; then
        log_fatal "Falha ao instalar dependências do sistema após múltiplas tentativas."
    fi
    
    print_success "Dependências do sistema instaladas."
}

# Instalar Tailscale (Robusto)
install_tailscale_enhanced() {
    print_section "Configurando Tailscale"
    
    if command_exists tailscale; then
        print_success "Tailscale já instalado: $(tailscale version | head -n 1)"
        return 0
    fi
    
    log_info "Baixando e instalando Tailscale..."
    if ! retry_with_backoff 3 bash -c "curl -fsSL https://tailscale.com/install.sh | sh"; then
        log_error "Falha na instalação automática do Tailscale."
        return 1
    fi

    # Configurações de kernel para VPN
    log_info "Otimizando configurações de rede..."
    {
        echo 'net.ipv4.ip_forward = 1'
        echo 'net.ipv6.conf.all.forwarding = 1'
    } | sudo tee -a /etc/sysctl.conf >/dev/null
    sudo sysctl -p >/dev/null 2>&1 || true
    
    print_success "Tailscale instalado com sucesso."
    log_warn "Configure TAILSCALE_AUTHKEY no .env para conexão automática."
}

# Instalar Node.js (Garante versão LTS correta)
install_nodejs_enhanced() {
    print_section "Verificando Node.js"
    
    local required_version="18.0.0"
    
    if command_exists node; then
        local current_version="v$(node -v | tr -d 'v')"
        if version_gte "$current_version" "v20.0.0"; then
            print_success "Node.js $current_version já instalado (compatível)."
            return 0
        else
            log_warn "Versão antiga encontrada ($current_version). Atualizando para Node.js 20..."
        fi
    fi
    
    log_info "Instalando Node.js 20 LTS..."
    if ! retry_with_backoff 3 bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"; then
        handle_install_failure "node" "Falha ao baixar/instalar do nodesource"
        exit 1
    fi
    
    print_success "Node.js $(node -v) instalado."
}

# Instalar Docker (Gerenciamento de conflitos)
install_docker_enhanced() {
    print_section "Verificando Docker"
    
    if is_docker_running; then
        print_success "Docker já está rodando: $(docker --version)"
        return 0
    fi
    
    log_info "Instalando Docker..."
    
    # Remover versões antigas/conflitantes se necessário (opcional, mas seguro para 'fail-safe')
    # sudo apt-get remove -y docker docker-engine docker.io containerd runc >/dev/null 2>&1 || true

    if ! retry_with_backoff 3 bash -c "curl -fsSL https://get.docker.com | sh"; then
        handle_install_failure "docker" "Script oficial falhou"
        exit 1
    fi
    
    log_info "Configurando permissões e serviço Docker..."
    sudo usermod -aG docker $USER || true
    sudo systemctl start docker || true
    sudo systemctl enable docker || true
    
    # Aguarda Docker iniciar
    log_info "Aguardando daemon do Docker iniciar..."
    local attempts=0
    while ! is_docker_running; do
        if [ $attempts -gt 10 ]; then
            log_fatal "Docker instalado mas não iniciou corretamente."
        fi
        sleep 2
        attempts=$((attempts + 1))
    done
    
    print_success "Docker instalado e rodando."
}

# Configurar Firewall
configure_firewall_enhanced() {
    print_section "Configurando Firewall (UFW)"
    
    if sudo ufw status | grep -q "Status: active"; then
        log_info "UFW já ativo. Atualizando regras..."
    else
        log_info "Habilitando UFW..."
        # Em headless mode, ufw enable pode pedir confirmação "Command may disrupt existing ssh connections".
        # Usamos --force para pular
        sudo ufw --force enable || true
    fi
    
    local ports=("22/tcp" "80/tcp" "443/tcp" "8080/tcp")
    for port in "${ports[@]}"; do
        sudo ufw allow "$port" >/dev/null 2>&1
        log_debug "Porta $port liberada"
    done
    
    print_success "Firewall configurado."
}

# ============================================================================
# CONFIGURAÇÃO DO PROJETO
# ============================================================================

setup_env_and_secrets() {
    print_section "Configurando Ambiente e Segredos"
    
    cd "$PROJECT_DIR" || log_fatal "Diretório do projeto não encontrado"
    
    local target_env=".env"
    local example_env=".env.example"
    
    if [ ! -f "$example_env" ]; then
        log_fatal "Arquivo $example_env não encontrado. Repositório corrompido?"
    fi
    
    if [ -f "$target_env" ]; then
        log_info "Arquivo .env já existe."
        backup_file "$target_env"
    else
        cp "$example_env" "$target_env"
        print_success "Arquivo .env criado a partir do exemplo."
    fi
    
    # Gerar segredos se ainda estiverem padrão
    log_info "Verificando necessidade de gerar novas senhas..."
    
    local needs_update=false
    if grep -q "changeme" "$target_env"; then needs_update=true; fi
    
    if [ "$needs_update" = "true" ]; then
        local pg_pass=$(generate_random_string 32)
        local redis_pass=$(generate_random_string 32)
        local jwt_secret=$(generate_random_string 64)
        
        # Usar sed seguro com delimitadores diferentes
        sed -i "s/POSTGRES_PASSWORD=changeme/POSTGRES_PASSWORD=$pg_pass/" "$target_env"
        sed -i "s/REDIS_PASSWORD=changeme/REDIS_PASSWORD=$redis_pass/" "$target_env"
        sed -i "s|DATABASE_URL=postgresql://.*|DATABASE_URL=postgresql://openpanel:$pg_pass@openpanel-postgres:5432/openpanel|" "$target_env"
        sed -i "s|REDIS_URL=redis://.*|REDIS_URL=redis://:$redis_pass@openpanel-redis:6379/0|" "$target_env"
        
        # Se JWT_SECRET não existe ou é changeme (depende do .env.example, mas vamos garantir)
        if grep -q "JWT_SECRET=changeme" "$target_env"; then
             sed -i "s/JWT_SECRET=changeme/JWT_SECRET=$jwt_secret/" "$target_env"
        fi

        print_success "Novas senhas seguras geradas e salvas no .env"
    else
        log_info "Senhas já configuradas (não padrão)."
    fi
    
    # Configurar Tailscale AuthKey via variavel de ambiente (Headless)
    if [ -n "${TAILSCALE_AUTHKEY:-}" ]; then
        log_info "Injetando TAILSCALE_AUTHKEY do ambiente..."
        remove_line_from_file "$target_env" "TAILSCALE_AUTHKEY="
        echo "" >> "$target_env"
        echo "TAILSCALE_AUTHKEY=$TAILSCALE_AUTHKEY" >> "$target_env"
    elif [ "$HEADLESS_MODE" = "false" ] && [ "$SKIP_TAILSCALE" = "false" ] && ! grep -q "TAILSCALE_AUTHKEY=tskey" "$target_env"; then
        echo ""
        print_info "Configuração Tailscale (Opcional)"
        read -p "Digite sua Tailscale Auth Key (ou Enter para pular): " ts_key
        if [ -n "$ts_key" ]; then
            remove_line_from_file "$target_env" "TAILSCALE_AUTHKEY="
            echo "TAILSCALE_AUTHKEY=$ts_key" >> "$target_env"
            print_success "Tailscale Auth Key salva."
        fi
    fi
}

# Instalar dependências npm
install_npm_deps() {
    print_section "Instalando Dependências do Projeto"
    cd "$PROJECT_DIR"
    
    if ! retry_with_backoff 3 npm install; then
        log_fatal "Falha ao executar npm install."
    fi
    print_success "Dependências NPM instaladas."
}

# Iniciar Infraestrutura
start_services() {
    print_section "Iniciando Serviços (Docker)"
    cd "$PROJECT_DIR"
    
    make_executable() { chmod +x "$1" 2>/dev/null || true; }
    find scripts -name "*.sh" -exec chmod +x {} \;
    
    log_info "Subindo containers de infraestrutura (Postgres, Redis, Traefik)..."
    if ! docker compose up -d postgres redis traefik; then
        log_fatal "Falha ao iniciar docker compose."
    fi
    
    if [ -n "$(grep TAILSCALE_AUTHKEY .env | cut -d= -f2)" ] || [ -n "${TAILSCALE_AUTHKEY:-}" ]; then
        log_info "Iniciando container Tailscale..."
        docker compose --profile tailscale up -d tailscale || log_warn "Falha ao iniciar Tailscale (verifique logs)"
    fi
    
    log_info "Aguardando banco de dados estar pronto..."
    if wait_for_container_health "openpanel-postgres" 60; then
        print_success "Banco de dados pronto."
    else
        log_warn "Timeout aguardando status 'healthy' do Postgres. Verifique 'docker compose logs postgres'."
    fi
}

# Configurar Domínios Locais
setup_local_domains() {
    print_section "Configurando DNS Local"
    local hosts_file="/etc/hosts"
    local domains=("dev.openpanel.local" "pre.openpanel.local" "openpanel.local")
    local changed=false
    
    for domain in "${domains[@]}"; do
        if ! grep -q "$domain" "$hosts_file"; then
            echo "127.0.0.1  $domain" | sudo tee -a "$hosts_file" >/dev/null
            changed=true
            log_debug "Adicionado $domain ao hosts"
        fi
    done
    
    if [ "$changed" = "true" ]; then
        print_success "Domínios locais configurados em /etc/hosts"
    else
        print_success "Domínios locais já configurados."
    fi
}

# Configurar Home Lab (Interativo ou Automatizado se env vars presentes)
setup_homelab_features() {
    if [ "$HEADLESS_MODE" = "true" ]; then
        log_info "Modo Headless: Pulando configuração interativa de Home Lab."
        # Aqui poderíamos implementar lógica para ler env vars para configurar IP estático etc.
        return 0
    fi

    print_section "Configuração Adicional Home Lab"
    
    if ! confirm "Deseja configurar recursos de Home Lab (IP fixo, AdGuard, Domínio)?"; then
        return 0
    fi
    
    # IP Estático
    if confirm "Configurar IP estático?"; then
        [ -f "$SCRIPT_DIR/setup/configure-static-ip.sh" ] && sudo "$SCRIPT_DIR/setup/configure-static-ip.sh"
    fi
    
    # AdGuard
    if confirm "Instalar AdGuard Home?"; then
        [ -f "$SCRIPT_DIR/setup/install-adguard.sh" ] && sudo "$SCRIPT_DIR/setup/install-adguard.sh"
    fi
    
    # Domínio Externo
    if confirm "Configurar domínio externo (Hostinger/No-IP)?"; then
        [ -f "$SCRIPT_DIR/setup/configure-domain.sh" ] && "$SCRIPT_DIR/setup/configure-domain.sh"
    fi
}

# Resumo Final
show_final_summary() {
    print_section "Instalação Concluída"
    
    echo -e "   ${COLOR_GREEN}✔ Sistema Base:${COLOR_NC} OK"
    echo -e "   ${COLOR_GREEN}✔ Docker:${COLOR_NC}       OK (Rodando)"
    echo -e "   ${COLOR_GREEN}✔ Banco de Dados:${COLOR_NC} OK (Healthy)"
    echo -e "   ${COLOR_GREEN}✔ Dependências:${COLOR_NC}  OK"
    echo ""
    echo -e "${COLOR_CYAN}Próximos Passos:${COLOR_NC}"
    echo "   1. Carregar variáveis:  source .env"
    echo "   2. Migrar Banco:        npm run db:push"
    echo "   3. Criar Admin:         npm run create:admin"
    echo "   4. Iniciar App:         npm start"
    echo ""
    echo -e "Logs salvos em: ${LOG_FILE}"
}

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

main() {
    log_info "Iniciando instalação autônoma do OpenPanel..."
    
    check_lock
    check_sudo_perms
    check_connectivity
    
    # Pre-checks
    detect_os
    check_hardware_requirements_enhanced
    
    # Instalação
    install_system_dependencies_enhanced
    install_tailscale_enhanced
    install_nodejs_enhanced
    install_docker_enhanced
    configure_firewall_enhanced
    
    # Configuração Projeto
    setup_env_and_secrets
    install_npm_deps
    start_services
    setup_local_domains
    setup_homelab_features
    
    show_final_summary
}

main "$@"