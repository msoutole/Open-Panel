# Script para verificar erros de lint em arquivos markdown
param(
    [string]$DocsPath = "docs"
)

Write-Host "🔍 Verificando erros de lint em markdown..." -ForegroundColor Cyan
Write-Host ""

$issues = @()

$files = Get-ChildItem "$DocsPath/*.md" -Recurse -ErrorAction SilentlyContinue

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $lines = $content -split "`n"
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $lineNum = $i + 1
        
        # 1. Verificar linhas com trailing whitespace
        if ($line -match '\s+$') {
            $issues += @{
                File = $file.Name
                Line = $lineNum
                Issue = "Trailing whitespace"
                Content = $line.Trim()
            }
        }
        
        # 2. Verificar fence markdown inválida (````)
        if ($line -match '^````') {
            $issues += @{
                File = $file.Name
                Line = $lineNum
                Issue = "Fence markdown com 4 backticks"
                Content = $line
            }
        }
        
        # 3. Verificar links markdown sem URL
        if ($line -match '\[([^\]]+)\]\(\s*\)') {
            $issues += @{
                File = $file.Name
                Line = $lineNum
                Issue = "Link markdown vazio"
                Content = $line.Trim()
            }
        }
        
        # 4. Verificar listas não alinhadas (falta espaço após -)
        # Ignorar linhas que são flags de comando bash/curl (-H, -d, -p, -v, -e, etc)
        if ($line -match '^\s*-[^ ]' -and $line -notmatch '^\s*---' -and -not ($line -match '^\s*-[HdpveEf]\s')) {
            $issues += @{
                File = $file.Name
                Line = $lineNum
                Issue = "Lista sem espaço após -"
                Content = $line.Trim()
            }
        }
        
        # 5. Verificar headings sem espaço após #
        # Ignorar shebang (#!/bin/bash) e lines vazias (#, ##, etc)
        if ($line -match '^#{1,6}[^ ]' -and $line -notmatch '^#{1,6}\s' -and $line -notmatch '^#!' -and -not ($line -match '^#{1,6}$')) {
            $issues += @{
                File = $file.Name
                Line = $lineNum
                Issue = "Heading sem espaço após #"
                Content = $line.Trim()
            }
        }
        
        # 6. Verificar blocos de código não fechados (muito raramente)
        if ($line -match '^```' -and -not ($line -match '```\w*$')) {
            # Possível fence aberta
        }
    }
}

if ($issues.Count -eq 0) {
    Write-Host "✅ Nenhum erro de lint encontrado!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⚠️  Encontrados $($issues.Count) problemas:" -ForegroundColor Yellow
    Write-Host ""
    
    $issues | Group-Object -Property "File" | ForEach-Object {
        Write-Host "📄 $($_.Name):" -ForegroundColor Cyan
        $_.Group | ForEach-Object {
            Write-Host "  Linha $($_.Line): $($_.Issue)" -ForegroundColor Yellow
            Write-Host "    → $($_.Content)" -ForegroundColor Gray
        }
        Write-Host ""
    }
}

Write-Host "📊 Resumo:" -ForegroundColor Cyan
Write-Host "  Total de arquivos: $($files.Count)"
Write-Host "  Total de problemas: $($issues.Count)"
Write-Host ""
