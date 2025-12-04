#!/bin/bash
# ============================================================================
# OpenPanel - Parar Ambiente PRE
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🛑 Parando ambiente PRE..."

docker compose --profile pre down

echo "✅ Ambiente PRE parado!"

