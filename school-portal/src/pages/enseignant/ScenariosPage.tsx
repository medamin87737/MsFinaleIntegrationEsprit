import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEnseignantApi } from '../../hooks/useEnseignantApi';
import { useEnseignantPrivileges } from '../../hooks/useEnseignantPrivileges';
import { errorMessage } from '../../utils/errors';

type Check = {
  label: string;
  status: 'ok' | 'ko' | 'skip';
  detail: string;
};

type SalleRow = { id: number };
type MatiereRow = { id: number; nom?: string };

export default function EnseignantScenariosPage() {
  const client = useEnseignantApi();
  const { enseignant } = useAuth();
  const { isChef, canWriteNotes, canReadNotes } = useEnseignantPrivileges();
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalErr, setGlobalErr] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setGlobalErr(null);
      const next: Check[] = [];

      try {
        const classesRes = await client.get<Array<{ classeId?: number }>>('/classes/mes-classes', {
          validateStatus: (s) => s === 200 || s === 403,
        });
        const classes = classesRes.status === 200 && Array.isArray(classesRes.data) ? classesRes.data : [];
        const firstId = classes[0]?.classeId;
        if (firstId != null) {
          await client.get(`/classes/${firstId}/matieres-dediees`);
          next.push({
            label: 'OpenFeign · Classe -> matières dédiées',
            status: 'ok',
            detail: `GET /classes/${firstId}/matieres-dediees`,
          });
        } else {
          next.push({
            label: 'OpenFeign · Classe -> matières dédiées',
            status: 'skip',
            detail: 'Aucune classe disponible pour test.',
          });
        }
      } catch (e) {
        next.push({
          label: 'OpenFeign · Classe -> matières dédiées',
          status: 'ko',
          detail: errorMessage(e),
        });
      }

      try {
        const sallesPath = isChef ? '/salles' : '/salles/mes-salles';
        const { data: sallesData } = await client.get<SalleRow[]>(sallesPath);
        const salles = Array.isArray(sallesData) ? sallesData : [];
        if (salles.length > 0) {
          await client.get(`/salles/${salles[0].id}/matieres-dediees`);
          next.push({
            label: 'OpenFeign · Salle -> matières dédiées',
            status: 'ok',
            detail: `GET /salles/${salles[0].id}/matieres-dediees`,
          });
        } else {
          next.push({
            label: 'OpenFeign · Salle -> matières dédiées',
            status: 'skip',
            detail: 'Aucune salle disponible pour test.',
          });
        }
      } catch (e) {
        next.push({
          label: 'OpenFeign · Salle -> matières dédiées',
          status: 'ko',
          detail: errorMessage(e),
        });
      }

      try {
        const matPath = '/matieres/mes-matieres';
        const { data: matieresData } = await client.get<MatiereRow[]>(matPath);
        const matieres = Array.isArray(matieresData) ? matieresData : [];
        if (isChef) {
          next.push({
            label: 'OpenFeign · Matière + enseignant',
            status: 'skip',
            detail: 'Vérification ciblée enseignant ignorée pour le compte Chef/Admin.',
          });
        } else if (matieres.length > 0 && enseignant?.id != null) {
          const detailsPath = `/matieres/${matieres[0].id}/details-avec-enseignant/${enseignant.id}`;
          const res = await client.get(detailsPath, { validateStatus: (s) => s === 200 || s === 404 });
          if (res.status === 200) {
            next.push({
              label: 'OpenFeign · Matière + enseignant',
              status: 'ok',
              detail: `GET ${matPath} puis ${detailsPath}`,
            });
          } else {
            next.push({
              label: 'OpenFeign · Matière + enseignant',
              status: 'skip',
              detail: `Endpoint non disponible pour ce couple matière/enseignant (${detailsPath}).`,
            });
          }
        } else {
          next.push({
            label: 'OpenFeign · Matière + enseignant',
            status: 'skip',
            detail: 'Aucune matière (ou session enseignant) disponible pour test.',
          });
        }
      } catch (e) {
        next.push({
          label: 'OpenFeign · Matière + enseignant',
          status: 'ko',
          detail: errorMessage(e),
        });
      }

      if (canReadNotes) {
        try {
          await client.get('/notes/historique');
          next.push({
            label: 'RabbitMQ · Historique notes (publisher MSNotes)',
            status: 'ok',
            detail: 'GET /notes/historique',
          });
        } catch (e) {
          next.push({
            label: 'RabbitMQ · Historique notes (publisher MSNotes)',
            status: 'ko',
            detail: errorMessage(e),
          });
        }
      } else {
        next.push({
          label: 'RabbitMQ · Historique notes (publisher MSNotes)',
          status: 'skip',
          detail: 'Token sans ROLE_ENSEIGNANT / ROLE_CHEF_ENSEIGNANT.',
        });
      }

      try {
        await client.get('/classes/pedagogie/inscriptions-recues');
        next.push({
          label: 'RabbitMQ · Inscriptions reçues (consumer MSClasse)',
          status: 'ok',
          detail: 'GET /classes/pedagogie/inscriptions-recues',
        });
      } catch (e) {
        next.push({
          label: 'RabbitMQ · Inscriptions reçues (consumer MSClasse)',
          status: 'ko',
          detail: errorMessage(e),
        });
      }

      if (isChef) {
        try {
          await client.get('/etudiants/audit/notes-events');
          next.push({
            label: 'RabbitMQ · Audit événements notes (consumer MSEtudiant)',
            status: 'ok',
            detail: 'GET /etudiants/audit/notes-events',
          });
        } catch (e) {
          next.push({
            label: 'RabbitMQ · Audit événements notes (consumer MSEtudiant)',
            status: 'ko',
            detail: errorMessage(e),
          });
        }
      } else {
        next.push({
          label: 'RabbitMQ · Audit événements notes (consumer MSEtudiant)',
          status: 'skip',
          detail: 'Endpoint réservé au Chef Enseignant.',
        });
      }

      if (!cancelled) {
        setChecks(next);
        setLoading(false);
      }
    })().catch((e) => {
      if (!cancelled) {
        setGlobalErr(errorMessage(e));
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [client, enseignant?.id, isChef, canReadNotes]);

  return (
    <>
      <h1 className="page-title">Scénarios inter-MS</h1>
      <p className="page-desc">
        Tous les scénarios OpenFeign et RabbitMQ visibles côté front, avec les attributs utiles et les droits
        par rôle.
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
                <th>Référentiels (étudiants/classes/matières/salles)</th>
                <th>Notes</th>
                <th>Audit RabbitMQ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Chef Enseignant</td>
                <td>Lecture + écriture</td>
                <td>Lecture uniquement</td>
                <td>Lecture (audit + inscriptions reçues)</td>
              </tr>
              <tr>
                <td>Enseignant</td>
                <td>Lecture uniquement</td>
                <td>Lecture + écriture</td>
                <td>Lecture inscriptions reçues; audit notes non autorisé</td>
              </tr>
              <tr>
                <td>Étudiant</td>
                <td>Via portail personnel uniquement</td>
                <td>Consultation de ses notes</td>
                <td>Non disponible sur ce portail</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Scénarios OpenFeign affichés</h3>
        <ul style={{ margin: 0, paddingLeft: '1.15rem', lineHeight: 1.6 }}>
          <li>
            <strong>Classe → matières</strong> (`/classes/{'{id}'}/matieres-dediees`) :
            <code> classeId, classeNom, classeDescription, matieres[id, nom, salleId, heureDebutSeance, heureFinSeance]</code>
          </li>
          <li>
            <strong>Salle → matières</strong> (`/salles/{'{id}'}/matieres-dediees`) :
            <code> salleId, salleNom, salleDescription, matieres[id, nom, heureDebutSeance, heureFinSeance]</code>
          </li>
          <li>
            <strong>Matière + enseignant</strong> (`/matieres/{'{id}'}/details-avec-enseignant/{'{enseignantId}'}`) :
            <code> matiereId, matiereNom, enseignantId, enseignantNom, enseignantMatricule, enseignantRole</code>
          </li>
        </ul>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Scénarios RabbitMQ affichés</h3>
        <ul style={{ margin: 0, paddingLeft: '1.15rem', lineHeight: 1.6 }}>
          <li>
            <strong>grade.created / grade.updated</strong> : historique notes + audit côté étudiant
            (`/notes/historique`, `/etudiants/audit/notes-events`).
          </li>
          <li>
            <strong>inscription.created</strong> : suivi pédagogique côté classe
            (`/classes/pedagogie/inscriptions-recues`).
          </li>
        </ul>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--line)' }}>
          <strong>Vérification runtime des endpoints scénarios</strong>
          <div style={{ color: 'var(--muted)', fontSize: '0.86rem', marginTop: '0.35rem' }}>
            Rôle courant: {isChef ? 'Chef Enseignant' : 'Enseignant'} · Notes en écriture:{' '}
            {canWriteNotes ? 'oui' : 'non'}
          </div>
        </div>
        {globalErr && <div className="alert alert-error">{globalErr}</div>}
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
                    {loading ? 'Chargement des vérifications...' : 'Aucune vérification disponible.'}
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
