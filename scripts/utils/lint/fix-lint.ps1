# Script para corrigir erros de lint em arquivos markdown
param(
    [string]$DocsPath = "docs"
)

$ErrorActionPreference = "Continue"

Write-Host "🔧 Corrigindo erros de lint em arquivos markdown..." -ForegroundColor Cyan
Write-Host ""

$fixed = 0
$files = Get-ChildItem "$DocsPath/*.md" -Recurse -ErrorAction SilentlyContinue

foreach ($file in $files) {
    Write-Host "Processando: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # 1. Remover fence markdown de 4 backticks no início (````markdown ou ````)
    $content = $content -replace "^````markdown\n", ""
    $content = $content -replace "^````\n", ""
    
    # 2. Remover fence markdown de 4 backticks no final (````)
    $content = $content -replace "\n````$", ""
    $content = $content -replace "\n````", "`n"
    
    # 3. Corrigir spacing ao redor de headings (adicionar linha em branco antes de #)
    # Mas apenas se não houver já
    $content = $content -replace "([^\n])\n(#{1,6} )", "`$1`n`n`$2"
    
    # 4. Remover múltiplos espaços em branco consecutivos (mais de 2 linhas vazias)
    $content = $content -replace "`n`n`n+", "`n`n"
    
    # 5. Garantir que o arquivo termina com uma única newline
    $content = $content -replace "`s+$", ""
    if ($content -and !$content.EndsWith("`n")) {
        $content += "`n"
    }
    
    # 6. Corrigir espaços em branco nas linhas (trailing spaces)
    $lines = $content -split "`n"
    $lines = $lines | ForEach-Object { $_ -replace '\s+$', '' }
    $content = $lines -join "`n"
    
    # Verificar se houve mudanças
    if ($originalContent -ne $content) {
        Write-Host "  ✓ Corrigido" -ForegroundColor Green
        Set-Content $file.FullName -Value $content -Encoding UTF8
        $fixed++
    } else {
        Write-Host "  - Sem mudanças" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Concluído!" -ForegroundColor Green
Write-Host "📊 Arquivos corrigidos: $fixed" -ForegroundColor Cyan
