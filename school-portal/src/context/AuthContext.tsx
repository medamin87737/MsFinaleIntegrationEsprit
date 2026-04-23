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
  const parsed = keycloak.tokenParsed as
    | { realm_access?: { roles?: string[] }; resource_access?: Record<string, { roles?: string[] }> }
    | undefined;
  const out = new Set<string>();
  for (const r of parsed?.realm_access?.roles ?? []) out.add(r);
  const resourceAccess = parsed?.resource_access ?? {};
  for (const client of Object.values(resourceAccess)) {
    for (const r of client?.roles ?? []) out.add(r);
  }
  if (out.has('ROLE_ADMIN') && !out.has('ROLE_CHEF_ENSEIGNANT')) {
    out.add('ROLE_CHEF_ENSEIGNANT');
  }
  return [...out];
}

/**
 * Priorité : un compte **étudiant** n’a que ROLE_ETUDIANT (sans rôles staff).
 * Sinon, tout personnel (enseignant, chef, admin) va vers l’espace enseignant avec privilèges affinés (isChefEnseignant, etc.).
 */
function deriveUserKind(roles: string[]): UserKind {
  const staff =
    roles.includes('ROLE_ADMIN') ||
    roles.includes('ROLE_CHEF_ENSEIGNANT') ||
    roles.includes('ROLE_ENSEIGNANT');
  const etu = roles.includes('ROLE_ETUDIANT');
  if (etu && !staff) return 'etudiant';
  if (staff) return 'enseignant';
  if (etu) return 'etudiant';
  return null;
}

/** Statuts HTTP pour les GET /me : évite qu’axios rejette (ex. 503 gateway / service down). */
function isMeRequestAcceptable(status: number): boolean {
  if (status >= 200 && status < 300) return true;
  if (status === 404) return true;
  if (status === 502 || status === 503 || status === 504) return true;
  return false;
}

function enseignantRoleFromKeycloak(roles: string[]): EnseignantRoleLabel {
  if (roles.includes('ROLE_ADMIN')) return 'Administrateur';
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
  const parsed = keycloak.tokenParsed as Record<string, unknown> | undefined;
  const rawEtuClaim = parsed?.school_etudiant_id ?? parsed?.schoolEtudiantId;
  const canQueryMyNotes = rawEtuClaim != null && String(rawEtuClaim).trim() !== '';
  const notesStatusesOk = (s: number) =>
    (s >= 200 && s < 300) || s === 400 || s === 404 || s === 403;

  if (canQueryMyNotes) {
    try {
      const res = await api.get<NotesInscriptionRow[]>(`/notes/me`, {
        validateStatus: notesStatusesOk,
      });
      if (res.status === 200 && Array.isArray(res.data)) {
        notesInscriptions = res.data;
      } else {
        notesInscriptions = null;
      }
    } catch {
      notesInscriptions = null;
    }
  }
  /** Sans claim, ou si /notes/me n’a pas réussi : id métier via MSEtudiant puis GET /notes/etudiants/{id}. */
  if (notesInscriptions === null) {
    try {
      const meRes = await api.get<{ id?: number }>(`/etudiants/me`, {
        validateStatus: (s) => (s >= 200 && s < 300) || s === 404,
      });
      if (meRes.status === 200 && meRes.data?.id != null) {
        const etuId = Number(meRes.data.id);
        if (Number.isInteger(etuId) && etuId >= 1) {
          const res = await api.get<NotesInscriptionRow[]>(`/notes/etudiants/${etuId}`, {
            validateStatus: notesStatusesOk,
          });
          if (res.status === 200 && Array.isArray(res.data)) {
            notesInscriptions = res.data;
          }
        }
      }
    } catch {
      /* ignore : portail sans bloc notes */
    }
  }
  const matiereIds = new Set<number>();
  if (notesInscriptions) {
    for (const row of notesInscriptions) {
      if (row.matiereId != null) matiereIds.add(row.matiereId);
    }
  }
  let matieres: NonNullable<EtudiantPortail['matieres']> = [];
  type MatiereMe = {
    id?: number;
    nom?: string;
    description?: string | null;
    enseignantId?: number | null;
    classeId?: number | null;
    salleId?: number | null;
    heureDebutSeance?: string | null;
    heureFinSeance?: string | null;
  };
  type EnseignantMe = { id?: number; nom?: string };
  const enseignantsById = new Map<number, string>();
  try {
    const ensRes = await api.get<EnseignantMe[]>('/enseignants/me', { validateStatus: isMeRequestAcceptable });
    if (ensRes.status === 200 && Array.isArray(ensRes.data)) {
      for (const e of ensRes.data) {
        if (e?.id != null) enseignantsById.set(e.id, e.nom ?? '');
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const res = await api.get<MatiereMe[]>('/matieres/me', {
      validateStatus: isMeRequestAcceptable,
    });
    if (res.status === 200 && Array.isArray(res.data)) {
      matieres = res.data
        .filter((m): m is MatiereMe & { id: number } => m?.id != null)
        .map((m) => ({
          id: m.id,
          nom: m.nom ?? '',
          description: m.description,
          enseignantId: m.enseignantId ?? null,
          enseignantNom:
            m.enseignantId != null ? (enseignantsById.get(m.enseignantId) ?? null) : null,
          classeId: m.classeId ?? null,
          salleId: m.salleId ?? null,
          heureDebutSeance: m.heureDebutSeance ?? null,
          heureFinSeance: m.heureFinSeance ?? null,
        }));
    }
  } catch {
    matieres = [];
  }
  if (matiereIds.size > 0 && matieres.length > 0) {
    matieres = matieres.filter((m) => matiereIds.has(m.id));
  }
  let classe: EtudiantPortail['classe'] = null;
  let resolvedClasseId = classeId ?? null;
  if (resolvedClasseId == null) {
    const fromMatiere = matieres.find((m) => m.classeId != null)?.classeId;
    if (fromMatiere != null) {
      resolvedClasseId = fromMatiere;
    }
  }
  if (resolvedClasseId == null && notesInscriptions) {
    const fromNotes = notesInscriptions.find((n) => n.classeId != null)?.classeId;
    if (fromNotes != null) {
      resolvedClasseId = fromNotes;
    }
  }
  if (resolvedClasseId != null) {
    try {
      const { data } = await api.get<{ id?: number; nom?: string; description?: string | null }>(
        `/classes/${resolvedClasseId}`,
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
    try {
    const roles = realmRolesFromToken();
    const kind = deriveUserKind(roles);
    setUserKind(kind);

    const parsed = keycloak.tokenParsed as Record<string, unknown> | undefined;
    const ensIdRaw = parsed?.school_enseignant_id;
    const etuIdRaw = parsed?.school_etudiant_id ?? parsed?.schoolEtudiantId;
    const ensId = ensIdRaw != null && ensIdRaw !== '' ? Number(ensIdRaw) : NaN;
    const etuId = etuIdRaw != null && etuIdRaw !== '' ? Number(etuIdRaw) : NaN;

    if (kind === 'enseignant') {
      const fallbackId = Number.isInteger(ensId) && ensId > 0 ? ensId : 0;
      setEnseignant({
        id: fallbackId,
        nom: (parsed?.name as string) ?? '',
        description: null,
        matricule: (parsed?.preferred_username as string) ?? '',
        role: enseignantRoleFromKeycloak(roles),
      });
      setEtudiant(null);
    } else if (kind === 'etudiant') {
      const classeRaw = parsed?.school_classe_id ?? parsed?.schoolClasseId ?? parsed?.classeId;
      const classeNum = classeRaw != null && classeRaw !== '' ? Number(classeRaw) : NaN;
      const classeFromToken = Number.isInteger(classeNum) && classeNum > 0 ? classeNum : undefined;
      const portail = await buildPortailForEtudiant(classeFromToken);
      const p = parsed;
      setEtudiant({
        id: Number.isInteger(etuId) && etuId > 0 ? etuId : 0,
        nom: (p?.name as string) ?? (p?.preferred_username as string) ?? '',
        description: null,
        matricule: (p?.preferred_username as string) ?? '',
        portail,
      });
      setEnseignant(null);
    } else {
      setEtudiant(null);
      setEnseignant(null);
    }
    } catch (err) {
      console.warn('[Auth] refreshSessions failed', err);
      const roles = realmRolesFromToken();
      setUserKind(deriveUserKind(roles));
      setEtudiant(null);
      setEnseignant(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!cancelled) setUserInfo(userInfoFromToken());
        await refreshSessions();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSessions]);

  /** Après login / refresh token : resynchroniser fiche enseignant ou étudiant. */
  useEffect(() => {
    keycloak.onAuthSuccess = () => {
      void (async () => {
        try {
          setUserInfo(userInfoFromToken());
          await refreshSessions();
        } catch {
          /* refreshSessions gère déjà l’état ; éviter rejection non gérée */
        }
      })();
    };
    return () => {
      keycloak.onAuthSuccess = undefined;
    };
  }, [refreshSessions]);

  useEffect(() => {
    if (enseignant) {
      setEnseignantRoleHeaderSupplier(() => {
        const r = enseignant.role;
        if (r === 'Administrateur') return 'Chef Enseignant';
        return r;
      });
    } else {
      setEnseignantRoleHeaderSupplier(() => undefined);
    }
  }, [enseignant]);

  const logout = useCallback(() => {
    setEnseignantRoleHeaderSupplier(() => undefined);
    keycloak.logout({ redirectUri: window.location.origin + '/' });
  }, []);

  const hasRole = useCallback((role: string) => realmRolesFromToken().includes(role), []);

  const isChefEnseignant = useCallback(
    () => hasRole('ROLE_CHEF_ENSEIGNANT') || hasRole('ROLE_ADMIN'),
    [hasRole],
  );
  const isEnseignant = useCallback(
    () =>
      hasRole('ROLE_ENSEIGNANT') || hasRole('ROLE_CHEF_ENSEIGNANT') || hasRole('ROLE_ADMIN'),
    [hasRole],
  );
  const isEtudiant = useCallback(() => {
    const staff = hasRole('ROLE_ADMIN') || hasRole('ROLE_CHEF_ENSEIGNANT') || hasRole('ROLE_ENSEIGNANT');
    return hasRole('ROLE_ETUDIANT') && !staff;
  }, [hasRole]);
  const getRoleLabel = useCallback(() => {
    if (hasRole('ROLE_ADMIN')) return 'Administrateur';
    if (hasRole('ROLE_CHEF_ENSEIGNANT')) return 'Chef enseignant';
    if (hasRole('ROLE_ENSEIGNANT')) return 'Enseignant';
    if (hasRole('ROLE_ETUDIANT')) return 'Étudiant';
    return 'Inconnu';
  }, [hasRole]);

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
