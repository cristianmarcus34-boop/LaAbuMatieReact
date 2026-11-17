import React, { useState, useEffect } from 'react';
import { XCircle, Send, Star, User, MessageSquare } from 'lucide-react';

const ReviewResponseModal = ({ isOpen, onClose, review, onSaveResponse, showNotification }) => {
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && review) {
      // Si la reseña ya tiene una respuesta del admin, precargarla
      setResponseText(review.adminResponse?.text || '');
    } else {
      setResponseText('');
    }
  }, [isOpen, review]);

  const handleSubmit = async () => {
    if (!responseText.trim()) {
      showNotification('La respuesta no puede estar vacía.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSaveResponse(review.id, responseText);
      onClose(); // Cerrar el modal al guardar
    } catch (error) {
      // La notificación de error ya la maneja useReviewManagement
      console.error("Error al guardar respuesta en el modal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[110]"> {/* Z-index alto para estar sobre otros modales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-1"
          aria-label="Cerrar modal de respuesta de reseña"
        >
          <XCircle size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Responder Reseña</h2>

        {/* Detalles de la Reseña Original */}
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
            <User size={16} /> Cliente: <span className="font-semibold text-gray-800 dark:text-gray-200">{review.userName || review.userId?.substring(0, 8) || 'Anónimo'}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
            <Star size={16} className="text-yellow-500 fill-current" /> Calificación: <span className="font-semibold text-gray-800 dark:text-gray-200">{review.rating}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
            <MessageSquare size={16} className="mt-0.5" /> Comentario: <span className="font-semibold text-gray-800 dark:text-gray-200">{review.comment || 'Sin comentario'}</span>
          </p>
          {review.timestamp && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
              Fecha: {new Date(review.timestamp.toDate()).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Formulario de Respuesta del Administrador */}
        <div className="mb-4">
          <label htmlFor="adminResponse" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tu Respuesta:
          </label>
          <textarea
            id="adminResponse"
            name="adminResponse"
            rows="4"
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-purple-500 focus:border-purple-500 resize-y"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Send size={20} className="animate-pulse" /> Enviando...
              </>
            ) : (
              <>
                <Send size={20} /> Enviar Respuesta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewResponseModal;
