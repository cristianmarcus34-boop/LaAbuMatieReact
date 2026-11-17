import React, { useCallback, useEffect, useRef } from 'react';
// Cambiado: Eliminado 'Whatsapp', añadido 'Send' o 'MessageSquare' si se prefiere un icono genérico,
// pero usaremos una imagen para el logo oficial de WhatsApp.
import { XCircle, CheckCircle, Send } from 'lucide-react'; 

function WhatsAppConfirmationModal({ order, onClose, onConfirmWhatsAppSent }) {
  const modalRef = useRef(null);

  // Asegura que el modal se cierre al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        // No cerramos automáticamente al hacer clic fuera para este modal,
        // ya que queremos que el usuario complete la acción de WhatsApp.
        // Podríamos añadir una notificación si intenta cerrar sin confirmar.
      }
    };

    // No añadimos el listener de clic fuera para no cerrar accidentalmente
    // document.addEventListener('mousedown', handleClickOutside);
    // return () => {
    //   document.removeEventListener('mousedown', handleClickOutside);
    // };
  }, []);

  // Función para reabrir WhatsApp
  const handleReopenWhatsApp = useCallback(() => {
    if (order && order.whatsappMessage) {
      const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
      if (whatsappNumber) {
        const encodedMessage = encodeURIComponent(order.whatsappMessage);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
      } else {
        // Esto no debería ocurrir si ya se verificó en useOrderFlow
        console.error('Número de WhatsApp no configurado.');
      }
    }
  }, [order]);

  if (!order) {
    return null; // No renderizar si no hay datos de la orden
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-95 animate-scale-in"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ¡Pedido Generado!
          </h2>
          {/* No permitimos cerrar con X para forzar la acción de WhatsApp */}
          {/* <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Cerrar"
          >
            <XCircle size={24} />
          </button> */}
        </div>

        <div className="text-center mb-6">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold mb-4">
            Tu pedido ha sido creado con éxito.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-md mb-6">
            **¡Ahora, por favor, envía el mensaje a WhatsApp para que podamos procesarlo!**
          </p>
          
          {order.whatsappMessage && (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-left mb-6 border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Mensaje a enviar:</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                {order.whatsappMessage}
              </pre>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleReopenWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
            aria-label="Abrir WhatsApp para enviar pedido"
          >
            {/* Usando una imagen para el logo de WhatsApp */}
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp Logo" className="w-6 h-6" /> 
            Abrir WhatsApp
          </button>

          <button
            onClick={onConfirmWhatsAppSent}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
            aria-label="Ya envié el mensaje y finalizar"
          >
            <CheckCircle size={20} /> Ya envié el mensaje / Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppConfirmationModal;
