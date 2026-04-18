import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import type { NotesInscriptionRow } from '../../types';
import { matiereLabel } from '../../utils/etudiantPortail';

export default function NotesEtudiantPage() {
  const { etudiant } = useAuth();
  const portail = etudiant?.portail;
  const notes = (portail?.notesInscriptions ?? null) as NotesInscriptionRow[] | null;

  return (
    <>
      <h1 className="page-title">Mes notes</h1>
      <p className="page-desc">Notes et inscriptions par matière (données MSNotes).</p>

      <motion.div
        className="card"
        style={{ padding: 0 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {notes && notes.length > 0 ? (
                notes.map((row, i) => (
                  <tr key={row.inscriptionId ?? `${row.matiereId}-${i}`}>
                    <td>{matiereLabel(portail ?? undefined, row.matiereId)}</td>
                    <td>
                      {row.note != null && typeof row.note.valeur === 'number'
                        ? String(row.note.valeur)
                        : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ color: 'var(--muted)' }}>
                    Aucune donnée (pas d’inscription / note, ou service indisponible au chargement).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}
