#!/bin/bash
# ============================================================================
# OpenPanel - Reiniciar Ambiente PRE
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🔄 Reiniciando ambiente PRE..."

docker compose --profile pre --env-file .env.pre restart

echo "✅ Ambiente PRE reiniciado!"

