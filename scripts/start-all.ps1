# Script para iniciar todos os servios do OpenPanel no Windows

Write-Host "========================================" -ForegroundColor Green
Write-Host "  OpenPanel All Services Starter" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Function to check command existence
function Test-CommandExists {
    param ($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Stop'
    try {
        Get-Command $command | Out-Null
        return $true
    }
    catch {
        return $false
    }
    finally {
        $ErrorActionPreference = $oldPreference
    }
}

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
    $dockerInfo = docker info | Out-Null
    Write-Host "✓ Docker est em execuo" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker no est em execuo. Por favor, inicie o Docker e tente novamente." -ForegroundColor Red
    exit 1
}

# Verificar se Node.js est instalado
if (-not (Test-CommandExists node)) {
    Write-Host "✗ Node.js no encontrado. Por favor, instale o Node.js e tente novamente." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✓ Node.js encontrado ($(node -v))" -ForegroundColor Green
}

# Iniciar servios Docker
Write-Host "Iniciando servios Docker..." -ForegroundColor Yellow
docker-compose up -d

# Aguardar alguns segundos para os servios iniciarem
Write-Host "Aguardando inicializao dos servios Docker..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar status dos containers
Write-Host "Verificando status dos containers:" -ForegroundColor Cyan
$containers = @("openpanel-postgres", "openpanel-redis", "openpanel-traefik", "openpanel-ollama")

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
        # Container no encontrado - ignorar
    }
}

Write-Host ""
Write-Host "Servios Docker iniciados com sucesso!" -ForegroundColor Green
Write-Host "Aguardando inicializao da aplicao..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Agora iniciar os servios web e API
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Iniciando OpenPanel Web e API..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Iniciar o desenvolvimento (web e api)
npm run dev