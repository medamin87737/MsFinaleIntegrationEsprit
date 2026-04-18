import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { publicClient } from '../../api/client';
import { errorMessage } from '../../utils/errors';

type Check = {
  label: string;
  status: 'ok' | 'ko' | 'skip';
  detail: string;
};

export default function EtudiantScenariosPage() {
  const { etudiant } = useAuth();
  const portail = etudiant?.portail ?? null;
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const next: Check[] = [];

      if (portail?.classe?.id != null) {
        try {
          await publicClient.get(`/classes/${portail.classe.id}/matieres-dediees`);
          next.push({
            label: 'OpenFeign · Ma classe -> matières dédiées',
            status: 'ok',
            detail: `GET /classes/${portail.classe.id}/matieres-dediees`,
          });
        } catch (e) {
          next.push({
            label: 'OpenFeign · Ma classe -> matières dédiées',
            status: 'ko',
            detail: errorMessage(e),
          });
        }
      } else {
        next.push({
          label: 'OpenFeign · Ma classe -> matières dédiées',
          status: 'skip',
          detail: 'Aucune classe liée à votre profil.',
        });
      }

      if ((portail?.matieres ?? []).length > 0) {
        next.push({
          label: 'Portail étudiant · Matières liées',
          status: 'ok',
          detail: `${portail?.matieres?.length ?? 0} matière(s) dans votre session.`,
        });
      } else {
        next.push({
          label: 'Portail étudiant · Matières liées',
          status: 'skip',
          detail: 'Aucune matière dans votre session portail.',
        });
      }

      if ((portail?.notesInscriptions ?? []).length > 0) {
        next.push({
          label: 'RabbitMQ (résultat visible) · Notes/inscriptions',
          status: 'ok',
          detail: `${portail?.notesInscriptions?.length ?? 0} ligne(s) note/inscription dans votre portail.`,
        });
      } else {
        next.push({
          label: 'RabbitMQ (résultat visible) · Notes/inscriptions',
          status: 'skip',
          detail: 'Aucune note/inscription disponible pour le moment.',
        });
      }

      if (!cancelled) {
        setChecks(next);
        setLoading(false);
      }
    })().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [portail]);

  return (
    <>
      <h1 className="page-title">Scénarios inter-MS</h1>
      <p className="page-desc">
        Vue étudiant des scénarios disponibles avec les attributs utiles. Les opérations d’administration
        restent réservées aux comptes enseignant/chef.
      </p>

      <div className="card" style={{ padding: 0, marginBottom: '1rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--line)' }}>
          <strong>Privilèges par login</strong>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Login</th>
                <th>Référentiels</th>
                <th>Notes</th>
                <th>RabbitMQ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Chef Enseignant</td>
                <td>Lecture + écriture</td>
                <td>Lecture seulement</td>
                <td>Audit complet</td>
              </tr>
              <tr>
                <td>Enseignant</td>
                <td>Lecture seulement</td>
                <td>Lecture + écriture</td>
                <td>Suivi inscriptions (lecture)</td>
              </tr>
              <tr>
                <td>Étudiant</td>
                <td>Classe/matières personnelles</td>
                <td>Ses notes uniquement</td>
                <td>Non exposé depuis ce portail</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Scénarios visibles pour étudiant</h3>
        <ul style={{ margin: 0, paddingLeft: '1.15rem', lineHeight: 1.6 }}>
          <li>
            <strong>Classe vers matières dédiées</strong> : <code>classeId, classeNom, matieres[id, nom, salleId, horaires]</code>
          </li>
          <li>
            <strong>Portail matières</strong> : <code>matieres[id, nom, description]</code>
          </li>
          <li>
            <strong>Portail notes</strong> : <code>notesInscriptions[inscriptionId, matiereId, note.valeur]</code>
          </li>
        </ul>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--line)' }}>
          <strong>Vérification runtime (session étudiante)</strong>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Scénario</th>
                <th>Statut</th>
                <th>Détail</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.label}>
                  <td>{c.label}</td>
                  <td>
                    {c.status === 'ok' && 'OK'}
                    {c.status === 'ko' && 'Erreur'}
                    {c.status === 'skip' && 'Non applicable'}
                  </td>
                  <td>{c.detail}</td>
                </tr>
              ))}
              {checks.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: 'var(--muted)' }}>
                    {loading ? 'Chargement des vérifications...' : 'Aucune donnée de scénario.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
