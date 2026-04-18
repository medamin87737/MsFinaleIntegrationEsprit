import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import PrivilegeHint from '../../components/PrivilegeHint';
import { useEnseignantApi } from '../../hooks/useEnseignantApi';
import { useEnseignantPrivileges } from '../../hooks/useEnseignantPrivileges';
import { errorMessage } from '../../utils/errors';

type HistRow = {
  _id?: string;
  etudiantId?: number;
  matiereId?: number;
  ancienneValeur?: number;
  nouvelleValeur?: number;
  action?: string;
  createdAt?: string;
};

type NoteLookupRow = {
  inscriptionId?: string;
  etudiantId?: number;
  matiereId?: number;
  note?: {
    id?: string;
    valeur?: number;
    createdAt?: string;
    updatedAt?: string;
  } | null;
};

type EtudiantOpt = { id: number; nom: string; matricule?: string | null };
type MatiereOpt = { id: number; nom: string };

export default function NotesPage() {
  const client = useEnseignantApi();
  const { canWriteNotes, isChef } = useEnseignantPrivileges();

  const [historique, setHistorique] = useState<HistRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [refBusy, setRefBusy] = useState(false);

  const [etudiantOptions, setEtudiantOptions] = useState<EtudiantOpt[]>([]);
  const [matiereOptions, setMatiereOptions] = useState<MatiereOpt[]>([]);

  const [insEtudiantId, setInsEtudiantId] = useState('');
  const [insMatiereId, setInsMatiereId] = useState('');
  const [noteEtudiantId, setNoteEtudiantId] = useState('');
  const [noteMatiereId, setNoteMatiereId] = useState('');
  const [noteV, setNoteV] = useState('12');

  const [lookupEtudiantId, setLookupEtudiantId] = useState('');
  const [lookupRows, setLookupRows] = useState<NoteLookupRow[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [selectedNoteSummary, setSelectedNoteSummary] = useState('');
  const [updateValue, setUpdateValue] = useState('12');

  const etuLabel = useCallback(
    (id?: number) => {
      if (id == null) return '—';
      const e = etudiantOptions.find((x) => x.id === id);
      if (!e) return '—';
      return e.matricule ? `${e.nom} · ${e.matricule}` : e.nom;
    },
    [etudiantOptions],
  );

  const matLabel = useCallback(
    (id?: number) => {
      if (id == null) return '—';
      const m = matiereOptions.find((x) => x.id === id);
      return m?.nom ?? '—';
    },
    [matiereOptions],
  );

  const load = useCallback(async () => {
    if (!client) return;
    const { data } = await client.get<HistRow[]>('/notes/historique');
    setHistorique(Array.isArray(data) ? data : []);
  }, [client]);

  const loadRefOptions = useCallback(async () => {
    if (!client) return;
    setRefBusy(true);
    try {
      if (canWriteNotes) {
        const { data: mes } = await client.get<Array<{ classeId?: number }>>('/classes/mes-classes');
        const classes = Array.isArray(mes) ? mes : [];
        const merged: EtudiantOpt[] = [];
        const seen = new Set<number>();
        for (const c of classes) {
          const cid = c.classeId;
          if (cid == null) continue;
          try {
            const { data: studs } = await client.get<EtudiantOpt[]>(`/etudiants/classe/${cid}`);
            for (const s of Array.isArray(studs) ? studs : []) {
              if (s.id != null && !seen.has(s.id)) {
                seen.add(s.id);
                merged.push({ id: s.id, nom: s.nom, matricule: s.matricule });
              }
            }
          } catch {
            /* ignore */
          }
        }
        merged.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
        setEtudiantOptions(merged);
        const { data: mat } = await client.get<MatiereOpt[]>('/matieres/mes-matieres');
        const mats = Array.isArray(mat) ? mat : [];
        mats.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
        setMatiereOptions(mats);
      } else if (isChef) {
        const [eRes, mRes] = await Promise.all([
          client.get<EtudiantOpt[]>('/etudiants'),
          client.get<MatiereOpt[]>('/matieres'),
        ]);
        const eList = Array.isArray(eRes.data) ? eRes.data : [];
        eList.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
        setEtudiantOptions(eList);
        const mList = Array.isArray(mRes.data) ? mRes.data : [];
        mList.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
        setMatiereOptions(mList);
      } else {
        setEtudiantOptions([]);
        setMatiereOptions([]);
      }
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setRefBusy(false);
    }
  }, [client, canWriteNotes, isChef]);

  const reloadLookupRows = useCallback(async () => {
    if (!client || !canWriteNotes) return;
    const etuId = Number(lookupEtudiantId);
    if (!lookupEtudiantId || !Number.isInteger(etuId) || etuId < 1) return;
    const { data } = await client.get<NoteLookupRow[]>(`/notes/etudiants/${etuId}`);
    setLookupRows(Array.isArray(data) ? data : []);
  }, [client, canWriteNotes, lookupEtudiantId]);

  const chargerInscriptions = useCallback(async () => {
    if (!client || !canWriteNotes) return;
    const etuId = Number(lookupEtudiantId);
    if (!lookupEtudiantId || !Number.isInteger(etuId) || etuId < 1) {
      setErr('Choisissez un étudiant dans la liste, puis chargez ses inscriptions.');
      return;
    }
    setLookupBusy(true);
    setErr(null);
    try {
      const { data } = await client.get<NoteLookupRow[]>(`/notes/etudiants/${etuId}`);
      setLookupRows(Array.isArray(data) ? data : []);
      setSelectedNoteId('');
      setSelectedNoteSummary('');
    } catch (ex) {
      setErr(errorMessage(ex));
      setLookupRows([]);
    } finally {
      setLookupBusy(false);
    }
  }, [client, canWriteNotes, lookupEtudiantId]);

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

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      try {
        await loadRefOptions();
      } catch {
        /* err géré dans loadRefOptions */
      }
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [client, loadRefOptions]);

  useEffect(() => {
    setLookupRows([]);
    setSelectedNoteId('');
    setSelectedNoteSummary('');
  }, [lookupEtudiantId]);

  const selectEtudiantItems = useMemo(() => {
    const opts = etudiantOptions.map((e) => (
      <option key={e.id} value={e.id}>
        {e.matricule ? `${e.nom} (${e.matricule})` : e.nom}
      </option>
    ));
    return [<option key="_" value="">Sélectionner…</option>, ...opts];
  }, [etudiantOptions]);

  const selectMatiereItems = useMemo(() => {
    const opts = matiereOptions.map((m) => (
      <option key={m.id} value={m.id}>
        {m.nom}
      </option>
    ));
    return [<option key="_" value="">Sélectionner…</option>, ...opts];
  }, [matiereOptions]);

  async function submitInscription(e: FormEvent) {
    e.preventDefault();
    if (!client || !canWriteNotes) return;
    const etudiantId = Number(insEtudiantId);
    const matiereId = Number(insMatiereId);
    if (!Number.isInteger(etudiantId) || etudiantId < 1 || !Number.isInteger(matiereId) || matiereId < 1) {
      setErr('Choisissez un étudiant et une matière dans les listes.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await client.post('/notes/inscriptions', { etudiantId, matiereId });
      setInsEtudiantId('');
      setInsMatiereId('');
      await load();
      await reloadLookupRows();
    } catch (ex) {
      setErr(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  async function submitNote(e: FormEvent) {
    e.preventDefault();
    if (!client || !canWriteNotes) return;
    const etudiantId = Number(noteEtudiantId);
    const matiereId = Number(noteMatiereId);
    if (!Number.isInteger(etudiantId) || etudiantId < 1 || !Number.isInteger(matiereId) || matiereId < 1) {
      setErr('Choisissez un étudiant et une matière dans les listes.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await client.post('/notes', {
        etudiantId,
        matiereId,
        valeur: Number(noteV),
      });
      setNoteEtudiantId('');
      setNoteMatiereId('');
      setNoteV('12');
      await load();
      await reloadLookupRows();
    } catch (ex) {
      setErr(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  function chooseNoteToEdit(row: NoteLookupRow) {
    const noteId = row.note?.id;
    if (!noteId) return;
    setSelectedNoteId(noteId);
    const etu = etuLabel(row.etudiantId);
    const mat = matLabel(row.matiereId);
    setSelectedNoteSummary(`${etu} — ${mat} — note actuelle : ${row.note?.valeur ?? '—'}/20`);
    setUpdateValue(String(row.note?.valeur ?? 12));
  }

  async function submitUpdateNote(e: FormEvent) {
    e.preventDefault();
    if (!client || !canWriteNotes) return;
    if (!selectedNoteId) {
      setErr('Choisissez une ligne dans le tableau (bouton « Modifier »).');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await client.put(`/notes/${selectedNoteId}`, {
        valeur: Number(updateValue),
      });
      await load();
      await reloadLookupRows();
    } catch (ex) {
      setErr(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="page-title">Notes</h1>
      <p className="page-desc">
        Même logique que le service MSNotes : lecture pour Enseignant et Chef ; inscriptions et saisie de
        notes pour le rôle Enseignant uniquement.
      </p>
      {isChef && <PrivilegeHint variant="chefNotesReadOnly" />}
      {canWriteNotes && <PrivilegeHint variant="enseignantNotes" />}
      {err && <div className="alert alert-error">{err}</div>}
      {refBusy && canWriteNotes && (
        <p className="page-desc" style={{ marginTop: 0 }}>
          Chargement des listes étudiants / matières…
        </p>
      )}

      {canWriteNotes && (
        <div style={{ marginBottom: '1rem' }}>
          <button type="button" className="btn btn-ghost btn-sm" disabled={refBusy} onClick={() => loadRefOptions()}>
            Recharger les listes étudiants / matières
          </button>
        </div>
      )}

      {canWriteNotes && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Inscrire un étudiant à une matière</h3>
          <form onSubmit={submitInscription} style={{ display: 'grid', gap: '0.75rem', maxWidth: 480 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="ins-etu">Étudiant</label>
              <select
                id="ins-etu"
                value={insEtudiantId}
                onChange={(e) => setInsEtudiantId(e.target.value)}
                required
              >
                {selectEtudiantItems}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="ins-mat">Matière</label>
              <select
                id="ins-mat"
                value={insMatiereId}
                onChange={(e) => setInsMatiereId(e.target.value)}
                required
              >
                {selectMatiereItems}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy || refBusy}>
              Inscrire
            </button>
          </form>
        </div>
      )}

      {canWriteNotes && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Affecter une note (0–20)</h3>
          <form onSubmit={submitNote} style={{ display: 'grid', gap: '0.75rem', maxWidth: 480 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="note-etu">Étudiant</label>
              <select
                id="note-etu"
                value={noteEtudiantId}
                onChange={(e) => setNoteEtudiantId(e.target.value)}
                required
              >
                {selectEtudiantItems}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="note-mat">Matière</label>
              <select
                id="note-mat"
                value={noteMatiereId}
                onChange={(e) => setNoteMatiereId(e.target.value)}
                required
              >
                {selectMatiereItems}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="note-val">Note</label>
              <input
                id="note-val"
                type="number"
                min={0}
                max={20}
                step="0.25"
                value={noteV}
                onChange={(e) => setNoteV(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy || refBusy}>
              Enregistrer
            </button>
          </form>
        </div>
      )}

      {canWriteNotes && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Modifier une note existante</h3>
          <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.92rem' }}>
            Choisissez un étudiant dans la liste, puis chargez ses inscriptions et notes.
          </p>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="lookup-etu">Étudiant</label>
            <select
              id="lookup-etu"
              value={lookupEtudiantId}
              onChange={(e) => setLookupEtudiantId(e.target.value)}
            >
              <option value="">Sélectionner…</option>
              {etudiantOptions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.matricule ? `${e.nom} (${e.matricule})` : e.nom}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: '0.65rem' }}>
            <button type="button" className="btn btn-primary btn-sm" disabled={lookupBusy} onClick={() => chargerInscriptions()}>
              {lookupBusy ? 'Chargement…' : 'Charger les inscriptions'}
            </button>
          </div>

          {lookupBusy ? (
            <p style={{ marginTop: '0.85rem', color: 'var(--muted)' }}>Chargement des notes…</p>
          ) : null}

          <div className="table-wrap" style={{ marginTop: '0.9rem' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Matière</th>
                  <th>Valeur</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lookupRows.map((r, idx) => (
                  <tr key={r.inscriptionId ?? String(idx)}>
                    <td>{etuLabel(r.etudiantId)}</td>
                    <td>{matLabel(r.matiereId)}</td>
                    <td>{typeof r.note?.valeur === 'number' ? r.note.valeur : '—'}</td>
                    <td>
                      {r.note?.id ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => chooseNoteToEdit(r)}
                        >
                          Modifier
                        </button>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>Aucune note</span>
                      )}
                    </td>
                  </tr>
                ))}
                {lookupRows.length === 0 && !lookupBusy && (
                  <tr>
                    <td colSpan={4} style={{ color: 'var(--muted)' }}>
                      Choisissez un étudiant, puis utilisez « Charger les inscriptions ».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <form onSubmit={submitUpdateNote} style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem', maxWidth: 480 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Note sélectionnée</label>
              <input value={selectedNoteSummary} readOnly placeholder="Choisissez une ligne à modifier ci-dessus" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="upd-val">Nouvelle valeur (0–20)</label>
              <input
                id="upd-val"
                type="number"
                min={0}
                max={20}
                step="0.25"
                value={updateValue}
                onChange={(e) => setUpdateValue(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy || !selectedNoteId}>
              Enregistrer la modification
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--line)' }}>
          <strong>Historique</strong>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Matière</th>
                <th>Action</th>
                <th>Ancienne</th>
                <th>Nouvelle</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {historique.map((h, i) => (
                <tr key={h._id ?? String(i)}>
                  <td>{etuLabel(h.etudiantId)}</td>
                  <td>{matLabel(h.matiereId)}</td>
                  <td>{h.action ?? '—'}</td>
                  <td>{h.ancienneValeur ?? '—'}</td>
                  <td>{h.nouvelleValeur ?? '—'}</td>
                  <td>{h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
