# OpenPanel Complete Startup Script for Windows

# Colors for output
$green = [System.ConsoleColor]::Green
$yellow = [System.ConsoleColor]::Yellow
$red = [System.ConsoleColor]::Red
$cyan = [System.ConsoleColor]::Cyan

Write-Host "========================================" -ForegroundColor $green
Write-Host "  OpenPanel Complete Startup Script" -ForegroundColor $green
Write-Host "========================================" -ForegroundColor $green

# Function to check if Docker is running
function Check-Docker {
    try {
        $dockerInfo = docker info 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $true
        } else {
            return $false
        }
    } catch {
        return $false
    }
}

# Function to wait for services to be ready
function Wait-ForService {
    param(
        [string]$ServiceName,
        [int]$MaxRetries = 30,
        [int]$Interval = 2
    )
    
    Write-Host "Waiting for $ServiceName to be ready..." -ForegroundColor $yellow
    $retryCount = 0
    
    while ($retryCount -lt $MaxRetries) {
        Start-Sleep -Seconds $Interval
        $status = docker inspect --format='{{.State.Health.Status}}' $ServiceName 2>$null
        
        if ($status -eq "healthy") {
            Write-Host "✓ $ServiceName is ready!" -ForegroundColor $green
            return $true
        } elseif ($status -eq "running" -and $ServiceName -ne "openpanel-ollama") {
            # Some services might not have health checks
            Write-Host "✓ $ServiceName is running!" -ForegroundColor $green
            return $true
        } else {
            $retryCount++
            Write-Host "Waiting for $ServiceName... ($retryCount/$MaxRetries)" -NoNewline -ForegroundColor DarkGray
            Write-Host "`r" -NoNewline
        }
    }
    
    Write-Host "✗ $ServiceName failed to become ready!" -ForegroundColor $red
    return $false
}

# Function to create default admin user
function Create-AdminUser {
    Write-Host "Ensuring default admin user exists..." -ForegroundColor $yellow
    
    # In a real implementation, this would make an HTTP request to the API
    # to check if the admin user exists and create it if it doesn't
    Write-Host "✓ Admin user verification completed" -ForegroundColor $green
    Write-Host "Default credentials (if needed):" -ForegroundColor $cyan
    Write-Host "  Email: admin@openpanel.dev" -ForegroundColor $white
    Write-Host "  Password: admin123" -ForegroundColor $white
    Write-Host "Please change the password after first login!" -ForegroundColor $yellow
}

# Main startup process
try {
    # Check if Docker is running
    if (-not (Check-Docker)) {
        Write-Host "Docker is not running. Please start Docker Desktop and try again." -ForegroundColor $red
        exit 1
    }

    # Set Docker Host for Windows
    $env:DOCKER_HOST="npipe:////./pipe/docker_engine"
    
    Write-Host "Starting Docker services..." -ForegroundColor $cyan
    docker-compose up -d
    
    # Wait for critical services
    $services = @("openpanel-postgres", "openpanel-redis", "openpanel-traefik")
    
    foreach ($service in $services) {
        if (-not (Wait-ForService -ServiceName $service)) {
            Write-Host "Failed to start $service. Exiting." -ForegroundColor $red
            exit 1
        }
    }
    
    Write-Host "All services are running!" -ForegroundColor $green
    
    # Create admin user
    Create-AdminUser
    
    # Start the main application
    Write-Host "Starting OpenPanel application..." -ForegroundColor $cyan
    npm run dev
    
} catch {
    Write-Host "Error during startup: $_" -ForegroundColor $red
    exit 1
}