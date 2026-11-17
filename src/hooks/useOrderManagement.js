import { useState, useCallback, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
//Este gancho manejará la lógica relacionada con las órdenes, incluyendo la actualización de estado, eliminación y notificación de nuevas órdenes.
export const useOrderManagement = (db, appId, showNotification, orders) => {
  const [previousPendingOrdersCount, setPreviousPendingOrdersCount] = useState(0);
  const [hasNewOrdersAlert, setHasNewOrdersAlert] = useState(false);

  // Función para reproducir un sonido de notificación
  const playNewOrderSound = useCallback(() => {
    const audio = new Audio('/sounds/new_order_sound.mp3'); 
    audio.play().catch(e => console.error("Error al reproducir sonido de nueva orden:", e));
  }, []);

  // Efecto para detectar nuevas órdenes pendientes y activar la notificación
  useEffect(() => {
    const currentPendingOrders = orders.filter(order => order.status === 'pending').length;

    if (currentPendingOrders > previousPendingOrdersCount && previousPendingOrdersCount !== 0) {
      setHasNewOrdersAlert(true);
      playNewOrderSound();
      showNotification('¡Nueva orden pendiente recibida!', 'info', 5000);
    } else if (currentPendingOrders < previousPendingOrdersCount) {
      setHasNewOrdersAlert(false);
    }

    setPreviousPendingOrdersCount(currentPendingOrders);
  }, [orders, previousPendingOrdersCount, playNewOrderSound, showNotification]);

  const handleUpdateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, `artifacts/${appId}/public/data/orders`, orderId);
      await updateDoc(orderRef, { status: newStatus });
      showNotification(`Estado de la orden ${orderId.substring(0, 5)}... actualizado a "${newStatus}".`, 'success');
    } catch (e) {
      console.error("Error al actualizar estado de orden:", e);
      showNotification(`Error al actualizar estado de orden: ${e.message}`, 'error');
    }
  }, [db, appId, showNotification]);

  const handleDeleteOrder = useCallback(async (orderId, setConfirmMessage, setConfirmAction, setIsConfirmModalOpen) => {
    setConfirmMessage('¿Estás seguro de que quieres eliminar esta orden? Esta acción es irreversible.');
    setConfirmAction(() => async () => {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/orders`, orderId));
        showNotification('Orden eliminada con éxito.', 'success');
      } catch (e) {
        console.error("Error al eliminar orden:", e);
        showNotification(`Error al eliminar orden: ${e.message}`, 'error');
      } finally {
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  }, [db, appId, showNotification]);

  const handleClearAllOrders = useCallback(async (setConfirmMessage, setConfirmAction, setIsConfirmModalOpen) => {
    setConfirmMessage('¿Estás seguro de que quieres eliminar TODAS las órdenes completadas y canceladas?');
    setConfirmAction(() => async () => {
      try {
        const ordersColRef = collection(db, `artifacts/${appId}/public/data/orders`);
        const q = query(ordersColRef, where('status', 'in', ['completed', 'cancelled']));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        showNotification('Órdenes completadas y canceladas eliminadas.', 'success');
      } catch (e) {
        console.error("Error al limpiar órdenes:", e);
        showNotification(`Error al limpiar órdenes: ${e.message}`, 'error');
      } finally {
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  }, [db, appId, showNotification]);

  return {
    handleUpdateOrderStatus,
    handleDeleteOrder,
    handleClearAllOrders,
    hasNewOrdersAlert,
  };
};
