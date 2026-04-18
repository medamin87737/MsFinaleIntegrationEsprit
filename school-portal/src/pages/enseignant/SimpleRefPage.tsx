import { useCallback, useEffect, useState, type FormEvent } from 'react';
import PrivilegeHint from '../../components/PrivilegeHint';
import { useEnseignantApi } from '../../hooks/useEnseignantApi';
import { useEnseignantPrivileges } from '../../hooks/useEnseignantPrivileges';
import { errorMessage } from '../../utils/errors';

type Row = { id: number; nom: string; description?: string | null };

type MesClasseRow = { classeId?: number; classeNom?: string; classeDescription?: string | null };

type ResourcePath = '/classes' | '/matieres' | '/salles';

type Props = {
  title: string;
  resourcePath: ResourcePath;
  singular: string;
};

export default function SimpleRefPage({ title, resourcePath, singular }: Props) {
  const client = useEnseignantApi();
  const { canManageRefData, isChef } = useEnseignantPrivileges();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!client) return;
    if (resourcePath === '/classes' && !isChef) {
      const { data } = await client.get<MesClasseRow[]>('/classes/mes-classes');
      const arr = Array.isArray(data) ? data : [];
      setRows(
        arr
          .filter((c) => c.classeId != null)
          .map((c) => ({
            id: Number(c.classeId),
            nom: c.classeNom ?? '',
            description: c.classeDescription ?? null,
          })),
      );
      return;
    }
    if (resourcePath === '/matieres' && !isChef) {
      const { data } = await client.get<Row[]>('/matieres/mes-matieres');
      setRows(Array.isArray(data) ? data : []);
      return;
    }
    const { data } = await client.get<Row[]>(resourcePath);
    setRows(Array.isArray(data) ? data : []);
  }, [client, resourcePath, isChef]);

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

  function reset() {
    setNom('');
    setDescription('');
    setEditingId(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!client || !canManageRefData) return;
    setBusy(true);
    setErr(null);
    try {
      const body = { nom: nom.trim(), description: description.trim() || null };
      if (editingId != null) {
        await client.put(`${resourcePath}/${editingId}`, body);
      } else {
        await client.post(resourcePath, body);
      }
      reset();
      await load();
    } catch (ex) {
      setErr(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    if (!client || !canManageRefData) return;
    if (!window.confirm(`Supprimer cette ${singular} ?`)) return;
    setBusy(true);
    setErr(null);
    try {
      await client.delete(`${resourcePath}/${id}`);
      if (editingId === id) reset();
      await load();
    } catch (ex) {
      setErr(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  function onEdit(r: Row) {
    setEditingId(r.id);
    setNom(r.nom);
    setDescription(r.description ?? '');
  }

  return (
    <>
      <h1 className="page-title">{title}</h1>
      {!canManageRefData && <PrivilegeHint variant="readOnlyRef" />}
      <p className="page-desc">
        {canManageRefData
          ? 'Gestion complète (création, modification, suppression) — réservée au Chef Enseignant côté API.'
          : 'Consultation pour tous les enseignants authentifiés.'}
      </p>
      {err && <div className="alert alert-error">{err}</div>}

      {canManageRefData && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>
            {editingId != null ? `Modifier la ${singular}` : `Nouvelle ${singular}`}
          </h3>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor={`${resourcePath}-nom`}>Nom</label>
              <input
                id={`${resourcePath}-nom`}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor={`${resourcePath}-desc`}>Description</label>
              <input
                id={`${resourcePath}-desc`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {editingId != null ? 'Enregistrer' : 'Créer'}
              </button>
              {editingId != null && (
                <button type="button" className="btn btn-ghost" onClick={reset}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => load()}>
            Recharger la liste
          </button>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                {canManageRefData && <th style={{ width: 200 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.nom}</td>
                  <td>{r.description ?? '—'}</td>
                  {canManageRefData && (
                    <td>
                      <div className="btn-row">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(r)}>
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => onDelete(r.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
