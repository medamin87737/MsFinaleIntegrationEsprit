import axios from 'axios';
import { toast } from 'react-toastify';
import keycloak from '../keycloak';

const baseURL = import.meta.env.VITE_API_URL ?? '/api';
let loginRedirectInProgress = false;

/** En-tête X-Enseignant-Role pour les routes enseignant (Chef / Enseignant) — fourni dynamiquement. */
let enseignantRoleHeaderSupplier: () => string | undefined = () => undefined;

export function setEnseignantRoleHeaderSupplier(fn: () => string | undefined) {
  enseignantRoleHeaderSupplier = fn;
}

function ensureLoginRedirect(): void {
  if (loginRedirectInProgress) return;
  loginRedirectInProgress = true;
  void keycloak.login();
}

function shouldAttemptRefreshAfter401(): boolean {
  if (!keycloak.authenticated || !keycloak.token) return false;
  try {
    return keycloak.isTokenExpired(5);
  } catch {
    return false;
  }
}

const axiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(async (config) => {
  config.headers = config.headers ?? {};
  try {
    await keycloak.updateToken(30);
  } catch {
    // Evite une boucle de navigation: on ne relance le login que si la session Keycloak n'est plus authentifiee.
    if (!keycloak.authenticated) ensureLoginRedirect();
    return Promise.reject(new Error('Authentication required: token refresh failed.'));
  }
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  const roleHeader = enseignantRoleHeaderSupplier();
  if (roleHeader) {
    config.headers['X-Enseignant-Role'] = roleHeader;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && error.config) {
      const cfg = error.config as { _retry?: boolean; headers?: Record<string, string> };
      if (!shouldAttemptRefreshAfter401()) {
        if (!keycloak.authenticated) ensureLoginRedirect();
        return Promise.reject(error);
      }
      if (cfg._retry) {
        if (!keycloak.authenticated) ensureLoginRedirect();
        return Promise.reject(error);
      }
      try {
        await keycloak.updateToken(5);
        cfg.headers = cfg.headers ?? {};
        cfg.headers.Authorization = `Bearer ${keycloak.token}`;
        cfg._retry = true;
        return axiosInstance.request(cfg);
      } catch {
        if (!keycloak.authenticated) ensureLoginRedirect();
      }
    }
    const cfg = error.config as
      | { suppressForbiddenToast?: boolean; meta?: { suppressForbiddenToast?: boolean } }
      | undefined;
    const suppress403 = cfg?.suppressForbiddenToast === true || cfg?.meta?.suppressForbiddenToast === true;
    if (error.response?.status === 403 && !suppress403) {
      toast.error("Accès refusé : vous n'avez pas les droits pour cette action");
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
