# Open-Panel Start Script for Windows

param(
    [switch]$NoBuild,
    [switch]$NoWait,
    [switch]$NoDb,
    [switch]$Help
)

if ($Help) {
    Write-Host "Uso: .\scripts\start.ps1 [options]"
    Write-Host ""
    Write-Host "Opções:"
    Write-Host "  -NoBuild     Não recompilar"
    Write-Host "  -NoWait      Não aguardar saúde"
    Write-Host "  -NoDb        Não sincronizar BD"
    exit 0
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

. "$ScriptDir\config.ps1"
. "$ScriptDir\lib\common.ps1"

Print-Section "🚀 Starting Open-Panel Services"

# Validar .env
if (-not (Test-FileExists $ENV_FILE)) {
    Write-Fatal-Log ".env não encontrado. Execute setup primeiro."
}

# Iniciar Docker
Print-Subsection "Iniciando Docker containers"
Write-Info-Log "Running: docker-compose up -d"
docker-compose up -d | Out-Null

# Aguardar
if (-not $NoWait) {
    Print-Subsection "Aguardando containers"
    Wait-ContainerHealth $CONTAINER_POSTGRES 60 | Out-Null
    Wait-ContainerHealth $CONTAINER_REDIS 60 | Out-Null
}

# Sincronizar BD
if (-not $NoDb) {
    Print-Subsection "Sincronizando banco de dados"
    npm run db:push | Out-Null
}

# Build
if (-not $NoBuild) {
    Print-Subsection "Compilando"
    npm run build | Out-Null
}

# Iniciar
Print-Subsection "Iniciando aplicação"
npm run dev
