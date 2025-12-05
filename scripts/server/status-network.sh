#!/bin/bash
# ============================================================================
# OpenPanel - Status da Rede
# ============================================================================
# Mostra status completo da rede e serviços relacionados
#
# Uso:
#   ./status-network.sh
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Executar script de verificação de rede
if [ -f "$SCRIPT_DIR/../setup/check-network.sh" ]; then
    "$SCRIPT_DIR/../setup/check-network.sh"
else
    echo "Script check-network.sh não encontrado"
    exit 1
fi

