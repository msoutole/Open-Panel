#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   OpenPanel - Service Health Check${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to check command existence
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Docker
echo -e "${YELLOW}[1/8] Checking Docker...${NC}"
if command_exists docker; then
    if docker info >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker is running${NC}\n"
    else
        echo -e "${RED}✗ Docker is installed but not running${NC}"
        echo -e "${YELLOW}  Run: sudo systemctl start docker${NC}\n"
    fi
else
    echo -e "${RED}✗ Docker not found${NC}"
    echo -e "${YELLOW}  Install: curl -fsSL https://get.docker.com | sh${NC}\n"
fi

# Check Docker Compose
echo -e "${YELLOW}[2/8] Checking Docker Compose...${NC}"
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker Compose is available${NC}\n"
else
    echo -e "${RED}✗ Docker Compose not found${NC}\n"
fi

# Check PostgreSQL container
echo -e "${YELLOW}[3/8] Checking PostgreSQL...${NC}"
if docker ps --format '{{.Names}}' | grep -q "openpanel-postgres"; then
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' openpanel-postgres 2>/dev/null || echo "no-healthcheck")
    if [ "$STATUS" == "healthy" ]; then
        echo -e "${GREEN}✓ PostgreSQL is running and healthy${NC}"
        echo -e "  Port: 5432"
        echo -e "  Container: openpanel-postgres\n"
    elif [ "$STATUS" == "starting" ]; then
        echo -e "${YELLOW}⚠ PostgreSQL is starting...${NC}\n"
    else
        echo -e "${RED}✗ PostgreSQL is unhealthy${NC}"
        echo -e "${YELLOW}  Check logs: docker logs openpanel-postgres${NC}\n"
    fi
else
    echo -e "${RED}✗ PostgreSQL container not running${NC}"
    echo -e "${YELLOW}  Start: docker-compose up -d postgres${NC}\n"
fi

# Check Redis container
echo -e "${YELLOW}[4/8] Checking Redis...${NC}"
if docker ps --format '{{.Names}}' | grep -q "openpanel-redis"; then
    if docker exec openpanel-redis redis-cli -a changeme ping 2>/dev/null | grep -q "PONG"; then
        echo -e "${GREEN}✓ Redis is running${NC}"
        echo -e "  Port: 6379"
        echo -e "  Container: openpanel-redis\n"
    else
        echo -e "${RED}✗ Redis is not responding${NC}\n"
    fi
else
    echo -e "${RED}✗ Redis container not running${NC}"
    echo -e "${YELLOW}  Start: docker-compose up -d redis${NC}\n"
fi

# Check Ollama container
echo -e "${YELLOW}[5/8] Checking Ollama (AI)...${NC}"
if docker ps --format '{{.Names}}' | grep -q "openpanel-ollama"; then
    echo -e "${GREEN}✓ Ollama is running${NC}"
    echo -e "  Port: 11434"
    echo -e "  Container: openpanel-ollama\n"
else
    echo -e "${YELLOW}⚠ Ollama container not running (optional)${NC}"
    echo -e "  Start: docker-compose up -d ollama${NC}\n"
fi

# Check Traefik container
echo -e "${YELLOW}[6/8] Checking Traefik...${NC}"
if docker ps --format '{{.Names}}' | grep -q "openpanel-traefik"; then
    echo -e "${GREEN}✓ Traefik is running${NC}"
    echo -e "  HTTP: 80, HTTPS: 443, Dashboard: 8080"
    echo -e "  Container: openpanel-traefik\n"
else
    echo -e "${YELLOW}⚠ Traefik container not running${NC}"
    echo -e "  Start: docker-compose up -d traefik${NC}\n"
fi

# Check API (if running)
echo -e "${YELLOW}[7/8] Checking API...${NC}"
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    RESPONSE=$(curl -s http://localhost:3001/health)
    echo -e "${GREEN}✓ API is running${NC}"
    echo -e "  URL: http://localhost:3001"
    echo -e "  Response: $RESPONSE\n"
else
    echo -e "${RED}✗ API not responding on port 3001${NC}"
    echo -e "${YELLOW}  Start: npm run dev:api${NC}\n"
fi

# Check Frontend (if running)
echo -e "${YELLOW}[8/8] Checking Frontend...${NC}"
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
    echo -e "  URL: http://localhost:3000\n"
else
    echo -e "${RED}✗ Frontend not responding on port 3000${NC}"
    echo -e "${YELLOW}  Start: npm run dev:web${NC}\n"
fi

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Summary${NC}"
echo -e "${BLUE}========================================${NC}\n"

DOCKER_OK=false
POSTGRES_OK=false
REDIS_OK=false
API_OK=false
FRONTEND_OK=false

# Re-check critical services for summary
command_exists docker && docker info >/dev/null 2>&1 && DOCKER_OK=true
docker ps --format '{{.Names}}' | grep -q "openpanel-postgres" && POSTGRES_OK=true
docker ps --format '{{.Names}}' | grep -q "openpanel-redis" && REDIS_OK=true
curl -s http://localhost:3001/health >/dev/null 2>&1 && API_OK=true
curl -s http://localhost:3000 >/dev/null 2>&1 && FRONTEND_OK=true

if $DOCKER_OK && $POSTGRES_OK && $REDIS_OK && $API_OK && $FRONTEND_OK; then
    echo -e "${GREEN}🎉 All critical services are running!${NC}"
    echo -e "${GREEN}You can access the application at:${NC}"
    echo -e "${BLUE}  Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}  API: http://localhost:3001${NC}\n"
elif $DOCKER_OK && $POSTGRES_OK && $REDIS_OK; then
    echo -e "${YELLOW}⚠ Docker services are running, but API/Frontend are not${NC}"
    echo -e "${YELLOW}Start them with:${NC}"
    echo -e "${BLUE}  npm run dev${NC}"
    echo -e "${YELLOW}Or separately:${NC}"
    echo -e "${BLUE}  npm run dev:api${NC}"
    echo -e "${BLUE}  npm run dev:web${NC}\n"
elif $DOCKER_OK; then
    echo -e "${YELLOW}⚠ Docker is running, but containers are not${NC}"
    echo -e "${YELLOW}Start containers with:${NC}"
    echo -e "${BLUE}  docker-compose up -d${NC}\n"
else
    echo -e "${RED}✗ Docker is not running${NC}"
    echo -e "${YELLOW}Start Docker first, then run:${NC}"
    echo -e "${BLUE}  docker-compose up -d${NC}\n"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}For detailed setup instructions, see:${NC}"
echo -e "${BLUE}  SETUP_GUIDE.md${NC}"
echo -e "${BLUE}========================================${NC}\n"
