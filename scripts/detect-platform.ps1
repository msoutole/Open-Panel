#!/usr/bin/env pwsh

# Detect platform and configure environment variables
# This script detects the OS and sets the appropriate DOCKER_SOCK value

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$envFile = Join-Path $projectRoot ".env"

# Detect OS
$platform = "windows"
$dockerSock = "//./pipe/docker_engine"
$dockerSockTarget = "/var/run/docker.sock"

Write-Host "Detected Platform: $platform" -ForegroundColor Green
Write-Host "Docker Socket (Host): $dockerSock" -ForegroundColor Green
Write-Host "Docker Socket (Target): $dockerSockTarget" -ForegroundColor Green

# Update .env file with DOCKER_SOCK values
if (Test-Path $envFile) {
    # Read lines from file
    $envLines = @(Get-Content $envFile)
    $foundSock = $false
    $foundTarget = $false

    # Find and replace DOCKER_SOCK and DOCKER_SOCK_TARGET lines
    for ($i = 0; $i -lt $envLines.Count; $i++) {
        if ($envLines[$i] -match "^DOCKER_SOCK=" -and $envLines[$i] -notmatch "DOCKER_SOCK_TARGET") {
            $envLines[$i] = "DOCKER_SOCK=$dockerSock"
            $foundSock = $true
        }
        elseif ($envLines[$i] -match "^DOCKER_SOCK_TARGET=") {
            $envLines[$i] = "DOCKER_SOCK_TARGET=$dockerSockTarget"
            $foundTarget = $true
        }
    }

    # If not found, append them
    if (-not $foundSock) {
        $envLines += "DOCKER_SOCK=$dockerSock"
    }
    if (-not $foundTarget) {
        $envLines += "DOCKER_SOCK_TARGET=$dockerSockTarget"
    }

    # Write back to file
    Set-Content -Path $envFile -Value $envLines -Encoding UTF8
    Write-Host "✓ Updated Docker socket configuration in .env" -ForegroundColor Green

} else {
    Write-Host "✗ .env file not found. Please create it from .env.example first." -ForegroundColor Red
    exit 1
}

Write-Host "Platform detection complete!" -ForegroundColor Green
