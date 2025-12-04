#!/bin/bash
# ============================================================================
# OpenPanel - Iniciar Ambiente PRE
# ============================================================================
# Inicia apenas o ambiente de staging/preview
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🚀 Iniciando ambiente PRE..."

# Verificar se arquivo .env.pre existe
if [ ! -f .env.pre ]; then
    echo "⚠️  Arquivo .env.pre não encontrado. Criando a partir de .env.pre.example..."
    if [ -f .env.pre.example ]; then
        cp .env.pre.example .env.pre
        echo "✅ Arquivo .env.pre criado. Por favor, edite com suas configurações."
    else
        echo "❌ Arquivo .env.pre.example não encontrado!"
        exit 1
    fi
fi

# Iniciar infraestrutura compartilhada (se não estiver rodando)
echo "📦 Verificando infraestrutura compartilhada..."
docker compose up -d postgres redis traefik
# Tailscale é opcional - use --profile tailscale se configurado
if [ -n "${TAILSCALE_AUTHKEY:-}" ]; then
    docker compose --profile tailscale up -d tailscale || echo "⚠️  Tailscale não configurado (opcional)"
fi

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
timeout=60
elapsed=0
until docker exec openpanel-postgres pg_isready -U openpanel > /dev/null 2>&1; do
    if [ $elapsed -ge $timeout ]; then
        echo "❌ Timeout aguardando PostgreSQL"
        exit 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo -n "."
done
echo ""

# Iniciar ambiente PRE
echo "🔧 Iniciando containers PRE..."
docker compose --profile pre --env-file .env.pre up -d --build

echo "✅ Ambiente PRE iniciado!"
echo ""
echo "📋 Serviços disponíveis:"
echo "   - Web: http://pre.openpanel.local"
echo "   - API: http://pre.openpanel.local/api"
echo ""
echo "📊 Ver status: ./scripts/server/status.sh"
echo "📝 Ver logs: ./scripts/server/logs-pre.sh"

