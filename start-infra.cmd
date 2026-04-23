@echo off
cd /d "%~dp0"
docker compose -f docker-compose.infra.yml up -d
echo.
echo Infra demarree : Mongo 27017, RabbitMQ 5672/15672, Keycloak 8180
echo Import realm : service keycloak-realm-import (API Admin, idempotent)
echo Si besoin : docker compose -f docker-compose.infra.yml logs keycloak-realm-import
timeout /t 3 /nobreak >nul
echo Verifiez : http://localhost:8180/realms/school-realm/.well-known/openid-configuration
pause
