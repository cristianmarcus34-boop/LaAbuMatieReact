import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function useServiceWorkerUpdate() {
  const {
    needRefresh,
    updateServiceWorker,
    offlineReady,
  } = useRegisterSW();

  const hasTriedUpdate = useRef(false);
  const [showManualUpdatePrompt, setShowManualUpdatePrompt] = useState(false);

  useEffect(() => {
    if (needRefresh && !hasTriedUpdate.current) {
      hasTriedUpdate.current = true;

      (async () => {
        try {
          await updateServiceWorker(true);
        } catch {
          setShowManualUpdatePrompt(true);
        }
      })();
    }
  }, [needRefresh, updateServiceWorker]);

  const confirmUpdate = async () => {
    try {
      await updateServiceWorker(true);
      setShowManualUpdatePrompt(false);
      window.location.reload();
    } catch {
      // Manejar error si se desea
    }
  };

  return { showManualUpdatePrompt, confirmUpdate, offlineReady };
}
