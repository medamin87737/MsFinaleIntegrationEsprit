/** Ligne renvoyée par MSNotes pour GET /notes/etudiants/{id} */
export interface NotesInscriptionRow {
  inscriptionId?: string;
  etudiantId?: number;
  matiereId?: number;
  note?: { id?: string; valeur?: number; createdAt?: string; updatedAt?: string } | null;
}

export interface EtudiantPortail {
  classe: { id: number; nom: string; description?: string | null } | null;
  matieres: { id: number; nom: string; description?: string | null }[];
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

export type EnseignantRoleLabel = 'Enseignant' | 'Chef Enseignant';

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
