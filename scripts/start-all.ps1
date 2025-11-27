# Script para iniciar todos os servios do OpenPanel no Windows

Write-Host "========================================" -ForegroundColor Green
Write-Host "  OpenPanel All Services Starter" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Verificar se o Docker est instalado e em execuo
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker no encontrado. Por favor, instale o Docker e tente novamente." -ForegroundColor Red
    exit 1
}

# Verificar se o Docker est em execuo
try {
    $dockerInfo = docker info
    Write-Host "✓ Docker est em execuo" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker no est em execuo. Por favor, inicie o Docker e tente novamente." -ForegroundColor Red
    exit 1
}

# Iniciar servios Docker
Write-Host "Iniciando servios Docker..." -ForegroundColor Yellow
docker-compose up -d

# Aguardar alguns segundos para os servios iniciarem
Write-Host "Aguardando inicializao dos servios..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar status dos containers
Write-Host "Verificando status dos containers:" -ForegroundColor Cyan
$containers = @("openpanel-postgres", "openpanel-redis", "openpanel-traefik")

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

Write-Host ""
Write-Host "Servios iniciados com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "📋 Informaes de acesso:" -ForegroundColor Cyan
Write-Host "   Interface Web: http://localhost:3000" -ForegroundColor White
Write-Host "   Endpoint API:  http://localhost:3001" -ForegroundColor White
Write-Host "   Painel Traefik: http://localhost:8080" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host "Pressione Ctrl+C para parar todos os servios" -ForegroundColor Yellow

# Manter o script em execuo
while ($true) {
    Start-Sleep -Seconds 1
}