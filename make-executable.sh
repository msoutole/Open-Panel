#!/bin/bash
# ============================================================================
# OpenPanel - Tornar Scripts Executáveis
# ============================================================================
# Script para tornar todos os scripts do projeto executáveis
#
# Uso:
#   ./make-executable.sh
# ============================================================================

echo "Tornando scripts executáveis..."

# Pasta de scripts
SCRIPTS_DIR="scripts"

# Encontrar todos os arquivos .sh e torná-los executáveis
find "$SCRIPTS_DIR" -name "*.sh" -type f -exec chmod +x {} \; -print

echo ""
echo "✓ Scripts tornados executáveis em: $SCRIPTS_DIR"
echo ""
echo "Arquivos:"
find "$SCRIPTS_DIR" -name "*.sh" -type f -exec ls -lh {} \; | awk '{print "  " $9 " (" $1 ")"}'
