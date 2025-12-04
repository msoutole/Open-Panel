#!/bin/bash
# ============================================================================
# OpenPanel - Configuração de DNS na Hostinger
# ============================================================================
# Script auxiliar para configurar registros DNS na Hostinger
# Cria CNAME para www e subdomínios apontando para No-IP
#
# Uso:
#   ./configure-hostinger-dns.sh <domain> <noip_hostname> [subdomain1] [subdomain2] ...
#
# Exemplo:
#   ./configure-hostinger-dns.sh soullabs.com.br seuusuario.ddns.net adguard traefik
#
# Documentação completa: docs/HOSTINGER_DNS_CONFIG.md
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

# Verificar argumentos
if [ $# -lt 2 ]; then
    echo -e "${CROSS} ${RED}Uso: $0 <domain> <noip_hostname> [subdomain1] [subdomain2] ...${NC}"
    echo -e "${INFO} Exemplo: $0 soullabs.com.br seuusuario.ddns.net adguard traefik panel${NC}"
    echo ""
    echo -e "${INFO} Documentação completa: docs/HOSTINGER_DNS_CONFIG.md${NC}"
    exit 1
fi

DOMAIN="$1"
NOIP_HOSTNAME="$2"
SUBDOMAINS=("${@:3}")

# Subdomínios padrão se não fornecidos
if [ ${#SUBDOMAINS[@]} -eq 0 ]; then
    SUBDOMAINS=("www" "adguard" "traefik")
fi

echo -e "${INFO} Configurando DNS na Hostinger..."
echo ""

# Verificar se MCP está disponível
check_mcp() {
    echo -e "${INFO} Verificando Hostinger-MCP..."
    
    # Nota: Este script assume que o MCP está configurado
    # Em um ambiente real, você precisaria usar as ferramentas MCP apropriadas
    # Por enquanto, fornecemos instruções manuais
    
    echo -e "${WARN} ⚠️  Configuração via MCP requer integração com Cursor/Claude"
    echo -e "${INFO} Configure os registros DNS manualmente ou use a interface da Hostinger"
    echo ""
}

# Instruções de configuração manual
print_manual_instructions() {
    echo -e "${INFO} Configure os seguintes registros DNS na Hostinger:"
    echo ""
    echo -e "${INFO} Domínio: ${GREEN}$DOMAIN${NC}"
    echo -e "${INFO} Apontando para: ${GREEN}$NOIP_HOSTNAME${NC}"
    echo ""
    
    if [ -n "$NOIP_HOSTNAME" ]; then
        # Listar todos os subdomínios fornecidos
        for subdomain in "${SUBDOMAINS[@]}"; do
            echo -e "   ${ARROW} Tipo: CNAME"
            echo -e "      Nome: ${GREEN}$subdomain${NC}"
            echo -e "      Valor: ${GREEN}$NOIP_HOSTNAME${NC}"
            echo -e "      TTL: 3600"
            echo ""
        done
    else
        # Se não tiver No-IP, usar IP público
        PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "SEU_IP_PUBLICO")
        
        echo -e "   ${ARROW} Tipo: A"
        echo -e "      Nome: @"
        echo -e "      Valor: ${GREEN}$PUBLIC_IP${NC}"
        echo -e "      TTL: 3600"
        echo ""
        echo -e "   ${ARROW} Tipo: A"
        echo -e "      Nome: www"
        echo -e "      Valor: ${GREEN}$PUBLIC_IP${NC}"
        echo -e "      TTL: 3600"
        echo ""
        echo -e "   ${ARROW} Tipo: A"
        echo -e "      Nome: adguard"
        echo -e "      Valor: ${GREEN}$PUBLIC_IP${NC}"
        echo -e "      TTL: 3600"
        echo ""
        echo -e "   ${ARROW} Tipo: A"
        echo -e "      Nome: traefik"
        echo -e "      Valor: ${GREEN}$PUBLIC_IP${NC}"
        echo -e "      TTL: 3600"
        echo ""
        echo -e "${WARN} ⚠️  Se você tiver IP dinâmico, configure No-IP DUC primeiro!"
    fi
}

# Validar configuração
validate_dns() {
    echo -e "${INFO} Validando configuração DNS..."
    echo ""
    echo -e "${INFO} Aguarde alguns minutos e então verifique:"
    echo -e "   ${ARROW} dig $DOMAIN"
    
    for subdomain in "${SUBDOMAINS[@]}"; do
        echo -e "   ${ARROW} dig $subdomain.$DOMAIN"
    done
    echo ""
    echo -e "${WARN} A propagação DNS pode levar até 48 horas"
    echo ""
    echo -e "${INFO} Para verificar propagação global: https://dnschecker.org/"
}

# Função principal
main() {
    check_mcp
    echo ""
    print_manual_instructions
    echo ""
    validate_dns
    echo ""
    
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        INSTRUÇÕES DE DNS FORNECIDAS                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${INFO} Acesse o painel da Hostinger e configure os registros DNS acima"
    echo -e "${INFO} URL: https://hpanel.hostinger.com"
    echo ""
    echo -e "${INFO} Navegação: Domains → Gerenciar Domínio → DNS / Nameservers → Gerenciar Zona DNS"
    echo ""
    echo -e "${INFO} 📖 Documentação completa: docs/HOSTINGER_DNS_CONFIG.md${NC}"
    echo ""
}

main "$@"

