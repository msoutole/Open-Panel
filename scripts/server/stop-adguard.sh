#!/bin/bash
# ============================================================================
# OpenPanel - Parar AdGuard Home
# ============================================================================
# Para AdGuard Home via Docker Compose
#
# Uso:
#   ./stop-adguard.sh
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "Parando AdGuard Home..."
docker compose --profile adguard stop adguard

echo "AdGuard Home parado!"

