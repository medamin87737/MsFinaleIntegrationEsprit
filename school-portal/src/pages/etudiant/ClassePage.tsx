import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { publicClient } from '../../api/client';
import { ClassesAvecMatieresCard } from '../../components/MatiereSalleCards';

export default function ClassePage() {
  const { etudiant } = useAuth();
  const portail = etudiant?.portail;
  const c = portail?.classe;

  return (
    <>
      <h1 className="page-title">Ma classe</h1>
      <p className="page-desc">Informations de classe issues de votre fiche (Chef Enseignant).</p>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {c ? (
          <>
            <div className="badge" style={{ marginBottom: '0.75rem' }}>Classe</div>
            <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 0.5rem', fontSize: '1.35rem' }}>
              {c.nom}
            </h2>
            {c.id != null && (
              <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>Identifiant · {c.id}</p>
            )}
            {c.description && <p style={{ margin: 0, maxWidth: '56ch', lineHeight: 1.5 }}>{c.description}</p>}
          </>
        ) : (
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Aucune classe renseignée sur votre fiche. Le Chef Enseignant peut associer une classe (ID) à votre
            profil étudiant.
          </p>
        )}
      </motion.div>

      {c?.id != null && (
        <ClassesAvecMatieresCard
          client={publicClient}
          classId={c.id}
          title="Matières dédiées à ma classe (avec salle et horaire)"
        />
      )}
    </>
  );
}
