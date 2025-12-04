#!/bin/bash
# ============================================================================
# OpenPanel - Instalação do No-IP DUC
# ============================================================================
# Instala cliente No-IP Dynamic Update Client (DUC)
# Configura autenticação e cria serviço systemd
#
# Uso:
#   sudo ./install-noip-duc.sh <username> <password> <hostname>
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

# Verificar argumentos
if [ $# -lt 3 ]; then
    echo -e "${CROSS} ${RED}Uso: $0 <username> <password> <hostname>${NC}"
    exit 1
fi

NOIP_USERNAME="$1"
NOIP_PASSWORD="$2"
NOIP_HOSTNAME="$3"

echo -e "${INFO} Instalando No-IP Dynamic Update Client..."
echo ""

# Detectar arquitetura
detect_architecture() {
    ARCH=$(uname -m)
    case $ARCH in
        x86_64) DUC_ARCH="linux_x86_64" ;;
        armv7l) DUC_ARCH="linux_armv7" ;;
        aarch64) DUC_ARCH="linux_arm64" ;;
        *) 
            echo -e "${CROSS} ${RED}Arquitetura não suportada: $ARCH${NC}"
            exit 1
            ;;
    esac
    echo -e "${CHECK} Arquitetura detectada: $ARCH"
}

# Baixar e instalar No-IP DUC
install_noip() {
    echo -e "${INFO} Baixando No-IP DUC..."
    
    DUC_URL="https://www.noip.com/client/linux/noip-duc-linux.tar.gz"
    TEMP_DIR=$(mktemp -d)
    
    cd "$TEMP_DIR"
    wget -q "$DUC_URL" -O noip-duc.tar.gz || {
        echo -e "${CROSS} ${RED}Falha ao baixar No-IP DUC${NC}"
        exit 1
    }
    
    tar -xzf noip-duc.tar.gz
    cd noip-*
    
    # Compilar
    echo -e "${INFO} Compilando No-IP DUC..."
    make || {
        echo -e "${CROSS} ${RED}Falha ao compilar No-IP DUC${NC}"
        echo -e "${INFO} Instale dependências: sudo apt-get install build-essential"
        exit 1
    }
    
    # Instalar
    make install || {
        echo -e "${CROSS} ${RED}Falha ao instalar No-IP DUC${NC}"
        exit 1
    }
    
    cd /
    rm -rf "$TEMP_DIR"
    
    echo -e "${CHECK} No-IP DUC instalado"
}

# Configurar No-IP DUC
configure_noip() {
    echo -e "${INFO} Configurando No-IP DUC..."
    
    # Criar arquivo de configuração
    NOIP_CONF="/usr/local/etc/no-ip2.conf"
    
    # Executar configuração interativa via expect ou criar manualmente
    if command -v expect >/dev/null 2>&1; then
        expect <<EOF
spawn /usr/local/bin/noip2 -C
expect "Please enter the login/email string for no-ip.com"
send "$NOIP_USERNAME\r"
expect "Please enter the password for user"
send "$NOIP_PASSWORD\r"
expect "Please enter an update interval"
send "30\r"
expect "Do you wish to run something at successful update?"
send "N\r"
expect eof
EOF
    else
        # Criar configuração manualmente
        mkdir -p "$(dirname "$NOIP_CONF")"
        cat > "$NOIP_CONF" <<EOF
username=$NOIP_USERNAME
password=$NOIP_PASSWORD
update_interval=30
EOF
        echo "$NOIP_HOSTNAME" >> "$NOIP_CONF"
    fi
    
    echo -e "${CHECK} No-IP DUC configurado"
}

# Criar serviço systemd
create_systemd_service() {
    echo -e "${INFO} Criando serviço systemd..."
    
    cat > /etc/systemd/system/noip2.service <<EOF
[Unit]
Description=No-IP Dynamic DNS Update Client
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/bin/noip2
ExecStop=/usr/local/bin/noip2 -K
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable noip2
    systemctl start noip2
    
    echo -e "${CHECK} Serviço systemd criado e iniciado"
}

# Verificar status
check_status() {
    echo -e "${INFO} Verificando status do No-IP DUC..."
    
    sleep 2
    
    if systemctl is-active --quiet noip2; then
        echo -e "${CHECK} No-IP DUC está rodando"
        
        # Mostrar informações
        if [ -f /usr/local/bin/noip2 ]; then
            /usr/local/bin/noip2 -S 2>/dev/null || true
        fi
    else
        echo -e "${CROSS} ${RED}No-IP DUC não está rodando${NC}"
        systemctl status noip2 || true
    fi
}

# Função principal
main() {
    detect_architecture
    echo ""
    install_noip
    echo ""
    configure_noip
    echo ""
    create_systemd_service
    echo ""
    check_status
    echo ""
    
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        NO-IP DUC INSTALADO COM SUCESSO! 🎉                   ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${INFO} O No-IP DUC atualizará automaticamente seu IP dinâmico"
    echo -e "${INFO} Hostname configurado: ${GREEN}$NOIP_HOSTNAME${NC}"
    echo ""
    echo -e "${INFO} Comandos úteis:"
    echo -e "   ${ARROW} Status: ${BLUE}systemctl status noip2${NC}"
    echo -e "   ${ARROW} Logs: ${BLUE}journalctl -u noip2 -f${NC}"
    echo -e "   ${ARROW} Reiniciar: ${BLUE}systemctl restart noip2${NC}"
    echo ""
}

main "$@"

