import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { SearchProvider } from './contexts/SearchContext.tsx';
import './index.css';

const domain = import.meta.env.VITE_AUTH0_DOMAIN || '';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || '';
const audience = import.meta.env.VITE_AUTH0_AUDIENCE || '';

console.log('[main.tsx] Auth0 Configuration:', {
    domain,
    clientId,
    audience,
    origin: window.location.origin,
    env: import.meta.env.MODE,
});

if (!domain || !clientId) {
    console.error('[main.tsx] ❌ Auth0 credentials missing!', {
        domain: domain ? '✓' : '❌',
        clientId: clientId ? '✓' : '❌',
    });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <AuthProvider>
        <SearchProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SearchProvider>
      </AuthProvider>
    </Auth0Provider>
  </StrictMode>,
);
