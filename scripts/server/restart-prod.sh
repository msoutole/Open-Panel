#!/bin/bash
# ============================================================================
# OpenPanel - Reiniciar Ambiente PROD
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🔄 Reiniciando ambiente PROD..."

# Recriar containers para garantir configurações atualizadas
docker compose --profile prod --env-file .env.prod down
docker compose --profile prod --env-file .env.prod up -d --build --force-recreate

echo "✅ Ambiente PROD reiniciado e recriado!"

