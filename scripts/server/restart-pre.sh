#!/bin/bash
# ============================================================================
# OpenPanel - Reiniciar Ambiente PRE
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🔄 Reiniciando ambiente PRE..."

# Recriar containers para garantir configurações atualizadas
docker compose --profile pre --env-file .env.pre down
docker compose --profile pre --env-file .env.pre up -d --build --force-recreate

echo "✅ Ambiente PRE reiniciado e recriado!"

