#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Open-Panel Setup...${NC}"

# Function to check command existence
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create default admin user
create_admin_user() {
    echo -e "${YELLOW}Creating default admin user...${NC}"
    # Try to create admin user via API
    curl -s -X POST http://localhost:3001/api/auth/register \
         -H "Content-Type: application/json" \
         -d '{"name":"Admin User","email":"admin@openpanel.dev","password":"admin123"}' \
         >/dev/null 2>&1 || echo -e "${YELLOW}⚠ Admin user may already exist or API is not ready yet${NC}"
}

# Function to start all services
start_openpanel() {
    echo -e "${YELLOW}Starting OpenPanel services...${NC}"
    npm run dev &
}

# 1. Check & Install Node.js
if command_exists node; then
    echo -e "${GREEN}✓ Node.js is installed ($(node -v))${NC}"
else
    echo -e "${YELLOW}Node.js not found. Attempting to install...${NC}"
    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y nodejs npm
    elif command_exists brew; then
        brew install node
    elif command_exists dnf; then
        sudo dnf install -y nodejs
    else
        echo -e "${RED}Could not install Node.js automatically. Please install Node.js (>=18) manually.${NC}"
        exit 1
    fi
fi

# 2. Check & Install Docker
if command_exists docker; then
    echo -e "${GREEN}✓ Docker is installed${NC}"
else
    echo -e "${YELLOW}Docker not found. Attempting to install...${NC}"
    curl -fsSL https://get.docker.com | sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install Docker. Please install Docker manually.${NC}"
        exit 1
    fi
fi

# Ensure Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${YELLOW}Docker is not running. Attempting to start...${NC}"
    sudo systemctl start docker || open -a Docker
    sleep 5
fi

# 3. Setup Environment Variables
if [ ! -f .env ]; then
    echo -e "${YELLOW}.env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env created${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# 4. Install Dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# 5. Start Docker Services
echo -e "${YELLOW}Starting Docker services...${NC}"
docker-compose up -d

# Wait for Postgres to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' openpanel-postgres 2>/dev/null)
    if [ "$STATUS" == "healthy" ]; then
        HEALTHY=true
        echo -e "${GREEN}Database is ready!${NC}"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT+1))
        echo -ne "Waiting for database... ($RETRY_COUNT/$MAX_RETRIES)\r"
    fi
done

if [ "$HEALTHY" = false ]; then
    echo -e "\n${RED}Database failed to become ready. Please check logs: docker logs openpanel-postgres${NC}"
    exit 1
fi

# 6. Database Setup
echo -e "${YELLOW}Setting up database...${NC}"
npm run db:generate
npm run db:push

# 7. Start all services
echo -e "${GREEN}------------------------------------------------${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}Starting all OpenPanel services...${NC}"
echo -e "${GREEN}------------------------------------------------${NC}"

# Create admin user
create_admin_user

# Start services in background
start_openpanel

echo -e "${GREEN}------------------------------------------------${NC}"
echo -e "${GREEN}✅ OpenPanel is now running!${NC}"
echo -e "${GREEN}------------------------------------------------${NC}"
echo -e "${CYAN}📋 Access Information:${NC}"
echo -e "${WHITE}   Web Interface: http://localhost:3000${NC}"
echo -e "${WHITE}   API Endpoint:  http://localhost:3001${NC}"
echo -e "${WHITE}   Traefik Panel: http://localhost:8080${NC}"
echo -e ""
echo -e "${CYAN}🔐 Default Admin Credentials:${NC}"
echo -e "${WHITE}   Email: admin@openpanel.dev${NC}"
echo -e "${WHITE}   Password: admin123${NC}"
echo -e ""
echo -e "${CYAN}📝 Next Steps:${NC}"
echo -e "${WHITE}   1. Open http://localhost:3000 in your browser${NC}"
echo -e "${WHITE}   2. Login with the admin credentials above${NC}"
echo -e "${WHITE}   3. Start managing your Docker containers!${NC}"
echo -e "${GREEN}------------------------------------------------${NC}"
