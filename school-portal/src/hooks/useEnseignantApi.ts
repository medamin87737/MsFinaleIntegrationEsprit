import { useMemo } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export function useEnseignantApi() {
  const { userKind } = useAuth();
  return useMemo(() => (userKind === 'enseignant' ? api : null), [userKind]);
}
