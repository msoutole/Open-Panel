# Script para rotacionar credenciais expostas (PowerShell)

Write-Host "🔄 Script de Rotação de Credenciais" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script irá gerar novas credenciais seguras e atualizar o .env"
Write-Host ""

# Gerar novas senhas
Write-Host "🔐 Gerando novas credenciais seguras..." -ForegroundColor Yellow

function Generate-SecurePassword {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes) -replace '[=+/]', '' | Select-Object -First 32
}

function Generate-HexSecret {
    $bytes = New-Object byte[] 64
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return ($bytes | ForEach-Object { $_.ToString("x2") }) -join ''
}

$NEW_POSTGRES_PASSWORD = Generate-SecurePassword
$NEW_REDIS_PASSWORD = Generate-SecurePassword
$NEW_JWT_SECRET = Generate-HexSecret

Write-Host "✅ Credenciais geradas" -ForegroundColor Green
Write-Host ""

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado na raiz!" -ForegroundColor Red
    Write-Host "Execute 'npm start' primeiro para criar o .env"
    exit 1
}

Write-Host "📝 Atualizando .env..." -ForegroundColor Yellow
Write-Host ""

# Backup do .env atual
$backupName = ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item ".env" $backupName
Write-Host "✅ Backup criado: $backupName" -ForegroundColor Green

# Ler conteúdo do .env
$envContent = Get-Content ".env" -Raw

# Atualizar POSTGRES_PASSWORD
if ($envContent -match "POSTGRES_PASSWORD=") {
    $envContent = $envContent -replace "POSTGRES_PASSWORD=.*", "POSTGRES_PASSWORD=$NEW_POSTGRES_PASSWORD"
    Write-Host "✅ POSTGRES_PASSWORD atualizado" -ForegroundColor Green
} else {
    $envContent += "`nPOSTGRES_PASSWORD=$NEW_POSTGRES_PASSWORD"
    Write-Host "✅ POSTGRES_PASSWORD adicionado" -ForegroundColor Green
}

# Atualizar DATABASE_URL
if ($envContent -match "DATABASE_URL=") {
    $envContent = $envContent -replace "postgresql://openpanel:[^@]*@", "postgresql://openpanel:$NEW_POSTGRES_PASSWORD@"
    Write-Host "✅ DATABASE_URL atualizado" -ForegroundColor Green
}

# Atualizar REDIS_PASSWORD
if ($envContent -match "REDIS_PASSWORD=") {
    $envContent = $envContent -replace "REDIS_PASSWORD=.*", "REDIS_PASSWORD=$NEW_REDIS_PASSWORD"
    Write-Host "✅ REDIS_PASSWORD atualizado" -ForegroundColor Green
} else {
    $envContent += "`nREDIS_PASSWORD=$NEW_REDIS_PASSWORD"
    Write-Host "✅ REDIS_PASSWORD adicionado" -ForegroundColor Green
}

# Atualizar REDIS_URL
if ($envContent -match "REDIS_URL=") {
    $envContent = $envContent -replace "redis://:[^@]*@", "redis://:$NEW_REDIS_PASSWORD@"
    Write-Host "✅ REDIS_URL atualizado" -ForegroundColor Green
}

# Atualizar JWT_SECRET
if ($envContent -match "JWT_SECRET=") {
    $envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$NEW_JWT_SECRET"
    Write-Host "✅ JWT_SECRET atualizado" -ForegroundColor Green
} else {
    $envContent += "`nJWT_SECRET=$NEW_JWT_SECRET"
    Write-Host "✅ JWT_SECRET adicionado" -ForegroundColor Green
}

# Salvar .env atualizado
Set-Content ".env" $envContent -NoNewline

Write-Host ""
Write-Host "✅ Credenciais rotacionadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Pare os containers Docker:"
Write-Host "   docker-compose down -v"
Write-Host ""
Write-Host "2. Reinicie os containers com as novas credenciais:"
Write-Host "   docker-compose up -d"
Write-Host ""
Write-Host "3. Sincronize os subprojetos:"
Write-Host "   npm start"
Write-Host ""
Write-Host "4. ⚠️  IMPORTANTE: Todos os tokens JWT existentes serão invalidados!" -ForegroundColor Red
Write-Host "   Os usuários precisarão fazer login novamente."
Write-Host ""
Write-Host "5. Atualize as credenciais em qualquer serviço externo que use estas credenciais."
Write-Host ""

