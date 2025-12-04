#!/bin/bash
# Teste completo de integração Hostinger-MCP
# Use este script para validar todos os endpoints

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuração
API_URL="${API_URL:-http://localhost:3001}"
API_TOKEN="${HOSTINGER_API_TOKEN:-}"
DOMAIN="${DDNS_DOMAIN:-soullabs.com.br}"
SUBDOMAIN="${DDNS_SUBDOMAIN:-home}"

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Teste de Integração Hostinger-MCP${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Função auxiliar
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local name=$4
  
  echo -e "\n${YELLOW}[TESTE]${NC} $name"
  echo -e "${BLUE}$method $endpoint${NC}"
  
  if [ "$method" = "GET" ]; then
    if [ -z "$API_TOKEN" ]; then
      response=$(curl -s -X $method "$API_URL$endpoint")
    else
      response=$(curl -s -X $method \
        -H "Authorization: Bearer $API_TOKEN" \
        "$API_URL$endpoint")
    fi
  else
    if [ -z "$API_TOKEN" ]; then
      response=$(curl -s -X $method \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$API_URL$endpoint")
    else
      response=$(curl -s -X $method \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$API_URL$endpoint")
    fi
  fi
  
  # Verificar resposta
  if echo "$response" | grep -q '"success"' || echo "$response" | grep -q '"status"'; then
    echo -e "${GREEN}✓ SUCESSO${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
  else
    echo -e "${RED}✗ FALHA${NC}"
    echo "$response"
  fi
}

# 1. Health Check (sem autenticação)
echo -e "\n${BLUE}=== TESTES SEM AUTENTICAÇÃO ===${NC}"
test_endpoint "GET" "/api/hostinger/health" "" "Health Check"

# 2. Se tiver token, fazer testes com autenticação
if [ -z "$API_TOKEN" ]; then
  echo -e "\n${YELLOW}⚠️  HOSTINGER_API_TOKEN não configurado${NC}"
  echo -e "Para testes completos, defina:"
  echo -e "  ${BLUE}export HOSTINGER_API_TOKEN=seu_token_aqui${NC}"
else
  echo -e "\n${BLUE}=== TESTES COM AUTENTICAÇÃO ===${NC}"
  
  # 3. Listar domínios
  test_endpoint "GET" "/api/hostinger/domains" "" "Listar Domínios"
  
  # 4. Detalhes do domínio
  test_endpoint "GET" "/api/hostinger/domains/$DOMAIN" "" "Detalhes do Domínio"
  
  # 5. Listar registros DNS
  test_endpoint "GET" "/api/hostinger/domains/$DOMAIN/dns" "" "Listar Registros DNS"
  
  # 6. Criar registro DNS (teste com valores mock)
  echo -e "\n${YELLOW}[TESTE]${NC} Criar Registro DNS (teste)"
  echo -e "${BLUE}POST /api/hostinger/domains/$DOMAIN/dns${NC}"
  create_dns=$(cat <<EOF
{
  "type": "A",
  "name": "test-$(date +%s)",
  "value": "192.0.2.100",
  "ttl": 3600
}
EOF
)
  response=$(curl -s -X POST \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$create_dns" \
    "$API_URL/api/hostinger/domains/$DOMAIN/dns")
  
  if echo "$response" | grep -q '"success"'; then
    echo -e "${GREEN}✓ SUCESSO${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
  else
    echo -e "${RED}✗ FALHA (esperado em ambiente com mock data)${NC}"
  fi
  
  # 7. UPSERT Registro DNS
  echo -e "\n${YELLOW}[TESTE]${NC} UPSERT Registro DNS"
  echo -e "${BLUE}POST /api/hostinger/domains/$DOMAIN/dns/upsert${NC}"
  upsert_dns=$(cat <<EOF
{
  "type": "A",
  "name": "@",
  "value": "192.0.2.1",
  "ttl": 3600
}
EOF
)
  response=$(curl -s -X POST \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$upsert_dns" \
    "$API_URL/api/hostinger/domains/$DOMAIN/dns/upsert")
  
  if echo "$response" | grep -q 'success\|created\|updated'; then
    echo -e "${GREEN}✓ SUCESSO${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
  else
    echo -e "${YELLOW}⚠️  Resposta inesperada${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
  fi
  
  # 8. Listar VPS
  test_endpoint "GET" "/api/hostinger/vms" "" "Listar VPS"
fi

# 9. Teste DDNS (pode ser feito sem autenticação em alguns setups)
echo -e "\n${BLUE}=== TESTE DDNS ===${NC}"
echo -e "${YELLOW}[TESTE]${NC} Atualizar DDNS"
echo -e "${BLUE}POST /api/hostinger/ddns/update${NC}"

ddns_update=$(cat <<EOF
{
  "domain": "$DOMAIN",
  "subdomain": "$SUBDOMAIN",
  "ip": "203.0.113.42"
}
EOF
)

response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$ddns_update" \
  "$API_URL/api/hostinger/ddns/update")

if echo "$response" | grep -q 'success'; then
  echo -e "${GREEN}✓ SUCESSO${NC}"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
  echo -e "${YELLOW}⚠️  Resposta inesperada${NC}"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
fi

# Resumo
echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Testes Completados${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Próximos passos:${NC}"
echo "1. Verificar logs: npm run logs:api"
echo "2. Consultar documentação: docs/HOSTINGER_MCP_QUICKSTART.md"
echo "3. Configurar ddclient no Ubuntu Server (se usando DDNS)"

echo ""
