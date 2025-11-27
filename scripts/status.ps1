# Script para verificar o status dos servios do OpenPanel no Windows

Write-Host "========================================" -ForegroundColor Green
Write-Host "  OpenPanel Status Checker" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Verificar se o Docker est instalado e em execuo
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker encontrado: $dockerVersion" -ForegroundColor Green
    
    $dockerInfo = docker info
    Write-Host "✓ Docker est em execuo" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker no encontrado ou no est em execuo" -ForegroundColor Red
    exit 1
}

# Verificar status dos containers Docker
Write-Host ""
Write-Host "Verificando servios Docker:" -ForegroundColor Cyan

$containers = @("openpanel-postgres", "openpanel-redis", "openpanel-ollama", "openpanel-traefik")

foreach ($container in $containers) {
    try {
        $status = docker inspect --format='{{.State.Status}}' $container 2>$null
        $health = docker inspect --format='{{.State.Health.Status}}' $container 2>$null
        
        if ($status -eq "running") {
            if ($health -and $health -ne "<no value>") {
                if ($health -eq "healthy") {
                    Write-Host "✓ $container est rodando e saudvel" -ForegroundColor Green
                } else {
                    Write-Host "⚠ $container est rodando mas com status: $health" -ForegroundColor Yellow
                }
            } else {
                Write-Host "✓ $container est rodando" -ForegroundColor Green
            }
        } else {
            Write-Host "✗ $container no est rodando (Status: $status)" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ $container no encontrado ou no est rodando" -ForegroundColor Red
    }
}

# Verificar se as portas esto sendo escutadas
Write-Host ""
Write-Host "Verificando portas:" -ForegroundColor Cyan

$ports = @{
    3000 = "Interface Web"
    3001 = "API Server"
    8080 = "Traefik Dashboard"
}

foreach ($port in $ports.Keys) {
    $serviceName = $ports[$port]
    try {
        # Verificar se a porta est sendo escutada
        $portCheck = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
        if ($portCheck.State -eq "Listen") {
            Write-Host "✓ $serviceName est escutando na porta $port" -ForegroundColor Green
        } else {
            Write-Host "⚠ $serviceName est conectado mas no escutando na porta $port" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ $serviceName no est escutando na porta $port" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "📋 Resumo:" -ForegroundColor Cyan
Write-Host "   Interface Web: http://localhost:3000" -ForegroundColor White
Write-Host "   Endpoint API:  http://localhost:3001" -ForegroundColor White
Write-Host "   Painel Traefik: http://localhost:8080" -ForegroundColor White
Write-Host "   Admin padro: admin@openpanel.dev / admin123" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green