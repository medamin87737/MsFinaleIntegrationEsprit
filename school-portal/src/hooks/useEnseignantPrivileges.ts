import { useAuth } from '../context/AuthContext';
import type { EnseignantRoleLabel } from '../types';

/**
 * Règles alignées sur les intercepteurs Spring / Nest (X-Enseignant-Role).
 *
 * - Référentiels (étudiants, classes, matières, salles, annuaire enseignants) : écritures → Chef uniquement.
 * - Notes : lecture Enseignant + Chef ; écritures → Enseignant uniquement.
 */
export function useEnseignantPrivileges() {
  const { enseignant, hasRole } = useAuth();
  const role = (enseignant?.role ?? 'Enseignant') as EnseignantRoleLabel;
  const tokenIsChef = hasRole('ROLE_CHEF_ENSEIGNANT') || hasRole('ROLE_ADMIN');
  const tokenIsEnseignant = hasRole('ROLE_ENSEIGNANT');
  const isChef = role === 'Chef Enseignant' || role === 'Administrateur' || tokenIsChef;
  const canReadNotes = tokenIsChef || tokenIsEnseignant;

  return {
    role,
    isChef,
    isEnseignantSeul: role === 'Enseignant',
    /** POST / PUT / DELETE sur étudiants, classes, matières, salles, enseignants */
    canManageRefData: isChef,
    /** GET /notes/** (historique, stats…) */
    canReadNotes,
    /** POST / PUT sur /notes (inscriptions, notes) */
    canWriteNotes: tokenIsEnseignant && !tokenIsChef,
    /** GET /enseignants (liste) — Chef uniquement côté API */
    canListAllEnseignants: isChef,
  };
}
