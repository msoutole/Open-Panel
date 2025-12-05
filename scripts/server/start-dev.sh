#!/bin/bash
# ============================================================================
# OpenPanel - Iniciar Ambiente DEV
# ============================================================================
# Inicia apenas o ambiente de desenvolvimento
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🚀 Iniciando ambiente DEV..."

# Verificar se arquivo .env.dev existe
if [ ! -f .env.dev ]; then
    echo "⚠️  Arquivo .env.dev não encontrado. Criando a partir de .env.dev.example..."
    if [ -f .env.dev.example ]; then
        cp .env.dev.example .env.dev
        echo "✅ Arquivo .env.dev criado. Por favor, edite com suas configurações."
    else
        echo "❌ Arquivo .env.dev.example não encontrado!"
        exit 1
    fi
fi

# Iniciar infraestrutura compartilhada (se não estiver rodando)
echo "📦 Verificando infraestrutura compartilhada..."
docker compose up -d --build --force-recreate postgres redis traefik
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

# Iniciar ambiente DEV
echo "🔧 Iniciando containers DEV..."
if command -v docker_compose_recreate >/dev/null 2>&1; then
    source "$SCRIPT_DIR/../lib/common.sh"
    docker_compose_recreate "dev" ".env.dev"
else
    docker compose --profile dev --env-file .env.dev up -d --build --force-recreate
fi

echo "✅ Ambiente DEV iniciado!"
echo ""
echo "📋 Serviços disponíveis:"
echo "   - Web: http://dev.openpanel.local"
echo "   - API: http://dev.openpanel.local/api"
echo "   - Traefik Dashboard: http://localhost:8080"
echo ""
echo "📊 Ver status: ./scripts/server/status.sh"
echo "📝 Ver logs: ./scripts/server/logs-dev.sh"

