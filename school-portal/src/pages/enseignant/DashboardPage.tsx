import { useEffect, useState } from 'react';
import { useEnseignantApi } from '../../hooks/useEnseignantApi';
import { useEnseignantPrivileges } from '../../hooks/useEnseignantPrivileges';
import { errorMessage } from '../../utils/errors';

type Stats = {
  etudiants: number;
  classes: number;
  matieres: number;
  salles: number;
  historique: number;
};

type MesClasseAgg = { classeId?: number };

export default function EnseignantDashboard() {
  const client = useEnseignantApi();
  const { isChef, canWriteNotes } = useEnseignantPrivileges();
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      setErr(null);
      try {
        if (isChef) {
          const [etu, cls, mat, sal, hist] = await Promise.all([
            client.get<unknown[]>('/etudiants'),
            client.get<unknown[]>('/classes'),
            client.get<unknown[]>('/matieres'),
            client.get<unknown[]>('/salles'),
            client.get<unknown[]>('/notes/historique'),
          ]);
          if (cancelled) return;
          setStats({
            etudiants: Array.isArray(etu.data) ? etu.data.length : 0,
            classes: Array.isArray(cls.data) ? cls.data.length : 0,
            matieres: Array.isArray(mat.data) ? mat.data.length : 0,
            salles: Array.isArray(sal.data) ? sal.data.length : 0,
            historique: Array.isArray(hist.data) ? hist.data.length : 0,
          });
          return;
        }

        const [mesRes, mat, sal, hist] = await Promise.all([
          client.get<MesClasseAgg[]>('/classes/mes-classes'),
          client.get<unknown[]>('/matieres/mes-matieres'),
          client.get<unknown[]>('/salles'),
          client.get<unknown[]>('/notes/historique'),
        ]);
        if (cancelled) return;
        const mesClasses = Array.isArray(mesRes.data) ? mesRes.data : [];
        let etuCount = 0;
        const seen = new Set<number>();
        for (const c of mesClasses) {
          const cid = c.classeId;
          if (cid == null) continue;
          try {
            const { data } = await client.get<Array<{ id?: number }>>(`/etudiants/classe/${cid}`);
            for (const row of Array.isArray(data) ? data : []) {
              const id = row.id;
              if (id != null && !seen.has(id)) {
                seen.add(id);
                etuCount += 1;
              }
            }
          } catch {
            /* ignore par classe */
          }
        }
        setStats({
          etudiants: etuCount,
          classes: mesClasses.length,
          matieres: Array.isArray(mat.data) ? mat.data.length : 0,
          salles: Array.isArray(sal.data) ? sal.data.length : 0,
          historique: Array.isArray(hist.data) ? hist.data.length : 0,
        });
      } catch (e) {
        if (!cancelled) setErr(errorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, isChef]);

  return (
    <>
      <h1 className="page-title">Tableau de bord</h1>
      <p className="page-desc">
        Vue d’ensemble via la gateway (port 8080). Vos actions dans le menu correspondent à votre rôle
        (Chef : référentiels + annuaire ; Enseignant : notes en écriture).
      </p>
      <div
        className="card"
        style={{
          marginBottom: '1.25rem',
          padding: '0.9rem 1.1rem',
          background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          {isChef && (
            <>
              <strong>Rôle Chef Enseignant :</strong> gestion des étudiants, classes, matières, salles et
              annuaire enseignants ; lecture de l’historique des notes (pas de saisie de notes).
            </>
          )}
          {!isChef && canWriteNotes && (
            <>
              <strong>Rôle Enseignant :</strong> consultation des référentiels ; inscriptions et saisie des
              notes. Les modifications des fiches (étudiants, classes, …) sont réservées au Chef.
            </>
          )}
          {!isChef && !canWriteNotes && (
            <>Connectez-vous avec un compte enseignant pour voir les privilèges détaillés.</>
          )}
        </p>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      {stats && (
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-val">{stats.etudiants}</div>
            <div className="stat-label">Étudiants</div>
          </div>
          <div className="stat">
            <div className="stat-val">{stats.classes}</div>
            <div className="stat-label">Classes</div>
          </div>
          <div className="stat">
            <div className="stat-val">{stats.matieres}</div>
            <div className="stat-label">Matières</div>
          </div>
          <div className="stat">
            <div className="stat-val">{stats.salles}</div>
            <div className="stat-label">Salles</div>
          </div>
          <div className="stat">
            <div className="stat-val">{stats.historique}</div>
            <div className="stat-label">Lignes historique notes</div>
          </div>
        </div>
      )}
      {!stats && !err && <p style={{ color: 'var(--muted)' }}>Chargement…</p>}
    </>
  );
}
