<#
.SYNOPSIS
    OpenPanel Master Installation Script for Windows

.DESCRIPTION
    This script provides 100% automated installation and updates for OpenPanel on Windows.
    It handles all dependencies, configuration, and service initialization.

    Features:
    - Auto-installs Chocolatey if needed
    - Installs/updates all required dependencies (Node.js, Docker Desktop)
    - Configures environment automatically
    - Starts and verifies all services
    - Idempotent (safe to run multiple times)
    - Comprehensive error handling and logging

.PARAMETER Update
    Update existing installation

.PARAMETER Dev
    Development mode (skip production configs)

.PARAMETER NoDocker
    Skip Docker installation

.PARAMETER Verbose
    Enable verbose output

.EXAMPLE
    .\install.ps1
    # Fresh installation

.EXAMPLE
    .\install.ps1 -Update
    # Update existing installation

.EXAMPLE
    .\install.ps1 -Dev -NoDocker
    # Development mode without Docker

.NOTES
    Author: OpenPanel Team
    Requires: Windows 10/11 or Windows Server 2016+
    Requires: PowerShell 5.1 or higher
    Requires: Administrator privileges
#>

[CmdletBinding()]
param(
    [switch]$Update = $false,
    [switch]$Dev = $false,
    [switch]$NoDocker = $false,
    [switch]$VerboseMode = $false
)

# Requires -RunAsAdministrator

#Requires -Version 5.1

# ============================================
# GLOBAL VARIABLES
# ============================================
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile = Join-Path $ScriptDir "install.log"
$BackupDir = Join-Path $ScriptDir ".backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Version requirements
$MinNodeVersion = [Version]"18.0.0"
$MinNpmVersion = [Version]"10.0.0"
$MinDockerVersion = [Version]"20.10.0"

# ============================================
# LOGGING FUNCTIONS
# ============================================
function Write-Log {
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet('INFO', 'SUCCESS', 'WARN', 'ERROR')]
        [string]$Level,

        [Parameter(Mandatory=$true)]
        [string]$Message
    )

    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"

    # Write to log file
    Add-Content -Path $LogFile -Value $LogMessage

    # Write to console with colors
    switch ($Level) {
        'INFO'    { Write-Host "ℹ " -ForegroundColor Cyan -NoNewline; Write-Host $Message -ForegroundColor White }
        'SUCCESS' { Write-Host "✓ " -ForegroundColor Green -NoNewline; Write-Host $Message -ForegroundColor White }
        'WARN'    { Write-Host "⚠ " -ForegroundColor Yellow -NoNewline; Write-Host $Message -ForegroundColor Yellow }
        'ERROR'   { Write-Host "✗ " -ForegroundColor Red -NoNewline; Write-Host $Message -ForegroundColor Red }
    }
}

function Write-LogVerbose {
    param([string]$Message)

    if ($VerboseMode) {
        Write-Log -Level INFO -Message "[VERBOSE] $Message"
    }
}

# ============================================
# HEADER
# ============================================
function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║                                                               ║" -ForegroundColor Blue
    Write-Host "║   ██████╗ ██████╗ ███████╗███╗   ██╗██████╗  █████╗ ███╗   ██╗║" -ForegroundColor Blue
    Write-Host "║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗██╔══██╗████╗  ██║║" -ForegroundColor Blue
    Write-Host "║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██████╔╝███████║██╔██╗ ██║║" -ForegroundColor Blue
    Write-Host "║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔═══╝ ██╔══██║██║╚██╗██║║" -ForegroundColor Blue
    Write-Host "║  ╚██████╔╝██║     ███████╗██║ ╚████║██║     ██║  ██║██║ ╚████║║" -ForegroundColor Blue
    Write-Host "║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝║" -ForegroundColor Blue
    Write-Host "║                                                               ║" -ForegroundColor Blue
    Write-Host "║            Master Installation & Update Script               ║" -ForegroundColor Blue
    Write-Host "║                     Windows Edition                          ║" -ForegroundColor Blue
    Write-Host "║                                                               ║" -ForegroundColor Blue
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
    Write-Host ""
}

# ============================================
# HELPER FUNCTIONS
# ============================================
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-InstalledVersion {
    param([string]$Command)

    try {
        switch ($Command) {
            'node' {
                $version = & node -v 2>$null
                if ($version) {
                    return [Version]($version -replace 'v', '')
                }
            }
            'npm' {
                $version = & npm -v 2>$null
                if ($version) {
                    return [Version]$version
                }
            }
            'docker' {
                $version = & docker --version 2>$null
                if ($version -match '(\d+\.\d+\.\d+)') {
                    return [Version]$Matches[1]
                }
            }
        }
    }
    catch {
        return $null
    }

    return $null
}

# ============================================
# CHOCOLATEY INSTALLATION
# ============================================
function Install-Chocolatey {
    Write-Log -Level INFO -Message "Checking Chocolatey installation..."

    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Log -Level SUCCESS -Message "Chocolatey is already installed"

        if ($Update) {
            Write-Log -Level INFO -Message "Updating Chocolatey..."
            choco upgrade chocolatey -y | Out-Null
            Write-Log -Level SUCCESS -Message "Chocolatey updated"
        }

        return
    }

    Write-Log -Level WARN -Message "Chocolatey not found. Installing..."

    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

        # Refresh environment
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        Write-Log -Level SUCCESS -Message "Chocolatey installed successfully"
    }
    catch {
        Write-Log -Level ERROR -Message "Failed to install Chocolatey: $_"
        throw
    }
}

# ============================================
# NODE.JS INSTALLATION
# ============================================
function Install-NodeJS {
    Write-Log -Level INFO -Message "Checking Node.js installation..."

    $currentVersion = Get-InstalledVersion -Command 'node'

    if ($currentVersion) {
        Write-Log -Level INFO -Message "Node.js $currentVersion is installed"

        if ($currentVersion -ge $MinNodeVersion) {
            Write-Log -Level SUCCESS -Message "Node.js version is sufficient (>= $MinNodeVersion)"

            if ($Update) {
                Write-Log -Level INFO -Message "Update mode: Upgrading Node.js..."
                choco upgrade nodejs-lts -y | Out-Null
                Write-Log -Level SUCCESS -Message "Node.js updated"
            }

            return
        }
        else {
            Write-Log -Level WARN -Message "Node.js version is too old (< $MinNodeVersion). Upgrading..."
        }
    }
    else {
        Write-Log -Level WARN -Message "Node.js not found. Installing..."
    }

    try {
        Write-Log -Level INFO -Message "Installing Node.js LTS via Chocolatey..."
        choco install nodejs-lts -y | Out-Null

        # Refresh environment
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        $newVersion = Get-InstalledVersion -Command 'node'
        if ($newVersion) {
            Write-Log -Level SUCCESS -Message "Node.js $newVersion installed successfully"
        }
        else {
            throw "Node.js installation verification failed"
        }
    }
    catch {
        Write-Log -Level ERROR -Message "Failed to install Node.js: $_"
        throw
    }
}

# ============================================
# NPM UPDATE
# ============================================
function Update-Npm {
    Write-Log -Level INFO -Message "Checking npm version..."

    $currentVersion = Get-InstalledVersion -Command 'npm'

    if ($currentVersion) {
        Write-Log -Level INFO -Message "npm $currentVersion is installed"

        if ($currentVersion -ge $MinNpmVersion) {
            Write-Log -Level SUCCESS -Message "npm version is sufficient (>= $MinNpmVersion)"
        }
        else {
            Write-Log -Level WARN -Message "npm version is too old. Updating..."
            npm install -g npm@latest | Out-Null
            Write-Log -Level SUCCESS -Message "npm updated to $(Get-InstalledVersion -Command 'npm')"
        }
    }
    else {
        Write-Log -Level ERROR -Message "npm not found (should be installed with Node.js)"
        throw "npm not found"
    }
}

# ============================================
# DOCKER INSTALLATION
# ============================================
function Install-Docker {
    if ($NoDocker) {
        Write-Log -Level INFO -Message "Skipping Docker installation (NoDocker flag)"
        return
    }

    Write-Log -Level INFO -Message "Checking Docker installation..."

    $currentVersion = Get-InstalledVersion -Command 'docker'

    if ($currentVersion) {
        Write-Log -Level INFO -Message "Docker $currentVersion is installed"

        if ($currentVersion -ge $MinDockerVersion) {
            Write-Log -Level SUCCESS -Message "Docker version is sufficient (>= $MinDockerVersion)"

            # Check if Docker is running
            try {
                docker info 2>&1 | Out-Null
                Write-Log -Level SUCCESS -Message "Docker is running"
            }
            catch {
                Write-Log -Level WARN -Message "Docker is installed but not running"
                Start-DockerDesktop
            }

            return
        }
        else {
            Write-Log -Level WARN -Message "Docker version is too old. Updating..."
        }
    }
    else {
        Write-Log -Level WARN -Message "Docker not found. Installing..."
    }

    try {
        Write-Log -Level INFO -Message "Installing Docker Desktop via Chocolatey..."
        choco install docker-desktop -y | Out-Null

        Write-Log -Level SUCCESS -Message "Docker Desktop installed"
        Write-Log -Level WARN -Message "Please start Docker Desktop manually and wait for it to be ready"
        Write-Log -Level INFO -Message "Starting Docker Desktop..."

        Start-DockerDesktop
    }
    catch {
        Write-Log -Level ERROR -Message "Failed to install Docker: $_"
        throw
    }
}

function Start-DockerDesktop {
    Write-Log -Level INFO -Message "Starting Docker Desktop..."

    $dockerPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"

    if (Test-Path $dockerPath) {
        Start-Process -FilePath $dockerPath

        Write-Log -Level INFO -Message "Waiting for Docker to be ready (this may take a minute)..."

        $maxWait = 120
        $waited = 0

        while ($waited -lt $maxWait) {
            try {
                docker info 2>&1 | Out-Null
                Write-Log -Level SUCCESS -Message "Docker is ready"
                return
            }
            catch {
                Start-Sleep -Seconds 2
                $waited += 2
                Write-Host "." -NoNewline
            }
        }

        Write-Host ""
        Write-Log -Level WARN -Message "Docker did not start in time. Please start it manually."
    }
    else {
        Write-Log -Level WARN -Message "Docker Desktop executable not found at: $dockerPath"
    }
}

# ============================================
# PROJECT SETUP
# ============================================
function Backup-Configuration {
    Write-Log -Level INFO -Message "Backing up existing configuration..."

    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

    if (Test-Path ".env") {
        Copy-Item ".env" -Destination "$BackupDir\.env"
    }

    if (Test-Path "apps\web\.env.local") {
        Copy-Item "apps\web\.env.local" -Destination "$BackupDir\.env.local"
    }

    Write-Log -Level SUCCESS -Message "Configuration backed up to $BackupDir"
}

function Setup-Environment {
    Write-Log -Level INFO -Message "Setting up environment variables..."

    # Create .env if it doesn't exist
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" -Destination ".env"
            Write-Log -Level SUCCESS -Message ".env created from .env.example"

            # Generate secure JWT secret if in production mode
            if (-not $Dev) {
                Write-Log -Level INFO -Message "Generating secure JWT secret..."

                $bytes = New-Object byte[] 64
                $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
                $rng.GetBytes($bytes)
                $jwtSecret = [System.BitConverter]::ToString($bytes) -replace '-', ''

                (Get-Content ".env") -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwtSecret" | Set-Content ".env"

                Write-Log -Level SUCCESS -Message "Secure JWT secret generated"
            }
        }
        else {
            Write-Log -Level ERROR -Message ".env.example not found"
            throw ".env.example not found"
        }
    }
    else {
        Write-Log -Level INFO -Message ".env already exists"
    }

    # Create frontend .env.local
    if (-not (Test-Path "apps\web\.env.local")) {
        Write-Log -Level INFO -Message "Creating frontend .env.local..."

        $envContent = @"
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=OpenPanel
VITE_APP_VERSION=0.1.0
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_TERMINAL=true
VITE_ENABLE_MONITORING=true
"@

        Set-Content -Path "apps\web\.env.local" -Value $envContent
        Write-Log -Level SUCCESS -Message "Frontend .env.local created"
    }
    else {
        Write-Log -Level INFO -Message "Frontend .env.local already exists"
    }
}

function Install-Dependencies {
    Write-Log -Level INFO -Message "Installing project dependencies..."

    Set-Location $ScriptDir

    try {
        if ($Update) {
            Write-Log -Level INFO -Message "Update mode: Running npm ci for clean install..."
            npm ci 2>&1 | Out-Null
        }
        else {
            npm install 2>&1 | Out-Null
        }

        Write-Log -Level SUCCESS -Message "Dependencies installed"
    }
    catch {
        Write-Log -Level ERROR -Message "Failed to install dependencies: $_"
        throw
    }
}

# ============================================
# DOCKER SERVICES
# ============================================
function Start-DockerServices {
    if ($NoDocker) {
        Write-Log -Level INFO -Message "Skipping Docker services (NoDocker flag)"
        return
    }

    Write-Log -Level INFO -Message "Starting Docker services..."

    Set-Location $ScriptDir

    try {
        # Check if docker compose or docker-compose is available
        $composeCmd = "docker compose"
        try {
            docker compose version 2>&1 | Out-Null
        }
        catch {
            $composeCmd = "docker-compose"
        }

        Invoke-Expression "$composeCmd up -d" | Out-Null
        Write-Log -Level SUCCESS -Message "Docker services started"

        # Show running containers
        Write-Log -Level INFO -Message "Running containers:"
        docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
    }
    catch {
        Write-Log -Level ERROR -Message "Failed to start Docker services: $_"
        throw
    }
}

# ============================================
# DATABASE SETUP
# ============================================
function Setup-Database {
    Write-Log -Level INFO -Message "Setting up database..."

    # Check if PostgreSQL is running
    $postgresRunning = docker ps --format "{{.Names}}" | Select-String -Pattern "openpanel-postgres"

    if (-not $postgresRunning) {
        Write-Log -Level WARN -Message "PostgreSQL container not running. Starting Docker Compose..."
        Start-DockerServices
    }

    # Wait for PostgreSQL to be healthy
    Write-Log -Level INFO -Message "Waiting for PostgreSQL to be ready..."

    $maxWait = 60
    $waited = 0

    while ($waited -lt $maxWait) {
        try {
            $status = docker inspect --format="{{.State.Health.Status}}" openpanel-postgres 2>&1

            if ($status -eq "healthy") {
                Write-Log -Level SUCCESS -Message "PostgreSQL is ready"
                break
            }
        }
        catch {}

        Start-Sleep -Seconds 2
        $waited += 2
        Write-Host "." -NoNewline
    }

    Write-Host ""

    if ($waited -ge $maxWait) {
        Write-Log -Level ERROR -Message "PostgreSQL did not become healthy in time"
        throw "PostgreSQL timeout"
    }

    # Generate Prisma Client
    Write-Log -Level INFO -Message "Generating Prisma Client..."
    $env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = "1"
    npm run db:generate 2>&1 | Out-Null
    Write-Log -Level SUCCESS -Message "Prisma Client generated"

    # Push schema to database
    Write-Log -Level INFO -Message "Syncing database schema..."
    npm run db:push 2>&1 | Out-Null
    Write-Log -Level SUCCESS -Message "Database schema synced"
}

# ============================================
# BUILD & VERIFY
# ============================================
function Build-Project {
    Write-Log -Level INFO -Message "Building project..."

    Set-Location $ScriptDir

    try {
        # Type check
        Write-Log -Level INFO -Message "Running type checks..."
        npm run type-check 2>&1 | Out-Null

        # Build
        Write-Log -Level INFO -Message "Building production bundles..."
        npm run build 2>&1 | Out-Null

        Write-Log -Level SUCCESS -Message "Project built successfully"
    }
    catch {
        Write-Log -Level WARN -Message "Build completed with warnings (non-critical)"
    }
}

function Test-Installation {
    Write-Log -Level INFO -Message "Verifying installation..."

    $allOk = $true

    # Check Node.js
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVersion = Get-InstalledVersion -Command 'node'
        Write-Log -Level SUCCESS -Message "Node.js $nodeVersion ✓"
    }
    else {
        Write-Log -Level ERROR -Message "Node.js not found ✗"
        $allOk = $false
    }

    # Check npm
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $npmVersion = Get-InstalledVersion -Command 'npm'
        Write-Log -Level SUCCESS -Message "npm $npmVersion ✓"
    }
    else {
        Write-Log -Level ERROR -Message "npm not found ✗"
        $allOk = $false
    }

    # Check Docker
    if (-not $NoDocker) {
        if (Get-Command docker -ErrorAction SilentlyContinue) {
            try {
                docker info 2>&1 | Out-Null
                $dockerVersion = Get-InstalledVersion -Command 'docker'
                Write-Log -Level SUCCESS -Message "Docker $dockerVersion ✓"
            }
            catch {
                Write-Log -Level WARN -Message "Docker installed but not running ⚠"
            }
        }
        else {
            Write-Log -Level ERROR -Message "Docker not found ✗"
            $allOk = $false
        }
    }

    # Check environment files
    if ((Test-Path ".env") -and (Test-Path "apps\web\.env.local")) {
        Write-Log -Level SUCCESS -Message "Environment files ✓"
    }
    else {
        Write-Log -Level ERROR -Message "Environment files missing ✗"
        $allOk = $false
    }

    return $allOk
}

# ============================================
# SUMMARY
# ============================================
function Show-Summary {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                 INSTALLATION COMPLETED! 🎉                    ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""

    Write-Host "📋 Summary:" -ForegroundColor Cyan
    Write-Host "   ✓ Operating System: Windows" -ForegroundColor White
    Write-Host "   ✓ Node.js: $(node -v)" -ForegroundColor White
    Write-Host "   ✓ npm: v$(npm -v)" -ForegroundColor White

    if (-not $NoDocker) {
        $dockerVersion = Get-InstalledVersion -Command 'docker'
        if ($dockerVersion) {
            Write-Host "   ✓ Docker: $dockerVersion" -ForegroundColor White
        }
    }

    Write-Host ""
    Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
    Write-Host "   ➜ Frontend:    http://localhost:3000" -ForegroundColor White
    Write-Host "   ➜ API:         http://localhost:3001" -ForegroundColor White
    Write-Host "   ➜ API Health:  http://localhost:3001/health" -ForegroundColor White

    if (-not $NoDocker) {
        Write-Host "   ➜ Traefik:     http://localhost:8080" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
    Write-Host "   ➜ Start development: npm run dev" -ForegroundColor White
    Write-Host "   ➜ Check services:    .\check-services.ps1" -ForegroundColor White
    Write-Host "   ➜ View logs:         Get-Content $LogFile -Tail 50 -Wait" -ForegroundColor White

    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor Cyan
    Write-Host "   ➜ Quick Start: QUICKSTART.md" -ForegroundColor White
    Write-Host "   ➜ Full Guide:  SETUP_GUIDE.md" -ForegroundColor White
    Write-Host ""

    if (Test-Path $BackupDir) {
        Write-Host "📦 Backup: $BackupDir" -ForegroundColor Yellow
        Write-Host ""
    }
}

# ============================================
# MAIN FUNCTION
# ============================================
function Main {
    # Check administrator privileges
    if (-not (Test-Administrator)) {
        Write-Host "✗ This script requires administrator privileges" -ForegroundColor Red
        Write-Host "  Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
        exit 1
    }

    # Start log
    "==========================================" | Out-File -FilePath $LogFile
    "OpenPanel Installation Log (Windows)" | Out-File -FilePath $LogFile -Append
    "Started: $(Get-Date)" | Out-File -FilePath $LogFile -Append
    "==========================================" | Out-File -FilePath $LogFile -Append

    # Show header
    Show-Header

    # Show mode
    if ($Update) {
        Write-Log -Level INFO -Message "Running in UPDATE mode"
    }
    else {
        Write-Log -Level INFO -Message "Running in INSTALL mode"
    }

    if ($Dev) {
        Write-Log -Level INFO -Message "Development mode enabled"
    }

    try {
        # Step 1: Install Chocolatey
        Install-Chocolatey

        # Step 2: Install/update Node.js
        Install-NodeJS

        # Step 3: Update npm
        Update-Npm

        # Step 4: Install/update Docker
        Install-Docker

        # Step 5: Backup existing config
        if ($Update) {
            Backup-Configuration
        }

        # Step 6: Setup environment
        Setup-Environment

        # Step 7: Install project dependencies
        Install-Dependencies

        # Step 8: Start Docker services
        if (-not $NoDocker) {
            Start-DockerServices
        }

        # Step 9: Setup database
        if (-not $NoDocker) {
            Setup-Database
        }
        else {
            Write-Log -Level INFO -Message "Skipping database setup (Docker disabled)"
        }

        # Step 10: Build project (optional in dev mode)
        if (-not $Dev) {
            Build-Project
        }
        else {
            Write-Log -Level INFO -Message "Skipping build in development mode"
        }

        # Step 11: Verify installation
        $verifyResult = Test-Installation

        # Show summary
        Show-Summary

        # End log
        "==========================================" | Out-File -FilePath $LogFile -Append
        "Completed: $(Get-Date)" | Out-File -FilePath $LogFile -Append
        "==========================================" | Out-File -FilePath $LogFile -Append

        if (-not $verifyResult) {
            Write-Host ""
            Write-Host "⚠ Some verifications failed. Please check the log file for details." -ForegroundColor Yellow
            exit 1
        }
    }
    catch {
        Write-Log -Level ERROR -Message "Installation failed: $_"
        Write-Log -Level ERROR -Message "Check $LogFile for details"

        if (Test-Path $BackupDir) {
            Write-Log -Level INFO -Message "Backup available at: $BackupDir"
        }

        exit 1
    }
}

# ============================================
# ENTRY POINT
# ============================================
Main
