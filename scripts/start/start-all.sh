#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." >/dev/null 2>&1 && pwd)"

echo "========================================"
echo "  OpenPanel - Inicialização completa"
echo "========================================"
echo "-> Este wrapper apenas chama npm start para você."
echo "-> Pré-requisitos: Node 18+, npm 10+, Docker/Compose no PATH."
echo

if ! command -v npm >/dev/null 2>&1; then
  echo "npm não encontrado. Instale Node.js (inclui npm) e tente novamente."
  exit 1
fi

cd "${PROJECT_ROOT}"

# Delega para o orquestrador unificado (start.js)
npm start "$@"