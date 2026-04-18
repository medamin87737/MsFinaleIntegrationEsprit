import { useEffect, type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardSkeleton } from './components/ui/Skeleton';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import EtudiantLayout from './layouts/EtudiantLayout';
import EtudiantDashboard from './pages/etudiant/DashboardPage';
import EtudiantClassePage from './pages/etudiant/ClassePage';
import EtudiantMatieresPage from './pages/etudiant/MatieresPage';
import EtudiantNotesPage from './pages/etudiant/NotesEtudiantPage';
import EnseignantLayout from './layouts/EnseignantLayout';
import EnseignantDashboard from './pages/enseignant/DashboardPage';
import EtudiantsPage from './pages/enseignant/EtudiantsPage';
import ClassesPage from './pages/enseignant/ClassesPage';
import MatieresPage from './pages/enseignant/MatieresPage';
import SallesPage from './pages/enseignant/SallesPage';
import NotesPage from './pages/enseignant/NotesPage';
import EnseignantsPage from './pages/enseignant/EnseignantsPage';
import EnseignantScenariosPage from './pages/enseignant/ScenariosPage';
import EtudiantScenariosPage from './pages/etudiant/ScenariosPage';
import keycloak from './keycloak';

function GuardEtudiant({ children }: { children: ReactElement }) {
  const { userKind, loading } = useAuth();
  if (loading) {
    return (
      <div className="route-loading" aria-busy>
        <DashboardSkeleton />
      </div>
    );
  }
  if (userKind !== 'etudiant') return <Navigate to="/" replace />;
  return children;
}

function GuardEnseignant({ children }: { children: ReactElement }) {
  const { userKind, loading } = useAuth();
  if (loading) {
    return (
      <div className="route-loading" aria-busy>
        <DashboardSkeleton />
      </div>
    );
  }
  if (userKind !== 'enseignant') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  // Renouvellement silencieux du token (évite les 401 silencieux sur sessions longues).
  useEffect(() => {
    const id = window.setInterval(() => {
      keycloak.updateToken(60).catch(() => {
        /* ignore */
      });
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route
        path="/etudiant"
        element={
          <GuardEtudiant>
            <EtudiantLayout />
          </GuardEtudiant>
        }
      >
        <Route index element={<EtudiantDashboard />} />
        <Route path="classe" element={<EtudiantClassePage />} />
        <Route path="matieres" element={<EtudiantMatieresPage />} />
        <Route path="notes" element={<EtudiantNotesPage />} />
        <Route path="scenarios" element={<EtudiantScenariosPage />} />
      </Route>

      <Route
        path="/enseignant"
        element={
          <GuardEnseignant>
            <EnseignantLayout />
          </GuardEnseignant>
        }
      >
        <Route index element={<EnseignantDashboard />} />
        <Route path="etudiants" element={<EtudiantsPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="matieres" element={<MatieresPage />} />
        <Route path="salles" element={<SallesPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="enseignants" element={<EnseignantsPage />} />
        <Route path="scenarios" element={<EnseignantScenariosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
