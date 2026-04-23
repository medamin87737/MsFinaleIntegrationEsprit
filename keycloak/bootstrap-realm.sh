#!/bin/sh
# Import idempotent du realm school-realm via l'API Admin Keycloak.
# Utilisé par docker-compose (service keycloak-realm-import). Variables : KC_URL, KC_ADMIN, KC_ADMIN_PASSWORD

set -eu

if ! command -v curl >/dev/null 2>&1; then
  if command -v apk >/dev/null 2>&1; then
    apk add --no-cache curl jq >/dev/null
  fi
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "[bootstrap-realm] curl requis"
  exit 1
fi

REALM_FILE="${REALM_FILE:-/realm.json}"
KC_URL="${KC_URL:-http://keycloak:8080}"
KC_ADMIN="${KC_ADMIN:-admin}"
KC_ADMIN_PASSWORD="${KC_ADMIN_PASSWORD:-admin}"
MAX_WAIT="${MAX_WAIT:-90}"

i=0
while [ "$i" -lt "$MAX_WAIT" ]; do
  if curl -sf "${KC_URL}/realms/master" >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 1
done

if [ "$i" -ge "$MAX_WAIT" ]; then
  echo "[bootstrap-realm] Keycloak injoignable: ${KC_URL}"
  exit 1
fi

echo "[bootstrap-realm] Keycloak prêt, obtention du jeton admin…"

TOKEN_JSON=$(curl -s -X POST "${KC_URL}/realms/master/protocol/openid-connect/token" \
  -d "username=${KC_ADMIN}" \
  -d "password=${KC_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")

if command -v jq >/dev/null 2>&1; then
  TOKEN=$(echo "$TOKEN_JSON" | jq -r '.access_token // empty')
else
  TOKEN=$(echo "$TOKEN_JSON" | tr -d '\n\r' | sed 's/.*"access_token":"\([^"]*\)".*/\1/')
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] || [ "$TOKEN" = "$TOKEN_JSON" ]; then
  echo "[bootstrap-realm] Échec token admin. Réponse:"
  echo "$TOKEN_JSON" | head -c 400
  echo
  exit 1
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  "${KC_URL}/admin/realms/school-realm")

if [ "$CODE" = "200" ]; then
  echo "[bootstrap-realm] Realm school-realm déjà présent — rien à faire."
  exit 0
fi

if [ ! -f "$REALM_FILE" ]; then
  echo "[bootstrap-realm] Fichier realm introuvable: $REALM_FILE"
  exit 1
fi

echo "[bootstrap-realm] Import du realm (HTTP realm actuel: $CODE)…"

HTTP=$(curl -s -o /tmp/kc_import_err.txt -w "%{http_code}" -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data-binary "@${REALM_FILE}" \
  "${KC_URL}/admin/realms")

if [ "$HTTP" = "201" ]; then
  echo "[bootstrap-realm] Realm school-realm importé (201)."
  exit 0
fi

if [ "$HTTP" = "409" ]; then
  echo "[bootstrap-realm] Realm déjà existant (409) — OK."
  exit 0
fi

echo "[bootstrap-realm] Import échoué (HTTP $HTTP):"
cat /tmp/kc_import_err.txt 2>/dev/null | head -c 800 || true
echo
exit 1
