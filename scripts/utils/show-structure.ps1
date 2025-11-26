# Script to show the organized structure of OpenPanel scripts

Write-Host "========================================" -ForegroundColor Green
Write-Host "  OpenPanel Scripts Organization" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nscripts/" -ForegroundColor Yellow
Write-Host "  setup/" -ForegroundColor Cyan
Write-Host "    setup.ps1  (Windows setup script)" -ForegroundColor White
Write-Host "    setup.sh   (Linux/macOS setup script)" -ForegroundColor White
Write-Host "  start/" -ForegroundColor Cyan
Write-Host "    start-all.ps1  (Windows service starter)" -ForegroundColor White
Write-Host "    start-all.sh   (Linux/macOS service starter)" -ForegroundColor White
Write-Host "  status/" -ForegroundColor Cyan
Write-Host "    check-status.ps1  (Windows status checker)" -ForegroundColor White
Write-Host "    check-status.sh   (Linux/macOS status checker)" -ForegroundColor White
Write-Host "  utils/" -ForegroundColor Cyan
Write-Host "    show-structure.ps1  (This script)" -ForegroundColor White
Write-Host "  setup.js      (Node.js setup script)" -ForegroundColor White
Write-Host "  start.js      (Node.js service starter)" -ForegroundColor White
Write-Host "  status.js     (Node.js status checker)" -ForegroundColor White

Write-Host "`nUsage:" -ForegroundColor Green
Write-Host "  Windows:" -ForegroundColor Cyan
Write-Host "    .\scripts\setup\setup.ps1        # Full setup" -ForegroundColor White
Write-Host "    .\scripts\start\start-all.ps1    # Start all services" -ForegroundColor White
Write-Host "    .\scripts\status\check-status.ps1 # Check status" -ForegroundColor White

Write-Host "`n  Linux/macOS:" -ForegroundColor Cyan
Write-Host "    ./scripts/setup/setup.sh         # Full setup" -ForegroundColor White
Write-Host "    ./scripts/start/start-all.sh     # Start all services" -ForegroundColor White
Write-Host "    ./scripts/status/check-status.sh  # Check status" -ForegroundColor White

Write-Host "`n  Cross-platform (Node.js):" -ForegroundColor Cyan
Write-Host "    npm run setup    # Full setup" -ForegroundColor White
Write-Host "    npm run start    # Start all services" -ForegroundColor White
Write-Host "    npm run status   # Check status" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Green