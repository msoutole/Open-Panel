# Open-Panel Restart Script for Windows

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

. "$ScriptDir\config.ps1"
. "$ScriptDir\lib\common.ps1"

Print-Section "🔄 Restarting Open-Panel Services"

Print-Subsection "Parando serviços"
docker-compose down | Out-Null
Start-Sleep -Seconds 2

Print-Subsection "Reiniciando serviços"
docker-compose up -d | Out-Null

Print-Subsection "Aguardando containers"
Wait-ContainerHealth $CONTAINER_POSTGRES 60 | Out-Null
Wait-ContainerHealth $CONTAINER_REDIS 60 | Out-Null

Print-Subsection "Sincronizando banco"
npm run db:push | Out-Null

Print-Success "Restart concluído!"
Print-Info "Acesse: http://localhost:3000"
