# ===== What-A-Toy! local dev server (PowerShell) =====
Set-Location -Path $PSScriptRoot

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command py -ErrorAction SilentlyContinue
}

if (-not $python) {
    Write-Host "Python was not found on this machine." -ForegroundColor Red
    Write-Host "Install Python from https://www.python.org/downloads/ then re-run this script."
    exit 1
}

Write-Host ""
Write-Host "  What-A-Toy! is starting..." -ForegroundColor Yellow
Write-Host "  Open your browser at:  http://localhost:8000" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop."
Write-Host ""

& $python.Source -m http.server 8000
