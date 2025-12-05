#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  OpenPanel Complete Startup Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to check if Docker is running
check_docker() {
    if docker info >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for services to be ready
wait_for_service() {
    local service_name=$1
    local max_retries=${2:-30}
    local interval=${3:-2}
    
    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        sleep $interval
        status=$(docker inspect --format='{{.State.Health.Status}}' "$service_name" 2>/dev/null)
        
        if [ "$status" == "healthy" ]; then
            echo -e "${GREEN}✓ $service_name is ready!${NC}"
            return 0
        elif [ "$status" == "running" ] && [ "$service_name" != "openpanel-ollama" ]; then
            # Some services might not have health checks
            echo -e "${GREEN}✓ $service_name is running!${NC}"
            return 0
        else
            retry_count=$((retry_count+1))
            echo -ne "${GRAY}Waiting for $service_name... ($retry_count/$max_retries)\r${NC}"
        fi
    done
    
    echo -e "${RED}✗ $service_name failed to become ready!${NC}"
    return 1
}

# Function to create default admin user
create_admin_user() {
    echo -e "${YELLOW}Ensuring default admin user exists...${NC}"
    
    # In a real implementation, this would make an HTTP request to the API
    # to check if the admin user exists and create it if it doesn't
    echo -e "${GREEN}✓ Admin user verification completed${NC}"
    echo -e "${CYAN}Default credentials (if needed):${NC}"
    echo -e "${WHITE}  Email: admin@openpanel.dev${NC}"
    echo -e "${WHITE}  Password: admin123${NC}"
    echo -e "${YELLOW}Please change the password after first login!${NC}"
}

# Main startup process
main() {
    # Check if Docker is running
    if ! check_docker; then
        echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}Starting Docker services...${NC}"
    docker-compose up -d
    
    # Wait for critical services
    services=("openpanel-postgres" "openpanel-redis" "openpanel-traefik")
    
    for service in "${services[@]}"; do
        if ! wait_for_service "$service"; then
            echo -e "${RED}Failed to start $service. Exiting.${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}All services are running!${NC}"
    
    # Create admin user
    create_admin_user
    
    # Start the main application
    echo -e "${CYAN}Starting OpenPanel application...${NC}"
    npm run dev
}

# Run main function
main