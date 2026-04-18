import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import PrivilegeHint from '../../components/PrivilegeHint';
import { MatieresAffectationCard } from '../../components/MatiereSalleCards';
import { useEnseignantApi } from '../../hooks/useEnseignantApi';
import { useEnseignantPrivileges } from '../../hooks/useEnseignantPrivileges';
import { errorMessage } from '../../utils/errors';

type MatiereRow = {
  id: number;
  nom: string;
  description?: string | null;
  salleId?: number | null;
  classeId?: number | null;
  heureDebutSeance?: string | null;
  heureFinSeance?: string | null;
};

type ClasseRow = { id: number; nom: string };
type SalleRow = { id: number; nom: string };

function displayCreneau(debut?: string | null, fin?: string | null) {
  if (!debut || !fin) return '—';
  return `${debut} - ${fin}`;
}

type MesClasseRow = { classeId?: number; classeNom?: string };

export default function MatieresPage() {
  const client = useEnseignantApi();
  const { canManageRefData, isChef } = useEnseignantPrivileges();

  const [rows, setRows] = useState<MatiereRow[]>([]);
  const [classes, setClasses] = useState<ClasseRow[]>([]);
  const [salles, setSalles] = useState<SalleRow[]>([]);

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [affectMatiereId, setAffectMatiereId] = useState('');
  const [affectClasseId, setAffectClasseId] = useState('');
  const [affectSalleId, setAffectSalleId] = useState('');
  const [heureDebut, setHeureDebut] = useState('08:00');
  const [heureFin, setHeureFin] = useState('10:00');

  const classesMap = useMemo(
    () =>
      classes.reduce<Record<number, string>>((acc, c) => {
        acc[c.id] = c.nom;
        return acc;
      }, {}),
    [classes],
  );

  const sallesMap = useMemo(
    () =>
      salles.reduce<Record<number, string>>((acc, s) => {
        acc[s.id] = s.nom;
        return acc;
      }, {}),
    [salles],
  );

  const loadAll = useCallback(async () => {
    if (!client) return;
    if (isChef) {
      const [mRes, cRes, sRes] = await Promise.all([
        client.get<MatiereRow[]>('/matieres'),
        client.get<ClasseRow[]>('/classes'),
        client.get<SalleRow[]>('/salles'),
      ]);
      setRows(Array.isArray(mRes.data) ? mRes.data : []);
      setClasses(Array.isArray(cRes.data) ? cRes.data : []);
      setSalles(Array.isArray(sRes.data) ? sRes.data : []);
      return;
    }
    const [mRes, mesRes, sRes] = await Promise.all([
      client.get<MatiereRow[]>('/matieres/mes-matieres'),
      client.get<MesClasseRow[]>('/classes/mes-classes'),
      client.get<SalleRow[]>('/salles'),
    ]);
    setRows(Array.isArray(mRes.data) ? mRes.data : []);
    const mes = Array.isArray(mesRes.data) ? mesRes.data : [];
    setClasses(
      mes
        .filter((c) => c.classeId != null)
        .map((c) => ({ id: Number(c.classeId), nom: c.classeNom ?? '' })),
    );
    setSalles(Array.isArray(sRes.data) ? sRes.data : []);
  }, [client, isChef]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      setErr(null);
      try {
        await loadAll();
      } catch (e) {
        if (!cancelled) setErr(errorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, loadAll]);

  function resetForm() {
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
        await client.put(`/matieres/${editingId}`, body);
      } else {
        await client.post('/matieres', body);
      }
      resetForm();
      await loadAll();
    } catch (ex) {
      setErr(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  function onEdit(r: MatiereRow) {
    setEditingId(r.id);
    setNom(r.nom);
    setDescription(r.description ?? '');
  }

  async function onDelete(id: number) {
    if (!client || !canManageRefData) return;
    if (!window.confirm('Supprimer cette matière ?')) return;
    setBusy(true);
    setErr(null);
    try {
      await client.delete(`/matieres/${id}`);
      if (editingId === id) resetForm();
      await loadAll();
    } catch (ex) {
      setErr(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  async function onAssignationSubmit(e: FormEvent) {
    e.preventDefault();
    if (!client || !canManageRefData) return;
    const matiereId = Number(affectMatiereId);
    const classeId = Number(affectClasseId);
    const salleId = Number(affectSalleId);
    if (!Number.isInteger(matiereId) || matiereId < 1) {
      setErr("Sélectionnez d'abord une matière valide.");
      return;
    }
    if (!Number.isInteger(classeId) || classeId < 1 || !Number.isInteger(salleId) || salleId < 1) {
      setErr('Classe et salle sont obligatoires pour l’affectation.');
      return;
    }
    if (!heureDebut || !heureFin) {
      setErr('Heure début et heure fin sont obligatoires.');
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      await client.put(`/matieres/${matiereId}/assignation-salle`, {
        classeId,
        salleId,
        heureDebutSeance: heureDebut,
        heureFinSeance: heureFin,
      });
      await loadAll();
    } catch (ex) {
      setErr(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="page-title">Matières</h1>
      {!canManageRefData && <PrivilegeHint variant="readOnlyRef" />}
      <p className="page-desc">
        {canManageRefData
          ? 'Gestion complète (création, modification, suppression) + affectation classe/salle/créneau.'
          : 'Consultation de toutes les matières et de leurs affectations.'}
      </p>

      {err && <div className="alert alert-error">{err}</div>}

      {canManageRefData && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>
            {editingId != null ? 'Modifier matière' : 'Nouvelle matière'}
          </h3>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="mat-nom">Nom</label>
              <input id="mat-nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="mat-desc">Description</label>
              <input id="mat-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {editingId != null ? 'Enregistrer' : 'Créer'}
              </button>
              {editingId != null && (
                <button type="button" className="btn btn-ghost" onClick={resetForm}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {canManageRefData && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>
            Affecter matière vers classe / salle / créneau
          </h3>
          <form onSubmit={onAssignationSubmit} style={{ display: 'grid', gap: '0.75rem', maxWidth: 640 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="aff-matiere">Matière</label>
              <select
                id="aff-matiere"
                value={affectMatiereId}
                onChange={(e) => setAffectMatiereId(e.target.value)}
                required
              >
                <option value="">Sélectionner...</option>
                {rows.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="aff-classe">Classe</label>
              <select
                id="aff-classe"
                value={affectClasseId}
                onChange={(e) => setAffectClasseId(e.target.value)}
                required
              >
                <option value="">Sélectionner...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="aff-salle">Salle</label>
              <select
                id="aff-salle"
                value={affectSalleId}
                onChange={(e) => setAffectSalleId(e.target.value)}
                required
              >
                <option value="">Sélectionner...</option>
                {salles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="aff-debut">Heure début</label>
                <input
                  id="aff-debut"
                  type="time"
                  value={heureDebut}
                  onChange={(e) => setHeureDebut(e.target.value)}
                  required
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="aff-fin">Heure fin</label>
                <input id="aff-fin" type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              Affecter
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => loadAll()}>
            Recharger les listes
          </button>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Classe</th>
                <th>Salle</th>
                <th>Heure début</th>
                <th>Heure fin</th>
                <th>Créneau</th>
                {canManageRefData && <th style={{ width: 200 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.nom}</td>
                  <td>{r.description ?? '—'}</td>
                  <td>{r.classeId != null ? (classesMap[r.classeId] ?? '—') : '—'}</td>
                  <td>{r.salleId != null ? (sallesMap[r.salleId] ?? '—') : '—'}</td>
                  <td>{r.heureDebutSeance ?? '—'}</td>
                  <td>{r.heureFinSeance ?? '—'}</td>
                  <td>{displayCreneau(r.heureDebutSeance, r.heureFinSeance)}</td>
                  {canManageRefData && (
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
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={canManageRefData ? 8 : 7} style={{ color: 'var(--muted)' }}>
                    Aucune matière disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MatieresAffectationCard client={client} title="Carte matière -> salle et temps de séance" />
    </>
  );
}
