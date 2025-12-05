#!/bin/bash
# ============================================================================
# OpenPanel - Script de Configuração Rápida do Tailscale
# ============================================================================
# Adiciona a auth key do Tailscale em todos os arquivos .env
#
# Uso:
#   ./scripts/setup-tailscale.sh
#   ./scripts/setup-tailscale.sh tskey-auth-xxxxx
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

CHECK="${GREEN}✓${NC}"
WARN="${YELLOW}⚠${NC}"
INFO="${CYAN}ℹ${NC}"

# Obter auth key do argumento ou perguntar
if [ -n "$1" ]; then
    AUTH_KEY="$1"
else
    echo -e "${INFO} Configuração do Tailscale"
    echo -e "${INFO} Obtenha uma auth key em: https://login.tailscale.com/admin/settings/keys"
    echo ""
    read -p "Digite sua TAILSCALE_AUTHKEY: " AUTH_KEY
fi

if [ -z "$AUTH_KEY" ]; then
    echo -e "${WARN} Auth key não fornecida. Saindo..."
    exit 1
fi

# Validar formato da auth key
if [[ ! "$AUTH_KEY" =~ ^tskey-auth- ]]; then
    echo -e "${WARN} Formato de auth key inválido. Deve começar com 'tskey-auth-'"
    exit 1
fi

echo ""
echo -e "${INFO} Adicionando Tailscale Auth Key nos arquivos .env..."

# Função para adicionar/atualizar auth key em um arquivo
add_tailscale_key() {
    local file=$1
    
    if [ ! -f "$file" ]; then
        echo -e "${WARN} Arquivo $file não encontrado. Pulando..."
        return
    fi
    
    if grep -q "^TAILSCALE_AUTHKEY=" "$file" 2>/dev/null; then
        # Atualizar existente
        sed -i "s|^TAILSCALE_AUTHKEY=.*|TAILSCALE_AUTHKEY=$AUTH_KEY|" "$file"
        echo -e "${CHECK} Atualizado em $file"
    else
        # Adicionar novo
        # Verificar se já existe seção Tailscale
        if grep -q "# Tailscale" "$file" 2>/dev/null; then
            # Adicionar após a seção Tailscale
            sed -i "/# Tailscale/a TAILSCALE_AUTHKEY=$AUTH_KEY" "$file"
        else
            # Adicionar no final do arquivo
            echo "" >> "$file"
            echo "# Tailscale (VPN)" >> "$file"
            echo "TAILSCALE_AUTHKEY=$AUTH_KEY" >> "$file"
        fi
        echo -e "${CHECK} Adicionado em $file"
    fi
}

# Adicionar em todos os arquivos .env
add_tailscale_key ".env.dev"
add_tailscale_key ".env.pre"
add_tailscale_key ".env.prod"

# Também adicionar no .env principal se existir
if [ -f ".env" ]; then
    add_tailscale_key ".env"
fi

echo ""
echo -e "${GREEN}✅ Tailscale Auth Key configurada com sucesso!${NC}"
echo ""
echo -e "${INFO} Próximos passos:"
echo -e "   1. Iniciar Tailscale: docker compose --profile tailscale up -d tailscale"
echo -e "   2. Verificar status: docker logs openpanel-tailscale"
echo -e "   3. Obter IP: docker exec openpanel-tailscale tailscale ip"
echo ""

