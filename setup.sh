#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Open-Panel Setup...${NC}"

# Function to check command existence
command_exists() {
    command -v "$1" >/dev/null 2>&1
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

echo -e "${GREEN}------------------------------------------------${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}You can now start the application with:${NC}"
echo -e "${YELLOW}npm run dev${NC}"
echo -e "${GREEN}------------------------------------------------${NC}"
