# Repare Keycloak Docker quand Liquibase echoue (ex. CLIENT_TEMPLATE_ATTRIBUTES, migration cassee).
# Efface UNIQUEMENT le volume nomme *keycloak_twin6* puis relance keycloak + import realm.
# Usage (depuis MS/) : powershell -ExecutionPolicy Bypass -File .\reset-keycloak-docker.ps1

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== Reset base Keycloak (Docker) ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Arret des conteneurs keycloak..." -ForegroundColor Gray
docker compose -f docker-compose.infra.yml stop keycloak keycloak-realm-import 2>$null | Out-Null
docker compose -f docker-compose.infra.yml rm -f keycloak keycloak-realm-import 2>$null | Out-Null

$removed = $false
foreach ($line in (docker volume ls -q)) {
    if ($line -match 'keycloak_twin6') {
        Write-Host "Suppression volume: $line" -ForegroundColor Yellow
        docker volume rm $line 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $removed = $true }
    }
}

if (-not $removed) {
    Write-Host "Aucun volume *keycloak_twin6* trouve. Volumes Docker :" -ForegroundColor Yellow
    docker volume ls
    Write-Host "(Si Keycloak utilisait une ancienne image sans volume nomme, faites: docker compose down puis up)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Demarrage keycloak..." -ForegroundColor Cyan
docker compose -f docker-compose.infra.yml up -d keycloak

Write-Host "Attente demarrage (35s)..." -ForegroundColor Gray
Start-Sleep -Seconds 35

Write-Host "Import realm (service keycloak-realm-import)..." -ForegroundColor Cyan
docker compose -f docker-compose.infra.yml up -d keycloak-realm-import

Write-Host ""
Write-Host "Verifiez : http://localhost:8180/realms/school-realm/.well-known/openid-configuration" -ForegroundColor Green
Write-Host "Logs Keycloak : docker compose -f docker-compose.infra.yml logs keycloak --tail 80" -ForegroundColor Gray
Write-Host ""
