#!/usr/bin/env pwsh

# Detect platform and configure environment variables
# This script detects the OS and sets the appropriate DOCKER_SOCK value

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$envFile = Join-Path $projectRoot ".env"

# Detect OS
$platform = "windows"
$dockerSock = "//./pipe/docker_engine"

Write-Host "Detected Platform: $platform" -ForegroundColor Green
Write-Host "Docker Socket: $dockerSock" -ForegroundColor Green

# Update .env file with DOCKER_SOCK value
if (Test-Path $envFile) {
    # Read the entire file
    $envContent = Get-Content $envFile -Raw

    # Check if DOCKER_SOCK is already in the file
    if ($envContent -match "^DOCKER_SOCK=") {
        # Replace existing value
        $envContent = $envContent -replace "^DOCKER_SOCK=.*$", "DOCKER_SOCK=$dockerSock"
        Write-Host "✓ Updated DOCKER_SOCK in .env" -ForegroundColor Green
    } else {
        # The variable should already exist, but just in case
        $envContent += "`nDOCKER_SOCK=$dockerSock"
        Write-Host "✓ Added DOCKER_SOCK to .env" -ForegroundColor Green
    }

    # Write back to file
    Set-Content -Path $envFile -Value $envContent -Encoding UTF8

} else {
    Write-Host "✗ .env file not found. Please create it from .env.example first." -ForegroundColor Red
    exit 1
}

Write-Host "Platform detection complete!" -ForegroundColor Green
