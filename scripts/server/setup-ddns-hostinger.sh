#!/bin/bash

################################################################################
# Setup DDNS Hostinger via ddclient
# Descrição: Configura o ddclient para atualizar automaticamente seu DDNS
#           na Hostinger (ddnskey.com)
# Uso: sudo bash setup-ddns-hostinger.sh
################################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

################################################################################
# 1. Validar privilégios
################################################################################
if [[ $EUID -ne 0 ]]; then
    log_error "Este script deve ser executado como root (sudo)"
    exit 1
fi

log_info "Iniciando configuração do DDNS Hostinger via ddclient..."
echo

################################################################################
# 2. Coletar informações do usuário
################################################################################
log_info "Coletando informações necessárias:"
echo

read -p "$(echo -e ${BLUE}[?]${NC} Host DDNS da Hostinger [all.ddnskey.com]: )" DDNS_HOST
DDNS_HOST=${DDNS_HOST:-all.ddnskey.com}

read -p "$(echo -e ${BLUE}[?]${NC} Nome de usuário DDNS (ex: 71zkxtb): )" DDNS_USER
if [[ -z "$DDNS_USER" ]]; then
    log_error "Nome de usuário é obrigatório!"
    exit 1
fi

read -sp "$(echo -e ${BLUE}[?]${NC} Senha DDNS (será ocultada): )" DDNS_PASS
echo
if [[ -z "$DDNS_PASS" ]]; then
    log_error "Senha é obrigatória!"
    exit 1
fi

read -p "$(echo -e ${BLUE}[?]${NC} Domínio(s) a atualizar (ex: home.soullabs.com.br): )" DDNS_DOMAIN
if [[ -z "$DDNS_DOMAIN" ]]; then
    log_error "Domínio é obrigatório!"
    exit 1
fi

echo
log_success "Informações coletadas:"
echo "  Host: $DDNS_HOST"
echo "  Usuário: $DDNS_USER"
echo "  Domínio(s): $DDNS_DOMAIN"
echo

################################################################################
# 3. Atualizar repositórios e instalar ddclient
################################################################################
log_info "Atualizando repositórios e instalando ddclient..."
apt-get update -qq
apt-get install -y ddclient > /dev/null 2>&1

log_success "ddclient instalado com sucesso"
echo

################################################################################
# 4. Parar o serviço antes de reconfigurar
################################################################################
log_info "Parando serviço ddclient..."
systemctl stop ddclient 2>/dev/null || true

################################################################################
# 5. Criar arquivo de configuração
################################################################################
log_info "Criando arquivo de configuração (/etc/ddclient.conf)..."

# Fazer backup da config anterior
if [[ -f /etc/ddclient.conf ]]; then
    cp /etc/ddclient.conf /etc/ddclient.conf.backup
    log_warn "Backup anterior salvo em: /etc/ddclient.conf.backup"
fi

# Criar nova config
cat > /etc/ddclient.conf << EOF
# Configuração DDNS Hostinger via ddclient
# Gerada automaticamente - $(date +"%Y-%m-%d %H:%M:%S")

# Configuração Básica
daemon=300                # Verifica a cada 300 segundos (5 minutos)
syslog=yes                # Registra logs no sistema
pid=/var/run/ddclient.pid
ssl=yes                   # Usa HTTPS para segurança

# Método para descobrir seu IP externo
use=web, web=checkip.dyndns.com/, web-skip='IP Address'

# Credenciais da Hostinger
protocol=dyndns2
server=$DDNS_HOST
login=$DDNS_USER
password='$DDNS_PASS'

# Domínios a atualizar
$DDNS_DOMAIN
EOF

# Definir permissões adequadas (apenas root pode ler a senha!)
chmod 600 /etc/ddclient.conf
chown root:root /etc/ddclient.conf

log_success "Arquivo de configuração criado com permissões seguras"
echo

################################################################################
# 6. Reiniciar o serviço
################################################################################
log_info "Reiniciando serviço ddclient..."
systemctl start ddclient
sleep 2

# Verificar status
if systemctl is-active --quiet ddclient; then
    log_success "ddclient está rodando com sucesso"
else
    log_error "Falha ao iniciar ddclient"
    log_info "Use: sudo systemctl status ddclient"
    exit 1
fi

echo

################################################################################
# 7. Exibir status e logs
################################################################################
log_info "Status atual do serviço:"
systemctl status ddclient --no-pager | head -20
echo

################################################################################
# 8. Teste de depuração (opcional)
################################################################################
log_warn "Próximos passos:"
echo "  1. Aguarde ~1-2 minutos para a primeira sincronização"
echo "  2. Verifique os logs: sudo tail -f /var/log/syslog | grep ddclient"
echo "  3. Para debug detalhado, execute:"
echo "     sudo ddclient -daemon=0 -debug -verbose -noquiet"
echo
echo "  4. Na Hostinger:"
echo "     - Acesse: hPanel > Domínios > $DDNS_DOMAIN"
echo "     - Vá em: DNS Zone"
echo "     - Crie um registro A com nome: home (ou conforme configurado)"
echo "     - Valor inicial: 1.1.1.1 (será atualizado automaticamente)"
echo

################################################################################
# 9. Ativar inicialização automática
################################################################################
log_info "Ativando início automático ao boot..."
systemctl enable ddclient

log_success "DDNS Hostinger configurado com sucesso!"
echo

################################################################################
# 10. Resumo final
################################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}CONFIGURAÇÃO CONCLUÍDA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo
echo "Domínio: $DDNS_DOMAIN"
echo "Atualização a cada: 300 segundos (5 minutos)"
echo "Arquivo de log: /var/log/syslog"
echo
echo "Para monitorar em tempo real:"
echo "  sudo journalctl -u ddclient -f"
echo
