$ErrorActionPreference = "Stop"

Write-Host "=== Nexo Installer ===" -ForegroundColor Cyan
Write-Host ""

$nodeVersion = $null
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Installing electron builder..." -ForegroundColor Yellow
npm install -D electron-builder

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "To start in development mode:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "To build for production:" -ForegroundColor White
Write-Host "  npm run make" -ForegroundColor Gray
Write-Host ""
Write-Host "To add to Windows startup:" -ForegroundColor White
Write-Host "  Start the app, then go to Settings > Startup" -ForegroundColor Gray