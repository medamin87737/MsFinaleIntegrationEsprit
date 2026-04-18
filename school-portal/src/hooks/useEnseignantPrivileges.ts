import { useAuth } from '../context/AuthContext';
import type { EnseignantRoleLabel } from '../types';

/**
 * Règles alignées sur les intercepteurs Spring / Nest (X-Enseignant-Role).
 *
 * - Référentiels (étudiants, classes, matières, salles, annuaire enseignants) : écritures → Chef uniquement.
 * - Notes : lecture Enseignant + Chef ; écritures → Enseignant uniquement.
 */
export function useEnseignantPrivileges() {
  const { enseignant } = useAuth();
  const role = (enseignant?.role ?? 'Enseignant') as EnseignantRoleLabel;
  const isChef = role === 'Chef Enseignant';

  return {
    role,
    isChef,
    isEnseignantSeul: role === 'Enseignant',
    /** POST / PUT / DELETE sur étudiants, classes, matières, salles, enseignants */
    canManageRefData: isChef,
    /** POST / PUT sur /notes (inscriptions, notes) */
    canWriteNotes: role === 'Enseignant',
    /** GET /enseignants (liste) — Chef uniquement côté API */
    canListAllEnseignants: isChef,
  };
}
