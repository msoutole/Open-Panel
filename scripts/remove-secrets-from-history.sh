#!/bin/bash
# Script para remover credenciais do histórico do Git
# ⚠️  USE COM CUIDADO - Isso reescreve o histórico do Git!

set -e

echo "🔒 Script para Remover Credenciais do Histórico do Git"
echo "=================================================="
echo ""
echo "⚠️  AVISO: Este script irá reescrever o histórico do Git!"
echo "⚠️  Isso é DESTRUTIVO e pode afetar outros desenvolvedores!"
echo ""
echo "Este script irá:"
echo "1. Remover apps/api/.env de todo o histórico do Git"
echo "2. Remover apps/web/.env.local de todo o histórico do Git"
echo "3. Forçar garbage collection para limpar completamente"
echo ""
read -p "Tem certeza que deseja continuar? (digite 'SIM' para confirmar): " confirm

if [ "$confirm" != "SIM" ]; then
    echo "Operação cancelada."
    exit 1
fi

echo ""
echo "📋 Verificando se git-filter-repo está instalado..."
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ git-filter-repo não está instalado."
    echo ""
    echo "Instale com:"
    echo "  pip install git-filter-repo"
    echo "  ou"
    echo "  brew install git-filter-repo"
    echo ""
    exit 1
fi

echo "✅ git-filter-repo encontrado"
echo ""
echo "🗑️  Removendo arquivos .env do histórico..."

# Remover apps/api/.env
if git log --all --full-history --source -- "apps/api/.env" 2>/dev/null | grep -q .; then
    echo "  - Removendo apps/api/.env..."
    git filter-repo --path apps/api/.env --invert-paths --force
else
    echo "  - apps/api/.env não encontrado no histórico"
fi

# Remover apps/web/.env.local
if git log --all --full-history --source -- "apps/web/.env.local" 2>/dev/null | grep -q .; then
    echo "  - Removendo apps/web/.env.local..."
    git filter-repo --path apps/web/.env.local --invert-paths --force
else
    echo "  - apps/web/.env.local não encontrado no histórico"
fi

echo ""
echo "🧹 Limpando referências..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Histórico limpo!"
echo ""
echo "⚠️  PRÓXIMOS PASSOS OBRIGATÓRIOS:"
echo "1. Rotacione TODAS as credenciais expostas:"
echo "   - POSTGRES_PASSWORD"
echo "   - REDIS_PASSWORD"
echo "   - JWT_SECRET"
echo ""
echo "2. Se o repositório for remoto, force push (CUIDADO!):"
echo "   git push --force --all"
echo "   git push --force --tags"
echo ""
echo "3. Notifique todos os colaboradores para fazer:"
echo "   git fetch origin"
echo "   git reset --hard origin/main"
echo ""
echo "📖 Veja docs/SECURITY.md para mais informações"

