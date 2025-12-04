#!/bin/bash
# ============================================================================
# OpenPanel - Reiniciar Ambiente PROD
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🔄 Reiniciando ambiente PROD..."

docker compose --profile prod --env-file .env.prod restart

echo "✅ Ambiente PROD reiniciado!"

