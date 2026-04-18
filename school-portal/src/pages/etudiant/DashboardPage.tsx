import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function EtudiantDashboard() {
  const { etudiant } = useAuth();

  return (
    <>
      <h1 className="page-title">Accueil</h1>
      <p className="page-desc">
        Bienvenue sur votre espace. Utilisez le menu à gauche pour consulter votre classe, vos matières et vos
        notes.
      </p>

      {etudiant && (
        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="badge" style={{ marginBottom: '0.75rem' }}>
                Profil
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 0.25rem', fontSize: '1.35rem' }}>
                {etudiant.nom}
              </h2>
              <p style={{ margin: 0, color: 'var(--muted)' }}>Matricule · {etudiant.matricule}</p>
              {etudiant.description && (
                <p style={{ margin: '0.75rem 0 0', maxWidth: '48ch' }}>{etudiant.description}</p>
              )}
            </div>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 20,
                background: 'linear-gradient(135deg, var(--accent-soft), #fff)',
                border: '1px solid var(--line)',
              }}
            />
          </div>
        </motion.div>
      )}

      <div className="stat-grid" style={{ marginTop: '1.25rem' }}>
        <Link to="/etudiant/classe" className="stat" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-val" style={{ fontSize: '1.1rem' }}>
            Classe
          </div>
          <div className="stat-label">Voir ma classe</div>
        </Link>
        <Link to="/etudiant/matieres" className="stat" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-val" style={{ fontSize: '1.1rem' }}>
            Matières
          </div>
          <div className="stat-label">Liste des matières</div>
        </Link>
        <Link to="/etudiant/notes" className="stat" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-val" style={{ fontSize: '1.1rem' }}>
            Notes
          </div>
          <div className="stat-label">Notes & inscriptions</div>
        </Link>
      </div>
    </>
  );
}
