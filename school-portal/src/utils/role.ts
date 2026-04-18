import type { EnseignantRoleLabel } from '../types';

/**
 * Aligne la valeur renvoyée par l’API (ou le stockage) sur les libellés attendus
 * par les microservices dans l’en-tête `X-Enseignant-Role`.
 */
export function normalizeEnseignantRole(role: string | undefined | null): EnseignantRoleLabel {
  if (role == null || typeof role !== 'string') return 'Enseignant';
  const r = role.trim();
  if (!r) return 'Enseignant';
  const compact = r.toUpperCase().replace(/[\s_-]/g, '');
  if (compact === 'CHEFENSEIGNANT' || compact === 'CHEF_ENSEIGNANT') {
    return 'Chef Enseignant';
  }
  const lower = r.toLowerCase();
  if (lower === 'chef enseignant') return 'Chef Enseignant';
  if (r === 'Chef Enseignant') return 'Chef Enseignant';
  return 'Enseignant';
}
