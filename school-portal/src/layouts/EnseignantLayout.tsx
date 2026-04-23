import { useNavigate } from 'react-router-dom';
import { AppWorkspaceShell, type WorkspaceNavItem } from '../components/layout/AppWorkspaceShell';
import { useAuth } from '../context/AuthContext';

const NAV_BASE: WorkspaceNavItem[] = [
  { to: '/enseignant', label: 'Accueil', end: true, icon: 'home' },
  { to: '/enseignant/etudiants', label: 'Étudiants', icon: 'users' },
  { to: '/enseignant/classes', label: 'Classes', icon: 'layers' },
  { to: '/enseignant/matieres', label: 'Matières', icon: 'book' },
  { to: '/enseignant/salles', label: 'Salles', icon: 'door' },
  { to: '/enseignant/notes', label: 'Notes', icon: 'chart' },
];

const NAV_TEAM: WorkspaceNavItem = {
  to: '/enseignant/enseignants',
  label: 'Équipe enseignants',
  icon: 'users',
};

export default function EnseignantLayout() {
  const { enseignant, logout, isChefEnseignant } = useAuth();
  const navigate = useNavigate();

  const items = isChefEnseignant() ? [...NAV_BASE, NAV_TEAM] : NAV_BASE;

  return (
    <AppWorkspaceShell
      brandMark="T6"
      brandTitle="Twin6 Campus"
      brandSubtitle="Espace enseignant"
      navSectionLabel="Navigation"
      items={items}
      headerActions={
        <>
          {enseignant ? (
            <>
              <span className="badge">{enseignant.nom}</span>
              <span className="badge badge--neutral">{enseignant.role}</span>
            </>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Déconnexion
          </button>
        </>
      }
    />
  );
}
