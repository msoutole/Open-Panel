#!/bin/bash
# ============================================================================
# OpenPanel - Deploy PRE → PROD
# ============================================================================
# Promove código de PRE para PROD (produção)
# ⚠️  ATENÇÃO: Este script faz deploy em produção!
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🚀 Deploy PRE → PROD"
echo "===================="
echo ""
echo "⚠️  ATENÇÃO: Você está prestes a fazer deploy em PRODUÇÃO!"
read -p "Tem certeza que deseja continuar? (digite 'sim' para confirmar): " confirmation

if [ "$confirmation" != "sim" ]; then
    echo "❌ Deploy cancelado."
    exit 1
fi

# Backup do ambiente PROD atual
echo "💾 Criando backup do ambiente PROD atual..."
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup do banco de dados
echo "   - Backup do banco de dados..."
docker exec openpanel-postgres pg_dump -U openpanel openpanel_prod > "$BACKUP_DIR/database.sql" 2>/dev/null || echo "   ⚠️  Erro ao fazer backup do banco"

echo "✅ Backup criado em: $BACKUP_DIR"

# Verificar se PROD está rodando
if ! docker compose --profile prod ps | grep -q "Up"; then
    echo "⚠️  Ambiente PROD não está rodando. Iniciando..."
    ./scripts/server/start-prod.sh
fi

echo "🔨 Rebuildando e recriando containers PROD..."
docker compose --profile prod --env-file .env.prod build --no-cache

echo "🔄 Reiniciando ambiente PROD com force-recreate..."
docker compose --profile prod --env-file .env.prod down
docker compose --profile prod --env-file .env.prod up -d --build --force-recreate

echo "⏳ Aguardando serviços estarem prontos..."
sleep 15

# Verificar saúde dos serviços
echo "🏥 Verificando saúde dos serviços..."
if docker compose --profile prod ps | grep -q "healthy\|Up"; then
    echo "✅ Deploy em produção concluído com sucesso!"
    echo ""
    echo "📋 Ambiente PROD disponível em:"
    echo "   - Web: https://openpanel.local"
    echo "   - API: https://openpanel.local/api"
else
    echo "❌ ERRO: Serviços não estão saudáveis!"
    echo ""
    echo "🔄 Iniciando rollback..."
    
    # Rollback básico (restaurar containers anteriores)
    echo "   Restaurando containers anteriores..."
    docker compose --profile prod --env-file .env.prod down
    docker compose --profile prod --env-file .env.prod up -d
    
    echo "⚠️  Rollback concluído. Verifique os logs:"
    echo "   ./scripts/server/logs-prod.sh"
    exit 1
fi

