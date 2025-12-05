#!/bin/bash
# ============================================================================
# OpenPanel - Deploy DEV → PRE
# ============================================================================
# Promove código de DEV para PRE (staging)
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🚀 Deploy DEV → PRE"
echo "==================="
echo ""

# Verificar se PRE está rodando
if ! docker compose --profile pre ps | grep -q "Up"; then
    echo "⚠️  Ambiente PRE não está rodando. Iniciando..."
    ./scripts/server/start-pre.sh
fi

echo "🔨 Rebuildando containers PRE..."
docker compose --profile pre --env-file .env.pre build --no-cache

echo "🔄 Reiniciando ambiente PRE..."
docker compose --profile pre --env-file .env.pre up -d

echo "⏳ Aguardando serviços estarem prontos..."
sleep 10

# Verificar saúde dos serviços
echo "🏥 Verificando saúde dos serviços..."
if docker compose --profile pre ps | grep -q "healthy\|Up"; then
    echo "✅ Deploy concluído com sucesso!"
    echo ""
    echo "📋 Ambiente PRE disponível em:"
    echo "   - Web: http://pre.openpanel.local"
    echo "   - API: http://pre.openpanel.local/api"
else
    echo "⚠️  Alguns serviços podem não estar saudáveis. Verifique os logs:"
    echo "   ./scripts/server/logs-pre.sh"
fi

