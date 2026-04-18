import type { EtudiantPortail } from '../types';

export function matiereLabel(portail: EtudiantPortail | undefined | null, matiereId: number | undefined) {
  if (matiereId == null) return '—';
  const m = portail?.matieres?.find((x) => x.id === matiereId);
  return m ? `${m.nom} (${matiereId})` : String(matiereId);
}
