#!/bin/bash
# ============================================================================
# OpenPanel - Iniciar Todos os Ambientes
# ============================================================================
# Inicia infraestrutura compartilhada e todos os ambientes (dev, pre, prod)
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🚀 Iniciando todos os ambientes..."

# Verificar arquivos .env
for env in dev pre prod; do
    if [ ! -f ".env.$env" ]; then
        if [ -f ".env.$env.example" ]; then
            echo "⚠️  Criando .env.$env a partir de .env.$env.example..."
            cp ".env.$env.example" ".env.$env"
        fi
    fi
done

# Iniciar infraestrutura compartilhada
echo "📦 Iniciando infraestrutura compartilhada..."
docker compose up -d --build --force-recreate postgres redis traefik
# Tailscale é opcional - use --profile tailscale se configurado
if [ -n "${TAILSCALE_AUTHKEY:-}" ]; then
    docker compose --profile tailscale up -d --build --force-recreate tailscale || echo "⚠️  Tailscale não configurado (opcional)"
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

# Iniciar todos os ambientes
echo "🔧 Iniciando ambiente DEV..."
docker compose --profile dev --env-file .env.dev up -d --build --force-recreate 2>/dev/null || echo "⚠️  DEV já está rodando ou erro ao iniciar"

echo "🔧 Iniciando ambiente PRE..."
docker compose --profile pre --env-file .env.pre up -d --build --force-recreate 2>/dev/null || echo "⚠️  PRE já está rodando ou erro ao iniciar"

echo "🔧 Iniciando ambiente PROD..."
docker compose --profile prod --env-file .env.prod up -d --build --force-recreate 2>/dev/null || echo "⚠️  PROD já está rodando ou erro ao iniciar"

echo ""
echo "✅ Todos os ambientes iniciados!"
echo ""
echo "📋 Serviços disponíveis:"
echo "   - DEV Web: http://dev.openpanel.local"
echo "   - PRE Web: http://pre.openpanel.local"
echo "   - PROD Web: https://openpanel.local"
echo ""
echo "📊 Ver status: ./scripts/server/status.sh"

