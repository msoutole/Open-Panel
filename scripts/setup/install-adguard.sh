#!/bin/bash
# ============================================================================
# OpenPanel - Instalação do AdGuard Home
# ============================================================================
# Script para instalar e configurar AdGuard Home
# Verifica systemd-resolved e oferece desabilitá-lo
#
# Uso:
#   sudo ./install-adguard.sh
# ============================================================================

set -e

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
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${CROSS} ${RED}Este script precisa ser executado como root (use sudo)${NC}"
    exit 1
fi

echo -e "${INFO} Instalando AdGuard Home..."
echo ""

# Verificar systemd-resolved
check_systemd_resolved() {
    echo -e "${INFO} Verificando systemd-resolved..."
    
    if systemctl is-active --quiet systemd-resolved 2>/dev/null; then
        echo -e "${WARN} systemd-resolved está ativo e pode conflitar com AdGuard Home"
        echo -e "${INFO} AdGuard Home precisa da porta 53 (DNS), que está sendo usada pelo systemd-resolved"
        echo ""
        echo -e "${WARN} Opções:"
        echo -e "   1. Desabilitar systemd-resolved (recomendado para AdGuard Home)"
        echo -e "   2. Continuar sem desabilitar (pode causar problemas)"
        echo ""
        read -p "Deseja desabilitar systemd-resolved? (S/n): " DISABLE_RESOLVED
        
        if [[ "$DISABLE_RESOLVED" =~ ^[Ss]$ ]] || [ -z "$DISABLE_RESOLVED" ]; then
            echo -e "${INFO} Desabilitando systemd-resolved..."
            "$SCRIPT_DIR/disable-systemd-resolved.sh" || {
                echo -e "${CROSS} ${RED}Falha ao desabilitar systemd-resolved${NC}"
                exit 1
            }
            echo -e "${CHECK} systemd-resolved desabilitado"
        else
            echo -e "${WARN} Continuando sem desabilitar systemd-resolved..."
            echo -e "${WARN} Se houver problemas, você precisará desabilitá-lo manualmente"
        fi
    else
        echo -e "${CHECK} systemd-resolved não está ativo"
    fi
}

# Verificar se Docker está rodando
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        echo -e "${CROSS} ${RED}Docker não está instalado${NC}"
        echo -e "${INFO} Execute o script install-server.sh primeiro"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        echo -e "${CROSS} ${RED}Docker não está rodando${NC}"
        exit 1
    fi
    
    echo -e "${CHECK} Docker está instalado e rodando"
}

# Verificar se porta 53 está livre
check_port_53() {
    echo -e "${INFO} Verificando porta 53..."
    
    if netstat -tuln 2>/dev/null | grep -q ":53 " || ss -tuln 2>/dev/null | grep -q ":53 "; then
        echo -e "${WARN} Porta 53 está em uso"
        echo -e "${INFO} Verificando qual processo está usando..."
        
        if command -v lsof >/dev/null 2>&1; then
            lsof -i :53 || true
        elif command -v netstat >/dev/null 2>&1; then
            netstat -tulpn | grep :53 || true
        fi
        
        echo -e "${WARN} Você precisará liberar a porta 53 para o AdGuard Home funcionar"
    else
        echo -e "${CHECK} Porta 53 está livre"
    fi
}

# Verificar portas necessárias
check_required_ports() {
    echo -e "${INFO} Verificando portas necessárias para AdGuard..."
    
    local ports_in_use=()
    local all_ok=true
    
    # Portas: 53 (DNS), 80 (HTTP), 443 (HTTPS), 3000 (UI)
    for port in 53 80 443 3000; do
        if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
            ports_in_use+=($port)
            echo -e "${WARN} Porta $port está em uso"
            all_ok=false
        fi
    done
    
    if [ "$all_ok" = false ]; then
        echo ""
        echo -e "${WARN} ⚠️  Algumas portas necessárias estão ocupadas:"
        for port in "${ports_in_use[@]}"; do
            echo -e "   ${ARROW} Porta $port:"
            if command -v lsof >/dev/null 2>&1; then
                lsof -i :$port 2>/dev/null | tail -1 || true
            elif command -v netstat >/dev/null 2>&1; then
                netstat -tulpn 2>/dev/null | grep ":$port " | head -1 || true
            fi
        done
        echo ""
        echo -e "${WARN} Recomendações:"
        echo -e "   ${ARROW} Parar aplicações que usam estas portas"
        echo -e "   ${ARROW} Ou, configurar AdGuard em portas diferentes via .env"
        echo ""
        read -p "Deseja continuar mesmo assim? (s/N): " CONTINUE_ANYWAY
        if [[ ! "$CONTINUE_ANYWAY" =~ ^[Ss]$ ]]; then
            echo -e "${INFO} Instalação de AdGuard cancelada"
            return 1
        fi
    fi
    
    return 0
}

# Iniciar AdGuard via docker-compose
start_adguard() {
    echo -e "${INFO} Iniciando AdGuard Home via Docker Compose..."
    
    cd "$PROJECT_DIR"
    
    # Verificar se docker-compose.yml existe
    if [ ! -f docker-compose.yml ]; then
        echo -e "${CROSS} ${RED}docker-compose.yml não encontrado${NC}"
        exit 1
    fi
    
    # Tentar iniciar AdGuard com profile
    if ! docker compose --profile adguard up -d adguard 2>&1 | tee /tmp/adguard-startup.log; then
        echo -e "${CROSS} ${RED}Falha ao iniciar AdGuard Home${NC}"
        
        # Mostrar última parte do log
        echo -e "${INFO} Últimas linhas do erro:"
        tail -10 /tmp/adguard-startup.log
        
        # Verificar se é erro de porta
        if grep -q "address already in use\|bind.*failed" /tmp/adguard-startup.log; then
            echo ""
            echo -e "${WARN} Parece ser um problema de porta já em uso"
            echo -e "${INFO} Verifique quais portas estão em uso:"
            echo -e "   ${ARROW} netstat -tuln | grep LISTEN"
            echo -e "   ${ARROW} ss -tuln | grep LISTEN"
        fi
        
        return 1
    fi
    
    # Aguardar um pouco e verificar se container está rodando
    sleep 2
    if ! docker ps --format "{{.Names}}" | grep -q "openpanel-adguard"; then
        echo -e "${WARN} Container openpanel-adguard não está rodando"
        echo -e "${INFO} Verificando logs:"
        docker compose --profile adguard logs adguard | tail -20
        return 1
    fi
    
    echo -e "${CHECK} AdGuard Home iniciado com sucesso"
}

# Configurar DNS local
configure_local_dns() {
    echo -e "${INFO} Configurando DNS local..."
    
    # Aguardar AdGuard estar pronto
    echo -e "${INFO} Aguardando AdGuard Home estar pronto..."
    sleep 5
    
    # Obter IP do container AdGuard
    ADGUARD_IP=$(docker inspect openpanel-adguard 2>/dev/null | \
        grep -oP '(?<="IPAddress": ")[^"]+' | head -1)
    
    if [ -z "$ADGUARD_IP" ]; then
        echo -e "${WARN} Não foi possível obter IP do AdGuard. Configure DNS manualmente."
        return
    fi
    
    echo -e "${CHECK} IP do AdGuard: ${GREEN}$ADGUARD_IP${NC}"
    echo ""
    echo -e "${INFO} Para usar AdGuard como DNS local, configure:"
    echo -e "   ${ARROW} /etc/resolv.conf:"
    echo -e "      nameserver $ADGUARD_IP"
    echo ""
    echo -e "${WARN} Ou configure no Netplan se estiver usando IP estático"
}

# Adicionar domínio ao /etc/hosts
configure_hosts() {
    echo -e "${INFO} Configurando domínio local..."
    
    HOSTS_FILE="/etc/hosts"
    DOMAIN="adguard.openpanel.local"
    
    if ! grep -q "$DOMAIN" "$HOSTS_FILE" 2>/dev/null; then
        echo "127.0.0.1  $DOMAIN" | tee -a "$HOSTS_FILE" > /dev/null
        echo -e "${CHECK} Domínio $DOMAIN adicionado ao /etc/hosts"
    else
        echo -e "${INFO} Domínio $DOMAIN já existe em /etc/hosts"
    fi
}

# Função principal
main() {
    check_docker
    echo ""
    check_port_53
    echo ""
    check_required_ports || exit 0
    echo ""
    check_systemd_resolved
    echo ""
    start_adguard
    echo ""
    configure_local_dns
    echo ""
    configure_hosts
    echo ""
    
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║      ADGUARD HOME INSTALADO COM SUCESSO! 🎉                    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${INFO} Próximos passos:"
    echo -e "   ${ARROW} 1. Acesse o painel do AdGuard:"
    echo -e "      ${GREEN}http://adguard.openpanel.local${NC}"
    echo ""
    echo -e "   ${ARROW} 2. Complete a configuração inicial no painel web"
    echo ""
    echo -e "   ${ARROW} 3. Configure seu roteador ou dispositivos para usar o AdGuard como DNS"
    echo ""
    echo -e "   ${ARROW} 4. Para parar: ${BLUE}docker compose --profile adguard stop adguard${NC}"
    echo ""
}

main "$@"

