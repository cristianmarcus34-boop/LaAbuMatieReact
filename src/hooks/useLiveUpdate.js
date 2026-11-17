import { useEffect, useState } from 'react';

export function useLiveUpdate() {
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // Escuchar mensajes del Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NEW_VERSION') {
          console.log('[SW] Nueva versión disponible.');
          setHasUpdate(true);
        }
      });
    }

    // Refuerzo con BroadcastChannel
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('sw-messages');
      channel.onmessage = (event) => {
        if (event.data === 'refresh') {
          console.log('[SW] Señal global de refresh recibida.');
          setHasUpdate(true);
        }
      };
      return () => channel.close();
    }
  }, []);

  // Recargar la página
  const refreshPage = () => {
    window.location.reload(true);
  };

  return { hasUpdate, refreshPage };
}
