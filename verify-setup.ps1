# Script to verify all setup files were created correctly

Write-Host "Verifying OpenPanel setup files..." -ForegroundColor Green

$filesToCheck = @(
    "scripts/setup/setup.ps1",
    "scripts/setup/setup.sh",
    "scripts/status/check-status.ps1",
    "scripts/status/check-status.sh",
    "scripts/start/start-all.ps1",
    "scripts/start/start-all.sh",
    "scripts/setup.js",
    "scripts/start.js",
    "scripts/status.js"
)

$allFilesExist = $true

foreach ($file in $filesToCheck) {
    $fullPath = "D:\Open-Panel\$file"
    if (Test-Path $fullPath) {
        Write-Host "OK - $file exists" -ForegroundColor Green
    } else {
        Write-Host "MISSING - $file is missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if ($allFilesExist) {
    Write-Host "All setup files are present!" -ForegroundColor Green
} else {
    Write-Host "Some setup files are missing!" -ForegroundColor Red
}