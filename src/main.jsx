import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './style.css';
import './styles/design-system.css';

// ─── Service Worker registration ──────────────────────────────────────────────
function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.info('[SW] Service Workers not supported in this browser.');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        // 'classic' type is required because our SW does NOT use import()
        type: 'classic',
      });

      console.info('[SW] Registered, scope:', registration.scope);

      // Handle SW updates: when a new SW is waiting, reload once it activates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New SW installed — tell it to skip waiting, then reload
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            console.info('[SW] New version available — reloading.');
          }
        });
      });

      // Reload page when a new SW takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } catch (error) {
      // SW registration failure is non-fatal; the app still works online
      console.warn('[SW] Registration failed:', error.message);
    }
  });
}

registerSW();

// ─── Render ───────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
