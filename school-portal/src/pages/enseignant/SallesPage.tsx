import SimpleRefPage from './SimpleRefPage';
import { SallesAvecMatieresCard } from '../../components/MatiereSalleCards';
import { useEnseignantApi } from '../../hooks/useEnseignantApi';

export default function SallesPage() {
  const client = useEnseignantApi();

  return (
    <>
      <SimpleRefPage title="Salles" resourcePath="/salles" singular="salle" />
      <SallesAvecMatieresCard client={client} title="Carte salle → matières dédiées et temps de séance" />
    </>
  );
}
