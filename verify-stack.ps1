# Verification rapide de l'infra Twin6 (Eureka, Config, Gateway, Keycloak, Mongo, RabbitMQ).
# Usage: powershell -ExecutionPolicy Bypass -File .\verify-stack.ps1
# Depuis le dossier MS/

$ErrorActionPreference = "Continue"

function Test-Url {
    param(
        [string]$Name,
        [string]$Uri,
        [int[]]$OkCodes
    )
    if (-not $OkCodes -or $OkCodes.Count -eq 0) {
        $OkCodes = @(200)
    }
    try {
        $r = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 5
        $code = [int]$r.StatusCode
        if ($OkCodes -contains $code) {
            Write-Host "  [OK] $Name ($code) $Uri" -ForegroundColor Green
            return $true
        }
        Write-Host "  [??] $Name ($code attendu $($OkCodes -join '|')) $Uri" -ForegroundColor Yellow
        return $false
    } catch {
        Write-Host "  [KO] $Name - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-TcpPort {
    param([string]$Name, [string]$ComputerName, [int]$Port)
    try {
        $t = Test-NetConnection -ComputerName $ComputerName -Port $Port -WarningAction SilentlyContinue
        if ($t.TcpTestSucceeded) {
            Write-Host "  [OK] $Name (TCP ${ComputerName}:${Port})" -ForegroundColor Green
            return $true
        }
        Write-Host "  [KO] $Name - port $Port ferme ou injoignable" -ForegroundColor Red
        return $false
    } catch {
        Write-Host "  [KO] $Name - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host ""
Write-Host "=== Twin6 - verification stack ===" -ForegroundColor Cyan
Write-Host ""

$null = Test-Url "Eureka" "http://localhost:8761/"
$null = Test-Url "Config Server (health)" "http://localhost:8888/actuator/health"
$null = Test-Url "API Gateway (health)" "http://localhost:8080/actuator/health"
$null = Test-Url "Keycloak realm (well-known)" "http://localhost:8180/realms/school-realm/.well-known/openid-configuration"
$null = Test-Url "MSNotes (optionnel)" "http://localhost:8089/" @(200, 404)

Write-Host ""
Write-Host "--- Ports (infra locale) ---" -ForegroundColor Cyan
Write-Host ""

$null = Test-TcpPort "MongoDB" "127.0.0.1" 27017
$null = Test-TcpPort "RabbitMQ AMQP" "127.0.0.1" 5672

Write-Host ""
Write-Host "--- Rappels ---" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Portail SPA : ouvrir http://localhost:5173 dans Chrome/Edge (onglet complet), pas dans un iframe (apercu IDE)." -ForegroundColor Gray
Write-Host "  Swagger gateway : http://localhost:8080/swagger-gateway.html" -ForegroundColor Gray
Write-Host "  Comptes Keycloak : chef.test / enseignant.test / etudiant.test / admin.test (voir LOCAL-RUN.md)"
Write-Host ""
