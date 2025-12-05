#!/bin/bash

# Deploy AI Stack (Mongo, AI Service, MCP Server)

echo "Starting AI Stack Deployment..."

# Ensure Docker network exists
docker network create openpanel-network 2>/dev/null || true

# Build and Start Services
echo "Building and starting services..."
docker compose up -d --build mongo ai-service mcp-server

# Check Health
echo "Waiting for services to be healthy..."
sleep 10

if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo "AI Service is Healthy!"
else
    echo "Warning: AI Service might not be ready yet."
fi

if curl -s http://localhost:3005/health | grep -q "ok"; then
    echo "MCP Server is Healthy!"
else
    echo "Warning: MCP Server might not be ready yet."
fi

echo "AI Stack Deployed Successfully."
echo "MCP Server SSE Endpoint: http://localhost:3005/sse"
