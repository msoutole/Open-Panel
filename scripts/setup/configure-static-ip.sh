#!/bin/bash
# ============================================================================
# OpenPanel - Configuração de IP Estático
# ============================================================================
# Script para configurar IP estático via Netplan no Ubuntu
# Detecta interface de rede automaticamente e configura IP estático
#
# Uso:
#   sudo ./configure-static-ip.sh
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

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${CROSS} ${RED}Este script precisa ser executado como root (use sudo)${NC}"
    exit 1
fi

echo -e "${INFO} Configurando IP Estático via Netplan..."
echo ""

# Detectar interface de rede ativa
detect_interface() {
    echo -e "${INFO} Detectando interface de rede..."
    
    # Tentar encontrar interface com gateway padrão
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -1)
    
    if [ -z "$INTERFACE" ]; then
        # Fallback: primeira interface ethernet ou wifi
        INTERFACE=$(ip link show | grep -E "^[0-9]+: (eth|en|wlan)" | head -1 | cut -d: -f2 | tr -d ' ')
    fi
    
    if [ -z "$INTERFACE" ]; then
        echo -e "${CROSS} ${RED}Não foi possível detectar interface de rede${NC}"
        exit 1
    fi
    
    echo -e "${CHECK} Interface detectada: ${GREEN}$INTERFACE${NC}"
}

# Obter informações atuais da rede
get_current_network_info() {
    CURRENT_IP=$(ip -4 addr show $INTERFACE | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1)
    CURRENT_GATEWAY=$(ip route | grep default | awk '{print $3}' | head -1)
    
    # Tentar obter subnet mask
    if command -v netmask >/dev/null 2>&1; then
        CURRENT_NETMASK=$(ip -4 addr show $INTERFACE | grep -oP '(?<=inet\s)[\d.]+/\d+' | cut -d/ -f2)
    else
        CURRENT_NETMASK="24"
    fi
    
    echo -e "${INFO} Configuração atual:"
    echo -e "   IP: ${CURRENT_IP}"
    echo -e "   Gateway: ${CURRENT_GATEWAY}"
    echo -e "   Subnet: /${CURRENT_NETMASK:-24}"
    echo ""
}

# Coletar informações do usuário
collect_network_info() {
    echo -e "${INFO} Digite as informações para IP estático:"
    echo ""
    
    read -p "IP estático desejado [$CURRENT_IP]: " STATIC_IP
    STATIC_IP=${STATIC_IP:-$CURRENT_IP}
    
    read -p "Gateway [$CURRENT_GATEWAY]: " GATEWAY
    GATEWAY=${GATEWAY:-$CURRENT_GATEWAY}
    
    read -p "Subnet mask (ex: 24) [${CURRENT_NETMASK:-24}]: " SUBNET
    SUBNET=${SUBNET:-${CURRENT_NETMASK:-24}}
    
    read -p "DNS servers (separados por vírgula) [8.8.8.8,8.8.4.4]: " DNS_SERVERS
    DNS_SERVERS=${DNS_SERVERS:-8.8.8.8,8.8.4.4}
    
    echo ""
    echo -e "${WARN} Você está prestes a configurar:"
    echo -e "   Interface: ${INTERFACE}"
    echo -e "   IP: ${STATIC_IP}"
    echo -e "   Gateway: ${GATEWAY}"
    echo -e "   Subnet: /${SUBNET}"
    echo -e "   DNS: ${DNS_SERVERS}"
    echo ""
    read -p "Continuar? (s/N): " CONFIRM
    
    if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
        echo -e "${INFO} Operação cancelada"
        exit 0
    fi
}

# Criar configuração Netplan
create_netplan_config() {
    echo -e "${INFO} Criando configuração Netplan..."
    
    NETPLAN_FILE="/etc/netplan/01-static-ip.yaml"
    
    # Backup da configuração existente
    if [ -f "$NETPLAN_FILE" ]; then
        cp "$NETPLAN_FILE" "${NETPLAN_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${CHECK} Backup criado: ${NETPLAN_FILE}.backup.*"
    fi
    
    # Converter DNS servers para array YAML
    DNS_ARRAY=$(echo "$DNS_SERVERS" | tr ',' '\n' | sed 's/^/      - /')
    
    # Criar arquivo Netplan
    cat > "$NETPLAN_FILE" <<EOF
network:
  version: 2
  renderer: networkd
  ethernets:
    $INTERFACE:
      dhcp4: false
      addresses:
        - $STATIC_IP/$SUBNET
      routes:
        - to: default
          via: $GATEWAY
      nameservers:
        addresses:
$DNS_ARRAY
EOF
    
    echo -e "${CHECK} Arquivo Netplan criado: $NETPLAN_FILE"
}

# Aplicar configuração
apply_netplan() {
    echo -e "${INFO} Aplicando configuração Netplan..."
    
    # Validar configuração
    if ! netplan try --timeout 10 2>/dev/null; then
        echo -e "${CROSS} ${RED}Erro na configuração Netplan. Revertendo...${NC}"
        if [ -f "${NETPLAN_FILE}.backup" ]; then
            cp "${NETPLAN_FILE}.backup" "$NETPLAN_FILE"
        fi
        exit 1
    fi
    
    # Aplicar permanentemente
    netplan apply
    
    echo -e "${CHECK} Configuração aplicada com sucesso!"
    echo ""
    echo -e "${WARN} ⚠️  IMPORTANTE: Verifique se a conexão ainda está funcionando!"
    echo -e "${INFO} Se você perder a conexão, restaure o backup:"
    echo -e "   ${ARROW} sudo cp ${NETPLAN_FILE}.backup.* $NETPLAN_FILE"
    echo -e "   ${ARROW} sudo netplan apply"
}

# Função principal
main() {
    detect_interface
    get_current_network_info
    collect_network_info
    create_netplan_config
    apply_netplan
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        IP ESTÁTICO CONFIGURADO COM SUCESSO! 🎉                 ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${INFO} Verifique a conexão:"
    echo -e "   ${ARROW} ip addr show $INTERFACE"
    echo -e "   ${ARROW} ping -c 3 $GATEWAY"
}

main "$@"

