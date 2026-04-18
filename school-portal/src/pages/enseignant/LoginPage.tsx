import { Navigate } from 'react-router-dom';

/** L’authentification passe par Keycloak (login-required) — cette page n’est plus utilisée. */
export default function EnseignantLogin() {
  return <Navigate to="/" replace />;
}
