# Import idempotent du realm school-realm via l'API Admin (Keycloak installe localement, ex. port 8180).
# Usage: powershell -ExecutionPolicy Bypass -File .\keycloak\bootstrap-realm.ps1
# Variables optionnelles: $env:KC_URL = "http://localhost:8180"

$ErrorActionPreference = "Stop"

function Get-KeycloakAdminToken {
    param([string]$BaseUrl, [string]$User, [string]$Password)
    $pair = "grant_type=password&client_id=admin-cli&username=$([uri]::EscapeDataString($User))&password=$([uri]::EscapeDataString($Password))"
    $resp = Invoke-RestMethod -Uri "$BaseUrl/realms/master/protocol/openid-connect/token" -Method Post -Body $pair -ContentType "application/x-www-form-urlencoded"
    return $resp.access_token
}

$kcUrl = if ($env:KC_URL) { $env:KC_URL.TrimEnd('/') } else { "http://localhost:8180" }
$admin = if ($env:KC_ADMIN) { $env:KC_ADMIN } else { "admin" }
$pass = if ($env:KC_ADMIN_PASSWORD) { $env:KC_ADMIN_PASSWORD } else { "admin" }
$realmFile = Join-Path $PSScriptRoot "realm-export.json"

$max = 90
$ready = $false
for ($i = 0; $i -lt $max; $i++) {
    try {
        Invoke-WebRequest -Uri "$kcUrl/realms/master" -UseBasicParsing -TimeoutSec 2 | Out-Null
        $ready = $true
        break
    } catch {
        Start-Sleep -Seconds 1
    }
}
if (-not $ready) {
    throw "Keycloak injoignable apres ${max}s : $kcUrl"
}

if (-not (Test-Path $realmFile)) {
    throw "Fichier introuvable: $realmFile"
}

$token = Get-KeycloakAdminToken -BaseUrl $kcUrl -User $admin -Password $pass

$exists = $false
try {
    Invoke-RestMethod -Uri "$kcUrl/admin/realms/school-realm" -Headers @{ Authorization = "Bearer $token" } -Method Get | Out-Null
    $exists = $true
} catch {
    $resp = $_.Exception.Response
    $notFound = $resp -and [int]$resp.StatusCode -eq 404
    if (-not $notFound) { throw }
}

if ($exists) {
    Write-Host "[bootstrap-realm] Realm school-realm deja present."
    exit 0
}

$body = Get-Content -Raw -Encoding UTF8 $realmFile
try {
    Invoke-RestMethod -Uri "$kcUrl/admin/realms" -Method Post -Headers @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body $body
    Write-Host "[bootstrap-realm] Realm school-realm importe."
} catch {
    $resp = $_.Exception.Response
    if ($resp -and [int]$resp.StatusCode -eq 409) {
        Write-Host "[bootstrap-realm] Realm deja existant (409) — OK."
        exit 0
    }
    throw
}
