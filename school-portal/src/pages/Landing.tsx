import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AppCard } from '../components/ui/AppCard';
import { useAuth } from '../context/AuthContext';

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Landing() {
  const { userKind, logout, isEtudiant, isEnseignant, getRoleLabel } = useAuth();
  const canStudent = isEtudiant();
  const canStaff = isEnseignant();

  return (
    <div className="landing-hero">
      <div className="landing-ambient" aria-hidden>
        <span className="landing-ambient__blob landing-ambient__blob--a" />
        <span className="landing-ambient__blob landing-ambient__blob--b" />
      </div>
      <div className="landing-grid" aria-hidden />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="landing-inner"
      >
        <motion.div
          className="brand-mark landing-logo"
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          T6
        </motion.div>
        <motion.h1
          className="page-title landing-title"
          custom={0}
          variants={fade}
          initial="hidden"
          animate="show"
        >
          Twin6 Campus
        </motion.h1>
        <motion.p className="page-desc landing-desc" custom={1} variants={fade} initial="hidden" animate="show">
          Portail pédagogique sécurisé (OIDC / PKCE) et connecté à la passerelle d’API.
        </motion.p>

        <motion.div className="login-split" custom={2} variants={fade} initial="hidden" animate="show">
          <Link to="/etudiant" className={`landing-tile ${!canStudent ? 'landing-tile--muted' : ''}`}>
            <AppCard hover className="landing-card-inner" padding="default">
              <div className="landing-tile__row">
                <div>
                  <div className="badge landing-badge">Espace étudiant</div>
                  <h2 className="landing-tile__title">Continuer</h2>
                  <p className="landing-tile__text">
                    {!canStudent
                      ? 'Votre session ne dispose pas des droits nécessaires pour cet espace.'
                      : 'Profil, classe, matières et notes.'}
                  </p>
                </div>
                <span className="landing-tile__chev" aria-hidden>
                  →
                </span>
              </div>
            </AppCard>
          </Link>

          <Link to="/enseignant" className={`landing-tile ${!canStaff ? 'landing-tile--muted' : ''}`}>
            <AppCard hover className="landing-card-inner" padding="default">
              <div className="landing-tile__row">
                <div>
                  <div className="badge landing-badge">Espace enseignant</div>
                  <h2 className="landing-tile__title">Continuer</h2>
                  <p className="landing-tile__text">
                    {!canStaff
                      ? 'Votre session ne dispose pas des droits nécessaires pour cet espace.'
                      : 'Classes, matières, salles et notes selon vos habilitations.'}
                  </p>
                </div>
                <span className="landing-tile__chev" aria-hidden>
                  →
                </span>
              </div>
            </AppCard>
          </Link>
        </motion.div>

        {userKind != null ? (
          <motion.p className="landing-foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            Profil de session détecté : <strong>{getRoleLabel()}</strong>
          </motion.p>
        ) : null}

        <motion.div className="landing-actions">
          <button type="button" className="btn btn-ghost" onClick={() => logout()}>
            Déconnexion
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
