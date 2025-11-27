# ============================================================================
# Open-Panel Common Utilities for PowerShell
#
# Este arquivo contém funções reutilizáveis para todos os scripts PowerShell
# Inclua com: . "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\lib\common.ps1"
# ============================================================================

# ============================================================================
# CORES E FORMATAÇÃO DE OUTPUT
# ============================================================================

# Definir host para suportar colors
$Host.UI.RawUI.BackgroundColor = "Black"

# Símbolos visuais
$SYMBOL_SUCCESS = "✓"
$SYMBOL_ERROR = "✗"
$SYMBOL_WARNING = "⚠"
$SYMBOL_INFO = "ℹ"
$SYMBOL_ARROW = "→"
$SYMBOL_BULLET = "•"

# ============================================================================
# LOGGING E OUTPUT
# ============================================================================

# Variáveis globais de log
$global:ScriptName = Split-Path -Leaf $PSCommandPath
$global:LogDir = ".\.logs"
$global:LogFile = "$LogDir\$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')-$($ScriptName -replace '\.ps1$', '.log')"
$global:LogLevel = "INFO"  # DEBUG, INFO, WARN, ERROR, FATAL

# Garante que diretório de logs existe
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

##
# Log com nível, timestamp e cor
#
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )

    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $color = "White"

    switch ($Level) {
        "DEBUG" { $color = "DarkGray"; if ($LogLevel -ne "DEBUG") { return } }
        "INFO" { $color = "Cyan" }
        "WARN" { $color = "Yellow" }
        "ERROR" { $color = "Red" }
        "FATAL" { $color = "Red" }
    }

    # Output para console com cores
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color

    # Salva em arquivo (sem cores)
    "[$timestamp] [$Level] $Message" | Add-Content -Path $LogFile -Encoding UTF8
}

##
# Log DEBUG
#
function Write-Debug-Log {
    param([string]$Message)
    Write-Log "DEBUG" $Message
}

##
# Log INFO
#
function Write-Info-Log {
    param([string]$Message)
    Write-Log "INFO" $Message
}

##
# Log WARN
#
function Write-Warn-Log {
    param([string]$Message)
    Write-Log "WARN" $Message
}

##
# Log ERROR
#
function Write-Error-Log {
    param([string]$Message)
    Write-Log "ERROR" $Message
}

##
# Log FATAL e exit
#
function Write-Fatal-Log {
    param([string]$Message)
    Write-Log "FATAL" $Message
    exit 1
}

# ============================================================================
# PRINTING COM CORES
# ============================================================================

##
# Print sucesso
#
function Print-Success {
    param([string]$Message)
    Write-Host "$SYMBOL_SUCCESS $Message" -ForegroundColor Green
}

##
# Print erro
#
function Print-Error {
    param([string]$Message)
    Write-Host "$SYMBOL_ERROR $Message" -ForegroundColor Red
}

##
# Print aviso
#
function Print-Warn {
    param([string]$Message)
    Write-Host "$SYMBOL_WARNING $Message" -ForegroundColor Yellow
}

##
# Print info
#
function Print-Info {
    param([string]$Message)
    Write-Host "$SYMBOL_INFO $Message" -ForegroundColor Cyan
}

##
# Print seção (com linha)
#
function Print-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host "  $Title" -ForegroundColor Blue
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host ""
}

##
# Print subsection
#
function Print-Subsection {
    param([string]$Title)
    Write-Host ""
    Write-Host "─── $Title ───" -ForegroundColor Cyan
}

# ============================================================================
# VERIFICAÇÕES DE COMANDO
# ============================================================================

##
# Verifica se um comando existe
#
function Test-CommandExists {
    param([string]$Command)

    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

##
# Verifica se comando existe e exibe erro se não
#
function Require-Command {
    param(
        [string]$Command,
        [string]$ErrorMessage = "Comando obrigatório '$Command' não encontrado"
    )

    if (-not (Test-CommandExists $Command)) {
        Print-Error $ErrorMessage
        return $false
    }
    return $true
}

##
# Retorna versão de um comando
#
function Get-CommandVersion {
    param(
        [string]$Command,
        [string]$Flag = "--version"
    )

    if (Test-CommandExists $Command) {
        try {
            $version = & $Command $Flag 2>$null | Select-Object -First 1
            return $version
        }
        catch {
            return "não foi possível obter versão"
        }
    }
    return "não instalado"
}

# ============================================================================
# RETRY E EXPONENTIAL BACKOFF
# ============================================================================

##
# Retry com exponential backoff
#
function Invoke-RetryWithBackoff {
    param(
        [int]$MaxAttempts = 5,
        [scriptblock]$ScriptBlock
    )

    $delay = 2
    $attempt = 1

    while ($true) {
        Write-Debug-Log "Tentativa $attempt/$MaxAttempts"

        try {
            & $ScriptBlock
            return $true
        }
        catch {
            if ($attempt -ge $MaxAttempts) {
                Write-Error-Log "Falha após $MaxAttempts tentativas"
                return $false
            }

            Write-Warn-Log "Tentativa $attempt falhou. Aguardando ${delay}s..."
            Start-Sleep -Seconds $delay
            $delay = $delay * 2
            $attempt++
        }
    }
}

##
# Retry simples
#
function Invoke-Retry {
    param(
        [int]$MaxAttempts = 3,
        [scriptblock]$ScriptBlock
    )

    $attempt = 1

    while ($true) {
        try {
            & $ScriptBlock
            return $true
        }
        catch {
            if ($attempt -ge $MaxAttempts) {
                return $false
            }

            $attempt++
            Start-Sleep -Seconds 1
        }
    }
}

# ============================================================================
# SPINNER E PROGRESS
# ============================================================================

$global:SpinnerJob = $null

##
# Inicia spinner
#
function Start-Spinner {
    param([string]$Message = "Aguardando...")

    $frames = @("⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏")
    $i = 0

    $global:SpinnerJob = {
        param($Frames, $Message)
        $i = 0
        while ($true) {
            Write-Host "`r$($Frames[$i % 10]) $Message" -NoNewline -ForegroundColor Cyan
            $i++
            Start-Sleep -Milliseconds 100
        }
    }

    # Iniciar job (não é ideal em PowerShell, então usamos um alternative)
    # Para simplificar, vamos apenas usar uma mensagem sem spinner
    Write-Host "$Message" -ForegroundColor Cyan
}

##
# Para spinner
#
function Stop-Spinner {
    if ($null -ne $global:SpinnerJob) {
        Stop-Job -Job $global:SpinnerJob -ErrorAction SilentlyContinue
        Remove-Job -Job $global:SpinnerJob -ErrorAction SilentlyContinue
        $global:SpinnerJob = $null
    }
    Write-Host ""
}

##
# Spinner com resultado
#
function Invoke-WithSpinner {
    param(
        [string]$Message,
        [scriptblock]$ScriptBlock
    )

    Start-Spinner $Message

    try {
        & $ScriptBlock
        Stop-Spinner
        Print-Success $Message
        return $true
    }
    catch {
        Stop-Spinner
        Print-Error $Message
        return $false
    }
}

# ============================================================================
# VALIDAÇÕES E CHECKS
# ============================================================================

##
# Verifica se arquivo existe
#
function Test-FileExists {
    param([string]$Path)
    return Test-Path -Path $Path -PathType Leaf
}

##
# Verifica se diretório existe
#
function Test-DirExists {
    param([string]$Path)
    return Test-Path -Path $Path -PathType Container
}

##
# Verifica espaço em disco
#
function Test-DiskSpace {
    param(
        [string]$Path = ".",
        [int]$RequiredMB = 5000
    )

    $drive = (Resolve-Path $Path).Drive.Name
    $diskInfo = Get-Volume -DriveLetter $drive

    if ($diskInfo.SizeRemaining / 1MB -lt $RequiredMB) {
        Write-Error-Log "Espaço em disco insuficiente: $([math]::Round($diskInfo.SizeRemaining / 1MB))MB disponível"
        return $false
    }

    Write-Debug-Log "Espaço em disco OK: $([math]::Round($diskInfo.SizeRemaining / 1MB))MB disponível"
    return $true
}

##
# Verifica se variável de ambiente está definida
#
function Test-EnvVar {
    param([string]$VarName)

    $value = [Environment]::GetEnvironmentVariable($VarName)
    if ([string]::IsNullOrEmpty($value)) {
        Write-Error-Log "Variável de ambiente obrigatória não está definida: $VarName"
        return $false
    }

    return $true
}

# ============================================================================
# DOCKER UTILITIES
# ============================================================================

##
# Verifica se Docker daemon está rodando
#
function Test-DockerRunning {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

##
# Aguarda container ficar saudável
#
function Wait-ContainerHealth {
    param(
        [string]$ContainerName,
        [int]$MaxWait = 30
    )

    $waited = 0
    $interval = 2

    while ($waited -lt $MaxWait) {
        $status = docker inspect --format='{{.State.Health.Status}}' $ContainerName 2>$null

        if ($status -eq "healthy") {
            Write-Debug-Log "Container $ContainerName está saudável"
            return $true
        }

        Write-Debug-Log "Container $ContainerName: $status (aguardado: ${waited}s/${MaxWait}s)"
        Start-Sleep -Seconds $interval
        $waited += $interval
    }

    Write-Error-Log "Container $ContainerName não ficou saudável em ${MaxWait}s"
    return $false
}

##
# Aguarda porta estar acessível
#
function Wait-Port {
    param(
        [int]$Port,
        [int]$MaxWait = 30
    )

    $waited = 0
    $interval = 1

    while ($waited -lt $MaxWait) {
        try {
            $tcpClient = New-Object Net.Sockets.TcpClient
            $tcpClient.Connect("localhost", $Port)
            $tcpClient.Close()

            Write-Debug-Log "Porta $Port está respondendo"
            return $true
        }
        catch {
            Write-Debug-Log "Aguardando porta $Port (${waited}s/${MaxWait}s)"
            Start-Sleep -Seconds $interval
            $waited += $interval
        }
    }

    Write-Error-Log "Porta $Port não ficou acessível em ${MaxWait}s"
    return $false
}

##
# Aguarda endpoint HTTP responder
#
function Wait-HttpEndpoint {
    param(
        [string]$Url,
        [int]$MaxWait = 30
    )

    if (-not (Require-Command "curl")) { return $false }

    $waited = 0
    $interval = 2

    while ($waited -lt $MaxWait) {
        try {
            $response = curl -sf $Url 2>$null

            if ($response) {
                Write-Debug-Log "Endpoint $Url está respondendo"
                return $true
            }
        }
        catch {
            # Continue
        }

        Write-Debug-Log "Aguardando endpoint $Url (${waited}s/${MaxWait}s)"
        Start-Sleep -Seconds $interval
        $waited += $interval
    }

    Write-Error-Log "Endpoint $Url não ficou acessível em ${MaxWait}s"
    return $false
}

# ============================================================================
# FILE UTILITIES
# ============================================================================

##
# Cria backup de arquivo
#
function Backup-File {
    param([string]$Path)

    if (Test-Path -Path $Path) {
        $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        $backupPath = "$Path.backup.$timestamp"

        Copy-Item -Path $Path -Destination $backupPath -Force
        Write-Info-Log "Backup criado: $backupPath"

        return $backupPath
    }
    else {
        Write-Warn-Log "Arquivo não existe: $Path"
        return $null
    }
}

##
# Cria diretório se não existir
#
function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path -Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Debug-Log "Diretório criado: $Path"
    }
}

##
# Remove linhas com padrão de um arquivo
#
function Remove-LineFromFile {
    param(
        [string]$Path,
        [string]$Pattern
    )

    if (-not (Test-Path -Path $Path)) { return }

    $content = Get-Content -Path $Path
    $newContent = $content | Where-Object { $_ -notmatch "^$Pattern" }

    Set-Content -Path $Path -Value $newContent -Encoding UTF8
}

# ============================================================================
# RANDOM GENERATION (Seguro)
# ============================================================================

##
# Gera string aleatória
#
function New-RandomString {
    param([int]$Length = 32)

    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    $random = New-Object System.Random

    $result = ""
    for ($i = 0; $i -lt $Length; $i++) {
        $result += $chars[$random.Next($chars.Length)]
    }

    return $result
}

##
# Gera string hexadecimal aleatória
#
function New-RandomHex {
    param([int]$Length = 32)

    $bytes = New-Object byte[] ($Length / 2)
    ([Security.Cryptography.RNGCryptoServiceProvider]::new()).GetBytes($bytes)

    return [BitConverter]::ToString($bytes).Replace("-", "").ToLower().Substring(0, $Length)
}

##
# Gera UUID v4
#
function New-UUID {
    return [guid]::NewGuid().ToString().ToLower()
}

# ============================================================================
# CLEANUP E SIGNAL HANDLERS
# ============================================================================

$global:CleanupFunctions = @()

##
# Registra função de cleanup
#
function Register-Cleanup {
    param([scriptblock]$ScriptBlock)

    $global:CleanupFunctions += $ScriptBlock
}

##
# Executa cleanup
#
function Invoke-Cleanup {
    Write-Debug-Log "Executando cleanup..."

    foreach ($func in $global:CleanupFunctions) {
        try {
            & $func
        }
        catch {
            Write-Warn-Log "Cleanup function falhou: $_"
        }
    }
}

# Registrar trap para Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Invoke-Cleanup
}

# ============================================================================
# MENU E INPUT
# ============================================================================

##
# Exibe menu de escolha
#
function Select-Option {
    param(
        [string]$Prompt,
        [string[]]$Options
    )

    Write-Host ""
    Write-Host $Prompt -ForegroundColor Cyan
    for ($i = 0; $i -lt $Options.Length; $i++) {
        Write-Host "  $($i+1). $($Options[$i])"
    }
    Write-Host ""

    $choice = Read-Host "Digite o número da sua escolha (1-$($Options.Length))"

    if (-not [int]::TryParse($choice, [ref]$choice) -or $choice -lt 1 -or $choice -gt $Options.Length) {
        Print-Error "Opção inválida"
        return $null
    }

    return $choice
}

##
# Prompt yes/no
#
function Confirm-Action {
    param([string]$Prompt)

    $response = Read-Host "$Prompt (y/n)"

    return $response -match '^[yY]'
}

# ============================================================================
# INICIALIZAÇÃO
# ============================================================================

Write-Info-Log "=== Iniciando $ScriptName ==="
Write-Debug-Log "Log file: $LogFile"
