#!/usr/bin/env pwsh

# OpenPanel Setup Verification Script for Windows
# Verifica se tudo está configurado corretamente

$Passed = 0
$Failed = 0

function Print-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  $Title" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
}

function Check-Command {
    param(
        [string]$Name,
        [string]$Command
    )

    try {
        $result = Invoke-Expression $Command -ErrorAction SilentlyContinue
        Write-Host "✓ $Name" -ForegroundColor Green
        $script:Passed++
    } catch {
        Write-Host "✗ $Name" -ForegroundColor Red
        $script:Failed++
    }
}

function Check-HttpStatus {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedCode
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -ErrorAction SilentlyContinue
        $status = $response.StatusCode
    } catch {
        $status = 0
    }

    if ($status -eq $ExpectedCode -or $status -eq 0) {
        Write-Host "✓ $Name (HTTP $status)" -ForegroundColor Green
        $script:Passed++
    } else {
        Write-Host "✗ $Name (HTTP $status, expected $ExpectedCode)" -ForegroundColor Red
        $script:Failed++
    }
}

Print-Header "OpenPanel Setup Verification"

# Check prerequisites
Write-Host "Checking prerequisites..."
Check-Command "Node.js" "node --version"
Check-Command "npm" "npm --version"
Check-Command "Docker" "docker --version"
Check-Command "docker-compose" "docker-compose --version"

# Check Docker running
Write-Host ""
Write-Host "Checking Docker status..."
Check-Command "Docker daemon" "docker info"

# Check environment files
Write-Host ""
Write-Host "Checking configuration files..."
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    $script:Passed++
} else {
    Write-Host "✗ .env file exists" -ForegroundColor Red
    $script:Failed++
}

if (Test-Path ".env.example") {
    Write-Host "✓ .env.example exists" -ForegroundColor Green
    $script:Passed++
} else {
    Write-Host "✗ .env.example exists" -ForegroundColor Red
    $script:Failed++
}

# Check containers
Write-Host ""
Write-Host "Checking containers..."

$containers = @("openpanel-postgres", "openpanel-redis", "openpanel-api", "openpanel-web")

foreach ($container in $containers) {
    try {
        $status = docker inspect --format='{{.State.Status}}' $container 2>$null
        if ($status -eq "running") {
            Write-Host "✓ $container running" -ForegroundColor Green
            $script:Passed++
        } else {
            Write-Host "✗ $container not running (status: $status)" -ForegroundColor Red
            $script:Failed++
        }
    } catch {
        Write-Host "✗ $container not running" -ForegroundColor Red
        $script:Failed++
    }
}

# Check container health
Write-Host ""
Write-Host "Checking container health..."

try {
    $pgHealth = docker inspect --format='{{.State.Health.Status}}' openpanel-postgres 2>$null
    if ($pgHealth -eq "healthy") {
        Write-Host "✓ PostgreSQL healthy" -ForegroundColor Green
        $script:Passed++
    } else {
        Write-Host "✗ PostgreSQL not healthy (status: $pgHealth)" -ForegroundColor Red
        $script:Failed++
    }
} catch {
    Write-Host "✗ PostgreSQL health check failed" -ForegroundColor Red
    $script:Failed++
}

try {
    $redisHealth = docker inspect --format='{{.State.Health.Status}}' openpanel-redis 2>$null
    if ($redisHealth -eq "healthy") {
        Write-Host "✓ Redis healthy" -ForegroundColor Green
        $script:Passed++
    } else {
        Write-Host "✗ Redis not healthy (status: $redisHealth)" -ForegroundColor Red
        $script:Failed++
    }
} catch {
    Write-Host "✗ Redis health check failed" -ForegroundColor Red
    $script:Failed++
}

# Check API connectivity
Write-Host ""
Write-Host "Checking API connectivity..."
Check-HttpStatus "API Health Check" "http://localhost:3001/api/health" 401

# Check Web connectivity
Write-Host ""
Write-Host "Checking Web connectivity..."
Check-HttpStatus "Web Server" "http://localhost:3000" 200

# Summary
Print-Header "Verification Summary"
Write-Host "Passed: $Passed" -ForegroundColor Green
Write-Host "Failed: $Failed" -ForegroundColor Red

if ($Failed -eq 0) {
    Write-Host ""
    Write-Host "✅ All checks passed! Your setup is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: npm run dev"
    Write-Host "2. Open http://localhost:3000"
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ Some checks failed. Please review the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Debugging tips:" -ForegroundColor Cyan
    Write-Host "1. Check Docker is running: docker ps"
    Write-Host "2. View container logs: docker-compose logs"
    Write-Host "3. Restart containers: docker-compose down && docker-compose up -d"
    exit 1
}