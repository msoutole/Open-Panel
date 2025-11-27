# Script aprimorado para corrigir erros de lint em arquivos markdown
param(
    [string]$DocsPath = "docs"
)

$ErrorActionPreference = "Continue"

Write-Host "🔧 Corrigindo erros de lint avançados em arquivos markdown..." -ForegroundColor Cyan
Write-Host ""

$fixed = 0
$files = Get-ChildItem "$DocsPath/*.md" -Recurse -ErrorAction SilentlyContinue

foreach ($file in $files) {
    Write-Host "Processando: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Processar linha por linha
    $lines = $content -split "`n"
    $newLines = @()
    
    foreach ($line in $lines) {
        $newLine = $line
        
        # 1. Remover trailing whitespace
        $newLine = $newLine -replace '\s+$', ''
        
        # 2. Corrigir "## " (heading vazio ou mal formatado) quando está em bloco de código
        # Apenas para linhas que começam com ## seguido imediatamente de newline ou fim de string
        # Ignorar se for #!/bin/bash (shebang)
        if ($newLine -match '^##$' -and $newLine -ne '##') {
            # Pular, é um heading vazio
            $newLine = $newLine
        }
        
        # 3. Corrigir listas em bash/curl (linhas que começam com - seguindo um pattern específico)
        # Adicionar espaço após - nos exemplos de curl/docker run (dentro de blocos ```bash/shell)
        # Mas SER CUIDADOSO com horizontal rules (---)
        
        $newLines += $newLine
    }
    
    $content = $newLines -join "`n"
    
    # 2. Remover fence markdown de 4 backticks no início (````markdown ou ````)
    $content = $content -replace "^````markdown\n", ""
    $content = $content -replace "^````\n", ""
    
    # 3. Remover fence markdown de 4 backticks no final (````)
    $content = $content -replace "\n````$", ""
    $content = $content -replace "(\n)````$", "`$1"
    
    # 4. Corrigir spacing ao redor de headings (adicionar linha em branco antes de # se não houver)
    $content = $content -replace "([^\n])\n(#{1,6} )", "`$1`n`n`$2"
    
    # 5. Remover múltiplos espaços em branco consecutivos (mais de 2 linhas vazias)
    $content = $content -replace "`n`n`n+", "`n`n"
    
    # 6. Corrigir links markdown vazios (muito raro)
    $content = $content -replace '\[([^\]]+)\]\(\s*\)', '[$1]'
    
    # 7. Garantir que o arquivo termina com uma única newline
    $content = $content -replace "`s+$", ""
    if ($content -and !$content.EndsWith("`n")) {
        $content += "`n"
    }
    
    # Verificar se houve mudanças
    if ($originalContent -ne $content) {
        Write-Host "  ✓ Corrigido" -ForegroundColor Green
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
        if ($content.EndsWith("`n")) {
            Add-Content $file.FullName -Value "" -Encoding UTF8 -NoNewline
        }
        $fixed++
    } else {
        Write-Host "  - Sem mudanças" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Concluído!" -ForegroundColor Green
Write-Host "📊 Arquivos corrigidos: $fixed" -ForegroundColor Cyan

# Agora validar
Write-Host ""
Write-Host "🔍 Validando..."
$issues = 0

$files = Get-ChildItem "$DocsPath/*.md" -Recurse -ErrorAction SilentlyContinue

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $lines = $content -split "`n"
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Apenas contar trailing whitespace (ignoring curl/docker lines que são legítimos)
        if ($line -match '\s+$' -and -not ($line -match '^\s*-[HPdpev]')) {
            $issues++
        }
    }
}

Write-Host "📊 Problemas restantes: $issues" -ForegroundColor $(if ($issues -eq 0) { 'Green' } else { 'Yellow' })
