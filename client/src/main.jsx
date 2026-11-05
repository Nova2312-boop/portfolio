import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Le back-office n'est chargé que sur /admin : le site public reste léger
const Admin = lazy(() => import('./components/admin/Admin.jsx'));
const isAdmin = /^\/admin\/?$/.test(location.pathname);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
