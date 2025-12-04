#!/bin/bash
# ============================================================================
# OpenPanel - Parar Ambiente DEV
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🛑 Parando ambiente DEV..."

docker compose --profile dev down

echo "✅ Ambiente DEV parado!"

