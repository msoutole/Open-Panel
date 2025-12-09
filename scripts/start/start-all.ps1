# OpenPanel - Inicialização completa (wrapper para npm start)

Write-Host "========================================" -ForegroundColor Green
Write-Host "  OpenPanel - Inicialização completa" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "-> Este wrapper apenas chama npm start para você."
Write-Host "-> Pré-requisitos: Node 18+, npm 10+, Docker Desktop com Compose." -ForegroundColor Cyan
Write-Host ""

try {
    $pushed = $false
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Resolve-Path (Join-Path $scriptDir "..\..")

    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "npm não encontrado. Instale Node.js (inclui npm) e tente novamente." -ForegroundColor Red
        exit 1
    }

    Push-Location $projectRoot
    $pushed = $true
    npm start @args
} catch {
    Write-Host "Erro durante a inicialização: $_" -ForegroundColor Red
    exit 1
} finally {
    if ($pushed) {
        Pop-Location | Out-Null
    }
}