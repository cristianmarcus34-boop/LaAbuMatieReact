// src/components/OrderSummaryModal.jsx
import React, { useMemo } from 'react';
import { XCircle, CheckCircle, ArrowLeft, Send, User, MapPin, CreditCard, Clock, ShoppingBag } from 'lucide-react'; // Añadidos más iconos para profesionalismo

function OrderSummaryModal({ order, onClose, onBack, onConfirmOrderAndSendWhatsApp, showNotification, allProducts }) { // Cambiado onContinue por onConfirmOrderAndSendWhatsApp
  const itemsInOrder = order?.cartItems || [];
  const hasCustomerInfo = !!order?.customerInfo;

  const total = useMemo(() => {
    return Math.floor(itemsInOrder.reduce((sum, item) => {
      let itemBasePrice = item.precio || 0;

      // Si es empanada/canastita, el precio base depende del tipo de cantidad
      if (['Empanadas y Canastitas'].includes(item.category) && item.selectedQuantityType) {
        if (item.selectedQuantityType === 'docena') {
          itemBasePrice = item.precioDocena || (item.precio * 12);
        } else if (item.selectedQuantityType === 'mediaDocena') {
          itemBasePrice = item.precioMediaDocena || (item.precio * 6);
        } else { // 'unidad'
          itemBasePrice = item.precio || 0;
        }
      } else if (item.category === 'Pizzas' && item.selectedCombinedPizza) {
        // Si es una pizza combinada, toma el precio más alto
        itemBasePrice = Math.max(item.precio || 0, item.selectedCombinedPizza.precio || 0);
      }

      const itemPrice = itemBasePrice + (item.selectedSauce?.price || 0) + (item.selectedFlavor?.price || 0) + (item.selectedSize?.price || 0);
      return sum + itemPrice * item.quantity;
    }, 0));
  }, [itemsInOrder]);

  if (!order) {
    console.error("OrderSummaryModal: El objeto 'order' es inválido.");
    showNotification("No se pudo cargar el resumen del pedido. Por favor, inténtalo de nuevo.", "error", 4000);
    return null;
  }

  const { customerInfo = {} } = order; // Destructure customerInfo directly from order

  const deliveryMethodText = useMemo(() => {
    if (customerInfo.deliveryMethod === 'pickup') {
      return 'Retiro en el local (Calle 881 N° 5003, Villa la Florida)';
    } else if (customerInfo.deliveryMethod === 'delivery') {
      return 'Delivery a domicilio (sin cargo)';
    }
    return 'No especificado';
  }, [customerInfo.deliveryMethod]);

  // Formatear la hora del pedido para mostrar en el resumen
  const formattedOrderTime = useMemo(() => {
    if (customerInfo.orderType === 'immediate') {
      // Si es un pedido inmediato, usamos el tiempo estimado calculado y pasado desde useOrderFlow
      if (customerInfo.formattedEstimatedDeliveryTime && customerInfo.estimatedDeliveryMinutes) {
        return `Inmediato (Listo aprox. ${customerInfo.formattedEstimatedDeliveryTime} hs - Estimado: ${customerInfo.estimatedDeliveryMinutes} min)`;
      }
      // Fallback si por alguna razón no se pasaron los datos estimados
      const date = new Date(customerInfo.orderTime);
      return `Inmediato (Listo aprox. ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs)`;
    } else if (customerInfo.orderType === 'reserved' && customerInfo.orderTime) {
      const date = new Date(customerInfo.orderTime);
      return `Reservado para las ${date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} hs`;
    }
    return 'No especificado';
  }, [customerInfo.orderTime, customerInfo.orderType, customerInfo.formattedEstimatedDeliveryTime, customerInfo.estimatedDeliveryMinutes]);


  return (
    <div className="lam-modal-overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in custom-scrollbar overflow-y-auto">
      <div className="lam-modal-content bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform animate-slide-in-up relative my-8 overflow-y-auto max-h-[90vh]">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-2"
          aria-label="Cerrar resumen del pedido"
        >
          <XCircle size={24} />
        </button>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Resumen de tu Pedido
        </h2>

        {/* Sección de Datos del Cliente */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <User size={20} className="text-blue-500" /> Datos del Cliente
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Nombre:</strong> {customerInfo.name}</p>
          <p className="text-700 dark:text-gray-300 mb-2"><strong>Teléfono:</strong> {customerInfo.phone}</p>
          
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2 flex items-center gap-2">
            <MapPin size={18} className="text-purple-500" /> Método de Entrega
          </h4>
          <p className="text-gray-700 dark:text-gray-300 mb-2">{deliveryMethodText}</p>
          {customerInfo.deliveryMethod === 'delivery' && (
            <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Dirección:</strong> {customerInfo.address}</p>
          )}

          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2 flex items-center gap-2">
            <CreditCard size={18} className="text-green-500" /> Información de Pago
          </h4>
          <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Método de Pago:</strong> {customerInfo.paymentMethod === 'cash' ? 'Efectivo' : 'Mercado Pago'}</p>
          {customerInfo.paymentMethod === 'cash' && customerInfo.cashAmount && (
            <>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Paga con:</strong> ${customerInfo.cashAmount}</p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Vuelto:</strong> ${customerInfo.cashAmount - total}</p>
            </>
          )}

          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2 flex items-center gap-2">
            <Clock size={18} className="text-orange-500" /> Horario del Pedido
          </h4>
          <p className="text-gray-700 dark:text-gray-300 mb-2">{formattedOrderTime}</p>

          {customerInfo.notes && (
            <p className="text-gray-700 dark:text-gray-300 mt-4"><strong>Notas:</strong> {customerInfo.notes}</p>
          )}
        </div>

        {/* Sección de Productos en el Pedido */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-red-500" /> Productos
          </h3>
          <ul className="space-y-4">
            {itemsInOrder.map((item, index) => {
              let itemBasePrice = item.precio || 0;

              // Si es empanada/canastita, el precio base depende del tipo de cantidad
              if (['Empanadas y Canastitas'].includes(item.category) && item.selectedQuantityType) {
                if (item.selectedQuantityType === 'docena') {
                  itemBasePrice = item.precioDocena || (item.precio * 12);
                } else if (item.selectedQuantityType === 'mediaDocena') {
                  itemBasePrice = item.precioMediaDocena || (item.precio * 6);
                } else { // 'unidad'
                  itemBasePrice = item.precio || 0;
                }
              } else if (item.category === 'Pizzas' && item.selectedCombinedPizza) {
                // Si es una pizza combinada, toma el precio más alto
                itemBasePrice = Math.max(item.precio || 0, item.selectedCombinedPizza.precio || 0);
              }

              const itemPrice = itemBasePrice + (item.selectedSauce?.price || 0) + (item.selectedFlavor?.price || 0) + (item.selectedSize?.price || 0);

              return (
                <li key={item.id + (item.selectedSauce?.id || '') + (item.selectedFlavor?.id || '') + (item.selectedSize?.id || '') + (item.selectedCombinedPizza?.id || '') + (item.selectedQuantityType || '') + JSON.stringify(item.combinedEmpanadaFlavors || {}) + index} 
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-gray-700 dark:text-gray-300 p-3 rounded-lg bg-white dark:bg-gray-750 shadow-sm border border-gray-100 dark:border-gray-650">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg">{item.name}</p>
                    {item.selectedCombinedPizza && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        (Mitad {item.name} + Mitad {item.selectedCombinedPizza.name})
                      </p>
                    )}
                    {['Empanadas y Canastitas'].includes(item.category) && item.selectedQuantityType && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Cantidad: {item.quantity} {item.selectedQuantityType === 'docena' ? 'Docena(s)' : item.selectedQuantityType === 'mediaDocena' ? 'Media(s) Docena(s)' : 'Unidad(es)'}
                      </p>
                    )}
                    {!item.selectedCombinedPizza && !['Empanadas y Canastitas'].includes(item.category) && 
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Cantidad: {item.quantity}</p>}
                    
                    {item.selectedFlavor && ( 
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Sabor: {item.selectedFlavor.name}
                      </p>
                    )}
                    {item.selectedSauce && ( 
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Salsa: {item.selectedSauce.name}
                        {!item.selectedSauce.isFree && item.selectedSauce.price > 0 && ` (+$${Math.floor(item.selectedSauce.price)})`}
                      </p>
                    )}
                    {item.selectedSize && ( 
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Tamaño: {item.selectedSize.name}
                        {item.selectedSize.price > 0 && ` (+$${Math.floor(item.selectedSize.price)})`}
                      </p>
                    )}
                    {item.combinedEmpanadaFlavors && Object.keys(item.combinedEmpanadaFlavors).length > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md w-full">
                            <p className="font-medium mb-1">Sabores de Empanadas/Canastitas:</p>
                            <ul className="list-disc list-inside ml-4 space-y-0.5">
                                {Object.keys(item.combinedEmpanadaFlavors).map(flavorId => {
                                    const foundFlavor = allProducts?.find(p => p.id === flavorId);
                                    return (
                                        <li key={flavorId}>
                                            {foundFlavor ? foundFlavor.name : `Sabor ID: ${flavorId}`} x{item.combinedEmpanadaFlavors[flavorId]}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                  </div>
                  <span className="font-bold text-lg mt-2 sm:mt-0 sm:ml-4">${Math.floor(itemPrice * item.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-6 flex justify-between items-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            <span>Total del Pedido:</span>
            <span>${total}</span>
          </div>
        </div>

        {customerInfo.paymentMethod === 'mercadopago' && (
          <>
            <p className="text-center text-blue-600 dark:text-blue-400 font-medium mb-4">
              Serás redirigido a Mercado Pago para completar tu pago.
            </p>
            <p className="text-center text-gray-600 dark:text-gray-400">
              *Recuerda que se requerirá comprobante de pago al recibir tu pedido.
            </p>
          </>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
          <button
            onClick={onBack}
            className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
            aria-label="Volver al formulario"
          >
            <ArrowLeft size={20} className="inline-block mr-2" /> Volver al Formulario
          </button>

          <button
            onClick={onConfirmOrderAndSendWhatsApp}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Confirmar y Enviar a WhatsApp"
            disabled={itemsInOrder.length === 0}
          >
            Confirmar y Enviar a WhatsApp <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderSummaryModal;
