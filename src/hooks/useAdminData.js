import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, query, where, doc, Timestamp } from 'firebase/firestore';

export const useAdminData = (db, appId, showNotification) => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [manualFeaturedProductIds, setManualFeaturedProductIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para filtros de productos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Estados para filtros de órdenes
  const [orderFilterStatus, setOrderFilterStatus] = useState('all');
  const [orderFilterDelivery, setOrderFilterDelivery] = useState('all');
  const [orderFilterDateFrom, setOrderFilterDateFrom] = useState('');
  const [orderFilterDateTo, setOrderFilterDateTo] = useState('');
  const [orderFilterTimeFrom, setOrderFilterTimeFrom] = useState('');
  const [orderFilterDayOfWeek, setOrderFilterDayOfWeek] = useState('all');

  // Estados para filtros de reseñas
  const [reviewFilterRating, setReviewFilterRating] = useState('all');
  const [reviewFilterStatus, setReviewFilterStatus] = useState('all');

  // Estados para filtros de métricas
  const [metricsStartDate, setMetricsStartDate] = useState('');
  const [metricsEndDate, setMetricsEndDate] = useState('');

  // Cargar productos
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const productsColRef = collection(db, `artifacts/${appId}/public/data/products`);
    const unsubscribe = onSnapshot(productsColRef, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      setLoading(false);
    }, (err) => {
      console.error("Error al cargar productos:", err);
      setError("Error al cargar productos.");
      setLoading(false);
      showNotification("Error al cargar productos.", "error");
    });
    return () => unsubscribe();
  }, [db, appId, showNotification]);

  // Cargar categorías
  useEffect(() => {
    if (!db) return;
    const categoriesColRef = collection(db, `artifacts/${appId}/public/data/categories`);
    const unsubscribe = onSnapshot(categoriesColRef, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);
    }, (err) => {
      console.error("Error al cargar categorías:", err);
      showNotification("Error al cargar categorías.", "error");
    });
    return () => unsubscribe();
  }, [db, appId, showNotification]);

  // Cargar órdenes y aplicar filtros
  useEffect(() => {
    if (!db) return;
    const ordersColRef = collection(db, `artifacts/${appId}/public/data/orders`);
    let q = query(ordersColRef);

    if (orderFilterStatus !== 'all') {
      q = query(q, where('status', '==', orderFilterStatus));
    }
    if (orderFilterDelivery !== 'all') {
      q = query(q, where('deliveryMethod', '==', orderFilterDelivery));
    }

    if (orderFilterDateFrom) {
      const startDate = new Date(orderFilterDateFrom);
      startDate.setHours(0, 0, 0, 0);
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)));
    }
    if (orderFilterDateTo) {
      const endDate = new Date(orderFilterDateTo);
      endDate.setHours(23, 59, 59, 999);
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(endDate)));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (orderFilterDayOfWeek !== 'all') {
        const targetDay = parseInt(orderFilterDayOfWeek);
        ordersData = ordersData.filter(order => {
          const orderTimestamp = order.createdAt?.toDate();
          if (!orderTimestamp) return false;
          return orderTimestamp.getDay() === targetDay;
        });
      }

      if (orderFilterTimeFrom) {
        const [hours, minutes] = orderFilterTimeFrom.split(':').map(Number);
        ordersData = ordersData.filter(order => {
          const orderTimestamp = order.createdAt?.toDate();
          if (!orderTimestamp) return false;
          const orderHours = orderTimestamp.getHours();
          const orderMinutes = orderTimestamp.getMinutes();
          if (orderHours > hours) return true;
          if (orderHours === hours && orderMinutes >= minutes) return true;
          return false;
        });
      }

      setOrders(ordersData.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)));
    }, (err) => {
      console.error("Error al cargar órdenes:", err);
      showNotification("Error al cargar órdenes.", "error");
    });
    return () => unsubscribe();
  }, [db, appId, orderFilterStatus, orderFilterDelivery, orderFilterDateFrom, orderFilterDateTo, orderFilterDayOfWeek, orderFilterTimeFrom, showNotification]);

  // Cargar reseñas
  useEffect(() => {
    if (!db) return;
    const reviewsColRef = collection(db, `artifacts/${appId}/public/data/product_reviews`);
    let q = query(reviewsColRef);

    if (reviewFilterRating !== 'all') {
      q = query(q, where('rating', '==', parseInt(reviewFilterRating)));
    }
    if (reviewFilterStatus === 'pending') {
      q = query(q, where('approved', '==', false));
    } else if (reviewFilterStatus === 'approved') {
      q = query(q, where('approved', '==', true));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewsData.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0)));
    }, (err) => {
      console.error("Error al cargar reseñas:", err);
      showNotification("Error al cargar reseñas.", "error");
    });
    return () => unsubscribe();
  }, [db, appId, reviewFilterRating, reviewFilterStatus, showNotification]);

  // Cargar IDs de productos destacados manualmente
  useEffect(() => {
    if (!db) return;
    const featuredConfigDocRef = doc(db, `artifacts/${appId}/public/data/featured_products_config/manual_selection`);
    const unsubscribe = onSnapshot(featuredConfigDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setManualFeaturedProductIds(data.productIds || []);
      } else {
        setManualFeaturedProductIds([]);
      }
    }, (err) => {
      console.error("Error al cargar IDs de productos destacados manuales:", err);
    });
    return unsubscribe;
  }, [db, appId]);

  // Filtros de productos (aplicados en el cliente)
  const filteredProducts = useMemo(() => {
    let currentProducts = products;
    if (productSearchTerm) {
      const lowerCaseSearchTerm = productSearchTerm.toLowerCase();
      currentProducts = currentProducts.filter(
        (product) =>
          (product.name && product.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (product.descripcion && product.descripcion.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    if (productCategoryFilter !== 'all') {
      currentProducts = currentProducts.filter(
        (product) => product.category === productCategoryFilter
      );
    }
    return currentProducts;
  }, [products, productSearchTerm, productCategoryFilter]);

  // Filtros para métricas (aplicados en el cliente)
  const filteredOrdersForMetrics = useMemo(() => {
    let filtered = orders.filter(order => order.status === 'completed'); // Solo órdenes completadas para métricas de ventas
    if (metricsStartDate) {
      const start = new Date(metricsStartDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate();
        return orderDate && orderDate >= start;
      });
    }
    if (metricsEndDate) {
      const end = new Date(metricsEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate();
        return orderDate && orderDate <= end;
      });
    }
    return filtered;
  }, [orders, metricsStartDate, metricsEndDate]);

  const filteredReviewsForMetrics = useMemo(() => {
    let filtered = reviews;
    if (metricsStartDate) {
      const start = new Date(metricsStartDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(review => {
        const reviewDate = review.timestamp?.toDate();
        return reviewDate && reviewDate >= start;
      });
    }
    if (metricsEndDate) {
      const end = new Date(metricsEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(review => {
        const reviewDate = review.timestamp?.toDate();
        return reviewDate && reviewDate <= end;
      });
    }
    return filtered;
  }, [reviews, metricsStartDate, metricsEndDate]);

  const handleResetMetricsDates = useCallback(() => {
    setMetricsStartDate('');
    setMetricsEndDate('');
  }, []);

  // --- NUEVAS MÉTRICAS CALCULADAS ---

  // Ventas Totales (ya existente, pero lo incluimos para consistencia)
  const totalSales = useMemo(() => {
    return filteredOrdersForMetrics.reduce((sum, order) => sum + order.total, 0);
  }, [filteredOrdersForMetrics]);

  // Total de Órdenes Procesadas (completadas)
  const totalOrdersProcessed = useMemo(() => {
    return filteredOrdersForMetrics.length;
  }, [filteredOrdersForMetrics]);

  // Valor Promedio del Pedido (AOV)
  const averageOrderValue = useMemo(() => {
    if (totalOrdersProcessed === 0) return 0;
    return totalSales / totalOrdersProcessed;
  }, [totalSales, totalOrdersProcessed]);

  // Productos Más Vendidos (por cantidad y por ingresos)
  const topSellingProducts = useMemo(() => {
    const productSales = {}; // { productId: { name: '...', quantity: N, revenue: M } }

    filteredOrdersForMetrics.forEach(order => {
      order.cartItems.forEach(item => {
        const productId = item.id;
        const productName = item.name;
        const itemQuantity = item.quantity;
        const itemPrice = item.priceAtOrder || item.precio || 0;

        if (!productSales[productId]) {
          productSales[productId] = { name: productName, quantity: 0, revenue: 0 };
        }
        productSales[productId].quantity += itemQuantity;
        productSales[productId].revenue += itemQuantity * itemPrice;
      });
    });

    const sortedByQuantity = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
    const sortedByRevenue = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);

    return { sortedByQuantity, sortedByRevenue };
  }, [filteredOrdersForMetrics]);

  // Productos Menos Vendidos (por cantidad y por ingresos)
  const leastSellingProducts = useMemo(() => {
    const productSales = {};

    filteredOrdersForMetrics.forEach(order => {
      order.cartItems.forEach(item => {
        const productId = item.id;
        const productName = item.name;
        const itemQuantity = item.quantity;
        const itemPrice = item.priceAtOrder || item.precio || 0;

        if (!productSales[productId]) {
          productSales[productId] = { name: productName, quantity: 0, revenue: 0 };
        }
        productSales[productId].quantity += itemQuantity;
        productSales[productId].revenue += itemQuantity * itemPrice;
      });
    });

    // Filtra productos que no se vendieron en el rango de fechas si es que hay productos en general
    const allProductIds = new Set(products.map(p => p.id));
    const soldProductIds = new Set(Object.keys(productSales));

    const unsoldProducts = Array.from(allProductIds)
      .filter(id => !soldProductIds.has(id))
      .map(id => {
        const product = products.find(p => p.id === id);
        return { name: product ? product.name : `Producto Desconocido (${id})`, quantity: 0, revenue: 0 };
      });

    const sortedByQuantity = Object.values(productSales).sort((a, b) => a.quantity - b.quantity);
    const sortedByRevenue = Object.values(productSales).sort((a, b) => a.revenue - b.revenue);

    // Combina los no vendidos con los menos vendidos, asegurando unicidad y orden
    const combinedLeastSellingQuantity = [...unsoldProducts, ...sortedByQuantity];
    const combinedLeastSellingRevenue = [...unsoldProducts, ...sortedByRevenue];

    // Eliminar duplicados si un producto no vendido aparece también con 0 ventas en sortedByQuantity
    const uniqueLeastSellingQuantity = [];
    const seenQuantityNames = new Set();
    for (const p of combinedLeastSellingQuantity) {
        if (!seenQuantityNames.has(p.name)) {
            uniqueLeastSellingQuantity.push(p);
            seenQuantityNames.add(p.name);
        }
    }

    const uniqueLeastSellingRevenue = [];
    const seenRevenueNames = new Set();
    for (const p of combinedLeastSellingRevenue) {
        if (!seenRevenueNames.has(p.name)) {
            uniqueLeastSellingRevenue.push(p);
            seenRevenueNames.add(p.name);
        }
    }

    return { sortedByQuantity: uniqueLeastSellingQuantity, sortedByRevenue: uniqueLeastSellingRevenue };
  }, [filteredOrdersForMetrics, products]);


  // Distribución de Estados de Órdenes (para Pie Chart)
  const orderStatusDistribution = useMemo(() => {
    const statusCounts = {
      'pending': 0,
      'processing': 0,
      'completed': 0,
      'cancelled': 0,
    };
    orders.forEach(order => { // Usamos 'orders' sin filtrar por fecha para ver el estado actual general
      if (statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status]++;
      }
    });

    return Object.keys(statusCounts).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize
      value: statusCounts[status],
      color: {
        'Pending': '#facc15', // yellow-500
        'Processing': '#3b82f6', // blue-500
        'Completed': '#22c55e', // green-500
        'Cancelled': '#ef4444', // red-500
      }[status.charAt(0).toUpperCase() + status.slice(1)] || '#94a3b8' // slate-500
    })).filter(item => item.value > 0); // Solo mostrar estados con órdenes
  }, [orders]);

  // Ventas por Categoría (para Bar Chart)
  const salesByCategory = useMemo(() => {
    const categorySales = {};
    filteredOrdersForMetrics.forEach(order => {
      order.cartItems.forEach(item => {
        const categoryName = item.category || 'Sin Categoría';
        const itemRevenue = (item.priceAtOrder || item.precio || 0) * item.quantity;
        categorySales[categoryName] = (categorySales[categoryName] || 0) + itemRevenue;
      });
    });
    return Object.keys(categorySales).map(category => ({
      name: category,
      sales: Math.floor(categorySales[category])
    })).sort((a, b) => b.sales - a.sales);
  }, [filteredOrdersForMetrics]);

  // Ventas por Método de Entrega (para Bar Chart)
  const salesByDeliveryMethod = useMemo(() => {
    const deliveryMethodSales = {};
    filteredOrdersForMetrics.forEach(order => {
      const method = order.deliveryMethod === 'pickup' ? 'Retiro en Local' : 'Delivery';
      deliveryMethodSales[method] = (deliveryMethodSales[method] || 0) + order.total;
    });
    return Object.keys(deliveryMethodSales).map(method => ({
      name: method,
      sales: Math.floor(deliveryMethodSales[method])
    })).sort((a, b) => b.sales - a.sales);
  }, [filteredOrdersForMetrics]);

  // Clientes Más Activos/Valiosos
  const mostActiveCustomers = useMemo(() => {
    const customerData = {}; // { customerId: { name: '...', totalOrders: N, totalSpent: M } }

    orders.forEach(order => { // Usamos 'orders' para todos los pedidos, no solo completados, para ver actividad general
      const customerId = order.customerInfo?.phone || order.customerInfo?.email || order.customerInfo?.name || 'Cliente Anónimo';
      const customerName = order.customerInfo?.name || 'Anónimo';
      const orderTotal = order.total || 0;

      if (!customerData[customerId]) {
        customerData[customerId] = {
          name: customerName,
          phone: order.customerInfo?.phone || 'N/A',
          address: order.customerInfo?.address || 'N/A',
          totalOrders: 0,
          totalSpent: 0
        };
      }
      customerData[customerId].totalOrders++;
      customerData[customerId].totalSpent += orderTotal;
    });

    return Object.values(customerData)
      .sort((a, b) => b.totalSpent - a.totalSpent) // Ordenar por gasto total
      .slice(0, 10); // Mostrar top 10
  }, [orders]);


  // Datos para el gráfico de tendencias de ventas (ventas diarias)
  const salesTrendData = useMemo(() => {
    const dailySales = {}; // { 'YYYY-MM-DD': totalSales }

    filteredOrdersForMetrics.forEach(order => {
      const orderDate = order.createdAt?.toDate();
      if (orderDate) {
        const dateString = orderDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
        dailySales[dateString] = (dailySales[dateString] || 0) + order.total;
      }
    });

    const data = Object.keys(dailySales).map(date => ({
      date: date,
      sales: Math.floor(dailySales[date])
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    return data;
  }, [filteredOrdersForMetrics]);


  return {
    products,
    orders,
    reviews,
    categories,
    manualFeaturedProductIds,
    loading,
    error,
    productSearchTerm,
    setProductSearchTerm,
    productCategoryFilter,
    setProductCategoryFilter,
    orderFilterStatus,
    setOrderFilterStatus,
    orderFilterDelivery,
    setOrderFilterDelivery,
    orderFilterDateFrom,
    setOrderFilterDateFrom,
    orderFilterDateTo,
    setOrderFilterDateTo,
    orderFilterTimeFrom,
    setOrderFilterTimeFrom,
    orderFilterDayOfWeek,
    setOrderFilterDayOfWeek,
    reviewFilterRating,
    setReviewFilterRating,
    reviewFilterStatus,
    setReviewFilterStatus,
    metricsStartDate,
    setMetricsStartDate,
    metricsEndDate,
    setMetricsEndDate,
    filteredProducts,
    filteredOrdersForMetrics,
    filteredReviewsForMetrics,
    handleResetMetricsDates,

    // Nuevas métricas exportadas
    totalSales,
    totalOrdersProcessed,
    averageOrderValue,
    topSellingProducts,
    leastSellingProducts,
    orderStatusDistribution,
    salesByCategory,
    salesByDeliveryMethod,
    mostActiveCustomers,
    salesTrendData, // Ya existía, pero lo listamos aquí para claridad
  };
};
