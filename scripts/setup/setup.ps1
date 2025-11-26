# Open-Panel Setup Script for Windows

# Set Docker Host for Windows
$env:DOCKER_HOST="npipe:////./pipe/docker_engine"

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

# Function to create default admin user
function Create-AdminUser {
    Write-Host "Creating default admin user..." -ForegroundColor Yellow
    try {
        # Try to create admin user via API
        $adminData = @{
            name = "Admin User"
            email = "admin@openpanel.dev"
            password = "admin123"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method POST -Body $adminData -ContentType "application/json" -TimeoutSec 10
        Write-Host "✓ Admin user created successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠ Admin user may already exist or API is not ready yet" -ForegroundColor Yellow
    }
}

# Function to start all services
function Start-OpenPanel {
    Write-Host "Starting OpenPanel services..." -ForegroundColor Yellow
    npm run dev
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

# 7. Start all services
Write-Host "------------------------------------------------" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "Starting all OpenPanel services..." -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Green

# Create admin user
Create-AdminUser

# Start services in background
Write-Host "Starting services in background..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "npm run dev" -WindowStyle Hidden

Write-Host "------------------------------------------------" -ForegroundColor Green
Write-Host "✅ OpenPanel is now running!" -ForegroundColor Green
Write-Host "------------------------------------------------" -ForegroundColor Green
Write-Host "📋 Access Information:" -ForegroundColor Cyan
Write-Host "   Web Interface: http://localhost:3000" -ForegroundColor White
Write-Host "   API Endpoint:  http://localhost:3001" -ForegroundColor White
Write-Host "   Traefik Panel: http://localhost:8080" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🔐 Default Admin Credentials:" -ForegroundColor Cyan
Write-Host "   Email: admin@openpanel.dev" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "   2. Login with the admin credentials above" -ForegroundColor White
Write-Host "   3. Start managing your Docker containers!" -ForegroundColor White
Write-Host "------------------------------------------------" -ForegroundColor Green
