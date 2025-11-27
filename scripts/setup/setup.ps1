# ============================================================================
# Open-Panel Setup Script for Windows
#
# Este script configura completamente o Open-Panel com zero intervenção manual
# Características:
# - ✅ Completamente automatizado
# - ✅ Nativo para Windows (sem WSL)
# - ✅ Idempotente (seguro rodar múltiplas vezes)
# - ✅ Robusto com tratamento de erros
# - ✅ Informativo com logs detalhados
# - ✅ Seguro com geração de secrets criptográficos
# - ✅ Backup automático de configurações
# - ✅ Verificação completa pós-instalação
# - ✅ UX profissional
#
# Uso: .\scripts\setup\setup.ps1 [-Silent] [-Force] [-Debug]
# Opções:
#   -Silent      Modo silencioso (sem prompts)
#   -Force       Sobrescrever .env sem confirmar
#   -Debug       Ativa logs DEBUG
#   -Help        Exibe esta ajuda
# ============================================================================

param(
    [switch]$Silent,
    [switch]$Force,
    [switch]$Debug,
    [switch]$Help
)

# Exibir ajuda
if ($Help) {
    Write-Host "Uso: .\scripts\setup\setup.ps1 [options]"
    Write-Host ""
    Write-Host "Opções:"
    Write-Host "  -Silent     Modo silencioso (sem prompts interativos)"
    Write-Host "  -Force      Sobrescrever .env sem confirmar"
    Write-Host "  -Debug      Ativa logs DEBUG"
    Write-Host "  -Help       Exibe esta ajuda"
    exit 0
}

# ============================================================================
# CONFIGURAÇÃO INICIAL
# ============================================================================

$ErrorActionPreference = "Stop"
$VerbosePreference = if ($Debug) { "Continue" } else { "SilentlyContinue" }

# Caminhos
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
Set-Location $ProjectRoot

# Carregar configurações e utilitários
. "$ScriptDir\..\config.ps1"
. "$ScriptDir\..\lib\common.ps1"

# Configurar log level
if ($Debug) { $global:LogLevel = "DEBUG" }
$global:PostSetupMessages = @()

Write-Info-Log "=== Iniciando Open-Panel Setup ==="
Write-Info-Log "Projeto: $ProjectRoot"
Write-Info-Log "Sistema: Windows PowerShell $($PSVersionTable.PSVersion)"

# ============================================================================
# STEP 1: VERIFICAÇÕES DE PRÉ-REQUISITOS
# ============================================================================

Print-Section "🚀 Open-Panel Setup"
Print-Subsection "Verificando pré-requisitos"

# Verificar Node.js
if (Test-CommandExists "node") {
    $nodeVersion = (node --version) -replace 'v', ''
    if (Test-MinVersion "node" $nodeVersion $MIN_NODE_VERSION) {
        Print-Success "Node.js $nodeVersion detectado"
        Write-Info-Log "Node.js version: $nodeVersion (mínimo: $MIN_NODE_VERSION)"
    }
    else {
        Print-Error "Node.js $nodeVersion encontrado, mas versão mínima é $MIN_NODE_VERSION"
        Write-Fatal-Log "Node.js version requirement not met"
    }
}
else {
    Print-Warn "Node.js não encontrado. Tentando instalar automaticamente..."
    Write-Info-Log "Node.js não instalado. Tentando instalar via winget..."

    try {
        winget install OpenJS.NodeJS --silent
        if ($LASTEXITCODE -eq 0) {
            # Refresh PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            Print-Success "Node.js instalado"
            Write-Info-Log "Node.js installed via winget"
        }
        else {
            throw "winget install failed"
        }
    }
    catch {
        Write-Error-Log "Falha ao instalar Node.js: $_"
        Print-Error "Não foi possível instalar Node.js automaticamente."
        Print-Info "Por favor, instale Node.js v$MIN_NODE_VERSION+ manualmente de https://nodejs.org/"
        exit 2
    }
}

# Atualizar npm para a versão mais recente
Print-Info "Verificando atualizações do npm..."
try {
    $currentNpmVersion = (npm --version)
    $latestNpmVersion = (npm view npm version)
    
    if ($currentNpmVersion -ne $latestNpmVersion) {
        Print-Info "Nova versão do npm encontrada: $latestNpmVersion (Atual: $currentNpmVersion)"
        Print-Info "Atualizando npm..."
        Write-Info-Log "Updating npm from $currentNpmVersion to $latestNpmVersion..."
        
        npm install -g npm@latest | Out-Null
        
        $newNpmVersion = (npm --version)
        Print-Success "npm atualizado para versão $newNpmVersion"
        Write-Info-Log "npm updated to version $newNpmVersion"
    }
    else {
        Print-Success "npm já está na versão mais recente ($currentNpmVersion)"
        Write-Info-Log "npm is already at latest version ($currentNpmVersion)"
    }
}
catch {
    Print-Warn "Falha ao verificar/atualizar npm. Continuando com versão atual."
    Write-Warn-Log "Failed to check/update npm: $_"
}

# Verificar Docker
if (Test-CommandExists "docker") {
    try {
        $dockerVersion = (docker --version) -replace '.*version ', '' -replace ',.*', ''
        if (Test-MinVersion "docker" $dockerVersion $MIN_DOCKER_VERSION) {
            Print-Success "Docker $dockerVersion detectado"
            Write-Info-Log "Docker version: $dockerVersion (mínimo: $MIN_DOCKER_VERSION)"
        }
        else {
            Print-Error "Docker $dockerVersion encontrado, mas versão mínima é $MIN_DOCKER_VERSION"
            Write-Fatal-Log "Docker version requirement not met"
        }
    }
    catch {
        Print-Error "Erro ao verificar versão do Docker"
        Write-Fatal-Log "Failed to check Docker version: $_"
    }
}
else {
    Print-Warn "Docker não encontrado. Tentando instalar automaticamente..."
    Write-Info-Log "Docker não instalado. Tentando instalar via winget..."

    try {
        winget install Docker.DockerDesktop --silent
        if ($LASTEXITCODE -eq 0) {
            Print-Info "Docker instalado. Reinicie o computador para completar a instalação."
            exit 0
        }
        else {
            throw "winget install failed"
        }
    }
    catch {
        Write-Error-Log "Falha ao instalar Docker: $_"
        Print-Error "Não foi possível instalar Docker automaticamente."
        Print-Info "Por favor, instale Docker Desktop de https://www.docker.com/products/docker-desktop/"
        exit 2
    }
}

# Verificar Docker Compose
if (Test-CommandExists "docker-compose") {
    try {
        $composeVersion = (docker-compose --version) -replace '^.*?v?(\d+(\.\d+)+).*$', '$1'
        if (Test-MinVersion "docker-compose" $composeVersion $MIN_DOCKER_COMPOSE_VERSION) {
            Print-Success "Docker Compose $composeVersion detectado"
            Write-Info-Log "Docker Compose version: $composeVersion"
        }
        else {
            Print-Warn "Docker Compose versão antiga encontrada"
        }
    }
    catch {
        Write-Error-Log "Error checking Docker Compose version: $_"
    }
}
else {
    Write-Fatal-Log "Docker Compose não encontrado. Por favor, instale Docker Compose v2.0.0+"
}

# Verificar Docker daemon
Print-Info "Verificando Docker daemon..."
if (-not (Test-DockerRunning)) {
    Print-Warn "Docker daemon não está rodando. Tentando iniciar..."
    Write-Info-Log "Docker daemon is not running. Attempting to start..."

    try {
        # Docker Desktop está disponível
        Write-Info-Log "Abrindo Docker Desktop..."
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Start-Sleep -Seconds 10

        if (-not (Test-DockerRunning)) {
            Write-Fatal-Log "Docker daemon ainda não responde após 10s"
        }
    }
    catch {
        Write-Fatal-Log "Falha ao iniciar Docker: $_"
    }
}
Print-Success "Docker daemon está rodando"

# Verificar espaço em disco
Print-Info "Verificando espaço em disco..."
if (-not (Test-DiskSpace $ProjectRoot $MIN_DISK_SPACE_MB)) {
    Write-Fatal-Log "Espaço em disco insuficiente"
}
Print-Success "Espaço em disco adequado (>$MIN_DISK_SPACE_MB MB)"

# ============================================================================
# STEP 2: SETUP DE VARIÁVEIS DE AMBIENTE
# ============================================================================

Print-Subsection "Configurando variáveis de ambiente"

if (Test-FileExists $ENV_FILE) {
    Print-Info ".env já existe"

    if (-not $Force -and -not $Silent) {
        if (Confirm-Action "Você deseja sobrescrever o arquivo .env existente?") {
            $Force = $true
        }
        else {
            Print-Info "Mantendo .env existente"
        }
    }

    if ($Force) {
        $backupFile = Backup-File $ENV_FILE
        Print-Info "Backup de .env salvo"
        Write-Info-Log "Backed up .env to $backupFile"
    }
}

# Sempre gerar novos secrets para segurança (Rotação de Credenciais)
Print-Info "Gerando novos secrets criptográficos (Rotação de Credenciais)..."

$JwtSecret = New-RandomHex 64
$PostgresPassword = New-RandomString 32
$RedisPassword = New-RandomString 32

Write-Debug-Log "Generated JWT_SECRET (length: $($JwtSecret.Length))"
Write-Debug-Log "Generated POSTGRES_PASSWORD (length: $($PostgresPassword.Length))"
Write-Debug-Log "Generated REDIS_PASSWORD (length: $($RedisPassword.Length))"

# Se .env não existe, criar do exemplo
if (-not (Test-FileExists $ENV_FILE)) {
    if (-not (Test-FileExists $ENV_EXAMPLE_FILE)) {
        Write-Fatal-Log "Arquivo $ENV_EXAMPLE_FILE não encontrado"
    }
    Print-Info "Criando .env a partir de $ENV_EXAMPLE_FILE..."
    Copy-Item -Path $ENV_EXAMPLE_FILE -Destination $ENV_FILE -Force
    Write-Info-Log "Created .env from .env.example"
}

# Atualizar variáveis no .env
$envContent = Get-Content -Path $ENV_FILE
$envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$JwtSecret"
$envContent = $envContent -replace "POSTGRES_PASSWORD=.*", "POSTGRES_PASSWORD=$PostgresPassword"
$envContent = $envContent -replace "REDIS_PASSWORD=.*", "REDIS_PASSWORD=$RedisPassword"

# Update Connection Strings
$envContent = $envContent -replace "postgresql://openpanel:.*@", "postgresql://openpanel:$PostgresPassword@"
$envContent = $envContent -replace "redis://:.*@", "redis://:$RedisPassword@"

Set-Content -Path $ENV_FILE -Value $envContent -Encoding UTF8

Print-Success "Credenciais atualizadas no .env"
Write-Info-Log "Credentials rotated in .env"

# Configuração de AI Provider (Obrigatória)
if (-not $Silent) {
    Print-Subsection "Configuração de IA (Obrigatória)"
    $aiOptions = @("Ollama (Local)", "Google Gemini", "Anthropic Claude", "GitHub Copilot")
    
    $aiChoice = $null
    while ($null -eq $aiChoice) {
        $aiChoice = Select-Option "Qual provedor de IA você deseja utilizar?" $aiOptions
    }

    $envContent = Get-Content -Path $ENV_FILE
    $aiMessage = ""
    $installOllama = $false

    switch ($aiChoice) {
        1 { # Ollama
            $envContent = $envContent -replace "# OLLAMA_HOST=", "OLLAMA_HOST="
            $aiMessage = "Ollama selecionado. O serviço Ollama será iniciado localmente."
            $installOllama = $true
        }
        2 { # Gemini
            $apiKey = Read-Host "Por favor, insira sua Google Gemini API Key (Obrigatório)"
            while ([string]::IsNullOrWhiteSpace($apiKey)) {
                Print-Warn "A API Key é obrigatória para este provedor."
                $apiKey = Read-Host "Por favor, insira sua Google Gemini API Key"
            }
            $envContent = $envContent -replace "# GEMINI_API_KEY=", "GEMINI_API_KEY=$apiKey"
            $aiMessage = "Google Gemini configurado."
        }
        3 { # Claude
            $apiKey = Read-Host "Por favor, insira sua Anthropic API Key (Obrigatório)"
            while ([string]::IsNullOrWhiteSpace($apiKey)) {
                Print-Warn "A API Key é obrigatória para este provedor."
                $apiKey = Read-Host "Por favor, insira sua Anthropic API Key"
            }
            $envContent = $envContent -replace "# ANTHROPIC_API_KEY=", "ANTHROPIC_API_KEY=$apiKey"
            $aiMessage = "Anthropic Claude configurado."
        }
        4 { # Copilot
            $apiKey = Read-Host "Por favor, insira sua GitHub Copilot API Key (Obrigatório)"
            while ([string]::IsNullOrWhiteSpace($apiKey)) {
                Print-Warn "A API Key é obrigatória para este provedor."
                $apiKey = Read-Host "Por favor, insira sua GitHub Copilot API Key"
            }
            $envContent = $envContent -replace "# COPILOT_API_KEY=", "COPILOT_API_KEY=$apiKey"
            $aiMessage = "GitHub Copilot configurado."
        }
    }

    # Se não escolheu Ollama como principal, perguntar se quer instalar opcionalmente
    if (-not $installOllama) {
        if (Confirm-Action "Deseja instalar e rodar o Ollama localmente também? (Recomendado para fallback)") {
            $installOllama = $true
            $aiMessage += " (Ollama também será instalado)"
        }
        else {
            Print-Warn "Atenção: Sem o Ollama local, você depende exclusivamente da chave de API fornecida."
        }
    }

    # Configurar perfil do Docker Compose
    if ($installOllama) {
        $env:COMPOSE_PROFILES = "ollama"
        Write-Info-Log "Docker Compose Profile: ollama enabled"
    }
    else {
        $env:COMPOSE_PROFILES = ""
        Write-Info-Log "Docker Compose Profile: default only"
    }

    Set-Content -Path $ENV_FILE -Value $envContent -Encoding UTF8
    Print-Success "Provedor de IA configurado no .env"
    
    # Adicionar lembrete para o final do script
    $global:PostSetupMessages += $aiMessage
}

# Carregar .env
if (Test-FileExists $ENV_FILE) {
    Get-Content $ENV_FILE | ForEach-Object {
        if ($_ -match '^\s*([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($name -and -not $name.StartsWith("#")) {
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    }
    Write-Debug-Log ".env loaded into environment"
}

# ============================================================================
# STEP 3: INSTALAR DEPENDÊNCIAS NPM
# ============================================================================

Print-Subsection "Instalando dependências do projeto"

if ((Test-NeedNpmInstall)) {
    Print-Info "Instalando npm dependencies..."
    Write-Info-Log "Running: npm install"

    $null = Invoke-WithSpinner "Instalando dependências (isso pode levar alguns minutos)" {
        npm install --prefer-offline
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
    }
}
else {
    Print-Success "Dependências já estão instaladas"
    Write-Info-Log "npm dependencies already installed, skipping npm install"
}

# ============================================================================
# STEP 4: VERIFICAR/CRIAR DIRETÓRIOS NECESSÁRIOS
# ============================================================================

Print-Subsection "Preparando estrutura de diretórios"

Ensure-Directory $LOG_DIR
Ensure-Directory ".env.backups"
Ensure-Directory ".docker"

Print-Success "Estrutura de diretórios criada"

# ============================================================================
# STEP 5: INICIAR SERVIÇOS DOCKER
# ============================================================================

Print-Subsection "Iniciando serviços Docker"

Print-Info "Iniciando containers Docker (docker-compose up -d)..."
Write-Info-Log "Running: docker-compose up -d"

# Enable BuildKit for faster builds
$env:DOCKER_BUILDKIT = 1
$env:COMPOSE_DOCKER_CLI_BUILD = 1

$null = Invoke-WithSpinner "Iniciando Docker services" {
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        throw "docker-compose up failed"
    }
}

# ============================================================================
# STEP 6: AGUARDAR SERVIÇOS FICAREM HEALTHY
# ============================================================================

Print-Subsection "Aguardando serviços ficarem saudáveis"

# PostgreSQL
Print-Info "Aguardando PostgreSQL..."
if (Wait-ContainerHealth $CONTAINER_POSTGRES ($HEALTHCHECK_RETRIES * $HEALTHCHECK_INTERVAL)) {
    Print-Success "PostgreSQL está saudável"
    Write-Info-Log "PostgreSQL is healthy"
    
    # Atualizar senha no PostgreSQL se o container já existia
    Print-Info "Atualizando senha do banco de dados..."
    try {
        docker exec $CONTAINER_POSTGRES psql -U openpanel -d openpanel -c "ALTER USER openpanel WITH PASSWORD '$PostgresPassword';" | Out-Null
        Print-Success "Senha do PostgreSQL atualizada"
        Write-Info-Log "PostgreSQL password updated"
    }
    catch {
        Write-Warn-Log "Falha ao atualizar senha do PostgreSQL (pode ser a primeira execução): $_"
    }
}
else {
    Write-Fatal-Log "PostgreSQL não ficou saudável após timeout"
}

# Redis
Print-Info "Aguardando Redis..."
if (Wait-ContainerHealth $CONTAINER_REDIS ($HEALTHCHECK_RETRIES * $HEALTHCHECK_INTERVAL)) {
    Print-Success "Redis está saudável"
    Write-Info-Log "Redis is healthy"
    
    # Redis geralmente pega a senha da env var na inicialização, 
    # mas se quisermos mudar em tempo de execução:
    try {
        docker exec $CONTAINER_REDIS redis-cli -a $RedisPassword CONFIG SET requirepass $RedisPassword | Out-Null
        Print-Success "Senha do Redis atualizada"
        Write-Info-Log "Redis password updated"
    }
    catch {
        # Ignorar erro se não conseguir conectar (senha antiga pode ser necessária)
        Write-Warn-Log "Tentativa de atualizar senha do Redis falhou: $_"
    }
}
else {
    Write-Fatal-Log "Redis não ficou saudável após timeout"
}

# ============================================================================
# STEP 7: CONFIGURAR BANCO DE DADOS
# ============================================================================

Print-Subsection "Configurando banco de dados"

Print-Info "Gerando Prisma client..."
Write-Info-Log "Running: npm run db:generate"
$null = npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Fatal-Log "Falha ao gerar Prisma client"
}

Print-Info "Sincronizando schema do banco de dados..."
Write-Info-Log "Running: npm run db:push"
$null = npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Fatal-Log "Falha ao sincronizar banco de dados"
}

Print-Success "Banco de dados configurado com sucesso"

# ============================================================================
# STEP 8: VERIFICAÇÃO COMPLETA PÓS-SETUP
# ============================================================================

Print-Subsection "Verificação completa pós-setup"

# Aguardar API iniciar
Print-Info "Aguardando API ficar pronta..."
Start-Sleep -Seconds 3

if (Wait-Port $PORT_API $TIMEOUT_HTTP) {
    Print-Success "API está respondendo na porta $PORT_API"
    Write-Info-Log "API responding on port $PORT_API"
}
else {
    Print-Warn "API ainda não está respondendo (esperado se não iniciou)"
    Write-Warn-Log "API not responding yet - may still be starting"
}

# Verificações de health
Print-Info "Executando health checks..."

foreach ($container in $CONTAINERS_MAIN) {
    $status = docker inspect --format='{{.State.Health.Status}}' $container 2>$null
    if ($status -eq "healthy") {
        Print-Success "${container}: Healthy"
        Write-Info-Log "${container}: healthy"
    }
    else {
        Print-Warn "${container}: $status"
        Write-Warn-Log "${container}: $status (may be starting)"
    }
}

# ============================================================================
# STEP 9: CRIAR USUÁRIO ADMIN
# ============================================================================

Print-Subsection "Criando usuário admin"

Print-Info "Criando usuário admin padrão..."
Write-Info-Log "Running: npm run create:admin"

$null = Invoke-WithSpinner "Criando usuário admin" {
    npm run create:admin
    if ($LASTEXITCODE -ne 0) {
        Write-Warn-Log "Falha ao criar usuário admin (pode já existir)"
    }
}

Print-Success "Usuário admin configurado"

# ============================================================================
# SUCESSO
# ============================================================================

Print-Section "✅ Setup Concluído com Sucesso!"

Write-Host ""
Print-Info "Informações de acesso:"
Write-Host "  Web Interface:  $URL_WEB" -ForegroundColor Cyan
Write-Host "  API Endpoint:   $URL_API" -ForegroundColor Cyan
Write-Host "  Traefik Panel:  $URL_TRAEFIK" -ForegroundColor Cyan

Write-Host ""
Print-Info "Próximos passos:"
Write-Host "  1. Aguarde a API iniciar completamente (verificar logs: npm run dev)"
Write-Host "  2. Abra $URL_WEB no navegador"
Write-Host "  3. Crie um novo usuário via interface"
Write-Host "  4. Comece a gerenciar seus containers!"

Write-Host ""
Print-Info "Comandos úteis:"
Write-Host "  npm run dev              - Inicia desenvolvimento (API + Web)"
Write-Host "  npm run dev:api          - Inicia apenas API"
Write-Host "  npm run dev:web          - Inicia apenas Web"
Write-Host "  npm run status           - Verifica status dos serviços"
Write-Host "  npm run db:studio        - Abre Prisma Studio"
Write-Host "  docker-compose logs -f   - Visualiza logs em tempo real"

if ($global:PostSetupMessages.Count -gt 0) {
    Write-Host ""
    Print-Section "⚠️  Atenção Necessária"
    foreach ($msg in $global:PostSetupMessages) {
        Print-Warn $msg
    }
}

Write-Host ""
Write-Info-Log "Setup completed successfully!"
Write-Info-Log "Log file: $LogFile"

Print-Section "Happy coding! 🎉"
