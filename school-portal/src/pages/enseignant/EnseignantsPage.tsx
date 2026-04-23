import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useEnseignantApi } from '../../hooks/useEnseignantApi';
import { useEnseignantPrivileges } from '../../hooks/useEnseignantPrivileges';
import type { EnseignantRoleLabel } from '../../types';
import { errorMessage } from '../../utils/errors';

type Row = {
  id: number;
  nom: string;
  description?: string | null;
  matricule?: string | null;
  role?: string;
};

export default function EnseignantsPage() {
  const client = useEnseignantApi();
  const { isChef, canListAllEnseignants } = useEnseignantPrivileges();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<EnseignantRoleLabel>('Enseignant');
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!client || !canListAllEnseignants) return;
    const ensRes = await client.get<Row[]>('/enseignants');
    const enseignants = Array.isArray(ensRes.data) ? ensRes.data : [];
    setRows(enseignants);
  }, [client, canListAllEnseignants]);

  useEffect(() => {
    if (!client || !canListAllEnseignants) return;
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
  }, [client, canListAllEnseignants, load]);

  function reset() {
    setNom('');
    setDescription('');
    setMatricule('');
    setPassword('');
    setRole('Enseignant');
    setEditingId(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!client || !isChef) return;
    setBusy(true);
    setErr(null);
    try {
      if (editingId != null) {
        const body: Record<string, unknown> = {
          nom: nom.trim(),
          description: description.trim() || null,
          matricule: matricule.trim(),
          role,
        };
        if (password.trim()) body.password = password.trim();
        await client.put(`/enseignants/${editingId}`, body);
      } else {
        await client.post('/enseignants', {
          nom: nom.trim(),
          description: description.trim() || null,
          matricule: matricule.trim(),
          password: password.trim() || undefined,
          role,
        });
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
    if (!client || !isChef) return;
    if (!window.confirm('Supprimer cet enseignant ?')) return;
    setBusy(true);
    setErr(null);
    try {
      await client.delete(`/enseignants/${id}`);
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
    setMatricule(r.matricule ?? '');
    setPassword('');
    setRole(r.role === 'Chef Enseignant' ? 'Chef Enseignant' : 'Enseignant');
  }

  if (!isChef) {
    return (
      <>
        <h1 className="page-title">Équipe enseignants</h1>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Équipe enseignants</h1>
      {err && <div className="alert alert-error">{err}</div>}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>
          {editingId != null ? 'Modifier un enseignant' : 'Nouvel enseignant'}
        </h3>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="ens-nom">Nom</label>
            <input id="ens-nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="ens-desc">Description</label>
            <input id="ens-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ens-mat">Matricule</label>
            <input id="ens-mat" value={matricule} onChange={(e) => setMatricule(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="ens-role">Rôle</label>
            <select
              id="ens-role"
              value={role}
              onChange={(e) => setRole(e.target.value as EnseignantRoleLabel)}
            >
              <option value="Enseignant">Enseignant</option>
              <option value="Chef Enseignant">Chef Enseignant</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="ens-pass">
              Mot de passe {editingId != null ? '(laisser vide pour ne pas changer)' : ''}
            </label>
            <input
              id="ens-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
                <th>Matricule</th>
                <th>Rôle</th>
                <th>Description</th>
                <th style={{ width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.nom}</td>
                  <td>{r.matricule ?? '—'}</td>
                  <td>{r.role ?? '—'}</td>
                  <td>{r.description ?? '—'}</td>
                  <td>
                    <div className="btn-row">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(r)}>
                        Modifier
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(r.id)}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
