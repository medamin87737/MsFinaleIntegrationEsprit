#Requires -Version 5.1
# Compile tout le monorepo Twin6 (Maven + Nest + Vite).
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "=== 1/5 Maven reacteur (MS\pom.xml) ===" -ForegroundColor Cyan
Set-Location (Join-Path $root 'demoEurekaServer')
.\mvnw.cmd -B -f ..\pom.xml -DskipTests package

Write-Host "=== 2/5 Eureka ===" -ForegroundColor Cyan
.\mvnw.cmd -B -DskipTests package

Write-Host "=== 3/5 Config Server ===" -ForegroundColor Cyan
Set-Location (Join-Path $root 'demoConfigServer')
.\mvnw.cmd -B -DskipTests package

Write-Host "=== 4/5 API Gateway ===" -ForegroundColor Cyan
Set-Location (Join-Path $root 'demoApiGatewayApplication')
.\mvnw.cmd -B -DskipTests package

Write-Host "=== 5/5 MSNotes (Nest) + school-portal (Vite) ===" -ForegroundColor Cyan
Set-Location (Join-Path $root 'MSNotes4twin6')
if (-not (Test-Path 'node_modules')) { npm install }
npm run build
Set-Location (Join-Path $root 'school-portal')
if (-not (Test-Path 'node_modules')) { npm install }
npm run build

Write-Host "`nOK : tout est compile." -ForegroundColor Green
Write-Host "Test visuel portail : cd school-portal ; npm run dev  -> http://localhost:5173/" -ForegroundColor Yellow
Write-Host "Stack locale : voir LOCAL-RUN.md (Keycloak, Mongo, Rabbit, Eureka, ...)" -ForegroundColor Yellow
exit 0
