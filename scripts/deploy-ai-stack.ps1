Write-Host "Starting AI Stack Deployment..."

# Ensure Docker network exists
docker network create openpanel-network -ErrorAction SilentlyContinue

# Build and Start Services
Write-Host "Building and starting services..."
docker compose up -d --build mongo ai-service mcp-server

# Check Health
Write-Host "Waiting for services to be healthy..."
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
    if ($response.Content -match "ok") {
        Write-Host "AI Service is Healthy!" -ForegroundColor Green
    }
} catch {
    Write-Host "Warning: AI Service might not be ready yet." -ForegroundColor Yellow
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/health" -UseBasicParsing
    if ($response.Content -match "ok") {
        Write-Host "MCP Server is Healthy!" -ForegroundColor Green
    }
} catch {
    Write-Host "Warning: MCP Server might not be ready yet." -ForegroundColor Yellow
}

Write-Host "AI Stack Deployed Successfully."
Write-Host "MCP Server SSE Endpoint: http://localhost:3005/sse"
