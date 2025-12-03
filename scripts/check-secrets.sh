#!/bin/bash
# Script para verificar se há credenciais expostas no repositório Git

echo "🔒 Verificando credenciais expostas no repositório..."

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FOUND_SECRETS=0

# Verificar se arquivos .env estão sendo rastreados
echo -e "\n📋 Verificando arquivos .env no Git..."
ENV_FILES=$(git ls-files | grep -E '\.env$|\.env\.')
if [ -n "$ENV_FILES" ]; then
    echo -e "${RED}❌ ERRO: Arquivos .env estão sendo rastreados pelo Git:${NC}"
    echo "$ENV_FILES"
    FOUND_SECRETS=1
else
    echo -e "${GREEN}✅ Nenhum arquivo .env está sendo rastreado${NC}"
fi

# Verificar histórico do Git por credenciais comuns
echo -e "\n📋 Verificando histórico do Git por credenciais expostas..."
if git log --all --full-history --source -- "*/.env" "*/.env.*" 2>/dev/null | grep -q .; then
    echo -e "${YELLOW}⚠️  AVISO: Arquivos .env foram encontrados no histórico do Git${NC}"
    echo -e "${YELLOW}   Execute: git log --all --full-history --source -- '*/.env' '*/.env.*'${NC}"
    echo -e "${YELLOW}   Veja docs/SECURITY.md para instruções de limpeza${NC}"
    FOUND_SECRETS=1
else
    echo -e "${GREEN}✅ Nenhum arquivo .env encontrado no histórico${NC}"
fi

# Verificar por padrões de senha no código
echo -e "\n📋 Verificando padrões de credenciais no código..."
PATTERNS=(
    "password.*=.*[a-zA-Z0-9]{20,}"
    "secret.*=.*[a-zA-Z0-9]{32,}"
    "DATABASE_URL.*postgresql://.*:.*@"
    "REDIS_URL.*redis://.*:.*@"
    "GEMINI_API_KEY.*=.*AIza"
    "API_KEY.*=.*[a-zA-Z0-9]{20,}"
)

for pattern in "${PATTERNS[@]}"; do
    if git grep -i "$pattern" -- ':!*.md' ':!docs/*' ':!.env.example' ':!scripts/setup/*' ':!start.js' 2>/dev/null \
        | grep -v -E "changeme|your-super-secret|placeholder" \
        | grep -v -E '\\\$\{|\\\$[A-Za-z_]+' \
        | grep -v -E '<password>|<strong-password>' \
        | grep -q .; then
        echo -e "${RED}❌ Possível credencial encontrada: $pattern${NC}"
        FOUND_SECRETS=1
    fi
done

if [ $FOUND_SECRETS -eq 0 ]; then
    echo -e "\n${GREEN}✅ Nenhuma credencial exposta encontrada${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Credenciais expostas encontradas!${NC}"
    echo -e "${YELLOW}📖 Veja docs/SECURITY.md para instruções de correção${NC}"
    exit 1
fi

