#!/bin/bash
# ============================================================================
# OpenPanel - Iniciar AdGuard Home
# ============================================================================
# Inicia AdGuard Home via Docker Compose
#
# Uso:
#   ./start-adguard.sh
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "Iniciando AdGuard Home..."
docker compose --profile adguard up -d adguard

echo "AdGuard Home iniciado!"
echo "Acesse: http://adguard.openpanel.local"

