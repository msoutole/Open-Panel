#!/bin/bash
# ============================================================================
# OpenPanel - Desabilitar systemd-resolved
# ============================================================================
# Script auxiliar para desabilitar systemd-resolved
# Cria backup da configuração antes de modificar
#
# Uso:
#   sudo ./disable-systemd-resolved.sh
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

echo -e "${WARN} ⚠️  ATENÇÃO: Este script irá desabilitar systemd-resolved"
echo -e "${INFO} Isso é necessário para que o AdGuard Home possa usar a porta 53 (DNS)"
echo ""

read -p "Continuar? (s/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo -e "${INFO} Operação cancelada"
    exit 0
fi

# Backup da configuração
backup_config() {
    echo -e "${INFO} Criando backup da configuração..."
    
    BACKUP_DIR="/etc/systemd/resolved.conf.d"
    mkdir -p "$BACKUP_DIR"
    
    if [ -f /etc/systemd/resolved.conf ]; then
        cp /etc/systemd/resolved.conf "${BACKUP_DIR}/resolved.conf.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${CHECK} Backup criado"
    fi
}

# Desabilitar systemd-resolved
disable_resolved() {
    echo -e "${INFO} Desabilitando systemd-resolved..."
    
    # Backup de configurações antes de modificar
    mkdir -p /etc/systemd/resolved.conf.d
    [ -f /etc/systemd/resolved.conf ] && cp /etc/systemd/resolved.conf /etc/systemd/resolved.conf.backup.$(date +%Y%m%d_%H%M%S)
    
    # Parar serviço
    if ! systemctl stop systemd-resolved 2>/dev/null; then
        echo -e "${WARN} Aviso: systemd-resolved pode não estar instalado ou em uso"
    else
        echo -e "${CHECK} Serviço systemd-resolved parado"
    fi
    
    # Desabilitar no boot
    if ! systemctl disable systemd-resolved 2>/dev/null; then
        echo -e "${WARN} Aviso: Não foi possível desabilitar systemd-resolved do boot"
    else
        echo -e "${CHECK} systemd-resolved desabilitado do boot"
    fi
    
    echo -e "${CHECK} systemd-resolved desabilitado"
}

# Criar resolv.conf estático
create_static_resolv_conf() {
    echo -e "${INFO} Criando /etc/resolv.conf estático..."
    
    # Backup do resolv.conf existente
    if [ -f /etc/resolv.conf ]; then
        cp /etc/resolv.conf /etc/resolv.conf.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # Remover symlink se existir
    if [ -L /etc/resolv.conf ]; then
        rm /etc/resolv.conf
    fi
    
    # Criar resolv.conf estático com DNS públicos
    cat > /etc/resolv.conf <<EOF
# Static resolv.conf created by OpenPanel
# systemd-resolved has been disabled to allow AdGuard Home to use port 53
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF
    
    # Tornar imutável para evitar que systemd-resolved o sobrescreva
    chattr +i /etc/resolv.conf 2>/dev/null || {
        echo -e "${WARN} Não foi possível tornar resolv.conf imutável (chattr não disponível)"
        echo -e "${INFO} Você pode precisar recriar este arquivo se systemd-resolved for reativado"
    }
    
    echo -e "${CHECK} /etc/resolv.conf criado"
}

# Função principal
main() {
    backup_config
    echo ""
    disable_resolved
    echo ""
    create_static_resolv_conf
    echo ""
    
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    SYSTEMD-RESOLVED DESABILITADO COM SUCESSO!                  ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${WARN} ⚠️  IMPORTANTE:"
    echo -e "   ${ARROW} /etc/resolv.conf agora é estático (imutável)"
    echo -e "   ${ARROW} Configure o AdGuard Home como DNS após instalá-lo"
    echo -e "   ${ARROW} Backups foram criados em: /etc/systemd/resolved.conf.d/"
    echo ""
    echo -e "${INFO} Para REVERTER (reativar systemd-resolved):"
    echo -e "   ${BLUE}sudo chattr -i /etc/resolv.conf${NC}"
    echo -e "   ${BLUE}sudo systemctl enable systemd-resolved${NC}"
    echo -e "   ${BLUE}sudo systemctl start systemd-resolved${NC}"
    echo -e "   ${BLUE}sudo rm /etc/resolv.conf${NC}"
    echo ""
}

main "$@"

