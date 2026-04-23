import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import keycloak from './keycloak';

declare global {
  interface Window {
    __TWIN6_IFRAME_BLOCKED__?: boolean;
  }
}

/**
 * OAuth2 / Keycloak exige une navigation de premier niveau (pas d’iframe).
 * `index.html` tente déjà `top.location.replace` avant les modules ; ce message couvre
 * les iframes sandbox (aperçu IDE) où l’accès au parent est interdit.
 */
function showIframeBlockMessage(): void {
  const el = document.getElementById('root');
  if (!el) return;
  el.innerHTML = `
    <div style="font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:1.5rem;border:1px solid #ccc;border-radius:8px;background:#1a1a1a;color:#eee">
      <h1 style="font-size:1.1rem;margin:0 0 0.75rem">Connexion Keycloak impossible dans un cadre (iframe)</h1>
      <p style="line-height:1.5;margin:0 0 1rem">N’utilisez pas l’aperçu intégré de l’IDE. Ouvrez le portail dans <strong>Chrome ou Edge</strong> (fenêtre normale) :</p>
      <p style="margin:0"><a href="${window.location.href}" target="_blank" rel="noopener" style="color:#7cb8ff">Ouvrir ${window.location.origin} dans un nouvel onglet</a></p>
    </div>`;
}

function breakOutOrBlockThenInit(): void {
  if (window.__TWIN6_IFRAME_BLOCKED__) {
    showIframeBlockMessage();
    return;
  }
  void runKeycloakInit();
}

/** Redirect URI stable pour eviter les boucles de retour sur des sous-routes. */
function keycloakRedirectUri(): string {
  return `${window.location.origin}/`;
}

function runKeycloakInit(): void {
  void keycloak
    .init({
      onLoad: 'login-required',
      checkLoginIframe: false,
      pkceMethod: 'S256',
      redirectUri: keycloakRedirectUri(),
    })
    .then((authenticated) => {
      if (!authenticated) {
        return;
      }
      if (import.meta.env.DEV) {
        const parsed = keycloak.tokenParsed as
          | {
              iss?: string;
              realm_access?: { roles?: string[] };
              resource_access?: Record<string, { roles?: string[] }>;
            }
          | undefined;
        const allRoles = new Set<string>(parsed?.realm_access?.roles ?? []);
        for (const client of Object.values(parsed?.resource_access ?? {})) {
          for (const r of client?.roles ?? []) allRoles.add(r);
        }
        // Debug dev: verifier rapidement la coherence token (issuer + roles realm).
        // eslint-disable-next-line no-console
        console.info('[Auth debug] keycloak.tokenParsed', {
          iss: parsed?.iss,
          realmRoles: parsed?.realm_access?.roles ?? [],
          allRoles: [...allRoles],
        });
      }
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <App />
              <ToastContainer position="top-right" autoClose={4000} />
            </AuthProvider>
          </BrowserRouter>
        </StrictMode>,
      );
    })
    .catch(() => {
      // eslint-disable-next-line no-console
      console.error('Échec initialisation Keycloak');
    });
}

breakOutOrBlockThenInit();
