import axios from 'axios';
import { toast } from 'react-toastify';
import keycloak from '../keycloak';

const baseURL = import.meta.env.VITE_API_URL ?? '/api';

/** En-tête X-Enseignant-Role pour les routes enseignant (Chef / Enseignant) — fourni dynamiquement. */
let enseignantRoleHeaderSupplier: () => string | undefined = () => undefined;

export function setEnseignantRoleHeaderSupplier(fn: () => string | undefined) {
  enseignantRoleHeaderSupplier = fn;
}

const axiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(async (config) => {
  try {
    await keycloak.updateToken(30);
  } catch {
    keycloak.login();
    return config;
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
      try {
        await keycloak.updateToken(5);
        error.config.headers = error.config.headers ?? {};
        error.config.headers.Authorization = `Bearer ${keycloak.token}`;
        return axiosInstance.request(error.config);
      } catch {
        keycloak.login();
      }
    }
    if (error.response?.status === 403) {
      toast.error("Accès refusé : vous n'avez pas les droits pour cette action");
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
