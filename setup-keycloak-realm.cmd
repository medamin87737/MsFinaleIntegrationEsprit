@echo off
REM Import automatique du realm school-realm (Keycloak deja demarre sur KC_URL, defaut http://localhost:8180)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0keycloak\bootstrap-realm.ps1"
if errorlevel 1 exit /b 1
echo.
echo Verifiez : http://localhost:8180/realms/school-realm/.well-known/openid-configuration
