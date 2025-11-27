#!/usr/bin/env pwsh

# OpenPanel Setup Script for Windows PowerShell
Write-Host "========================================" -ForegroundColor Green
Write-Host "  OpenPanel Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Detect platform and set DOCKER_SOCK
Write-Host "Detecting platform..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$detectScript = Join-Path $scriptDir "detect-platform.ps1"
if (Test-Path $detectScript) {
    & $detectScript
} else {
    Write-Host "detect-platform.ps1 not found" -ForegroundColor Red
    exit 1
}

# Verify prerequisites
Write-Host "Verifying prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed ($nodeVersion)" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js and try again." -ForegroundColor Red
    exit 1
}

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker installed ($dockerVersion)" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found. Please install Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    $dockerInfo = docker info 2>$null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host ".env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ .env file created" -ForegroundColor Green
    } else {
        Write-Host "✗ .env.example not found!" -ForegroundColor Red
    }
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
try {
    npm install --silent
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Start Docker services
Write-Host "Starting Docker services..." -ForegroundColor Yellow
try {
    docker-compose up -d
    Write-Host "✓ Docker services started" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to start Docker services" -ForegroundColor Red
    exit 1
}

# Wait for critical services
Write-Host "Waiting for critical services to become healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$services = @("openpanel-postgres", "openpanel-redis", "openpanel-traefik")

foreach ($service in $services) {
    $retryCount = 0
    $maxRetries = 60
    $isReady = $false

    Write-Host "Waiting for $service..." -ForegroundColor Yellow

    while (-not $isReady -and $retryCount -lt $maxRetries) {
        try {
            $status = docker inspect --format='{{.State.Health.Status}}' $service 2>$null

            if ($status -eq 'healthy') {
                Write-Host "✓ $service is healthy!" -ForegroundColor Green
                $isReady = $true
            } else {
                $retryCount++
                Write-Host "Waiting for $service... ($retryCount/$maxRetries)" -ForegroundColor Gray
                Start-Sleep -Seconds 2
            }
        } catch {
            $retryCount++
            Start-Sleep -Seconds 2
        }
    }

    if (-not $isReady) {
        Write-Host "✗ Failed to start $service. Exiting." -ForegroundColor Red
        Write-Host "Try running: docker-compose logs $service" -ForegroundColor Yellow
        exit 1
    }
}

# Setup database
Write-Host "Setting up database..." -ForegroundColor Yellow
try {
    npm run db:generate
    npm run db:push
    Write-Host "✓ Database setup complete" -ForegroundColor Green
} catch {
    Write-Host "✗ Database setup failed" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Access information:" -ForegroundColor Cyan
Write-Host "   Web Interface: http://localhost:3000" -ForegroundColor White
Write-Host "   API Endpoint:  http://localhost:3001" -ForegroundColor White
Write-Host "   Traefik Panel: http://localhost:8080" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host "To start development: npm run dev" -ForegroundColor Cyan
