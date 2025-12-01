#!/bin/bash
# Script para rotacionar credenciais expostas

set -e

echo "🔄 Script de Rotação de Credenciais"
echo "===================================="
echo ""
echo "Este script irá gerar novas credenciais seguras e atualizar o .env"
echo ""

# Gerar novas senhas
echo "🔐 Gerando novas credenciais seguras..."
NEW_POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
NEW_REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
NEW_JWT_SECRET=$(openssl rand -hex 64)

echo "✅ Credenciais geradas"
echo ""

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado na raiz!"
    echo "Execute 'npm start' primeiro para criar o .env"
    exit 1
fi

echo "📝 Atualizando .env..."
echo ""

# Backup do .env atual
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado: .env.backup.$(date +%Y%m%d_%H%M%S)"

# Atualizar POSTGRES_PASSWORD
if grep -q "^POSTGRES_PASSWORD=" .env; then
    sed -i.bak "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$NEW_POSTGRES_PASSWORD|" .env
    echo "✅ POSTGRES_PASSWORD atualizado"
else
    echo "POSTGRES_PASSWORD=$NEW_POSTGRES_PASSWORD" >> .env
    echo "✅ POSTGRES_PASSWORD adicionado"
fi

# Atualizar DATABASE_URL
if grep -q "^DATABASE_URL=" .env; then
    OLD_PASSWORD=$(grep "^POSTGRES_PASSWORD=" .env.backup.* 2>/dev/null | head -1 | cut -d'=' -f2 || echo "")
    if [ -n "$OLD_PASSWORD" ]; then
        sed -i.bak "s|:${OLD_PASSWORD}@|:${NEW_POSTGRES_PASSWORD}@|g" .env
    else
        sed -i.bak "s|postgresql://openpanel:[^@]*@|postgresql://openpanel:${NEW_POSTGRES_PASSWORD}@|" .env
    fi
    echo "✅ DATABASE_URL atualizado"
fi

# Atualizar REDIS_PASSWORD
if grep -q "^REDIS_PASSWORD=" .env; then
    sed -i.bak "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$NEW_REDIS_PASSWORD|" .env
    echo "✅ REDIS_PASSWORD atualizado"
else
    echo "REDIS_PASSWORD=$NEW_REDIS_PASSWORD" >> .env
    echo "✅ REDIS_PASSWORD adicionado"
fi

# Atualizar REDIS_URL
if grep -q "^REDIS_URL=" .env; then
    OLD_PASSWORD=$(grep "^REDIS_PASSWORD=" .env.backup.* 2>/dev/null | head -1 | cut -d'=' -f2 || echo "")
    if [ -n "$OLD_PASSWORD" ]; then
        sed -i.bak "s|:${OLD_PASSWORD}@|:${NEW_REDIS_PASSWORD}@|g" .env
    else
        sed -i.bak "s|redis://:[^@]*@|redis://:${NEW_REDIS_PASSWORD}@|" .env
    fi
    echo "✅ REDIS_URL atualizado"
fi

# Atualizar JWT_SECRET
if grep -q "^JWT_SECRET=" .env; then
    sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=$NEW_JWT_SECRET|" .env
    echo "✅ JWT_SECRET atualizado"
else
    echo "JWT_SECRET=$NEW_JWT_SECRET" >> .env
    echo "✅ JWT_SECRET adicionado"
fi

# Remover arquivos .bak
rm -f .env.bak

echo ""
echo "✅ Credenciais rotacionadas com sucesso!"
echo ""
echo "⚠️  PRÓXIMOS PASSOS:"
echo ""
echo "1. Pare os containers Docker:"
echo "   docker-compose down -v"
echo ""
echo "2. Reinicie os containers com as novas credenciais:"
echo "   docker-compose up -d"
echo ""
echo "3. Sincronize os subprojetos:"
echo "   npm start"
echo ""
echo "4. ⚠️  IMPORTANTE: Todos os tokens JWT existentes serão invalidados!"
echo "   Os usuários precisarão fazer login novamente."
echo ""
echo "5. Atualize as credenciais em qualquer serviço externo que use estas credenciais."
echo ""

