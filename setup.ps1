# Open-Panel Setup Script for Windows

Write-Host "Starting Open-Panel Setup..." -ForegroundColor Green

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

# 1. Check & Install Node.js
if (Test-CommandExists node) {
    Write-Host "✓ Node.js is installed ($(node -v))" -ForegroundColor Green
}
else {
    Write-Host "Node.js not found. Attempting to install via winget..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Node.js. Please install it manually." -ForegroundColor Red
        exit 1
    }
    # Refresh env vars
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

# 2. Check & Install Docker
if (Test-CommandExists docker) {
    Write-Host "✓ Docker is installed" -ForegroundColor Green
}
else {
    Write-Host "Docker not found. Attempting to install Docker Desktop via winget..." -ForegroundColor Yellow
    winget install Docker.DockerDesktop
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Docker. Please install it manually." -ForegroundColor Red
        exit 1
    }
    Write-Host "Docker installed. Please restart your computer or log out/in to complete the installation." -ForegroundColor Yellow
    exit 0
}

# Ensure Docker is running
try {
    docker info | Out-Null
}
catch {
    Write-Host "Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# 3. Setup Environment Variables
if (-not (Test-Path .env)) {
    Write-Host ".env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example -Destination .env
    Write-Host "✓ .env created" -ForegroundColor Green
}
else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}

# 4. Install Dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# 5. Start Docker Services
Write-Host "Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for Postgres to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
$maxRetries = 30
$retryCount = 0
$healthy = $false

while (-not $healthy -and $retryCount -lt $maxRetries) {
    Start-Sleep -Seconds 2
    $status = docker inspect --format='{{.State.Health.Status}}' openpanel-postgres 2>$null
    if ($status -eq "healthy") {
        $healthy = $true
        Write-Host "Database is ready!" -ForegroundColor Green
    }
    else {
        $retryCount++
        Write-Host "Waiting for database... ($retryCount/$maxRetries)" -NoNewline -ForegroundColor DarkGray
        Write-Host "`r" -NoNewline
    }
}

if (-not $healthy) {
    Write-Host "`nDatabase failed to become ready. Please check logs: docker logs openpanel-postgres" -ForegroundColor Red
    exit 1
}

# 6. Database Setup
Write-Host "Setting up database..." -ForegroundColor Yellow
npm run db:generate
npm run db:push

Write-Host "------------------------------------------------" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "You can now start the application with:" -ForegroundColor Green
Write-Host "npm run dev" -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Green
