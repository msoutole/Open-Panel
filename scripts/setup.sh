#!/bin/bash

# OpenPanel Setup Script for Linux/macOS/WSL
# This script sets up the OpenPanel development environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}  $1${NC}"
    echo -e "${GREEN}======================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}$1${NC}"
}

print_header "OpenPanel Setup"

# Detect platform and set DOCKER_SOCK
print_info "Detecting platform..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/detect-platform.sh" ]; then
    bash "$SCRIPT_DIR/detect-platform.sh"
else
    print_error "detect-platform.sh not found"
    exit 1
fi

# Check prerequisites
print_info "Verifying prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed ($NODE_VERSION)"
else
    print_error "Node.js not found. Please install Node.js and try again."
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker installed ($DOCKER_VERSION)"
else
    print_error "Docker not found. Please install Docker and try again."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Check docker-compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(docker-compose --version)
    print_success "docker-compose installed ($DOCKER_COMPOSE_VERSION)"
else
    print_error "docker-compose not found. Please install docker-compose and try again."
    exit 1
fi

# Check .env file
if [ ! -f ".env" ]; then
    print_info ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success ".env file created"
    else
        print_error ".env.example not found!"
        exit 1
    fi
else
    print_success ".env file already exists"
fi

# Install dependencies
print_info "Installing dependencies..."
if npm install --silent; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Start Docker services
print_info "Starting Docker services..."
if docker-compose up -d; then
    print_success "Docker services started"
else
    print_error "Failed to start Docker services"
    exit 1
fi

# Wait for critical services to be healthy
print_info "Waiting for critical services to become healthy..."
sleep 5

SERVICES=("openpanel-postgres" "openpanel-redis" "openpanel-traefik")
RETRY_COUNT=0
MAX_RETRIES=60

for SERVICE in "${SERVICES[@]}"; do
    RETRY_COUNT=0
    IS_READY=false

    print_info "Waiting for $SERVICE..."

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$SERVICE" 2>/dev/null || echo "")

        if [ "$STATUS" == "healthy" ]; then
            print_success "$SERVICE is healthy!"
            IS_READY=true
            break
        fi

        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -ne "Waiting for $SERVICE... ($RETRY_COUNT/$MAX_RETRIES)\r"
        sleep 2
    done

    if [ "$IS_READY" = false ]; then
        print_error "Failed to start $SERVICE. Exiting."
        echo "Try running: docker-compose logs $SERVICE"
        exit 1
    fi
done

# Setup database
print_info "Setting up database..."
if npm run db:generate && npm run db:push; then
    print_success "Database setup complete"
else
    print_error "Database setup failed"
    exit 1
fi

# Print completion message
print_header "Setup Complete!"
echo -e "${CYAN}Access information:${NC}"
echo -e "${CYAN}   Web Interface: http://localhost:3000${NC}"
echo -e "${CYAN}   API Endpoint:  http://localhost:3001${NC}"
echo -e "${CYAN}   Traefik Panel: http://localhost:8080${NC}"
echo -e "${GREEN}======================================${NC}"
echo -e "${CYAN}To start development: npm run dev${NC}"
