import { useNavigate } from 'react-router-dom';
import { AppWorkspaceShell, type WorkspaceNavItem } from '../components/layout/AppWorkspaceShell';
import { useAuth } from '../context/AuthContext';

const NAV: WorkspaceNavItem[] = [
  { to: '/etudiant', label: 'Accueil', end: true, icon: 'home' },
  { to: '/etudiant/classe', label: 'Classe', icon: 'layers' },
  { to: '/etudiant/matieres', label: 'Matières', icon: 'book' },
  { to: '/etudiant/notes', label: 'Notes', icon: 'chart' },
  { to: '/etudiant/scenarios', label: 'Scénarios inter-MS', icon: 'spark' },
];

export default function EtudiantLayout() {
  const { etudiant, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppWorkspaceShell
      brandMark="T6"
      brandTitle="Twin6 Campus"
      brandSubtitle="Espace étudiant"
      navSectionLabel="Navigation"
      items={NAV}
      headerActions={
        <>
          {etudiant ? <span className="badge">{`${etudiant.nom} · ${etudiant.matricule}`}</span> : null}
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
