import axios from 'axios';

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data;
    if (d && typeof d === 'object') {
      const o = d as Record<string, unknown>;
      if (typeof o.message === 'string') return o.message;
      if (typeof o.error === 'string') return o.error;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Une erreur est survenue.';
}
