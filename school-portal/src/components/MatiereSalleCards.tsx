import { useCallback, useEffect, useState } from 'react';
import type { AxiosInstance } from 'axios';
import { useAuth } from '../context/AuthContext';
import { useEnseignantPrivileges } from '../hooks/useEnseignantPrivileges';
import { errorMessage } from '../utils/errors';

type SalleRow = { id: number; nom: string; description?: string | null };
type ClasseRow = { id: number; nom: string; description?: string | null };
type MatiereRow = {
  id: number;
  nom: string;
  description?: string | null;
  salleId?: number | null;
  classeId?: number | null;
  heureDebutSeance?: string | null;
  heureFinSeance?: string | null;
};
type SalleAvecMatieres = {
  salleId?: number;
  salleNom?: string;
  salleDescription?: string | null;
  matieres?: MatiereRow[];
};
type ClasseAvecMatieres = {
  classeId?: number;
  classeNom?: string;
  classeDescription?: string | null;
  matieres?: MatiereRow[];
};

type MesClasseAgg = { classeId?: number; classeNom?: string };

function formatCreneau(debut?: string | null, fin?: string | null) {
  if (!debut || !fin) return 'Horaire non défini';
  return `${debut} - ${fin}`;
}

export function MatieresAffectationCard({
  client,
  title = 'Matières et salles',
}: {
  client: AxiosInstance | null;
  title?: string;
}) {
  const { userKind } = useAuth();
  const { isChef } = useEnseignantPrivileges();
  const [rows, setRows] = useState<MatiereRow[]>([]);
  const [sallesMap, setSallesMap] = useState<Record<number, string>>({});
  const [classesMap, setClassesMap] = useState<Record<number, string>>({});
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) return;
    const sallesRes = await client.get<SalleRow[]>('/salles');
    const salles = Array.isArray(sallesRes.data) ? sallesRes.data : [];
    const nextMap = salles.reduce<Record<number, string>>((acc, s) => {
      acc[s.id] = s.nom;
      return acc;
    }, {});

    if (userKind === 'etudiant') {
      let matieres: MatiereRow[] = [];
      try {
        const mRes = await client.get<MatiereRow[]>('/matieres/me', {
          validateStatus: (s) => s === 200 || s === 404,
        });
        if (mRes.status === 200) {
          matieres = Array.isArray(mRes.data) ? mRes.data : [];
        }
      } catch {
        matieres = [];
      }
      const nextClassesMap: Record<number, string> = {};
      try {
        const cRes = await client.get<{ id?: number; nom?: string }>('/classes/me', {
          validateStatus: (s) => s === 200 || s === 404,
        });
        if (cRes.status === 200) {
          const c = cRes.data;
          if (c?.id != null) nextClassesMap[c.id] = c.nom ?? '';
        }
      } catch {
        /* pas de classe assignée */
      }
      setRows(matieres);
      setSallesMap(nextMap);
      setClassesMap(nextClassesMap);
      return;
    }

    if (userKind !== 'enseignant') {
      setRows([]);
      setSallesMap(nextMap);
      setClassesMap({});
      return;
    }

    if (isChef) {
      const [matieresRes, classesRes] = await Promise.all([
        client.get<MatiereRow[]>('/matieres'),
        client.get<ClasseRow[]>('/classes'),
      ]);
      const matieres = Array.isArray(matieresRes.data) ? matieresRes.data : [];
      const classes = Array.isArray(classesRes.data) ? classesRes.data : [];
      const nextClassesMap = classes.reduce<Record<number, string>>((acc, c) => {
        acc[c.id] = c.nom;
        return acc;
      }, {});
      setRows(matieres);
      setSallesMap(nextMap);
      setClassesMap(nextClassesMap);
      return;
    }

    const [matieresRes, mesRes] = await Promise.all([
      client.get<MatiereRow[]>('/matieres/mes-matieres'),
      client.get<MesClasseAgg[]>('/classes/mes-classes'),
    ]);
    const matieres = Array.isArray(matieresRes.data) ? matieresRes.data : [];
    const mes = Array.isArray(mesRes.data) ? mesRes.data : [];
    const nextClassesMap = mes.reduce<Record<number, string>>((acc, c) => {
      const id = c.classeId;
      if (id != null) acc[id] = c.classeNom ?? '';
      return acc;
    }, {});
    setRows(matieres);
    setSallesMap(nextMap);
    setClassesMap(nextClassesMap);
  }, [client, userKind, isChef]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      setErr(null);
      try {
        await load();
      } catch (e) {
        if (!cancelled) setErr(errorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, load]);

  return (
    <div className="card" style={{ marginTop: '1rem', padding: 0 }}>
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <strong>{title}</strong>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => load()}>
          Recharger
        </button>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      <div className="table-wrap" style={{ border: 'none' }}>
        <table className="data">
          <thead>
            <tr>
              <th>Matière</th>
              <th>Classe</th>
              <th>Salle</th>
              <th>Créneau</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.nom}</td>
                <td>{m.classeId != null ? (classesMap[m.classeId] ?? '—') : '—'}</td>
                <td>{m.salleId != null ? (sallesMap[m.salleId] ?? '—') : '—'}</td>
                <td>{formatCreneau(m.heureDebutSeance, m.heureFinSeance)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: 'var(--muted)' }}>
                  Aucune matière disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SallesAvecMatieresCard({
  client,
  title = 'Salles et matières dédiées',
}: {
  client: AxiosInstance | null;
  title?: string;
}) {
  const [rows, setRows] = useState<SalleAvecMatieres[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) return;
    const { data: sallesData } = await client.get<SalleRow[]>('/salles');
    const salles = Array.isArray(sallesData) ? sallesData : [];

    const details = await Promise.all(
      salles.map(async (s) => {
        const { data } = await client.get<SalleAvecMatieres>(`/salles/${s.id}/matieres-dediees`);
        return data;
      }),
    );

    setRows(details);
  }, [client]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      setErr(null);
      try {
        await load();
      } catch (e) {
        if (!cancelled) setErr(errorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, load]);

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>{title}</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => load()}>
          Recharger
        </button>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      {rows.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {rows.map((s, idx) => (
            <div key={s.salleId ?? `s-${idx}`} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong>{s.salleNom ?? 'Salle'}</strong>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  {(s.matieres ?? []).length} matière(s)
                </span>
              </div>
              {s.salleDescription ? (
                <div style={{ marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.92rem' }}>{s.salleDescription}</div>
              ) : null}
              {(s.matieres ?? []).length > 0 ? (
                <ul style={{ margin: '0.65rem 0 0', paddingLeft: '1.15rem' }}>
                  {(s.matieres ?? []).map((m) => (
                    <li key={m.id} style={{ marginBottom: '0.45rem' }}>
                      <strong>{m.nom}</strong> — {formatCreneau(m.heureDebutSeance, m.heureFinSeance)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: '0.65rem 0 0', color: 'var(--muted)' }}>Aucune matière assignée à cette salle.</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, color: 'var(--muted)' }}>Aucune salle disponible.</p>
      )}
    </div>
  );
}

export function ClassesAvecMatieresCard({
  client,
  title = 'Classes et matières dédiées',
  classId,
}: {
  client: AxiosInstance | null;
  title?: string;
  classId?: number;
}) {
  const [rows, setRows] = useState<ClasseAvecMatieres[]>([]);
  const [sallesMap, setSallesMap] = useState<Record<number, string>>({});
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) return;

    const sallesRes = await client.get<SalleRow[]>('/salles');
    const salles = Array.isArray(sallesRes.data) ? sallesRes.data : [];
    setSallesMap(
      salles.reduce<Record<number, string>>((acc, s) => {
        acc[s.id] = s.nom;
        return acc;
      }, {}),
    );

    if (classId != null) {
      const { data } = await client.get<ClasseAvecMatieres>(`/classes/${classId}/matieres-dediees`);
      setRows(data ? [data] : []);
      return;
    }

    const { data } = await client.get<ClasseAvecMatieres[]>('/classes/mes-classes');
    setRows(Array.isArray(data) ? data : []);
  }, [client, classId]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      setErr(null);
      try {
        await load();
      } catch (e) {
        if (!cancelled) setErr(errorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, load]);

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>{title}</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => load()}>
          Recharger
        </button>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      {rows.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {rows.map((c, idx) => (
            <div key={c.classeId ?? `c-${idx}`} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong>{c.classeNom ?? 'Classe'}</strong>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  {(c.matieres ?? []).length} matière(s)
                </span>
              </div>
              {c.classeDescription ? (
                <div style={{ marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.92rem' }}>{c.classeDescription}</div>
              ) : null}
              {(c.matieres ?? []).length > 0 ? (
                <ul style={{ margin: '0.65rem 0 0', paddingLeft: '1.15rem' }}>
                  {(c.matieres ?? []).map((m) => (
                    <li key={m.id} style={{ marginBottom: '0.45rem' }}>
                      <strong>{m.nom}</strong> —{' '}
                      {m.salleId != null ? (sallesMap[m.salleId] ?? 'Salle') : '—'} —{' '}
                      {formatCreneau(m.heureDebutSeance, m.heureFinSeance)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: '0.65rem 0 0', color: 'var(--muted)' }}>Aucune matière dédiée à cette classe.</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, color: 'var(--muted)' }}>Aucune classe disponible.</p>
      )}
    </div>
  );
}
