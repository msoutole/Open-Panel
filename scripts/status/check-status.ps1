# Open-Panel Status Check Script for Windows

param(
    [switch]$Json,
    [switch]$Csv,
    [switch]$Watch,
    [switch]$Help
)

if ($Help) {
    Write-Host "Uso: .\scripts\status\check-status.ps1 [options]"
    Write-Host ""
    Write-Host "Opções:"
    Write-Host "  -Json       Output em JSON"
    Write-Host "  -Csv        Output em CSV"
    Write-Host "  -Watch      Monitor contínuo"
    exit 0
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
Set-Location $ProjectRoot

. "$ScriptDir\..\config.ps1"
. "$ScriptDir\..\lib\common.ps1"

function Collect-ContainerData {
    $containers = @{}

    foreach ($container in $CONTAINERS_MAIN) {
        $status = docker inspect --format='{{.State.Status}}' $container 2>$null
        $health = docker inspect --format='{{.State.Health.Status}}' $container 2>$null

        if ($status -eq "running") {
            $stats = docker stats --no-stream $container 2>$null | Select-Object -Last 1
            $cpu = if ($stats) { ($stats -split '\s+')[2] } else { "N/A" }
            $memory = if ($stats) { ($stats -split '\s+')[3] } else { "N/A" }
        } else {
            $cpu = "N/A"
            $memory = "N/A"
        }

        $containers[$container] = @{
            Status = $status
            Health = $health
            CPU = $cpu
            Memory = $memory
        }
    }

    return $containers
}

function Test-Ports {
    $ports = @($PORT_WEB, $PORT_API, $PORT_TRAEFIK_DASHBOARD)
    $result = @{}

    foreach ($port in $ports) {
        try {
            $tcpClient = New-Object Net.Sockets.TcpClient
            $tcpClient.Connect("localhost", $port)
            $tcpClient.Close()
            $result[$port] = "✓ Open"
        }
        catch {
            $result[$port] = "✗ Closed"
        }
    }

    return $result
}

function Print-TextFormat {
    Print-Section "📊 Open-Panel Status Report"

    Print-Subsection "🐳 Docker Daemon"
    if (Test-DockerRunning) {
        Print-Success "Docker: Running"
    } else {
        Print-Error "Docker: Not Running"
    }

    Print-Subsection "📦 Containers"
    Write-Host "Container                 Status          Health          CPU        Memory"
    Write-Host "─────────────────────────────────────────────────────────────────────────────"

    $containers = Collect-ContainerData
    foreach ($name in $containers.Keys) {
        $c = $containers[$name]
        Write-Host ("{0,-25} {1,-15} {2,-15} {3,-10} {4}" -f $name, $c.Status, $c.Health, $c.CPU, $c.Memory)
    }

    Print-Subsection "🔌 Ports"
    $ports = Test-Ports
    foreach ($port in $ports.Keys) {
        Write-Host "  Port $port : $($ports[$port])"
    }

    Print-Subsection "📍 Access"
    Write-Host "  Web: http://localhost:$PORT_WEB" -ForegroundColor Cyan
    Write-Host "  API: http://localhost:$PORT_API" -ForegroundColor Cyan
}

function Print-JsonFormat {
    $containers = Collect-ContainerData
    $ports = Test-Ports

    $data = @{
        timestamp = (Get-Date -Format "o")
        docker_running = (Test-DockerRunning)
        containers = $containers
        ports = $ports
    }

    $data | ConvertTo-Json | Write-Host
}

function Print-CsvFormat {
    Write-Host "Container,Status,Health,CPU,Memory"
    $containers = Collect-ContainerData

    foreach ($name in $containers.Keys) {
        $c = $containers[$name]
        Write-Host "$name,$($c.Status),$($c.Health),$($c.CPU),$($c.Memory)"
    }
}

# Main
if ($Watch) {
    while ($true) {
        Clear-Host
        Print-TextFormat
        Write-Host ""
        Write-Host "Refreshing in 5 seconds... (Ctrl+C to stop)"
        Start-Sleep -Seconds 5
    }
} else {
    if ($Json) { Print-JsonFormat }
    elseif ($Csv) { Print-CsvFormat }
    else { Print-TextFormat }
}

Write-Info-Log "Status check completed"