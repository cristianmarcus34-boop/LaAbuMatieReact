import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { registerSW } from 'virtual:pwa-register';

// Registrar Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[SW] Nueva versión detectada. Activando...');
    updateSW(true).then(() => {
      window.location.reload();
    });
  },
  onOfflineReady() {
    console.log('[SW] App lista para funcionar offline.');
  },
});

// Forzar actualización al volver a la pestaña (desktop y móvil)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('[SW] Verificando actualizaciones al volver a la pestaña...');
    updateSW(true);
  }
});

// FORZAR que el SW busque actualizaciones en cada load (especialmente en móvil)
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => {
        console.log('[SW] Forzando check de nueva versión...');
        reg.update();
      });
    });
  }
});

// Listener global para refresh por BroadcastChannel
if ('BroadcastChannel' in window) {
  const channel = new BroadcastChannel('sw-messages');
  channel.onmessage = (event) => {
    if (event.data === 'refresh') {
      console.log('[SW] Recibida señal global de refresh, recargando...');
      window.location.reload();
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
