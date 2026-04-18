import SimpleRefPage from './SimpleRefPage';
import { ClassesAvecMatieresCard } from '../../components/MatiereSalleCards';
import { useEnseignantApi } from '../../hooks/useEnseignantApi';

export default function ClassesPage() {
  const client = useEnseignantApi();

  return (
    <>
      <SimpleRefPage title="Classes" resourcePath="/classes" singular="classe" />
      <ClassesAvecMatieresCard client={client} title="Carte classe → matières dédiées et horaires" />
    </>
  );
}
