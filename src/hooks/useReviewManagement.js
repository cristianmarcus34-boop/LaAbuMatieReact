import { useCallback } from 'react';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'; // Importar serverTimestamp

export const useReviewManagement = (db, appId, showNotification) => {
  const handleApproveReview = useCallback(async (reviewId) => {
    try {
      const reviewRef = doc(db, `artifacts/${appId}/public/data/product_reviews`, reviewId);
      await updateDoc(reviewRef, { approved: true });
      showNotification('Reseña aprobada con éxito.', 'success');
    } catch (e) {
      console.error("Error al aprobar reseña:", e);
      showNotification(`Error al aprobar reseña: ${e.message}`, 'error');
    }
  }, [db, appId, showNotification]);

  const handleRejectReview = useCallback(async (reviewId, setConfirmMessage, setConfirmAction, setIsConfirmModalOpen) => {
    setConfirmMessage('¿Estás seguro de que quieres eliminar esta reseña? Esto la rechazará permanentemente.');
    setConfirmAction(() => async () => {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/product_reviews`, reviewId));
        showNotification('Reseña eliminada/rechazada con éxito.', 'info');
      } catch (e) {
        console.error("Error al rechazar reseña:", e);
        showNotification(`Error al rechazar reseña: ${e.message}`, 'error');
      } finally {
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  }, [db, appId, showNotification]);

  // NUEVA FUNCIÓN: Para que el administrador responda a una reseña
  const handleAdminRespondToReview = useCallback(async (reviewId, responseText) => {
    try {
      if (!responseText.trim()) {
        showNotification('La respuesta no puede estar vacía.', 'warning');
        return;
      }
      const reviewRef = doc(db, `artifacts/${appId}/public/data/product_reviews`, reviewId);
      await updateDoc(reviewRef, {
        adminResponse: {
          text: responseText.trim(),
          timestamp: serverTimestamp(), // Guarda la marca de tiempo de la respuesta
        },
        // Opcional: podrías marcarla como 'respondida' si necesitas un estado adicional
        // responded: true,
      });
      showNotification('Respuesta enviada con éxito.', 'success');
    } catch (e) {
      console.error("Error al responder reseña:", e);
      showNotification(`Error al enviar respuesta: ${e.message}`, 'error');
    }
  }, [db, appId, showNotification]);

  return {
    handleApproveReview,
    handleRejectReview,
    handleAdminRespondToReview, // Exportar la nueva función
  };
};
