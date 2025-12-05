#!/bin/bash
# ============================================================================
# OpenPanel - Parar Ambiente PROD
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "🛑 Parando ambiente PROD..."

docker compose --profile prod down

echo "✅ Ambiente PROD parado!"

