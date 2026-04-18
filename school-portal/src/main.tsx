import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import keycloak from './keycloak';

keycloak
  .init({
    onLoad: 'login-required',
    checkLoginIframe: false,
    pkceMethod: 'S256',
  })
  .then((authenticated) => {
    if (!authenticated) {
      return;
    }
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <App />
            <ToastContainer position="top-right" autoClose={4000} />
          </AuthProvider>
        </BrowserRouter>
      </StrictMode>,
    );
  })
  .catch(() => {
    // eslint-disable-next-line no-console
    console.error('Échec initialisation Keycloak');
  });
