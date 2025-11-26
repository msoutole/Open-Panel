# Script to validate all OpenPanel scripts

Write-Host "Validating OpenPanel Scripts" -ForegroundColor Green

$scriptsToValidate = @(
    @{ Path = "scripts\setup\setup.ps1"; Type = "PowerShell" }
    @{ Path = "scripts\setup\setup.sh"; Type = "Bash" }
    @{ Path = "scripts\start\start-all.ps1"; Type = "PowerShell" }
    @{ Path = "scripts\start\start-all.sh"; Type = "Bash" }
    @{ Path = "scripts\status\check-status.ps1"; Type = "PowerShell" }
    @{ Path = "scripts\status\check-status.sh"; Type = "Bash" }
    @{ Path = "scripts\setup.js"; Type = "Node.js" }
    @{ Path = "scripts\start.js"; Type = "Node.js" }
    @{ Path = "scripts\status.js"; Type = "Node.js" }
)

$allValid = $true

foreach ($script in $scriptsToValidate) {
    $fullPath = "D:\Open-Panel\$($script.Path)"
    if (Test-Path $fullPath) {
        Write-Host "OK - $($script.Path) exists" -ForegroundColor Green
        # Check if file has content
        $content = Get-Content $fullPath -Raw
        if ($content -and $content.Trim().Length -gt 0) {
            Write-Host "  $($script.Type) script with content" -ForegroundColor Cyan
        } else {
            Write-Host "  WARNING - Empty file" -ForegroundColor Yellow
            $allValid = $false
        }
    } else {
        Write-Host "MISSING - $($script.Path) is missing" -ForegroundColor Red
        $allValid = $false
    }
}

if ($allValid) {
    Write-Host "All scripts are present and valid!" -ForegroundColor Green
} else {
    Write-Host "Some scripts are missing or invalid!" -ForegroundColor Red
}