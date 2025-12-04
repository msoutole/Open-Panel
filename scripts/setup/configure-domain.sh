#!/bin/bash
# ============================================================================
# OpenPanel - Configuração de Domínio Externo
# ============================================================================
# Script interativo para configurar domínio externo
# Integra com Hostinger-MCP e No-IP DUC
#
# Uso:
#   ./configure-domain.sh
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

echo -e "${INFO} Configuração de Domínio Externo"
echo -e "${INFO} Este script configura domínio via Hostinger + No-IP"
echo ""

# Coletar informações do domínio
collect_domain_info() {
    echo -e "${INFO} Digite as informações do domínio:"
    echo ""
    
    read -p "Domínio principal (ex: meusite.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        echo -e "${CROSS} ${RED}Domínio é obrigatório${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${INFO} Provedor de DNS:"
    echo -e "   1. Hostinger (recomendado)"
    echo -e "   2. Outro (configuração manual)"
    read -p "Escolha (1/2): " DNS_PROVIDER
    
    if [ "$DNS_PROVIDER" = "1" ]; then
        DNS_PROVIDER="hostinger"
        read -p "Hostinger API Key: " HOSTINGER_API_KEY
        if [ -z "$HOSTINGER_API_KEY" ]; then
            echo -e "${WARN} API Key não fornecida. Você precisará configurar DNS manualmente."
        fi
    else
        DNS_PROVIDER="manual"
    fi
    
    echo ""
    echo -e "${INFO} No-IP Dynamic DNS (para IP dinâmico):"
    read -p "Deseja configurar No-IP? (S/n): " CONFIGURE_NOIP
    
    if [[ "$CONFIGURE_NOIP" =~ ^[Ss]$ ]] || [ -z "$CONFIGURE_NOIP" ]; then
        read -p "No-IP Username: " NOIP_USERNAME
        read -p "No-IP Password: " NOIP_PASSWORD
        read -p "No-IP Hostname (ex: meusite.ddns.net): " NOIP_HOSTNAME
    fi
}

# Instalar No-IP DUC
install_noip_duc() {
    if [ -n "$NOIP_USERNAME" ] && [ -n "$NOIP_PASSWORD" ] && [ -n "$NOIP_HOSTNAME" ]; then
        echo -e "${INFO} Instalando No-IP DUC..."
        "$SCRIPT_DIR/install-noip-duc.sh" "$NOIP_USERNAME" "$NOIP_PASSWORD" "$NOIP_HOSTNAME" || {
            echo -e "${WARN} Falha ao instalar No-IP DUC. Continue manualmente."
        }
    fi
}

# Configurar DNS na Hostinger
configure_hostinger_dns() {
    if [ "$DNS_PROVIDER" = "hostinger" ] && [ -n "$HOSTINGER_API_KEY" ]; then
        echo -e "${INFO} Configurando DNS na Hostinger..."
        "$SCRIPT_DIR/configure-hostinger-dns.sh" "$DOMAIN" "$HOSTINGER_API_KEY" "$NOIP_HOSTNAME" || {
            echo -e "${WARN} Falha ao configurar DNS na Hostinger. Continue manualmente."
        }
    else
        echo -e "${INFO} Configure DNS manualmente:"
        echo -e "   ${ARROW} Crie um registro CNAME apontando para: ${NOIP_HOSTNAME:-seu-ip-publico}"
        echo -e "   ${ARROW} Subdomínios sugeridos:"
        echo -e "      - www.$DOMAIN → $NOIP_HOSTNAME"
        echo -e "      - adguard.$DOMAIN → $NOIP_HOSTNAME"
        echo -e "      - traefik.$DOMAIN → $NOIP_HOSTNAME"
    fi
}

# Atualizar variáveis de ambiente
update_env_files() {
    echo -e "${INFO} Atualizando arquivos .env..."
    
    cd "$PROJECT_DIR"
    
    for env_file in .env.dev .env.pre .env.prod; do
        if [ -f "$env_file" ]; then
            # Atualizar DOMAIN
            if grep -q "^DOMAIN=" "$env_file" 2>/dev/null; then
                sed -i "s|^DOMAIN=.*|DOMAIN=$DOMAIN|" "$env_file"
            else
                echo "" >> "$env_file"
                echo "# Domain Configuration" >> "$env_file"
                echo "DOMAIN=$DOMAIN" >> "$env_file"
            fi
            
            # Adicionar variáveis No-IP se fornecidas
            if [ -n "$NOIP_USERNAME" ]; then
                if grep -q "^NOIP_USERNAME=" "$env_file" 2>/dev/null; then
                    sed -i "s|^NOIP_USERNAME=.*|NOIP_USERNAME=$NOIP_USERNAME|" "$env_file"
                else
                    echo "NOIP_USERNAME=$NOIP_USERNAME" >> "$env_file"
                fi
            fi
            
            if [ -n "$NOIP_HOSTNAME" ]; then
                if grep -q "^NOIP_HOSTNAME=" "$env_file" 2>/dev/null; then
                    sed -i "s|^NOIP_HOSTNAME=.*|NOIP_HOSTNAME=$NOIP_HOSTNAME|" "$env_file"
                else
                    echo "NOIP_HOSTNAME=$NOIP_HOSTNAME" >> "$env_file"
                fi
            fi
            
            if [ -n "$HOSTINGER_API_KEY" ]; then
                if grep -q "^HOSTINGER_API_KEY=" "$env_file" 2>/dev/null; then
                    sed -i "s|^HOSTINGER_API_KEY=.*|HOSTINGER_API_KEY=$HOSTINGER_API_KEY|" "$env_file"
                else
                    echo "HOSTINGER_API_KEY=$HOSTINGER_API_KEY" >> "$env_file"
                fi
            fi
            
            echo -e "${CHECK} $env_file atualizado"
        fi
    done
}

# Instruções de port forwarding
print_port_forwarding_instructions() {
    echo ""
    echo -e "${WARN} ⚠️  IMPORTANTE: Port Forwarding no Roteador"
    echo ""
    echo -e "${INFO} Configure port forwarding no seu roteador:"
    echo -e "   ${ARROW} Porta 80 (HTTP) → IP do servidor:80"
    echo -e "   ${ARROW} Porta 443 (HTTPS) → IP do servidor:443"
    echo ""
    echo -e "${WARN} NÃO exponha a porta 53 (DNS) para a internet!"
    echo ""
    echo -e "${INFO} Para verificar se está em CGNAT:"
    echo -e "   ${ARROW} Compare seu IP público (curl ifconfig.me) com o IP do roteador"
    echo -e "   ${ARROW} Se forem diferentes, você está em CGNAT"
    echo -e "   ${ARROW} Alternativas: Cloudflare Tunnel, Tailscale, ou solicitar IP público ao provedor"
}

# Função principal
main() {
    collect_domain_info
    echo ""
    install_noip_duc
    echo ""
    configure_hostinger_dns
    echo ""
    update_env_files
    echo ""
    print_port_forwarding_instructions
    echo ""
    
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║      DOMÍNIO EXTERNO CONFIGURADO COM SUCESSO! 🎉              ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${INFO} URLs de acesso:"
    echo -e "   ${ARROW} ${GREEN}http://$DOMAIN${NC}"
    echo -e "   ${ARROW} ${GREEN}http://adguard.$DOMAIN${NC}"
    echo -e "   ${ARROW} ${GREEN}http://traefik.$DOMAIN${NC}"
    echo ""
    echo -e "${INFO} Após configurar port forwarding, aguarde a propagação DNS (pode levar até 48h)"
    echo ""
}

main "$@"

