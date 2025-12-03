# Script para verificar se há credenciais expostas no repositório Git

Write-Host "🔒 Verificando credenciais expostas no repositório..." -ForegroundColor Cyan

$foundSecrets = $false

# Verificar se arquivos .env estão sendo rastreados
Write-Host "`n📋 Verificando arquivos .env no Git..." -ForegroundColor Cyan
try {
    $envFiles = git ls-files | Select-String -Pattern '\.env$|\.env\.'
    if ($envFiles) {
        Write-Host "❌ ERRO: Arquivos .env estão sendo rastreados pelo Git:" -ForegroundColor Red
        $envFiles | ForEach-Object { Write-Host $_ -ForegroundColor Red }
        $foundSecrets = $true
    } else {
        Write-Host "✅ Nenhum arquivo .env está sendo rastreado" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Não foi possível verificar (pode não ser um repositório Git)" -ForegroundColor Yellow
}

# Verificar histórico do Git
Write-Host "`n📋 Verificando histórico do Git por credenciais expostas..." -ForegroundColor Cyan
try {
    $history = git log --all --full-history --source -- "*/.env" "*/.env.*" 2>$null
    if ($history) {
        Write-Host "⚠️  AVISO: Arquivos .env foram encontrados no histórico do Git" -ForegroundColor Yellow
        Write-Host "   Execute: git log --all --full-history --source -- '*/.env' '*/.env.*'" -ForegroundColor Yellow
        Write-Host "   Veja docs/SECURITY.md para instruções de limpeza" -ForegroundColor Yellow
        $foundSecrets = $true
    } else {
        Write-Host "✅ Nenhum arquivo .env encontrado no histórico" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Não foi possível verificar histórico" -ForegroundColor Yellow
}

# Verificar por padrões de senha no código
Write-Host "`n📋 Verificando padrões de credenciais no código..." -ForegroundColor Cyan
$patterns = @(
    "password.*=.*[a-zA-Z0-9]{20,}",
    "secret.*=.*[a-zA-Z0-9]{32,}",
    "DATABASE_URL.*postgresql://.*:.*@",
    "REDIS_URL.*redis://.*:.*@",
    "GEMINI_API_KEY.*=.*AIza",
    "API_KEY.*=.*[a-zA-Z0-9]{20,}"
)

foreach ($pattern in $patterns) {
    try {
        $matches = git grep -i $pattern -- ':!*.md' ':!docs/*' ':!.env.example' ':!scripts/setup/*' ':!start.js' 2>$null |
            # Ignorar placeholders comuns
            Select-String -Pattern 'changeme|your-super-secret|placeholder' -NotMatch |
            # Ignorar linhas com variáveis (evita falsos positivos em templates e scripts)
            Select-String -Pattern '\$\{|\$[A-Za-z_]+|<password>|<strong-password>' -NotMatch

        if ($matches) {
            Write-Host "❌ Possível credencial encontrada: $pattern" -ForegroundColor Red
            $foundSecrets = $true
        }
    } catch {
        # Ignorar erros
    }
}

if (-not $foundSecrets) {
    Write-Host "`n✅ Nenhuma credencial exposta encontrada" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Credenciais expostas encontradas!" -ForegroundColor Red
    Write-Host "📖 Veja docs/SECURITY.md para instruções de correção" -ForegroundColor Yellow
    exit 1
}

