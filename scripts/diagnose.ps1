# Open-Panel Diagnostic Script for Windows

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

. "$ScriptDir\config.ps1"
. "$ScriptDir\lib\common.ps1"

Print-Section "🔍 Open-Panel Diagnostics Report"

# Sistema
Print-Subsection "System Information"
$os = Get-CimInstance -ClassName Win32_OperatingSystem
Write-Host "OS: $($os.Caption)"
Write-Host "Version: $($os.Version)"
Write-Host "Cores: $((Get-CimInstance -ClassName Win32_Processor).NumberOfLogicalProcessors)"

# Disco
Print-Subsection "Disk Usage"
$disk = Get-Volume | Where-Object {$_.DriveLetter}
$disk | Select-Object DriveLetter, FileSystemLabel, @{N='SizeGB';E={[math]::Round($_.Size/1GB, 2)}}, @{N='FreeGB';E={[math]::Round($_.SizeRemaining/1GB, 2)}}

# Docker
Print-Subsection "Docker Status"
if (Test-DockerRunning) {
    docker --version
    docker-compose --version
    Write-Host "Containers: $((docker ps -a | Measure-Object).Count - 1)"

    foreach ($container in $CONTAINERS_MAIN) {
        $status = docker inspect --format='{{.State.Status}}' $container 2>$null
        $health = docker inspect --format='{{.State.Health.Status}}' $container 2>$null
        Write-Host "  $container : $status ($health)"
    }
} else {
    Write-Host "Docker: NOT RUNNING"
}

# Versões
Print-Subsection "Runtime"
Write-Host "Node: $(node --version)"
Write-Host "npm: $(npm --version)"
Write-Host "Git: $(git --version)"

# Portas
Print-Subsection "Network Ports"
@($PORT_WEB, $PORT_API, $PORT_POSTGRES, $PORT_REDIS) | ForEach-Object {
    try {
        $tcpClient = New-Object Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $_)
        $tcpClient.Close()
        Write-Host "  Port $_: Open"
    }
    catch {
        Write-Host "  Port $_: Closed"
    }
}

# Export report
$reportFile = "diagnostic-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
@"
=== Open-Panel Diagnostic Report ===
Generated: $(Get-Date)
OS: $($os.Caption) $($os.Version)
Project: $ProjectRoot

=== Containers ===
$(docker ps -a)

=== Images ===
$(docker images)

=== Docker Logs (PostgreSQL) ===
$(docker logs --tail 30 $CONTAINER_POSTGRES 2>$null)

=== Docker Logs (Redis) ===
$(docker logs --tail 30 $CONTAINER_REDIS 2>$null)
"@ | Set-Content -Path $reportFile

Print-Success "Report saved: $reportFile"
