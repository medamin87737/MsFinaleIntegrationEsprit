import { useCallback, useEffect, useState, type FormEvent } from 'react';
import PrivilegeHint from '../../components/PrivilegeHint';
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

type MatiereRow = {
  id: number;
  nom?: string;
};

type MatiereAvecEnseignantDetail = {
  matiereId?: number;
  matiereNom?: string;
  matiereDescription?: string | null;
  enseignantId?: number;
  enseignantNom?: string;
  enseignantDescription?: string | null;
  enseignantMatricule?: string | null;
  enseignantRole?: string | null;
};

type ScenarioHistoryRow = {
  testedAt: string;
  matiereId: number | null;
  matiereNom: string;
  enseignantId: number | null;
  enseignantNom: string;
  enseignantMatricule: string;
  enseignantRole: string;
};

const SCENARIO_HISTORY_KEY = 'twin6_matiere_enseignant_scenario_history';

export default function EnseignantsPage() {
  const client = useEnseignantApi();
  const { isChef, canListAllEnseignants } = useEnseignantPrivileges();
  const [rows, setRows] = useState<Row[]>([]);
  const [matieres, setMatieres] = useState<MatiereRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<EnseignantRoleLabel>('Enseignant');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMatiereId, setSelectedMatiereId] = useState('');
  const [selectedEnseignantId, setSelectedEnseignantId] = useState('');
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<MatiereAvecEnseignantDetail | null>(null);
  const [historyRows, setHistoryRows] = useState<ScenarioHistoryRow[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCENARIO_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setHistoryRows(parsed as ScenarioHistoryRow[]);
      }
    } catch {
      /* ignore corrupted local cache */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SCENARIO_HISTORY_KEY, JSON.stringify(historyRows));
  }, [historyRows]);

  const load = useCallback(async () => {
    if (!client || !canListAllEnseignants) return;
    const [ensRes, matRes] = await Promise.all([
      client.get<Row[]>('/enseignants'),
      client.get<MatiereRow[]>('/matieres'),
    ]);
    const enseignants = Array.isArray(ensRes.data) ? ensRes.data : [];
    const matieresData = Array.isArray(matRes.data) ? matRes.data : [];
    setRows(enseignants);
    setMatieres(matieresData);
    setSelectedEnseignantId((prev) =>
      prev && enseignants.some((e) => String(e.id) === prev) ? prev : '',
    );
    setSelectedMatiereId((prev) =>
      prev && matieresData.some((m) => String(m.id) === prev) ? prev : '',
    );
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

  async function loadMatiereEnseignantDetail() {
    if (!client || !isChef) return;
    const matiereId = Number(selectedMatiereId);
    const enseignantId = Number(selectedEnseignantId);
    if (!Number.isInteger(matiereId) || matiereId < 1 || !Number.isInteger(enseignantId) || enseignantId < 1) {
      setDetailErr('Choisissez une matière et un enseignant dans les listes.');
      setDetail(null);
      return;
    }
    setDetailBusy(true);
    setDetailErr(null);
    try {
      const { data } = await client.get<MatiereAvecEnseignantDetail>(
        `/matieres/${matiereId}/details-avec-enseignant/${enseignantId}`,
      );
      setDetail(data ?? null);
      const row: ScenarioHistoryRow = {
        testedAt: new Date().toISOString(),
        matiereId: data?.matiereId ?? null,
        matiereNom: data?.matiereNom ?? '—',
        enseignantId: data?.enseignantId ?? null,
        enseignantNom: data?.enseignantNom ?? '—',
        enseignantMatricule: data?.enseignantMatricule ?? '—',
        enseignantRole: data?.enseignantRole ?? '—',
      };
      setHistoryRows((prev) => [row, ...prev].slice(0, 30));
    } catch (e) {
      setDetail(null);
      setDetailErr(errorMessage(e));
    } finally {
      setDetailBusy(false);
    }
  }

  if (!isChef) {
    return (
      <>
        <h1 className="page-title">Équipe enseignants</h1>
        <PrivilegeHint variant="readOnlyRef" />
        <div className="card">
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            La liste et la gestion de l’annuaire enseignants sont réservées au Chef Enseignant (GET{' '}
            <code>/enseignants</code> et écritures).
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Équipe enseignants</h1>
      <p className="page-desc">
        Annuaire complet — accès Chef uniquement (création, modification, suppression, rôle).
      </p>
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

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>
          Scénario OpenFeign : Matière + enseignant
        </h3>
        <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: '0.92rem' }}>
          Endpoint : <code>/matieres/{'{id}'}/details-avec-enseignant/{'{enseignantId}'}</code>
        </p>
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 720 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="ens-scenario-matiere">Matière</label>
            <select
              id="ens-scenario-matiere"
              value={selectedMatiereId}
              onChange={(e) => setSelectedMatiereId(e.target.value)}
            >
              <option value="">Sélectionner...</option>
              {matieres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom ?? 'Matière'}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="ens-scenario-enseignant">Enseignant</label>
            <select
              id="ens-scenario-enseignant"
              value={selectedEnseignantId}
              onChange={(e) => setSelectedEnseignantId(e.target.value)}
            >
              <option value="">Sélectionner...</option>
              {rows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.matricule ? `${r.nom} (${r.matricule})` : r.nom}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => load()}>
              Recharger les listes
            </button>
            <button type="button" className="btn btn-primary" onClick={loadMatiereEnseignantDetail} disabled={detailBusy}>
              {detailBusy ? 'Test en cours...' : 'Tester le scénario'}
            </button>
          </div>
        </div>

        {detailErr && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{detailErr}</div>}

        {detail && (
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Matière</th>
                  <th>Enseignant</th>
                  <th>Matricule</th>
                  <th>Rôle</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{detail.matiereNom ?? '—'}</td>
                  <td>{detail.enseignantNom ?? '—'}</td>
                  <td>{detail.enseignantMatricule ?? '—'}</td>
                  <td>{detail.enseignantRole ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="card" style={{ marginTop: '1rem', padding: 0 }}>
          <div
            style={{
              padding: '0.85rem 1.1rem',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <strong>Historique enregistré du scénario</strong>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHistoryRows([])}>
              Vider historique
            </button>
          </div>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Date test</th>
                  <th>Matière</th>
                  <th>Enseignant</th>
                  <th>Matricule</th>
                  <th>Rôle</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((r, idx) => (
                  <tr key={`${r.testedAt}-${idx}`}>
                    <td>{new Date(r.testedAt).toLocaleString()}</td>
                    <td>{r.matiereNom}</td>
                    <td>{r.enseignantNom}</td>
                    <td>{r.enseignantMatricule}</td>
                    <td>{r.enseignantRole}</td>
                  </tr>
                ))}
                {historyRows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ color: 'var(--muted)' }}>
                      Aucun test enregistré pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
