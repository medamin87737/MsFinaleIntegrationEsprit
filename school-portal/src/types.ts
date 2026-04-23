/** Ligne renvoyée par MSNotes pour GET /notes/etudiants/{id} */
export interface NotesInscriptionRow {
  inscriptionId?: string;
  etudiantId?: number;
  matiereId?: number;
  classeId?: number;
  note?: { id?: string; valeur?: number; createdAt?: string; updatedAt?: string } | null;
}

export interface EtudiantPortail {
  classe: { id: number; nom: string; description?: string | null } | null;
  matieres: {
    id: number;
    nom: string;
    description?: string | null;
    enseignantId?: number | null;
    enseignantNom?: string | null;
    classeId?: number | null;
    salleId?: number | null;
    heureDebutSeance?: string | null;
    heureFinSeance?: string | null;
  }[];
  notesInscriptions: NotesInscriptionRow[] | null;
}

export interface EtudiantSession {
  id: number;
  nom: string;
  description?: string | null;
  matricule: string;
  /** Présent après login ou après POST /etudiants/portail */
  portail?: EtudiantPortail | null;
}

export type EnseignantRoleLabel = 'Enseignant' | 'Chef Enseignant' | 'Administrateur';

export interface EnseignantSession {
  id: number;
  nom: string;
  description?: string | null;
  matricule: string;
  role: EnseignantRoleLabel;
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
}
