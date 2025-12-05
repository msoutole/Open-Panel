#!/bin/bash
# ============================================================================
# OpenPanel - Reiniciar Ambiente DEV
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🔄 Reiniciando ambiente DEV..."

# Recriar containers para garantir configurações atualizadas
docker compose --profile dev --env-file .env.dev down
docker compose --profile dev --env-file .env.dev up -d --build --force-recreate

echo "✅ Ambiente DEV reiniciado e recriado!"

