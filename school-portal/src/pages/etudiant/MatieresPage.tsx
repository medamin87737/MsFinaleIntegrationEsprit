import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { publicClient } from '../../api/client';
import { MatieresAffectationCard, SallesAvecMatieresCard } from '../../components/MatiereSalleCards';

export default function MatieresPage() {
  const { etudiant } = useAuth();
  const list = etudiant?.portail?.matieres ?? [];

  return (
    <>
      <h1 className="page-title">Mes matières</h1>
      <p className="page-desc">
        Matières liées à vos inscriptions (agrégation MSNotes / MSMatière au moment de la connexion).
      </p>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {list.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {list.map((m) => (
              <li key={m.id} style={{ marginBottom: '0.65rem' }}>
                <strong>{m.nom}</strong>
                <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}> · id {m.id}</span>
                {m.description ? (
                  <div style={{ marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.95rem' }}>
                    {m.description}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Aucune matière pour l’instant. Les inscriptions sont gérées par les enseignants dans MSNotes.
          </p>
        )}
      </motion.div>

      <MatieresAffectationCard client={publicClient} title="Carte matière → salle et temps de séance" />
      <SallesAvecMatieresCard client={publicClient} title="Carte salle → matières et horaires" />
    </>
  );
}
