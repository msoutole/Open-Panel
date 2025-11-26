#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${GREEN}------------------------------------------------${NC}"
echo -e "${GREEN}OpenPanel Status Checker${NC}"
echo -e "${GREEN}------------------------------------------------${NC}"

# Function to check if Docker is running
check_docker() {
    if docker info >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Docker is not running${NC}"
        return 1
    fi
}

# Function to check Docker services status
check_docker_services() {
    echo -e "\n${CYAN}Checking Docker services...${NC}"
    
    services=("openpanel-postgres" "openpanel-redis" "openpanel-ollama" "openpanel-traefik")
    
    for service in "${services[@]}"; do
        if docker inspect "$service" >/dev/null 2>&1; then
            status=$(docker inspect --format='{{.State.Status}}' "$service" 2>/dev/null)
            health=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null)
            
            if [ "$status" == "running" ]; then
                if [ "$health" != "<no value>" ] && [ -n "$health" ]; then
                    if [ "$health" == "healthy" ]; then
                        echo -e "${GREEN}✓ $service is running and healthy${NC}"
                    else
                        echo -e "${YELLOW}⚠ $service is running but $health${NC}"
                    fi
                else
                    echo -e "${GREEN}✓ $service is running${NC}"
                fi
            else
                echo -e "${RED}✗ $service is not running (Status: $status)${NC}"
            fi
        else
            echo -e "${RED}✗ $service is not found or not running${NC}"
        fi
    done
}

# Function to check API endpoints
check_api_endpoints() {
    echo -e "\n${CYAN}Checking API endpoints...${NC}"
    
    declare -A endpoints
    endpoints["Health Check"]="http://localhost:3001/api/health"
    endpoints["Auth Endpoint"]="http://localhost:3001/api/auth/status"
    
    for endpoint in "${!endpoints[@]}"; do
        if command -v curl >/dev/null 2>&1; then
            response=$(curl -s -o /dev/null -w "%{http_code}" "${endpoints[$endpoint]}" 2>/dev/null)
            if [ "$response" == "200" ]; then
                echo -e "${GREEN}✓ $endpoint is responding${NC}"
            else
                echo -e "${YELLOW}⚠ $endpoint is not responding (Status: $response)${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ Cannot check $endpoint - curl not available${NC}"
        fi
    done
}

# Function to check web interface
check_web_interface() {
    echo -e "\n${CYAN}Checking Web Interface...${NC}"
    
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>/dev/null)
        if [ "$response" == "200" ]; then
            echo -e "${GREEN}✓ Web Interface is accessible${NC}"
        else
            echo -e "${YELLOW}⚠ Web Interface is not accessible (Status: $response)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Cannot check Web Interface - curl not available${NC}"
    fi
}

# Main execution
if check_docker; then
    check_docker_services
    check_api_endpoints
    check_web_interface
    
    echo -e "\n${GREEN}------------------------------------------------${NC}"
    echo -e "${CYAN}📋 Summary:${NC}"
    echo -e "${WHITE}   Web Interface: http://localhost:3000${NC}"
    echo -e "${WHITE}   API Endpoint:  http://localhost:3001${NC}"
    echo -e "${WHITE}   Traefik Panel: http://localhost:8080${NC}"
    echo -e "${GREEN}------------------------------------------------${NC}"
    echo -e "${CYAN}🔐 Default Admin Credentials:${NC}"
    echo -e "${WHITE}   Email: admin@openpanel.dev${NC}"
    echo -e "${WHITE}   Password: admin123${NC}"
    echo -e "${YELLOW}   Please change the password after first login!${NC}"
    echo -e "${GREEN}------------------------------------------------${NC}"
else
    echo -e "\n${YELLOW}Please ensure Docker is installed and running.${NC}"
    echo -e "${YELLOW}Then run this script again.${NC}"
fi