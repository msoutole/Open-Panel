#!/bin/bash
# ============================================================================
# OpenPanel - Verificação de Configuração de Rede
# ============================================================================
# Script para verificar configuração de rede atual
# Detecta se está usando DHCP ou IP estático
#
# Uso:
#   ./check-network.sh
# ============================================================================

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

echo -e "${INFO} Verificando configuração de rede..."
echo ""

# Detectar interface de rede ativa
detect_interface() {
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -1)
    
    if [ -z "$INTERFACE" ]; then
        INTERFACE=$(ip link show | grep -E "^[0-9]+: (eth|en|wlan)" | head -1 | cut -d: -f2 | tr -d ' ')
    fi
    
    if [ -z "$INTERFACE" ]; then
        echo -e "${CROSS} ${RED}Não foi possível detectar interface de rede${NC}"
        exit 1
    fi
    
    echo -e "${CHECK} Interface: ${GREEN}$INTERFACE${NC}"
}

# Verificar se está usando DHCP ou IP estático
check_dhcp_vs_static() {
    echo -e "${INFO} Verificando configuração (DHCP vs IP Estático)..."
    
    # Verificar Netplan
    if [ -f /etc/netplan/*.yaml ]; then
        NETPLAN_FILE=$(ls /etc/netplan/*.yaml | head -1)
        
        if grep -q "dhcp4: true" "$NETPLAN_FILE" 2>/dev/null; then
            echo -e "${INFO} Modo: ${YELLOW}DHCP${NC}"
            IS_DHCP=true
        elif grep -q "dhcp4: false" "$NETPLAN_FILE" 2>/dev/null; then
            echo -e "${INFO} Modo: ${GREEN}IP Estático${NC}"
            IS_DHCP=false
        else
            echo -e "${WARN} Modo: ${YELLOW}Indeterminado${NC}"
            IS_DHCP=unknown
        fi
    else
        echo -e "${WARN} Arquivo Netplan não encontrado"
        IS_DHCP=unknown
    fi
}

# Obter informações de IP
get_ip_info() {
    CURRENT_IP=$(ip -4 addr show $INTERFACE 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1)
    CURRENT_NETMASK=$(ip -4 addr show $INTERFACE 2>/dev/null | grep -oP '(?<=inet\s)[\d.]+/\d+' | cut -d/ -f2)
    CURRENT_MAC=$(ip link show $INTERFACE 2>/dev/null | grep -oP '(?<=link/ether\s)[a-f0-9:]+' | head -1)
    
    echo -e "${CHECK} IP atual: ${GREEN}${CURRENT_IP:-N/A}${NC}"
    echo -e "${CHECK} Subnet: ${GREEN}/${CURRENT_NETMASK:-N/A}${NC}"
    echo -e "${CHECK} MAC: ${GREEN}${CURRENT_MAC:-N/A}${NC}"
}

# Obter informações de gateway
get_gateway_info() {
    CURRENT_GATEWAY=$(ip route | grep default | awk '{print $3}' | head -1)
    
    if [ -n "$CURRENT_GATEWAY" ]; then
        echo -e "${CHECK} Gateway: ${GREEN}${CURRENT_GATEWAY}${NC}"
        
        # Testar conectividade com gateway
        if ping -c 1 -W 2 "$CURRENT_GATEWAY" >/dev/null 2>&1; then
            echo -e "${CHECK} Gateway: ${GREEN}Reachável${NC}"
        else
            echo -e "${CROSS} Gateway: ${RED}Não reachável${NC}"
        fi
    else
        echo -e "${CROSS} Gateway: ${RED}Não configurado${NC}"
    fi
}

# Obter informações de DNS
get_dns_info() {
    echo -e "${INFO} Servidores DNS:"
    
    # Verificar resolv.conf
    if [ -f /etc/resolv.conf ]; then
        DNS_SERVERS=$(grep "^nameserver" /etc/resolv.conf | awk '{print $2}' | tr '\n' ' ')
        if [ -n "$DNS_SERVERS" ]; then
            echo -e "   ${ARROW} /etc/resolv.conf: ${GREEN}$DNS_SERVERS${NC}"
        fi
    fi
    
    # Verificar systemd-resolved
    if systemctl is-active --quiet systemd-resolved 2>/dev/null; then
        echo -e "   ${ARROW} systemd-resolved: ${GREEN}Ativo${NC}"
        RESOLVED_DNS=$(systemd-resolve --status 2>/dev/null | grep "DNS Servers" | awk '{print $3}' | tr '\n' ' ')
        if [ -n "$RESOLVED_DNS" ]; then
            echo -e "      DNS: ${GREEN}$RESOLVED_DNS${NC}"
        fi
    else
        echo -e "   ${ARROW} systemd-resolved: ${YELLOW}Inativo${NC}"
    fi
    
    # Verificar Netplan DNS
    if [ -f /etc/netplan/*.yaml ]; then
        NETPLAN_FILE=$(ls /etc/netplan/*.yaml | head -1)
        NETPLAN_DNS=$(grep -A 10 "nameservers:" "$NETPLAN_FILE" 2>/dev/null | grep "addresses:" -A 5 | grep -oP '\d+\.\d+\.\d+\.\d+' | tr '\n' ' ')
        if [ -n "$NETPLAN_DNS" ]; then
            echo -e "   ${ARROW} Netplan DNS: ${GREEN}$NETPLAN_DNS${NC}"
        fi
    fi
}

# Verificar conectividade externa
check_connectivity() {
    echo -e "${INFO} Testando conectividade..."
    
    if ping -c 1 -W 3 8.8.8.8 >/dev/null 2>&1; then
        echo -e "${CHECK} Internet: ${GREEN}Conectado${NC}"
    else
        echo -e "${CROSS} Internet: ${RED}Sem conexão${NC}"
    fi
    
    if ping -c 1 -W 3 google.com >/dev/null 2>&1; then
        echo -e "${CHECK} DNS: ${GREEN}Funcionando${NC}"
    else
        echo -e "${CROSS} DNS: ${RED}Não funcionando${NC}"
    fi
}

# Verificar AdGuard Home (se instalado)
check_adguard() {
    if docker ps | grep -q "openpanel-adguard"; then
        echo -e "${CHECK} AdGuard Home: ${GREEN}Rodando${NC}"
        ADGUARD_IP=$(docker inspect openpanel-adguard 2>/dev/null | grep -oP '(?<="IPAddress": ")[^"]+' | head -1)
        if [ -n "$ADGUARD_IP" ]; then
            echo -e "   ${ARROW} IP do container: ${GREEN}$ADGUARD_IP${NC}"
        fi
    else
        echo -e "${INFO} AdGuard Home: ${YELLOW}Não instalado${NC}"
    fi
}

# Verificar No-IP DUC (se instalado)
check_noip() {
    if systemctl is-active --quiet noip2 2>/dev/null || systemctl is-active --quiet noip 2>/dev/null; then
        echo -e "${CHECK} No-IP DUC: ${GREEN}Ativo${NC}"
    elif command -v noip2 >/dev/null 2>&1; then
        echo -e "${WARN} No-IP DUC: ${YELLOW}Instalado mas não rodando${NC}"
    else
        echo -e "${INFO} No-IP DUC: ${YELLOW}Não instalado${NC}"
    fi
}

# Função principal
main() {
    detect_interface
    echo ""
    check_dhcp_vs_static
    echo ""
    get_ip_info
    echo ""
    get_gateway_info
    echo ""
    get_dns_info
    echo ""
    check_connectivity
    echo ""
    check_adguard
    echo ""
    check_noip
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              VERIFICAÇÃO DE REDE CONCLUÍDA                    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
}

main "$@"

