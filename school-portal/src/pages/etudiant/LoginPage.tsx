import { Navigate } from 'react-router-dom';

/** L’authentification passe par Keycloak (login-required) — cette page n’est plus utilisée. */
export default function EtudiantLogin() {
  return <Navigate to="/" replace />;
}
