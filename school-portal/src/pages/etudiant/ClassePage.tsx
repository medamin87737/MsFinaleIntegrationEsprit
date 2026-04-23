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
      <p className="page-desc">Matières dédiées à votre classe.</p>

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
