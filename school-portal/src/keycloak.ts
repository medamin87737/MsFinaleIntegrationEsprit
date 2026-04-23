import Keycloak from 'keycloak-js';

/** Vite : une variable vide ("") reste telle quelle avec ?? — Keycloak-js construit alors des URLs relatives → 404 sur :5173. */
function envNonEmpty(value: string | undefined, fallback: string): string {
  if (value == null) return fallback;
  const s = String(value).trim();
  return s.length > 0 ? s : fallback;
}

const keycloak = new Keycloak({
  url: envNonEmpty(import.meta.env.VITE_KEYCLOAK_URL, 'http://localhost:8180').replace(/\/$/, ''),
  realm: envNonEmpty(import.meta.env.VITE_KEYCLOAK_REALM, 'school-realm'),
  clientId: envNonEmpty(import.meta.env.VITE_KEYCLOAK_CLIENT_ID, 'school-frontend'),
});

export default keycloak;
