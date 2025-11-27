# Open-Panel Stop Script for Windows

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

. "$ScriptDir\config.ps1"
. "$ScriptDir\lib\common.ps1"

Print-Section "🛑 Stopping Open-Panel Services"

Print-Info "Parando containers com graceful shutdown..."
Print-Subsection "Aguardando parada (30s)"

try {
    docker-compose down
    Print-Success "Serviços parados!"
}
catch {
    Write-Warn-Log "Forçando parada..."
    docker-compose down --force-kill
    Print-Info "Parada forçada completa"
}

Print-Info "Para reiniciar: .\scripts\start.ps1"
