#!/bin/bash
# ============================================================================
# OpenPanel - Logs do Ambiente DEV
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

# Se passar argumento -f, seguir logs
if [ "$1" = "-f" ] || [ "$1" = "--follow" ]; then
    docker compose --profile dev logs -f
else
    docker compose --profile dev logs --tail=100
fi

