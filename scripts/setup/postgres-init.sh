#!/bin/bash
# ============================================================================
# OpenPanel - PostgreSQL Database Initialization Script
# ============================================================================
# Este script inicializa o banco de dados único compartilhado
# É executado automaticamente quando o container PostgreSQL é criado pela primeira vez
# ============================================================================

set -e

POSTGRES_USER="${POSTGRES_USER:-openpanel}"
POSTGRES_DB="${POSTGRES_DB:-openpanel}"

# Aguardar PostgreSQL estar pronto
until pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; do
    echo "Aguardando PostgreSQL estar pronto..."
    sleep 1
done

echo "PostgreSQL está pronto. Inicializando banco de dados..."

# Criar extensão pgvector no banco de dados
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
EOSQL

echo "Banco de dados $POSTGRES_DB inicializado com sucesso!"

