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
  const { isChef, canReadNotes } = useEnseignantPrivileges();
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      setErr(null);
      try {
        if (isChef) {
          const [etu, cls, mat, sal] = await Promise.all([
            client.get<unknown[]>('/etudiants'),
            client.get<unknown[]>('/classes'),
            client.get<unknown[]>('/matieres'),
            client.get<unknown[]>('/salles'),
          ]);
          let histCount = 0;
          if (canReadNotes) {
            try {
              const hist = await client.get<unknown[]>('/notes/historique');
              histCount = Array.isArray(hist.data) ? hist.data.length : 0;
            } catch {
              histCount = 0;
            }
          }
          if (cancelled) return;
          setStats({
            etudiants: Array.isArray(etu.data) ? etu.data.length : 0,
            classes: Array.isArray(cls.data) ? cls.data.length : 0,
            matieres: Array.isArray(mat.data) ? mat.data.length : 0,
            salles: Array.isArray(sal.data) ? sal.data.length : 0,
            historique: histCount,
          });
          return;
        }

        const [mesRes, mat, sal] = await Promise.all([
          client.get<MesClasseAgg[]>('/classes/mes-classes', { validateStatus: (s) => s === 200 || s === 403 }),
          client.get<unknown[]>('/matieres/mes-matieres'),
          client.get<unknown[]>('/salles/mes-salles'),
        ]);
        let histCount = 0;
        if (canReadNotes) {
          try {
            const hist = await client.get<unknown[]>('/notes/historique');
            histCount = Array.isArray(hist.data) ? hist.data.length : 0;
          } catch {
            histCount = 0;
          }
        }
        if (cancelled) return;
        const mesClasses = mesRes.status === 200 && Array.isArray(mesRes.data) ? mesRes.data : [];
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
          historique: histCount,
        });
      } catch (e) {
        if (!cancelled) setErr(errorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, isChef, canReadNotes]);

  return (
    <>
      <h1 className="page-title">Tableau de bord</h1>
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
