import { useState, useCallback, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, writeBatch, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';

/**
 * Hook personalizado para gestionar el flujo de pedidos (modales de carrito, resumen, formulario)
 * y el envío del pedido a Firestore y WhatsApp.
 */
export const useOrderFlow = (
  db,
  appId,
  userId,
  cartItems,
  handleClearCart,
  showNotification,
  navigate,
  localProjectId,
  allProducts // Necesario para obtener nombres de sabores de empanadas combinadas
) => {
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isOrderFormModalOpen, setIsOrderFormModalOpen] = useState(false);
  const [isOrderSummaryModalOpen, setIsOrderSummaryModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [existingOrdersCount, setExistingOrdersCount] = useState(0);
  const [isWhatsAppConfirmationModalOpen, setIsWhatsAppConfirmationModalOpen] = useState(false);

  const actualAppIdForFirestore =
    typeof __app_id !== 'undefined' && __app_id !== 'default-app-id'
      ? __app_id
      : localProjectId;

  // Efecto para cargar el conteo de pedidos activos
  useEffect(() => {
    if (!db) return;
    const ordersCollectionRef = collection(
      db,
      `artifacts/${actualAppIdForFirestore}/public/data/orders`
    );
    const q = query(
      ordersCollectionRef,
      where('status', 'in', ['pending', 'processing']) // Contar pedidos pendientes o en proceso
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExistingOrdersCount(snapshot.size);
    }, (error) => {
      console.error("Error al cargar el conteo de pedidos:", error);
      showNotification("Error al obtener conteo de pedidos activos.", 'error');
    });

    return () => unsubscribe();
  }, [db, actualAppIdForFirestore, showNotification]);

  // Función para generar el mensaje de WhatsApp
  const buildWhatsAppMessage = useCallback((orderData) => {
    let message = `*¡Nuevo Pedido Recibido!* 🚀\n`;
    message += `*La Abu Matie - Pedido #${orderData.orderNumber}*\n`;
    message += `------------------------------------\n\n`;

    // Sección: Datos del Cliente
    message += `*👤 Datos del Cliente:*\n`;
    message += `*Nombre:* ${orderData.customerInfo.name}\n`;
    message += `*Teléfono:* ${orderData.customerInfo.phone}\n`;
    
    // Sección: Método de Entrega
    message += `\n*🚚 Método de Entrega:*\n`;
    if (orderData.customerInfo.deliveryMethod === 'delivery') {
      message += `*Tipo:* Delivery a domicilio\n`;
      message += `*Dirección:* ${orderData.customerInfo.address}\n`;
    } else {
      message += `*Tipo:* Retiro en local (Calle 881 N° 5003, Villa la Florida)\n`;
    }

    // Sección: Información de Pago
    message += `\n*💳 Información de Pago:*\n`;
    if (orderData.customerInfo.paymentMethod === 'cash') {
      message += `*Método:* Efectivo\n`;
      message += `*Abona con:* $${Math.floor(orderData.customerInfo.cashAmount || 0)}\n`;
      const change = Math.floor(orderData.customerInfo.cashAmount - orderData.total);
      if (change > 0) {
        message += `*Vuelto:* $${change}\n`;
      } else {
        message += `*Vuelto:* No requiere\n`;
      }
    } else { // mercadopago
      message += `*Método:* Mercado Pago\n`;
      message += `*Alias:* laabuelamatie\n`;
      message += `(Requiere comprobante de pago)\n`;
    }

    // Sección: Horario de Pedido
    message += `\n*⏰ Horario del Pedido:*\n`;
    // Aquí usamos los valores que ya se pasaron en orderData.customerInfo
    if (orderData.customerInfo.orderType === 'immediate') {
      message += `*Tipo:* Inmediato\n`;
      message += `*Listo aprox.:* ${orderData.customerInfo.formattedEstimatedDeliveryTime} hs (Estimado: ${orderData.customerInfo.estimatedDeliveryMinutes} min)\n`;
    } else if (orderData.customerInfo.orderType === 'reserved') {
      const reservedDate = new Date(orderData.customerInfo.orderTime);
      const formattedReservedTime = reservedDate.toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      message += `*Tipo:* Reserva\n`;
      message += `*Para:* ${formattedReservedTime} hs\n`;
    } else {
      message += `*Tipo:* No especificado\n`;
    }

    // Sección: Detalle del Pedido
    message += `\n*🍕 Detalle del Pedido:*\n`;
    orderData.cartItems.forEach(item => {
      let itemDetail = `- ${item.name}`;
      
      if (item.selectedFlavor) {
        itemDetail += ` (Sabor: ${item.selectedFlavor.name})`;
      }
      if (item.selectedSauce) {
        itemDetail += ` (Salsa: ${item.selectedSauce.name}`;
        if (!item.selectedSauce.isFree && item.selectedSauce.price > 0) {
          itemDetail += ` +$${Math.floor(item.selectedSauce.price)}`;
        }
        itemDetail += `)`;
      }
      if (item.selectedSize) {
        itemDetail += ` (Tamaño: ${item.selectedSize.name}`;
        if (item.selectedSize.price > 0) {
          itemDetail += ` +$${Math.floor(item.selectedSize.price)}`;
        }
        itemDetail += `)`;
      }
      
      if (['Empanadas y Canastitas'].includes(item.category) && item.selectedQuantityType) {
        if (item.selectedQuantityType === 'mediaDocena') itemDetail += ` (1/2 Docena)`;
        else if (item.selectedQuantityType === 'docena') itemDetail += ` (Docena)`;

        if (item.combinedEmpanadaFlavors && Object.keys(item.combinedEmpanadaFlavors).length > 0) {
            const flavorNames = Object.keys(item.combinedEmpanadaFlavors).map(flavorId => {
                const flavorProduct = allProducts.find(p => p.id === flavorId);
                return `${flavorProduct ? flavorProduct.name : 'Sabor Desconocido'} x${item.combinedEmpanadaFlavors[flavorId]}`;
            });
            itemDetail += ` [Sabores: ${flavorNames.join(', ')}]`;
        }
      }

      if (item.category === 'Pizzas' && item.selectedCombinedPizza) {
        itemDetail += ` + ${item.selectedCombinedPizza.name}`;
      }

      message += `${itemDetail} x ${item.quantity} = *$${Math.floor(item.price * item.quantity)}*\n`;
    });

    // Sección: Total
    message += `\n------------------------------------\n`;
    message += `*💰 Total del Pedido: $${Math.floor(orderData.total)}*\n`;
    message += `------------------------------------\n`;

    // Sección: Notas Adicionales
    if (orderData.customerInfo.notes) {
      message += `\n*📝 Notas Adicionales:*\n`;
      message += `${orderData.customerInfo.notes}\n`;
    }

    message += `\n*¡Gracias por tu pedido en La Abu Matie!* ✨\n`;
    message += `_Te contactaremos a la brevedad para confirmar._`;

    return message;
  }, [allProducts, existingOrdersCount]);

  // Manejador para ver el resumen desde el carrito (este se mantiene por si se quiere un resumen previo al formulario,
  // pero el botón "Realizar Pedido" del carrito ya no lo llamará directamente en este flujo)
  const handleViewSummaryFromCart = useCallback((items) => {
    setIsCartModalOpen(false);
    const totalForSummary = items.reduce((sum, item) => {
      let itemBasePrice = item.precio || 0;
      if (['Empanadas y Canastitas'].includes(item.category) && item.selectedQuantityType) {
        if (item.selectedQuantityType === 'docena') {
          itemBasePrice = item.precioDocena || (item.precio * 12);
        } else if (item.selectedQuantityType === 'mediaDocena') {
          itemBasePrice = item.precioMediaDocena || (item.precio * 6);
        } else {
          itemBasePrice = item.precio || 0;
        }
      } else if (item.category === 'Pizzas' && item.selectedCombinedPizza) {
        itemBasePrice = Math.max(item.precio || 0, item.selectedCombinedPizza.precio || 0);
      }
      const itemPrice = itemBasePrice + (item.selectedSauce?.price || 0) + (item.selectedFlavor?.price || 0) + (item.selectedSize?.price || 0);
      return sum + itemPrice * item.quantity;
    }, 0);
    setCurrentOrder({
      cartItems: items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        precio: item.precio,
        precioMediaDocena: item.precioMediaDocena || null,
        precioDocena: item.precioDocena || null,
        imageUrl: item.image || item.imageUrl,
        selectedSauce: item.selectedSauce || null,
        selectedFlavor: item.selectedFlavor || null,
        selectedSize: item.selectedSize || null,
        selectedCombinedPizza: item.selectedCombinedPizza || null,
        selectedQuantityType: item.selectedQuantityType || null,
        combinedEmpanadaFlavors: item.combinedEmpanadaFlavors || null,
        category: item.category,
      })),
      total: totalForSummary,
    });
    setIsOrderSummaryModalOpen(true);
  }, []); 

  // Manejador para continuar al formulario de pedido (este ya no se usa en el flujo principal)
  const handleContinueToForm = useCallback(() => {
    setIsOrderSummaryModalOpen(false);
    setIsOrderFormModalOpen(true);
  }, []);

  // Manejador para volver al carrito desde el formulario
  const handleBackToCartFromForm = useCallback(() => {
    setIsOrderFormModalOpen(false);
    setIsCartModalOpen(true);
  }, []);

  // Manejador para volver al formulario desde el resumen (cuando el resumen se muestra DESPUÉS del formulario)
  const handleBackToFormFromSummary = useCallback(() => {
    setIsOrderSummaryModalOpen(false);
    setIsOrderFormModalOpen(true);
  }, []);

  // Manejador para abrir el modal del formulario de pedido directamente desde el carrito
  const handlePlaceOrderClick = useCallback(() => {
    setIsCartModalOpen(false); // Cierra el carrito
    setIsOrderFormModalOpen(true); // Abre el formulario
  }, []);

  // Manejador principal para enviar el pedido (a Firestore y luego mostrar resumen)
  const handleSendOrder = useCallback(
    async (formData) => {
      if (!db) {
        showNotification('Error: Base de datos no disponible para guardar el pedido. Intenta recargar la página.', 'error', 5000);
        return;
      }
      if (!userId) {
        showNotification('Error: ID de usuario no disponible. Asegúrate de que la autenticación se ha completado.', 'error', 5000);
        return;
      }
      if (cartItems.length === 0) {
        showNotification('El carrito está vacío. Agrega productos antes de hacer un pedido.', 'error', 3000);
        return;
      }

      setIsOrderFormModalOpen(false); // Cierra el modal del formulario
      showNotification('Procesando tu pedido...', 'info', 3000);

      try {
        const orderNumber = existingOrdersCount + 1;
        const totalOrderPrice = cartItems.reduce((sum, item) => {
          let itemBasePrice = item.precio || 0;
          if (['Empanadas y Canastitas'].includes(item.category) && item.selectedQuantityType) {
            if (item.selectedQuantityType === 'docena') {
              itemBasePrice = item.precioDocena || (item.precio * 12);
            } else if (item.selectedQuantityType === 'mediaDocena') {
              itemBasePrice = item.precioMediaDocena || (item.precio * 6);
            } else {
              itemBasePrice = item.precio || 0;
            }
          } else if (item.category === 'Pizzas' && item.selectedCombinedPizza) {
            itemBasePrice = Math.max(item.precio || 0, item.selectedCombinedPizza.precio || 0);
          }
          const itemPrice = itemBasePrice + (item.selectedSauce?.price || 0) + (item.selectedFlavor?.price || 0) + (item.selectedSize?.price || 0);
          return sum + itemPrice * item.quantity;
        }, 0);

        const totalForDisplay = Math.floor(totalOrderPrice); 

        let estimatedMinutes = 30; // Base
        if (existingOrdersCount > 3) {
          estimatedMinutes = 40;
        }
        const now = new Date();
        const estimatedDeliveryTime = new Date(now.getTime() + estimatedMinutes * 60 * 1000);
        const formattedEstimatedTime = estimatedDeliveryTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });


        const orderDataForFirestore = {
          orderNumber: orderNumber,
          customerInfo: { 
            name: formData.name, 
            phone: formData.phone, 
            address: formData.address, 
            paymentMethod: formData.paymentMethod, 
            cashAmount: parseFloat(formData.cashAmount) || 0,
            deliveryMethod: formData.deliveryMethod,
            orderType: formData.orderType,
            orderTime: formData.orderTime,
            notes: formData.notes,
            userId: userId,
            // NUEVO: Añadir el tiempo estimado si es un pedido inmediato
            ...(formData.orderType === 'immediate' && {
              estimatedDeliveryMinutes: estimatedMinutes,
              formattedEstimatedDeliveryTime: formattedEstimatedTime,
            }),
          },
          cartItems: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            precio: item.precio,
            precioMediaDocena: item.precioMediaDocena || null,
            precioDocena: item.precioDocena || null,
            category: item.category,
            selectedSauce: item.selectedSauce ? { id: item.selectedSauce.id, name: item.selectedSauce.name, price: item.selectedSauce.price, isFree: item.selectedSauce.isFree } : null,
            selectedFlavor: item.selectedFlavor ? { id: item.selectedFlavor.id, name: item.selectedFlavor.name, price: item.selectedFlavor.price } : null,
            selectedSize: item.selectedSize ? { id: item.selectedSize.id, name: item.selectedSize.name, price: item.selectedSize.price } : null,
            selectedCombinedPizza: item.selectedCombinedPizza ? { id: item.selectedCombinedPizza.id, name: item.selectedCombinedPizza.name, precio: item.selectedCombinedPizza.precio } : null,
            selectedQuantityType: item.selectedQuantityType || null,
            combinedEmpanadaFlavors: item.combinedEmpanadaFlavors || null,
            price: (item.selectedQuantityType === 'docena' ? (item.precioDocena || (item.precio * 12)) :
                    item.selectedQuantityType === 'mediaDocena' ? (item.precioMediaDocena || (item.precio * 6)) :
                    item.precio) + (item.selectedSauce?.price || 0) + (item.selectedFlavor?.price || 0) + (item.selectedSize?.price || 0)
          })),
          total: totalForDisplay,
          status: 'pending',
          createdAt: serverTimestamp(),
        };

        const ordersCollectionRef = collection(
          db,
          `artifacts/${actualAppIdForFirestore}/public/data/orders`
        );
        const docRef = await addDoc(ordersCollectionRef, orderDataForFirestore);

        // Actualizar stock de productos
        const batch = writeBatch(db);
        const productsCollectionRef = collection(db, `artifacts/${actualAppIdForFirestore}/public/data/products`);

        for (const item of cartItems) {
          if (item.combinedEmpanadaFlavors && Object.keys(item.combinedEmpanadaFlavors).length > 0) {
            for (const flavorId in item.combinedEmpanadaFlavors) {
                const quantityToDeduct = item.combinedEmpanadaFlavors[flavorId] * item.quantity;
                const individualProductRef = doc(productsCollectionRef, flavorId);
                const individualProduct = allProducts.find(p => p.id === flavorId);

                if (individualProduct && individualProduct.stock !== undefined && individualProduct.stock >= quantityToDeduct) {
                    batch.update(individualProductRef, {
                        stock: individualProduct.stock - quantityToDeduct
                    });
                } else {
                    showNotification(`Error: Stock insuficiente para el sabor de empanada "${individualProduct?.name || 'ID:' + flavorId}". Pedido no procesado.`, 'error', 7000);
                    throw new Error(`Stock insuficiente para el sabor de empanada "${individualProduct?.name || 'ID:' + flavorId}".`);
                }
            }
            const containerProductRef = doc(productsCollectionRef, item.id);
            const containerProduct = allProducts.find(p => p.id === item.id);
            if (containerProduct && containerProduct.stock !== undefined && containerProduct.stock >= item.quantity) {
                batch.update(containerProductRef, {
                    stock: containerProduct.stock - item.quantity
                });
            } else {
                showNotification(`Error: Stock insuficiente para el paquete "${containerProduct?.name || item.name}". Pedido no procesado.`, 'error', 7000);
                throw new Error(`Stock insuficiente para el paquete "${containerProduct?.name || item.name}".`);
            }
          } else {
            if (item.id) {
              const productDocRef = doc(productsCollectionRef, item.id);
              let unitsToSubtract = item.quantity;
              if (['Empanadas y Canastitas'].includes(item.category) && item.selectedQuantityType) {
                if (item.selectedQuantityType === 'mediaDocena') {
                  unitsToSubtract = item.quantity * 6;
                } else if (item.selectedQuantityType === 'docena') {
                  unitsToSubtract = item.quantity * 12;
                }
              }

              const currentProductInAllProducts = allProducts.find(p => p.id === item.id);
              if (currentProductInAllProducts && currentProductInAllProducts.stock !== undefined && currentProductInAllProducts.stock >= unitsToSubtract) {
                batch.update(productDocRef, {
                  stock: currentProductInAllProducts.stock - unitsToSubtract
                });
              } else {
                showNotification(`Error: Stock insuficiente para ${item.name}. Pedido no procesado.`, 'error', 7000);
                throw new Error(`Stock insuficiente para ${item.name}.`);
              }
            }
          }
        }
        await batch.commit();

        // Establece la orden actual con todos los datos, incluyendo customerInfo
        setCurrentOrder({ ...orderDataForFirestore, id: docRef.id });
        
        // Abre el modal de resumen para que el usuario revise antes de enviar a WhatsApp
        setIsOrderSummaryModalOpen(true); 

      } catch (firebaseError) {
        console.error("Error al procesar el pedido:", firebaseError);
        let userErrorMessage = 'Error al procesar el pedido. Por favor, intenta de nuevo.';
        if (firebaseError.code === 'unavailable') {
          userErrorMessage = 'No se pudo conectar a la base de datos. Verifica tu conexión a internet.';
        } else if (firebaseError.code === 'permission-denied') {
          userErrorMessage = 'Permiso denegado. No tienes autorización para realizar esta acción.';
        } else if (firebaseError.code === 'aborted') {
          userErrorMessage = 'La operación fue abortada, posiblemente debido a un conflicto de datos. El pedido no se procesó.';
        } else {
          userErrorMessage = firebaseError.message.includes("Stock insuficiente") ? firebaseError.message : `Error desconocido al procesar el pedido: ${firebaseError.message}`;
        }
        showNotification(userErrorMessage, 'error', 7000);
        setIsOrderFormModalOpen(false);
        return;
      }
    },
    [cartItems, showNotification, db, userId, localProjectId, actualAppIdForFirestore, existingOrdersCount, allProducts]
  );

  // NUEVO: Función para confirmar el pedido y enviar a WhatsApp (llamada desde OrderSummaryModal)
  const handleConfirmOrderAndSendWhatsApp = useCallback(() => {
    if (!currentOrder) {
      showNotification('Error: No hay pedido para confirmar y enviar.', 'error', 3000);
      return;
    }

    const whatsappMessage = buildWhatsAppMessage(currentOrder);
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER;

    if (!whatsappNumber) {
      showNotification('Número de WhatsApp no configurado. Por favor, contacta al administrador.', 'error', 5000);
      console.error('VITE_WHATSAPP_NUMBER no está definido en las variables de entorno.');
      return;
    }
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');

    // Pasar el mensaje generado al modal de confirmación de WhatsApp
    setCurrentOrder(prevOrder => ({ ...prevOrder, whatsappMessage: whatsappMessage }));
    setIsWhatsAppConfirmationModalOpen(true);
    setIsOrderSummaryModalOpen(false); // Cierra el modal de resumen
  }, [currentOrder, buildWhatsAppMessage, showNotification]);


  // Función para manejar la confirmación del envío de WhatsApp (desde WhatsAppConfirmationModal)
  const handleWhatsAppSentConfirmation = useCallback(() => {
    setIsWhatsAppConfirmationModalOpen(false);
    handleClearCart();
    showNotification('¡Pedido confirmado y enviado! Gracias por tu compra.', 'success', 5000);
    navigate('/');
  }, [handleClearCart, showNotification, navigate]);

  return {
    isCartModalOpen,
    setIsCartModalOpen,
    isOrderFormModalOpen,
    setIsOrderFormModalOpen,
    isOrderSummaryModalOpen,
    setIsOrderSummaryModalOpen,
    isWhatsAppConfirmationModalOpen,
    setIsWhatsAppConfirmationModalOpen,
    currentOrder,
    setCurrentOrder,
    handleViewSummaryFromCart, // Se mantiene por si se quiere un resumen previo al formulario
    handleContinueToForm, // Se mantiene por si se quiere un flujo de resumen -> formulario
    handleBackToCartFromForm,
    handleBackToFormFromSummary,
    handlePlaceOrderClick, // Este ahora abre el formulario directamente
    handleSendOrder, // Este ahora guarda el pedido y abre el resumen
    handleConfirmOrderAndSendWhatsApp, // NUEVO: Este envía a WhatsApp desde el resumen
    handleWhatsAppSentConfirmation,
    existingOrdersCount,
  };
};
