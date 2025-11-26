# Open-Panel Status Checker for Windows

# Colors for output
$green = [System.ConsoleColor]::Green
$yellow = [System.ConsoleColor]::Yellow
$red = [System.ConsoleColor]::Red
$cyan = [System.ConsoleColor]::Cyan
$white = [System.ConsoleColor]::White

Write-Host "------------------------------------------------" -ForegroundColor $green
Write-Host "OpenPanel Status Checker" -ForegroundColor $green
Write-Host "------------------------------------------------" -ForegroundColor $green

# Function to check if Docker is running
function Check-Docker {
    try {
        $dockerInfo = docker info 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Docker is running" -ForegroundColor $green
            return $true
        } else {
            Write-Host "✗ Docker is not running" -ForegroundColor $red
            return $false
        }
    } catch {
        Write-Host "✗ Docker is not installed or not running" -ForegroundColor $red
        return $false
    }
}

# Function to check Docker services status
function Check-DockerServices {
    Write-Host "`nChecking Docker services..." -ForegroundColor $cyan
    
    $services = @("openpanel-postgres", "openpanel-redis", "openpanel-ollama", "openpanel-traefik")
    
    foreach ($service in $services) {
        try {
            $status = docker inspect --format='{{.State.Status}}' $service 2>$null
            $health = docker inspect --format='{{.State.Health.Status}}' $service 2>$null
            
            if ($status -eq "running") {
                if ($health -and $health -ne "<no value>") {
                    if ($health -eq "healthy") {
                        Write-Host "✓ $service is running and healthy" -ForegroundColor $green
                    } else {
                        Write-Host "⚠ $service is running but $health" -ForegroundColor $yellow
                    }
                } else {
                    Write-Host "✓ $service is running" -ForegroundColor $green
                }
            } else {
                Write-Host "✗ $service is not running (Status: $status)" -ForegroundColor $red
            }
        } catch {
            Write-Host "✗ $service is not found or not running" -ForegroundColor $red
        }
    }
}

# Function to check API endpoints
function Check-APIEndpoints {
    Write-Host "`nChecking API endpoints..." -ForegroundColor $cyan
    
    $endpoints = @{
        "Health Check" = "http://localhost:3001/api/health"
        "Auth Endpoint" = "http://localhost:3001/api/auth/status"
    }
    
    foreach ($endpoint in $endpoints.Keys) {
        try {
            $response = Invoke-RestMethod -Uri $endpoints[$endpoint] -TimeoutSec 5
            Write-Host "✓ $endpoint is responding" -ForegroundColor $green
        } catch {
            Write-Host "⚠ $endpoint is not responding" -ForegroundColor $yellow
        }
    }
}

# Function to check web interface
function Check-WebInterface {
    Write-Host "`nChecking Web Interface..." -ForegroundColor $cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Web Interface is accessible" -ForegroundColor $green
        } else {
            Write-Host "⚠ Web Interface returned status $($response.StatusCode)" -ForegroundColor $yellow
        }
    } catch {
        Write-Host "✗ Web Interface is not accessible" -ForegroundColor $red
    }
}

# Main execution
if (Check-Docker) {
    Check-DockerServices
    Check-APIEndpoints
    Check-WebInterface
    
    Write-Host "`n------------------------------------------------" -ForegroundColor $green
    Write-Host "📋 Summary:" -ForegroundColor $cyan
    Write-Host "   Web Interface: http://localhost:3000" -ForegroundColor $white
    Write-Host "   API Endpoint:  http://localhost:3001" -ForegroundColor $white
    Write-Host "   Traefik Panel: http://localhost:8080" -ForegroundColor $white
    Write-Host "------------------------------------------------" -ForegroundColor $green
    Write-Host "🔐 Default Admin Credentials:" -ForegroundColor $cyan
    Write-Host "   Email: admin@openpanel.dev" -ForegroundColor $white
    Write-Host "   Password: admin123" -ForegroundColor $white
    Write-Host "   Please change the password after first login!" -ForegroundColor $yellow
    Write-Host "------------------------------------------------" -ForegroundColor $green
} else {
    Write-Host "`nPlease ensure Docker is installed and running." -ForegroundColor $yellow
    Write-Host "Then run this script again." -ForegroundColor $yellow
}