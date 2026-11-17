import { useState, useCallback, useRef } from 'react';

/**
 * Hook personalizado para gestionar notificaciones toast.
 * Proporciona un estado 'toast' y una función 'showNotification' para mostrar mensajes.
 *
 * @returns {Object} Un objeto que contiene:
 * - {Object} toast: El objeto de notificación actual ({ message, type, duration, id }).
 * - {Function} showNotification: Función para disparar una nueva notificación.
 */
export const useToast = () => {
    // Definir el estado inicial de toast para evitar 'undefined'
    const [toast, setToast] = useState({ message: '', type: '', duration: 0, id: 0 });
    // Usar useRef para un ID persistente y único para cada notificación
    const toastId = useRef(0);

    const showNotification = useCallback((message, type = 'info', duration = 3000) => {
        toastId.current += 1; // Incrementa el ID para asegurar que React detecte un cambio
        setToast({ message, type, duration, id: toastId.current });
    }, []); // La dependencia vacía asegura que la función no cambie innecesariamente

    return { toast, showNotification };
};
