import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim, skipWaiting } from 'workbox-core';

// Esperar a instalar y activar nuevo SW de inmediato
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando nueva versión...');
  event.waitUntil(skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activando nueva versión...');
  event.waitUntil(
    (async () => {
      await clientsClaim();
      const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      clients.forEach(client => client.postMessage({ type: 'NEW_VERSION' }));
    })()
  );
});

// Precachear assets generados en build
precacheAndRoute(self.__WB_MANIFEST || []);
