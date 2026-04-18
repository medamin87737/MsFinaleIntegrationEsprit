import type { AxiosInstance } from 'axios';
import axiosInstance, { setEnseignantRoleHeaderSupplier } from './axiosInstance';
import type { EnseignantRoleLabel } from '../types';

export { setEnseignantRoleHeaderSupplier };

/** Client HTTP unique : JWT Keycloak + en-tête enseignant (fourni par {@link setEnseignantRoleHeaderSupplier}). */
export const api: AxiosInstance = axiosInstance;

/** @deprecated Utiliser {@link api}. */
export const publicClient = api;

export function roleHeaderForApi(role: EnseignantRoleLabel): string {
  return role;
}

/** @deprecated L’en-tête est géré globalement par AuthProvider ; retourne {@link api}. */
export function createAuthClient(_role: EnseignantRoleLabel): AxiosInstance {
  return axiosInstance;
}
