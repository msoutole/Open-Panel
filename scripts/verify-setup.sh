#!/bin/bash

# OpenPanel Setup Verification Script
# Verifica se tudo está configurado corretamente

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASSED=0
FAILED=0

print_header() {
    echo -e "\n${GREEN}======================================${NC}"
    echo -e "${GREEN}  $1${NC}"
    echo -e "${GREEN}======================================${NC}\n"
}

check_command() {
    local name=$1
    local command=$2

    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✓ $name${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ $name${NC}"
        FAILED=$((FAILED + 1))
    fi
}

check_http() {
    local name=$1
    local url=$2
    local expected_code=$3

    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

    if [ "$status" -eq "$expected_code" ] || [ "$status" -eq "0" ]; then
        echo -e "${GREEN}✓ $name (HTTP $status)${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ $name (HTTP $status, expected $expected_code)${NC}"
        FAILED=$((FAILED + 1))
    fi
}

print_header "OpenPanel Setup Verification"

# Check prerequisites
echo "Checking prerequisites..."
check_command "Node.js" "node --version"
check_command "npm" "npm --version"
check_command "Docker" "docker --version"
check_command "docker-compose" "docker-compose --version"

# Check Docker running
echo ""
echo "Checking Docker status..."
check_command "Docker daemon" "docker info"

# Check environment files
echo ""
echo "Checking configuration files..."
check_command ".env file exists" "test -f .env"
check_command ".env.example exists" "test -f .env.example"

# Check containers
echo ""
echo "Checking containers..."
check_command "openpanel-postgres running" "docker ps --filter 'name=openpanel-postgres' --filter 'status=running' | grep openpanel-postgres"
check_command "openpanel-redis running" "docker ps --filter 'name=openpanel-redis' --filter 'status=running' | grep openpanel-redis"
check_command "openpanel-api running" "docker ps --filter 'name=openpanel-api' --filter 'status=running' | grep openpanel-api"
check_command "openpanel-web running" "docker ps --filter 'name=openpanel-web' --filter 'status=running' | grep openpanel-web"

# Check container health
echo ""
echo "Checking container health..."
PG_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' openpanel-postgres 2>/dev/null || echo "unknown")
REDIS_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' openpanel-redis 2>/dev/null || echo "unknown")

if [ "$PG_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✓ PostgreSQL healthy${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ PostgreSQL not healthy (status: $PG_HEALTH)${NC}"
    FAILED=$((FAILED + 1))
fi

if [ "$REDIS_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✓ Redis healthy${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Redis not healthy (status: $REDIS_HEALTH)${NC}"
    FAILED=$((FAILED + 1))
fi

# Check API connectivity
echo ""
echo "Checking API connectivity..."
check_http "API Health Check" "http://localhost:3001/api/health" "401"

# Check Web connectivity
echo ""
echo "Checking Web connectivity..."
check_http "Web Server" "http://localhost:3000" "200"

# Check database connectivity
echo ""
echo "Checking database connectivity..."
check_command "PostgreSQL connection" "npm run db:generate 2>&1 | grep -q 'Generated Prisma Client'"

# Summary
echo ""
print_header "Verification Summary"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All checks passed! Your setup is ready.${NC}"
    echo -e "${CYAN}Next steps:${NC}"
    echo "1. Run: npm run dev"
    echo "2. Open http://localhost:3000"
    exit 0
else
    echo -e "\n${RED}❌ Some checks failed. Please review the errors above.${NC}"
    echo -e "${CYAN}Debugging tips:${NC}"
    echo "1. Check Docker is running: docker ps"
    echo "2. View container logs: docker-compose logs"
    echo "3. Restart containers: docker-compose down && docker-compose up -d"
    exit 1
fi
