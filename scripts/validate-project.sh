#!/bin/bash
# ============================================================================
# OpenPanel - Validation Script
# ============================================================================
# Este script valida se o projeto está pronto para distribuição
# ============================================================================

set -e

echo "🔍 Validando OpenPanel..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 existe"
    else
        echo -e "${RED}✗${NC} $1 NÃO existe"
        ((ERRORS++))
    fi
}

# Function to check directory doesn't exist
check_not_exists() {
    if [ ! -e "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 não existe (correto)"
    else
        echo -e "${YELLOW}⚠${NC} $1 ainda existe (deveria ter sido removido)"
        ((WARNINGS++))
    fi
}

# Check essential files
echo "📄 Verificando arquivos essenciais..."
check_file "LICENSE"
check_file "README.md"
check_file "CONTRIBUTING.md"
check_file "CODE_OF_CONDUCT.md"
check_file "SECURITY.md"
check_file "CHANGELOG.md"
check_file "HOMELAB_QUICKSTART.md"
check_file ".env.example"
check_file "package.json"
check_file "docker-compose.yml"
check_file "docker-compose.prod.yml"
echo ""

# Check GitHub templates
echo "📋 Verificando templates do GitHub..."
check_file ".github/ISSUE_TEMPLATE/bug_report.md"
check_file ".github/ISSUE_TEMPLATE/feature_request.md"
check_file ".github/ISSUE_TEMPLATE/documentation.md"
check_file ".github/PULL_REQUEST_TEMPLATE.md"
echo ""

# Check Dockerfiles
echo "🐳 Verificando Dockerfiles..."
check_file "apps/api/Dockerfile"
check_file "apps/web/Dockerfile"
check_file ".dockerignore"
echo ""

# Check that IDE-specific files were removed
echo "🧹 Verificando limpeza de arquivos..."
check_not_exists ".cursor"
check_not_exists ".claude"
check_not_exists ".gemini"
check_not_exists ".cursorignore"
check_not_exists "test-user.json"
echo ""

# Check for potential secrets in .env.example
echo "🔒 Verificando segurança do .env.example..."
if grep -q "changeme" .env.example; then
    echo -e "${GREEN}✓${NC} Usando placeholders 'changeme'"
else
    echo -e "${YELLOW}⚠${NC} .env.example pode conter valores reais"
    ((WARNINGS++))
fi

if ! grep -E "(admin123|password123|secret123)" .env.example > /dev/null; then
    echo -e "${GREEN}✓${NC} Nenhuma senha óbvia encontrada"
else
    echo -e "${YELLOW}⚠${NC} Senhas óbvias encontradas no .env.example"
    ((WARNINGS++))
fi
echo ""

# Check documentation
echo "📚 Verificando documentação..."
check_file "docs/README.md"
check_file "docs/MANUAL_DO_USUARIO.md"
check_file "docs/MANUAL_TECNICO.md"
check_file "docs/GUIA_DE_DESENVOLVIMENTO.md"
check_file "docs/GUIA_HOMELAB.md"
echo ""

# Summary
echo "================================"
echo "📊 Resumo da Validação"
echo "================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ SUCESSO!${NC} Projeto pronto para distribuição!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ATENÇÃO!${NC} $WARNINGS avisos encontrados"
    echo "Revise os avisos acima antes de distribuir"
    exit 0
else
    echo -e "${RED}❌ FALHOU!${NC} $ERRORS erros e $WARNINGS avisos encontrados"
    echo "Corrija os erros antes de distribuir"
    exit 1
fi
