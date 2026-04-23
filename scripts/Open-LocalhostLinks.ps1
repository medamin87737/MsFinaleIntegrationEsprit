#Requires -Version 5.1
# Ouvre la page d'index des liens localhost, puis le navigateur sur les URLs principales (avec delai).
$here = $PSScriptRoot
$html = Join-Path $here 'localhost-links.html'
if (-not (Test-Path $html)) {
    Write-Host "Fichier introuvable: $html" -ForegroundColor Red
    exit 1
}

Write-Host "Ouverture du tableau de liens..." -ForegroundColor Cyan
Start-Process $html

$urls = @(
    'http://localhost:8080/swagger-ui.html',
    'http://localhost:8761/',
    'http://localhost:8180/',
    'http://localhost:8080/actuator/health'
)

Write-Host "Ouverture des onglets services (apres LOCAL-RUN.md)..." -ForegroundColor Yellow
foreach ($u in $urls) {
    Start-Process $u
    Start-Sleep -Milliseconds 500
}

Write-Host "Termine. Portail dev (npm run dev) : http://localhost:5173/" -ForegroundColor Green
exit 0
