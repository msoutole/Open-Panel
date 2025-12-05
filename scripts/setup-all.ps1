Write-Host "🚀 Starting OpenPanel One-Click Setup..." -ForegroundColor Cyan

# 1. Check Environment
Write-Host "1. Checking Environment..."
if (!(Test-Path .env)) {
    Write-Host "   Creating .env from .env.example..."
    Copy-Item .env.example .env
}

# 2. Build & Start All Services (Infrastructure + App + AI)
Write-Host "2. Building and Starting Docker Containers..."
docker compose up -d --build postgres redis traefik mongo api-prod web-prod ai-service mcp-server

# 3. Wait for Health Checks
Write-Host "3. Waiting for services to be healthy (this may take a minute)..."
$services = @(
    @{ Name="Traefik"; Url="http://localhost:8080/ping" },
    @{ Name="API"; Url="http://localhost:3001/api/health" }, # Mapped port
    @{ Name="Web"; Url="http://localhost:3002" }, # Mapped port
    @{ Name="AI Service"; Url="http://localhost:8000/health" },
    @{ Name="MCP Server"; Url="http://localhost:3005/health" }
)

foreach ($service in $services) {
    Write-Host "   Checking $($service.Name)..." -NoNewline
    $retries = 0
    $healthy = $false
    while ($retries -lt 12) {
        try {
            $response = Invoke-WebRequest -Uri $service.Url -UseBasicParsing -Method Head -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $healthy = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 5
            $retries++
        }
    }
    
    if ($healthy) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " Failed/Timeout" -ForegroundColor Red
    }
}

Write-Host "`n✅ OpenPanel is Ready!" -ForegroundColor Green
Write-Host "--------------------------------------------------"
Write-Host "📱 Web Interface:   http://openpanel.local (or localhost:3002)"
Write-Host "🔌 API Endpoint:    http://openpanel.local/api (or localhost:3001)"
Write-Host "🧠 AI Service:      http://ai.openpanel.local (or localhost:8000)"
Write-Host "🤖 MCP Server:      http://mcp.openpanel.local (or localhost:3005)"
Write-Host "   -> SSE URL:      http://mcp.openpanel.local/sse"
Write-Host "--------------------------------------------------"
Write-Host "To stop: docker compose down"
