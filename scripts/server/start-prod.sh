#!/bin/bash
# ============================================================================
# OpenPanel - Iniciar Ambiente PROD
# ============================================================================
# Inicia apenas o ambiente de produção
# ⚠️  ATENÇÃO: Certifique-se de ter configurado senhas fortes em .env.prod!
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🚀 Iniciando ambiente PROD..."

# Verificar se arquivo .env.prod existe
if [ ! -f .env.prod ]; then
    echo "⚠️  Arquivo .env.prod não encontrado. Criando a partir de .env.prod.example..."
    if [ -f .env.prod.example ]; then
        cp .env.prod.example .env.prod
        echo "⚠️  ATENÇÃO: Arquivo .env.prod criado com senhas padrão!"
        echo "⚠️  Por favor, edite .env.prod e altere todas as senhas antes de continuar!"
        read -p "Pressione Enter após alterar as senhas ou Ctrl+C para cancelar..."
    else
        echo "❌ Arquivo .env.prod.example não encontrado!"
        exit 1
    fi
fi

# Verificar se senhas padrão foram alteradas
if grep -q "changeme" .env.prod; then
    echo "⚠️  ATENÇÃO: Detectadas senhas padrão em .env.prod!"
    echo "⚠️  Por favor, altere todas as senhas antes de usar em produção!"
    read -p "Continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
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

# Iniciar ambiente PROD
echo "🔧 Iniciando containers PROD..."
docker compose --profile prod --env-file .env.prod up -d --build --force-recreate

echo "✅ Ambiente PROD iniciado!"
echo ""
echo "📋 Serviços disponíveis:"
echo "   - Web: https://openpanel.local"
echo "   - API: https://openpanel.local/api"
echo ""
echo "📊 Ver status: ./scripts/server/status.sh"
echo "📝 Ver logs: ./scripts/server/logs-prod.sh"

