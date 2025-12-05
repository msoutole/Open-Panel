#!/bin/bash
# ============================================================================
# OpenPanel - Reiniciar Ambiente DEV
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🔄 Reiniciando ambiente DEV..."

docker compose --profile dev --env-file .env.dev restart

echo "✅ Ambiente DEV reiniciado!"

