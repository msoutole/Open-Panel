#!/usr/bin/env pwsh

# OpenPanel setup script for Windows (PowerShell Core / Windows PowerShell)
Write-Host "========================================"
Write-Host "  OpenPanel Setup"
Write-Host "========================================"

Write-Host "Checking prerequisites..."

function ExitWithMessage($msg) {
    Write-Host $msg -ForegroundColor Red
    exit 1
}

# Node.js check
try {
    $nodeVersion = node --version
    Write-Host "Node.js installed: $nodeVersion"
} catch {
    ExitWithMessage "Node.js not found. Please install Node.js and try again."
}

# Docker check
try {
    $dockerVersion = docker --version
    Write-Host "Docker installed: $dockerVersion"
} catch {
    ExitWithMessage "Docker not found. Please install Docker and try again."
}

# Docker running
try {
    $dockerInfo = docker info 2>$null
    Write-Host "Docker is running."
} catch {
    ExitWithMessage "Docker is not running. Please start Docker and try again."
}

# Ensure .env exists
if (-not (Test-Path -Path ".env")) {
    Write-Host ".env file not found. Creating from .env.example..."
    if (Test-Path -Path ".env.example") {
        Copy-Item -Path ".env.example" -Destination ".env"
        Write-Host ".env created." -ForegroundColor Green
    } else {
        Write-Host "Warning: .env.example not found; a .env file was not created." -ForegroundColor Yellow
    }
} else {
    Write-Host ".env already exists." -ForegroundColor Green
}

# Install dependencies
Write-Host "Installing dependencies..."
try {
    npm install --silent
    Write-Host "Dependencies installed." -ForegroundColor Green
} catch {
    ExitWithMessage "Failed to run npm install." 
}

# Start Docker services
Write-Host "Starting Docker services..."
try {
    docker-compose up -d
    Write-Host "Docker services started (detached)." -ForegroundColor Green
} catch {
    ExitWithMessage "Failed to start Docker services with docker-compose up -d."
}

# Wait for services to become healthy
Write-Host "Waiting for critical containers to become healthy..."
$services = @("openpanel-postgres", "openpanel-redis", "openpanel-traefik")
foreach ($svc in $services) {
    $retry = 0
    $maxRetries = 60
    $healthy = $false
    while (-not $healthy -and $retry -lt $maxRetries) {
        try {
            $health = docker inspect --format='{{.State.Health.Status}}' $svc 2>$null
        } catch {
            $health = $null
        }
        if ($health -eq 'healthy') {
            Write-Host "$svc is healthy." -ForegroundColor Green
            $healthy = $true
            break
        }
        Start-Sleep -Seconds 2
        $retry++
        Write-Host "Waiting $svc... ($retry/$maxRetries)" -ForegroundColor Yellow
    }
    if (-not $healthy) {
        ExitWithMessage "Container $svc did not become healthy in time."
    }
}

# Run database tasks
Write-Host "Setting up the database (Prisma)..."
try {
    npm run db:generate
    npm run db:push
    Write-Host "Database ready." -ForegroundColor Green
} catch {
    ExitWithMessage "Database setup failed. Check Prisma and database connectivity."
}

Write-Host "========================================"
Write-Host "Setup complete!"
Write-Host "========================================"
Write-Host "Web Interface: http://localhost:3000"
Write-Host "API Endpoint:  http://localhost:3001"
Write-Host "Traefik:        http://localhost:8080"
Write-Host "========================================"

Write-Host "If you need to start dev servers, run: npm run dev" -ForegroundColor Cyan
#!/usr/bin/env pwsh

# OpenPanel setup script for Windows (PowerShell Core / PowerShell)
Write-Host "========================================"
Write-Host "  OpenPanel Setup"
Write-Host "========================================"

Write-Host "Checking prerequisites..."

function ExitWithMessage($msg) {
    Write-Host $msg -ForegroundColor Red
    exit 1
}

# Node.js check
try {
    $nodeVersion = node --version
    Write-Host "Node.js installed: $nodeVersion"
} catch {
    ExitWithMessage "Node.js not found. Please install Node.js and try again."
}

# Docker check
try {
    $dockerVersion = docker --version
    Write-Host "Docker installed: $dockerVersion"
} catch {
    ExitWithMessage "Docker not found. Please install Docker and try again."
}

# Docker running
try {
    $dockerInfo = docker info 2>$null
    Write-Host "Docker is running."
} catch {
    ExitWithMessage "Docker is not running. Please start Docker and try again."
}

# Ensure .env exists
if (-not (Test-Path -Path ".env")) {
    Write-Host ".env file not found. Creating from .env.example..."
    if (Test-Path -Path ".env.example") {
        Copy-Item -Path ".env.example" -Destination ".env"
        Write-Host ".env created." -ForegroundColor Green
    } else {
        Write-Host "Warning: .env.example not found; a .env file was not created." -ForegroundColor Yellow
    }
} else {
    Write-Host ".env already exists." -ForegroundColor Green
}

# Install dependencies
Write-Host "Installing dependencies..."
try {
    npm install --silent
    Write-Host "Dependencies installed." -ForegroundColor Green
} catch {
    ExitWithMessage "Failed to run npm install." 
}

# Start Docker services
Write-Host "Starting Docker services..."
try {
    docker-compose up -d
    Write-Host "Docker services started (detached)." -ForegroundColor Green
} catch {
    ExitWithMessage "Failed to start Docker services with docker-compose up -d."
}

# Wait for services to become healthy
Write-Host "Waiting for critical containers to become healthy..."
$services = @("openpanel-postgres", "openpanel-redis", "openpanel-traefik")
foreach ($svc in $services) {
    $retry = 0
    $maxRetries = 60
    $healthy = $false
    while (-not $healthy -and $retry -lt $maxRetries) {
        try {
            $health = docker inspect --format='{{.State.Health.Status}}' $svc 2>$null
        } catch {
            $health = $null
        }
        if ($health -eq 'healthy') {
            Write-Host "$svc is healthy." -ForegroundColor Green
            $healthy = $true
            break
        }
        Start-Sleep -Seconds 2
        $retry++
        Write-Host "Waiting $svc... ($retry/$maxRetries)" -ForegroundColor Yellow
    }
    if (-not $healthy) {
        ExitWithMessage "Container $svc did not become healthy in time."
    }
}

# Run database tasks
Write-Host "Setting up the database (Prisma)..."
try {
    npm run db:generate
    npm run db:push
    Write-Host "Database ready." -ForegroundColor Green
} catch {
    ExitWithMessage "Database setup failed. Check Prisma and database connectivity."
}

Write-Host "========================================"
Write-Host "Setup complete!"
Write-Host "========================================"
Write-Host "Web Interface: http://localhost:3000"
Write-Host "API Endpoint:  http://localhost:3001"
Write-Host "Traefik:        http://localhost:8080"
Write-Host "========================================"

Write-Host "If you need to start dev servers, run: npm run dev" -ForegroundColor Cyan
# Script de setup do OpenPanel para Windows

Write-Host "========================================" -ForegroundColor Green
Write-Host "  OpenPanel Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Verificar prerequisitos
Write-Host "Verificando prerequisitos..." -ForegroundColor Yellow

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js instalado ($nodeVersion)" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js no encontrado. Por favor, instale o Node.js e tente novamente." -ForegroundColor Red
    exit 1
}

# Verificar Docker
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker instalado ($dockerVersion)" -ForegroundColor Green
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

# Verificar arquivo .env
if (-not (Test-Path ".env")) {
    Write-Host ".env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ .env criado" -ForegroundColor Green
    } else {
        Write-Host "✗ .env.example no encontrado!" -ForegroundColor Red
    }
} else {
    Write-Host "✓ Arquivo .env j existe" -ForegroundColor Green
}

# Instalar dependncias
Write-Host "Instalando dependncias..." -ForegroundColor Yellow
npm install

# Iniciar servios Docker
Write-Host "Iniciando servios Docker..." -ForegroundColor Yellow
docker-compose up -d

# Aguardar servios crticos
Write-Host "Aguardando servios crticos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar status dos containers
$services = @("openpanel-postgres", "openpanel-redis", "openpanel-traefik")

foreach ($service in $services) {
    $retryCount = 0
    $maxRetries = 30
    $isReady = $false
    
    Write-Host "Aguardando $service ficar pronto..." -ForegroundColor Yellow
    
    while (-not $isReady -and $retryCount -lt $maxRetries) {
        try {
            $status = docker inspect --format='{{.State.Health.Status}}' $service 2>$null
            
            if ($status -eq 'healthy') {
                Write-Host "✓ $service est pronto!" -ForegroundColor Green
                $isReady = $true
            } else {
                $retryCount++
                Write-Host "Aguardando $service... ($retryCount/$maxRetries)" -ForegroundColor Gray
                Start-Sleep -Seconds 2
            }
        } catch {
            $retryCount++
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $isReady) {
        Write-Host "✗ Falha ao iniciar $service. Saindo." -ForegroundColor Red
        exit 1
    }
}

# Configurao do banco de dados
Write-Host "Configurando banco de dados..." -ForegroundColor Yellow
npm run db:generate
npm run db:push

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Setup Completo!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "📋 Informaes de acesso:" -ForegroundColor Cyan
Write-Host "   Interface Web: http://localhost:3000" -ForegroundColor White
Write-Host "   Endpoint API:  http://localhost:3001" -ForegroundColor White
Write-Host "   Painel Traefik: http://localhost:8080" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green