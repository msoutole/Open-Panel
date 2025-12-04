#!/bin/bash
# ============================================================================
# OpenPanel - Status de Todos os Ambientes
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "📊 Status dos Ambientes OpenPanel"
echo "=================================="
echo ""

# Infraestrutura compartilhada
echo "🔧 Infraestrutura Compartilhada:"
docker compose ps postgres redis traefik 2>/dev/null || echo "   Nenhum serviço rodando"

echo ""
echo "🔐 Tailscale (VPN):"
docker compose --profile tailscale ps tailscale 2>/dev/null || echo "   Não está rodando (opcional)"
if docker ps --format '{{.Names}}' | grep -q "openpanel-tailscale"; then
    echo "   IP Tailscale: $(docker exec openpanel-tailscale tailscale ip 2>/dev/null || echo 'N/A')"
fi

echo ""
echo "🔵 Ambiente DEV:"
docker compose --profile dev ps 2>/dev/null || echo "   Não está rodando"

echo ""
echo "🟡 Ambiente PRE:"
docker compose --profile pre ps 2>/dev/null || echo "   Não está rodando"

echo ""
echo "🟢 Ambiente PROD:"
docker compose --profile prod ps 2>/dev/null || echo "   Não está rodando"

echo ""
echo "=================================="
echo "💡 Dicas:"
echo "   - Iniciar DEV: ./scripts/server/start-dev.sh"
echo "   - Iniciar PRE: ./scripts/server/start-pre.sh"
echo "   - Iniciar PROD: ./scripts/server/start-prod.sh"
echo "   - Ver logs: ./scripts/server/logs-dev.sh (ou -pre, -prod)"

