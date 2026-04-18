import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api, { setEnseignantRoleHeaderSupplier } from '../api/axiosInstance';
import type {
  EnseignantRoleLabel,
  EnseignantSession,
  EtudiantPortail,
  EtudiantSession,
  NotesInscriptionRow,
} from '../types';
import { normalizeEnseignantRole } from '../utils/role';
import keycloak from '../keycloak';

export type UserKind = 'etudiant' | 'enseignant' | null;

export type KeycloakUserInfo = {
  name?: string;
  email?: string;
  preferred_username?: string;
};

type AuthCtx = {
  keycloak: typeof keycloak;
  token: string | undefined;
  userInfo: KeycloakUserInfo | null;
  hasRole: (role: string) => boolean;
  isChefEnseignant: () => boolean;
  isEnseignant: () => boolean;
  isEtudiant: () => boolean;
  getRoleLabel: () => string;
  userKind: UserKind;
  etudiant: EtudiantSession | null;
  enseignant: import('../types').EnseignantSession | null;
  loading: boolean;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

function realmRolesFromToken(): string[] {
  const parsed = keycloak.tokenParsed as { realm_access?: { roles?: string[] } } | undefined;
  return parsed?.realm_access?.roles ?? [];
}

function deriveUserKind(roles: string[]): UserKind {
  const chef = roles.includes('ROLE_CHEF_ENSEIGNANT');
  const ens = roles.includes('ROLE_ENSEIGNANT') || chef;
  const etu = roles.includes('ROLE_ETUDIANT');
  if (ens) return 'enseignant';
  if (etu) return 'etudiant';
  return null;
}

function enseignantRoleFromKeycloak(roles: string[]): EnseignantRoleLabel {
  if (roles.includes('ROLE_CHEF_ENSEIGNANT')) return 'Chef Enseignant';
  return 'Enseignant';
}

/** Évite un appel XHR vers Keycloak `/account` (souvent bloqué par CORS si Web Origins non configurés). */
function userInfoFromToken(): KeycloakUserInfo {
  const p = keycloak.tokenParsed as Record<string, unknown> | undefined;
  const gn = p?.given_name as string | undefined;
  const fn = p?.family_name as string | undefined;
  const combined = gn && fn ? `${gn} ${fn}` : undefined;
  return {
    name: (p?.name as string) ?? combined ?? (p?.preferred_username as string) ?? undefined,
    email: (p?.email as string) ?? undefined,
    preferred_username: (p?.preferred_username as string) ?? undefined,
  };
}

async function buildPortailForEtudiant(classeId: number | null | undefined): Promise<EtudiantPortail> {
  let notesInscriptions: NotesInscriptionRow[] | null = null;
  try {
    const { data } = await api.get<NotesInscriptionRow[]>(`/notes/me`);
    notesInscriptions = Array.isArray(data) ? data : null;
  } catch {
    notesInscriptions = null;
  }
  const matiereIds = new Set<number>();
  if (notesInscriptions) {
    for (const row of notesInscriptions) {
      if (row.matiereId != null) matiereIds.add(row.matiereId);
    }
  }
  const matieres: NonNullable<EtudiantPortail['matieres']> = [];
  for (const mid of matiereIds) {
    try {
      const { data } = await api.get<{ id?: number; nom?: string; description?: string | null }>(`/matieres/${mid}`);
      if (data?.id != null) {
        matieres.push({ id: data.id, nom: data.nom ?? '', description: data.description });
      }
    } catch {
      /* ignore */
    }
  }
  let classe: EtudiantPortail['classe'] = null;
  if (classeId != null) {
    try {
      const { data } = await api.get<{ id?: number; nom?: string; description?: string | null }>(
        `/classes/${classeId}`,
      );
      if (data?.id != null) {
        classe = { id: data.id, nom: data.nom ?? '', description: data.description };
      }
    } catch {
      classe = null;
    }
  }
  return { classe, matieres, notesInscriptions };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<KeycloakUserInfo | null>(null);
  const [userKind, setUserKind] = useState<UserKind>(null);
  const [etudiant, setEtudiant] = useState<EtudiantSession | null>(null);
  const [enseignant, setEnseignant] = useState<EnseignantSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSessions = useCallback(async () => {
    const roles = realmRolesFromToken();
    const kind = deriveUserKind(roles);
    setUserKind(kind);

    const parsed = keycloak.tokenParsed as Record<string, unknown> | undefined;
    const ensIdRaw = parsed?.school_enseignant_id;
    const etuIdRaw = parsed?.school_etudiant_id;
    const ensId = ensIdRaw != null && ensIdRaw !== '' ? Number(ensIdRaw) : NaN;
    const etuId = etuIdRaw != null && etuIdRaw !== '' ? Number(etuIdRaw) : NaN;

    if (kind === 'enseignant') {
      type EnsRow = {
        id?: number;
        nom?: string;
        description?: string | null;
        matricule?: string;
        role?: string;
      };
      const okEns = (s: number) => s === 200 || s === 404;
      const res = await api.get<EnsRow[]>('/enseignants/me', { validateStatus: okEns });
      const row =
        res.status === 200 && Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : undefined;
      if (row?.id != null) {
        const roleLabel = normalizeEnseignantRole(row.role ?? enseignantRoleFromKeycloak(roles));
        setEnseignant({
          id: row.id,
          nom: row.nom ?? '',
          description: row.description,
          matricule: row.matricule ?? '',
          role: roleLabel,
        });
      } else {
        const fallbackId = Number.isInteger(ensId) && ensId > 0 ? ensId : 0;
        setEnseignant({
          id: fallbackId,
          nom: (parsed?.name as string) ?? '',
          description: null,
          matricule: (parsed?.preferred_username as string) ?? '',
          role: enseignantRoleFromKeycloak(roles),
        });
      }
      setEtudiant(null);
    } else if (kind === 'etudiant') {
      type EtudiantMe = {
        id?: number;
        nom?: string;
        description?: string | null;
        matricule?: string;
        classeId?: number | null;
      };
      const okStatus = (s: number) => s === 200 || s === 404;
      const res = await api.get<EtudiantMe>(`/etudiants/me`, { validateStatus: okStatus });
      if (res.status === 200 && res.data != null && res.data.id != null) {
        const data = res.data;
        const portail = await buildPortailForEtudiant(data.classeId);
        setEtudiant({
          id: data.id ?? (Number.isInteger(etuId) && etuId > 0 ? etuId : 0),
          nom: data.nom ?? '',
          description: data.description,
          matricule: data.matricule ?? '',
          portail,
        });
      } else {
        /** 404 : aucune fiche MSEtudiant liée au compte Keycloak (sub / matricule). */
        let portail = await buildPortailForEtudiant(undefined);
        try {
          const cm = await api.get<{ id?: number; nom?: string; description?: string | null }>(`/classes/me`, {
            validateStatus: okStatus,
          });
          if (cm.status === 200 && cm.data?.id != null) {
            portail = {
              classe: {
                id: cm.data.id,
                nom: cm.data.nom ?? '',
                description: cm.data.description ?? null,
              },
              matieres: portail.matieres,
              notesInscriptions: portail.notesInscriptions,
            };
          }
        } catch {
          /* ignore */
        }
        const p = parsed;
        setEtudiant({
          id: Number.isInteger(etuId) && etuId > 0 ? etuId : 0,
          nom: (p?.name as string) ?? (p?.preferred_username as string) ?? '',
          description: null,
          matricule: (p?.preferred_username as string) ?? '',
          portail,
        });
      }
      setEnseignant(null);
    } else {
      setEtudiant(null);
      setEnseignant(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!cancelled) setUserInfo(userInfoFromToken());
      await refreshSessions();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSessions]);

  useEffect(() => {
    if (enseignant) {
      setEnseignantRoleHeaderSupplier(() => enseignant.role);
    } else {
      setEnseignantRoleHeaderSupplier(() => undefined);
    }
  }, [enseignant]);

  const logout = useCallback(() => {
    setEnseignantRoleHeaderSupplier(() => undefined);
    keycloak.logout({ redirectUri: window.location.origin + '/' });
  }, []);

  const hasRole = useCallback((role: string) => keycloak.hasRealmRole(role), []);

  const isChefEnseignant = useCallback(() => keycloak.hasRealmRole('ROLE_CHEF_ENSEIGNANT'), []);
  const isEnseignant = useCallback(
    () => keycloak.hasRealmRole('ROLE_ENSEIGNANT') || keycloak.hasRealmRole('ROLE_CHEF_ENSEIGNANT'),
    [],
  );
  const isEtudiant = useCallback(() => keycloak.hasRealmRole('ROLE_ETUDIANT'), []);
  const getRoleLabel = useCallback(() => {
    if (isChefEnseignant()) return 'Chef enseignant';
    if (keycloak.hasRealmRole('ROLE_ENSEIGNANT')) return 'Enseignant';
    if (isEtudiant()) return 'Étudiant';
    return 'Inconnu';
  }, [isChefEnseignant, isEtudiant]);

  const value = useMemo(
    () => ({
      keycloak,
      token: keycloak.token,
      userInfo,
      hasRole,
      isChefEnseignant,
      isEnseignant,
      isEtudiant,
      getRoleLabel,
      userKind,
      etudiant,
      enseignant,
      loading,
      logout,
    }),
    [
      userInfo,
      hasRole,
      isChefEnseignant,
      isEnseignant,
      isEtudiant,
      getRoleLabel,
      userKind,
      etudiant,
      enseignant,
      loading,
      logout,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
