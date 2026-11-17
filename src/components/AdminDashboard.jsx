import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Importaciones de componentes y hooks
import ProductForm from './ProductForm';
import OrderDetailsModal from './OrderDetailsModal';
import JsonImportModal from './JsonImportModal';
import ConfirmationModal from './ConfirmationModal';
import CategoryManagementModal from './CategoryManagementModal';
import ReviewResponseModal from './ReviewResponseModal'; // Importar el nuevo modal de respuesta

import { useAdminData } from '../hooks/useAdminData';
import { useProductManagement } from '../hooks/useProductManagement';
import { useOrderManagement } from '../hooks/useOrderManagement';
import { useReviewManagement } from '../hooks/useReviewManagement';
import { useCategoryManagement } from '../hooks/useCategoryManagement';

// Iconos de Lucide React
import {
  Edit, Trash2, PlusCircle, ShoppingBag, Box, LogOut, Filter, Home, MessageSquare, BarChart2,
  DollarSign, ListOrdered, TrendingUp, Eraser, UploadCloud, AlertTriangle, BadgeAlert, Star,
  Loader2, CheckCheck, List, ImageOff, Search, Tags, XCircle, Save, CalendarDays, Clock, RefreshCw, Eye, Users, Percent, Package, Reply
} from 'lucide-react';


// Custom Tooltip para Recharts (para mostrar valores formateados)
const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-gray-900 bg-opacity-90 rounded-lg shadow-lg border border-gray-700 text-gray-100 text-sm">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.name.includes('Ventas') || entry.name.includes('Ingresos') ? `$${Math.floor(entry.value)}` : entry.value}${unit}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Colores para el Pie Chart de estados de órdenes
const ORDER_STATUS_COLORS = {
  'Pending': '#facc15', // yellow-500
  'Processing': '#3b82f6', // blue-500
  'Completed': '#22c55e', // green-500
  'Cancelled': '#ef4444', // red-500
};

const AdminDashboard = ({ db, appId, onLogout, showNotification, onGoToHome, hasShownAdminWelcome, setHasShownAdminWelcome, firebaseConfig }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCategoryManagementModalOpen, setIsCategoryManagementModalOpen] = useState(false);

  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(() => () => {});

  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // NUEVOS ESTADOS para el modal de respuesta de reseñas
  const [isReviewResponseModalOpen, setIsReviewResponseModalOpen] = useState(false);
  const [selectedReviewForResponse, setSelectedReviewForResponse] = useState(null);

  // Usar hooks personalizados para la lógica de datos y gestión
  const {
    products, orders, reviews, categories, manualFeaturedProductIds,
    loading, error,
    productSearchTerm, setProductSearchTerm, productCategoryFilter, setProductCategoryFilter,
    orderFilterStatus, setOrderFilterStatus, orderFilterDelivery, setOrderFilterDelivery,
    orderFilterDateFrom, setOrderFilterDateFrom, orderFilterDateTo, setOrderFilterDateTo,
    orderFilterTimeFrom, setOrderFilterTimeFrom, orderFilterDayOfWeek, setOrderFilterDayOfWeek,
    reviewFilterRating, setReviewFilterRating, reviewFilterStatus, setReviewFilterStatus,
    metricsStartDate, setMetricsStartDate, metricsEndDate, setMetricsEndDate,
    filteredProducts, filteredOrdersForMetrics, filteredReviewsForMetrics,
    handleResetMetricsDates,

    // Métricas exportadas del hook useAdminData
    totalSales,
    totalOrdersProcessed,
    averageOrderValue,
    topSellingProducts,
    leastSellingProducts,
    orderStatusDistribution,
    salesByCategory,
    salesByDeliveryMethod,
    mostActiveCustomers,
    salesTrendData,
  } = useAdminData(db, appId, showNotification);

  const {
    handleAddProduct, handleEditProduct, handleSaveProduct, handleDeleteProduct,
    handleImportProducts, handleToggleManualFeatured,
  } = useProductManagement(db, appId, showNotification);

  const {
    handleUpdateOrderStatus, handleDeleteOrder, handleClearAllOrders, hasNewOrdersAlert,
  } = useOrderManagement(db, appId, showNotification, orders);

  const {
    handleApproveReview, handleRejectReview, handleAdminRespondToReview, // Importar la nueva función
  } = useReviewManagement(db, appId, showNotification);

  const {
    handleSaveCategory, handleDeleteCategory,
  } = useCategoryManagement(db, appId, showNotification);


  // Mensaje de bienvenida para el administrador
  useEffect(() => {
    if (!hasShownAdminWelcome) {
      showNotification('¡Bienvenido al Panel de Administración!', 'info', 5000);
      setHasShownAdminWelcome(true);
    }
  }, [hasShownAdminWelcome, setHasShownAdminWelcome, showNotification]);

  // NUEVO: Búsqueda Global
  const handleGlobalSearch = useCallback((e) => {
    e.preventDefault();
    const term = globalSearchTerm.toLowerCase();

    const orderMatch = orders.find(order =>
      order.id.toLowerCase().includes(term) ||
      order.customerInfo?.name.toLowerCase().includes(term) ||
      order.customerInfo?.phone.includes(term) ||
      order.cartItems.some(item => item.name.toLowerCase().includes(term))
    );

    if (orderMatch) {
      setActiveTab('orders');
      showNotification(`Se encontró una orden para "${globalSearchTerm}".`, 'info');
      return;
    }

    const productMatch = products.find(product =>
      product.name.toLowerCase().includes(term) ||
      product.descripcion?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term)
    );

    if (productMatch) {
      setActiveTab('products');
      setProductSearchTerm(globalSearchTerm);
      showNotification(`Se encontró un producto para "${globalSearchTerm}".`, 'info');
      return;
    }

    const reviewMatch = reviews.find(review =>
      review.comment?.toLowerCase().includes(term) ||
      review.productId.toLowerCase().includes(term) ||
      review.userId?.toLowerCase().includes(term)
    );

    if (reviewMatch) {
      setActiveTab('reviews');
      showNotification(`Se encontró una reseña para "${globalSearchTerm}".`, 'info');
      return;
    }

    showNotification(`No se encontraron resultados para "${globalSearchTerm}" en ninguna sección.`, 'info');
  }, [globalSearchTerm, orders, products, reviews, showNotification, setProductSearchTerm]);


  // Métricas calculadas (ya vienen del hook useAdminData)
  const totalProducts = products.length;

  const averageRating = React.useMemo(() => {
    const approvedReviews = filteredReviewsForMetrics.filter(review => review.approved);
    if (approvedReviews.length === 0) return 'N/A';
    const sum = approvedReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / approvedReviews.length).toFixed(1);
  }, [filteredReviewsForMetrics]);

  const lowStockProducts = React.useMemo(() => {
    return products.filter(product => product.stock > 0 && product.stock <= 5).length;
  }, [products]);

  const totalApprovedReviews = React.useMemo(() => {
    return filteredReviewsForMetrics.filter(review => review.approved).length;
  }, [filteredReviewsForMetrics]);


  // Función para abrir el modal de respuesta de reseña
  const handleOpenReviewResponseModal = useCallback((review) => {
    setSelectedReviewForResponse(review);
    setIsReviewResponseModalOpen(true);
  }, []);

  // Función para guardar la respuesta del admin desde el modal
  const handleSaveAdminResponse = useCallback(async (reviewId, responseText) => {
    await handleAdminRespondToReview(reviewId, responseText);
  }, [handleAdminRespondToReview]);


  if (loading) {
    return (
      <div className="lam-admin-dashboard min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        <Loader2 size={48} className="animate-spin text-purple-500" />
        <p className="ml-4 text-xl">Cargando panel de administración...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lam-admin-dashboard min-h-screen flex flex-col items-center justify-center bg-gray-950 text-red-400 p-4">
        <AlertTriangle size={48} className="mb-4" />
        <p className="text-xl font-semibold mb-2">Error al cargar el panel:</p>
        <p className="text-lg text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md transition-colors"
        >
          Recargar Página
        </button>
      </div>
    );
  }

  return (
    <div className="lam-admin-dashboard min-h-screen bg-gray-950 text-gray-100 flex flex-col lg:flex-row">
      {/* Sidebar de navegación */}
      <aside className="bg-gray-900 w-full lg:w-64 p-6 lg:p-4 border-b border-gray-700 lg:border-r lg:border-b-0 flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-purple-400 mb-6 text-center lg:text-left">Admin Panel</h1>
          <nav>
            <ul>
              <li className="mb-3">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full text-left flex items-center p-3 rounded-lg transition-colors duration-200 ${activeTab === 'products' ? 'bg-purple-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  <Box size={20} className="mr-3" /> Gestión de Productos
                </button>
              </li>
              <li className="mb-3">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left flex items-center p-3 rounded-lg transition-colors duration-200 ${activeTab === 'orders' ? 'bg-purple-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  <ListOrdered size={20} className="mr-3" /> Gestión de Órdenes
                  {hasNewOrdersAlert && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      ¡Nuevas!
                    </span>
                  )}
                </button>
              </li>
              <li className="mb-3">
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`w-full text-left flex items-center p-3 rounded-lg transition-colors duration-200 ${activeTab === 'reviews' ? 'bg-purple-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  <MessageSquare size={20} className="mr-3" /> Gestión de Reseñas
                </button>
              </li>
              <li className="mb-3">
                <button
                  onClick={() => setActiveTab('metrics')}
                  className={`w-full text-left flex items-center p-3 rounded-lg transition-colors duration-200 ${activeTab === 'metrics' ? 'bg-purple-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  <BarChart2 size={20} className="mr-3" /> Métricas y Reportes
                </button>
              </li>
              <li className="mb-3">
                <button
                  onClick={() => setIsCategoryManagementModalOpen(true)}
                  className="w-full text-left flex items-center p-3 rounded-lg transition-colors duration-200 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Tags size={20} className="mr-3" /> Gestión de Categorías
                </button>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-6 lg:mt-auto">
          <button
            onClick={onGoToHome}
            className="w-full flex items-center justify-center p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200 mb-3"
          >
            <Home size={20} className="mr-2" /> Ir a la Tienda
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
          >
            <LogOut size={20} className="mr-2" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Barra de Búsqueda Global */}
        <form onSubmit={handleGlobalSearch} className="mb-6 flex gap-2">
          <div className="relative flex-grow">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="globalSearchInput"
              name="globalSearchInput"
              placeholder="Buscar productos, órdenes, clientes o reseñas..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm transition-colors duration-200"
            aria-label="Buscar globalmente"
          >
            Buscar
          </button>
        </form>

        {/* Gestión de Productos */}
        {activeTab === 'products' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-100 mb-6">Gestión de Productos</h2>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
              <button
                onClick={() => handleAddProduct(setIsProductFormOpen, setEditingProduct)}
                className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <PlusCircle size={20} /> Añadir Nuevo Producto
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <UploadCloud size={20} /> Importar Productos (JSON)
              </button>
            </div>

            {/* Filtros de productos */}
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
                <div className="relative w-full sm:w-1/2">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        id="productSearch"
                        name="productSearch"
                        placeholder="Buscar por nombre o descripción..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    />
                </div>
                <select
                    id="productCategoryFilter"
                    name="productCategoryFilter"
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 w-full sm:w-auto"
                >
                    <option value="all">Todas las Categorías</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {filteredProducts.length === 0 && !loading && (
                <p className="text-center text-gray-400 mt-10">No hay productos para mostrar con los filtros actuales.</p>
            )}

            {filteredProducts.length > 0 && (
                <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-3">Imagen</th>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Categoría</th>
                                <th scope="col" className="px-6 py-3">Precio</th>
                                <th scope="col" className="px-6 py-3">Stock</th>
                                <th scope="col" className="px-6 py-3 text-center">Salsas</th>
                                <th scope="col" className="px-6 py-3 text-center">Sabores</th>
                                <th scope="col" className="px-6 py-3 text-center">Tamaños</th>
                                <th scope="col" className="px-6 py-3 text-center">Destacado Manual</th>
                                <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => {
                                const isManuallyFeatured = manualFeaturedProductIds.includes(product.id);
                                return (
                                    <tr key={product.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-md" />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400">
                                                    <ImageOff size={24} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-gray-100">{product.name}</td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{product.category || 'N/A'}</td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                          {['Empanadas', 'Canastitas'].includes(product.category) ? (
                                            <>
                                              {product.precioDocena > 0 && `$${Math.floor(product.precioDocena)} (Doc.) `}
                                              {product.precioMediaDocena > 0 && `$${Math.floor(product.precioMediaDocena)} (1/2 Doc.) `}
                                              {product.precio > 0 && `$${Math.floor(product.precio)} (Unid.)`}
                                            </>
                                          ) : (
                                            `$${Math.floor(product.precio || 0)}`
                                          )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{product.stock}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center">
                                            {product.category === 'Pastas' && product.sauces && product.sauces.length > 0 ? (
                                                <List size={20} className="inline-block text-blue-500" title="Tiene salsas" />
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center">
                                            {product.category === 'Pastas' && product.flavors && product.flavors.length > 0 ? (
                                                <List size={20} className="inline-block text-purple-500" title="Tiene sabores" />
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center">
                                            {product.category === 'Papas Fritas' && product.sizes && product.sizes.length > 0 ? (
                                                <List size={20} className="inline-block text-orange-500" title="Tiene tamaños" />
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleManualFeatured(product.id, isManuallyFeatured, manualFeaturedProductIds)}
                                                    className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2
                                                      ${isManuallyFeatured
                                                        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-600 dark:bg-yellow-700 dark:hover:bg-yellow-600 dark:text-yellow-100 focus:ring-yellow-300'
                                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-300 focus:ring-gray-300'
                                                      }`}
                                                >
                                                    <Star size={20} className={isManuallyFeatured ? "fill-current" : ""} />
                                                </button>
                                            </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => handleEditProduct(product, setIsProductFormOpen, setEditingProduct)}
                                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline mr-3"
                                                aria-label={`Editar ${product.name}`}
                                            >
                                                <Edit size={20} className="inline-block" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id, setConfirmMessage, setConfirmAction, setIsConfirmModalOpen)}
                                                className="font-medium text-red-600 dark:text-red-400 hover:underline"
                                                aria-label={`Eliminar ${product.name}`}
                                            >
                                                <Trash2 size={20} className="inline-block" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        )}

        {/* Gestión de Órdenes */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-100 mb-6">Gestión de Órdenes</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <select
                        id="orderStatusFilter"
                        name="orderStatusFilter"
                        value={orderFilterStatus}
                        onChange={(e) => setOrderFilterStatus(e.target.value)}
                        className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 w-full sm:w-auto"
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="processing">En preparación</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                    <select
                        id="orderDeliveryFilter"
                        name="orderDeliveryFilter"
                        value={orderFilterDelivery}
                        onChange={(e) => setOrderFilterDelivery(e.target.value)}
                        className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 w-full sm:w-auto"
                    >
                        <option value="all">Todos los Envíos</option>
                        <option value="pickup">Retiro en Local</option>
                        <option value="delivery">Delivery</option>
                    </select>
                </div>
                <button
                    onClick={() => handleClearAllOrders(setConfirmMessage, setConfirmAction, setIsConfirmModalOpen)}
                    className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    <Eraser size={20} /> Limpiar Órdenes Finalizadas
                </button>
            </div>

            {/* FILTROS DE FECHA Y HORA */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                    <label htmlFor="orderDateFromFilter" className="block text-sm font-medium text-gray-400 mb-1">Fecha Desde:</label>
                    <CalendarDays size={20} className="absolute left-3 top-1/2 -translate-y-1/2 mt-2 text-gray-400" />
                    <input
                        type="date"
                        id="orderDateFromFilter"
                        name="orderDateFromFilter"
                        value={orderFilterDateFrom}
                        onChange={(e) => setOrderFilterDateFrom(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        title="Filtrar órdenes desde esta fecha"
                    />
                </div>
                <div className="relative">
                    <label htmlFor="orderDateToFilter" className="block text-sm font-medium text-gray-400 mb-1">Fecha Hasta:</label>
                    <CalendarDays size={20} className="absolute left-3 top-1/2 -translate-y-1/2 mt-2 text-gray-400" />
                    <input
                        type="date"
                        id="orderDateToFilter"
                        name="orderDateToFilter"
                        value={orderFilterDateTo}
                        onChange={(e) => setOrderFilterDateTo(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        title="Filtrar órdenes hasta esta fecha"
                    />
                </div>
                <div className="relative">
                    <label htmlFor="orderTimeFilter" className="block text-sm font-medium text-gray-400 mb-1">Hora Desde:</label>
                    <Clock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 mt-2 text-gray-400" />
                    <input
                        type="time"
                        id="orderTimeFilter"
                        name="orderTimeFilter"
                        value={orderFilterTimeFrom}
                        onChange={(e) => setOrderFilterTimeFrom(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        title="Filtrar órdenes a partir de esta hora"
                    />
                </div>
                <div className="relative">
                    <label htmlFor="orderDayOfWeekFilter" className="block text-sm font-medium text-gray-400 mb-1">Día de la Semana:</label>
                    <select
                        id="orderDayOfWeekFilter"
                        name="orderDayOfWeekFilter"
                        value={orderFilterDayOfWeek}
                        onChange={(e) => setOrderFilterDayOfWeek(e.target.value)}
                        className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 w-full"
                        title="Filtrar por día de la semana"
                    >
                        <option value="all">Cualquier Día</option>
                        <option value="1">Lunes</option>
                        <option value="2">Martes</option>
                        <option value="3">Miércoles</option>
                        <option value="4">Jueves</option>
                        <option value="5">Viernes</option>
                        <option value="6">Sábado</option>
                        <option value="0">Domingo</option>
                    </select>
                </div>
            </div>

            {orders.length === 0 && (
                <p className="text-center text-gray-400 mt-10">No hay órdenes para mostrar con los filtros actuales.</p>
            )}

            {orders.length > 0 && (
                <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID Orden</th><th scope="col" className="px-6 py-3">Cliente</th><th scope="col" className="px-6 py-3">Total</th><th scope="col" className="px-6 py-3">Método de Pago</th><th scope="col" className="px-6 py-3">Envío</th><th scope="col" className="px-6 py-3">Tipo Pedido</th><th scope="col" className="px-6 py-3">Hora Pedido</th><th scope="col" className="px-6 py-3">Estado</th><th scope="col" className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-gray-100">
                                        {order.id.substring(0, 8)}...
                                    </td><td className="px-6 py-4 text-gray-700 dark:text-gray-300">{order.customerInfo?.name || 'N/A'}</td><td className="px-6 py-4 text-gray-700 dark:text-gray-300">${Math.floor(order.total || 0)}</td><td className="px-6 py-4 text-gray-700 dark:text-gray-300">{order.paymentMethod === 'cash' ? 'Efectivo' : 'Mercado Pago'}</td><td className="px-6 py-4 text-gray-700 dark:text-gray-300">{order.deliveryMethod === 'pickup' ? 'Retiro' : 'Delivery'}</td><td className="px-6 py-4 text-gray-700 dark:text-gray-300">{order.orderType === 'immediate' ? 'Inmediato' : 'Reserva'}</td><td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                      {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </td><td className="px-6 py-4">
                                        <select
                                            id={`orderStatus-${order.id}`}
                                            name={`orderStatus-${order.id}`}
                                            value={order.status}
                                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                            className={`px-3 py-1 rounded-md text-sm font-semibold
                                                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' : ''}
                                                ${order.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' : ''}
                                                ${order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : ''}
                                                ${order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' : ''}
                                                bg-gray-700 text-gray-100 border-gray-600 focus:ring-purple-500 focus:border-purple-500
                                            `}
                                        >
                                            <option value="pending">Pendiente</option>
                                            <option value="processing">En preparación</option>
                                            <option value="completed">Completado</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                    </td><td className="px-6 py-4 text-center whitespace-nowrap">
                                        <button
                                            onClick={() => {setSelectedOrderDetails(order); setIsOrderDetailsModalOpen(true);}}
                                            className="font-medium text-purple-600 dark:text-purple-400 hover:underline mr-3"
                                            aria-label={`Ver detalles de orden ${order.id.substring(0, 5)}`}
                                        >
                                            <Eye size={20} className="inline-block" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOrder(order.id, setConfirmMessage, setConfirmAction, setIsConfirmModalOpen)}
                                            className="font-medium text-red-600 dark:text-red-400 hover:underline"
                                            aria-label={`Eliminar orden ${order.id.substring(0, 5)}`}
                                        >
                                            <Trash2 size={20} className="inline-block" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        )}

        {/* Gestión de Reseñas */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-100 mb-6">Gestión de Reseñas</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
                <select
                    id="reviewStatusFilter"
                    name="reviewStatusFilter"
                    value={reviewFilterStatus}
                    onChange={(e) => setReviewFilterStatus(e.target.value)}
                    className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 w-full sm:w-auto"
                >
                    <option value="all">Todos los Estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="approved">Aprobadas</option>
                </select>
                <select
                    id="reviewRatingFilter"
                    name="reviewRatingFilter"
                    value={reviewFilterRating}
                    onChange={(e) => setReviewFilterRating(e.target.value)}
                    className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 w-full sm:w-auto"
                >
                    <option value="all">Todas las Calificaciones</option>
                    {[1, 2, 3, 4, 5].map(rating => (
                        <option key={rating} value={rating}>{rating} Estrella{rating > 1 ? 's' : ''}</option>
                    ))}
                </select>
            </div>

            {reviews.length === 0 && (
                <p className="text-center text-gray-400 mt-10">No hay reseñas para mostrar con los filtros actuales.</p>
            )}

            {reviews.length > 0 && (
                <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-3">Producto ID</th>
                                <th scope="col" className="px-6 py-3">Usuario</th>
                                <th scope="col" className="px-6 py-3">Calificación</th>
                                <th scope="col" className="px-6 py-3">Comentario</th>
                                <th scope="col" className="px-6 py-3">Fecha</th>
                                <th scope="col" className="px-6 py-3">Estado</th>
                                <th scope="col" className="px-6 py-3">Respuesta Admin</th> {/* Nueva columna */}
                                <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map((review) => (
                                <tr key={review.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-gray-100">
                                        {review.productId.substring(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                        {review.userName || (review.userId ? `${review.userId.substring(0, 8)}...` : 'Anónimo')}
                                    </td>
                                    <td className="px-6 py-4 text-yellow-500 flex items-center">
                                        {review.rating} <Star size={16} className="fill-current ml-1" />
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-xs overflow-hidden text-ellipsis">
                                        {review.comment || 'Sin comentario'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                        {review.timestamp ? new Date(review.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                            ${review.approved ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'}`}
                                        >
                                            {review.approved ? 'Aprobada' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-xs overflow-hidden text-ellipsis">
                                        {review.adminResponse?.text ? (
                                            <span className="text-blue-400 flex items-center gap-1">
                                                <Reply size={16} /> Respondida
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">Sin respuesta</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        {!review.approved && (
                                            <button
                                                onClick={() => handleApproveReview(review.id)}
                                                className="font-medium text-green-600 dark:text-green-400 hover:underline mr-3"
                                                aria-label={`Aprobar reseña de ${review.productId.substring(0, 5)}`}
                                            >
                                                <CheckCheck size={20} className="inline-block" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpenReviewResponseModal(review)} // Botón para responder
                                            className="font-medium text-purple-600 dark:text-purple-400 hover:underline mr-3"
                                            aria-label={`Responder reseña de ${review.productId.substring(0, 5)}`}
                                        >
                                            <Reply size={20} className="inline-block" />
                                        </button>
                                        <button
                                            onClick={() => handleRejectReview(review.id, setConfirmMessage, setConfirmAction, setIsConfirmModalOpen)}
                                            className="font-medium text-red-600 dark:text-red-400 hover:underline"
                                            aria-label={`Rechazar reseña de ${review.productId.substring(0, 5)}`}
                                        >
                                            <Trash2 size={20} className="inline-block" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        )}

        {/* Métricas y Reportes */}
        {activeTab === 'metrics' && (
          <div className="space-y-10">
            <h2 className="text-3xl font-bold text-gray-100 mb-6">Métricas y Reportes del Negocio</h2>

            {/* SECCIÓN DE FILTROS PARA MÉTRICAS */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <h3 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-3">
                <Filter size={28} className="text-purple-400" /> Filtrar Métricas por Fecha
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="relative">
                  <label htmlFor="metricsStartDate" className="block text-sm font-medium text-gray-400 mb-1">Desde:</label>
                  <CalendarDays size={20} className="absolute left-3 top-1/2 -translate-y-1/2 mt-2 text-gray-400" />
                  <input
                    type="date"
                    id="metricsStartDate"
                    name="metricsStartDate"
                    value={metricsStartDate}
                    onChange={(e) => setMetricsStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    title="Fecha de inicio para las métricas"
                  />
                </div>
                <div className="relative">
                  <label htmlFor="metricsEndDate" className="block text-sm font-medium text-gray-400 mb-1">Hasta:</label>
                  <CalendarDays size={20} className="absolute left-3 top-1/2 -translate-y-1/2 mt-2 text-gray-400" />
                  <input
                    type="date"
                    id="metricsEndDate"
                    name="metricsEndDate"
                    value={metricsEndDate}
                    onChange={(e) => setMetricsEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    title="Fecha de fin para las métricas"
                  />
                </div>
                <button
                  onClick={handleResetMetricsDates}
                  className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 mt-4 md:mt-0"
                  title="Restablecer filtros de fecha"
                >
                  <RefreshCw size={20} /> Resetear Fechas
                </button>
              </div>
            </div>

            {/* SECCIÓN 1: Resumen General de Ventas */}
            <div className="bg-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700">
              <h3 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-3">
                <BarChart2 size={32} /> Resumen General de Ventas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Tarjeta de Ventas Totales */}
                <div className="bg-gradient-to-br from-green-700 to-green-900 p-6 rounded-xl shadow-xl flex items-center justify-between transform transition-transform hover:scale-105 border border-green-600">
                  <div>
                    <p className="text-sm text-green-200">Ventas Totales</p>
                    <p className="text-3xl font-extrabold text-white mt-1">${Math.floor(totalSales)}</p>
                  </div>
                  <DollarSign size={48} className="text-green-300 opacity-60" />
                </div>
                {/* Tarjeta de Órdenes Procesadas */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl shadow-xl flex items-center justify-between transform transition-transform hover:scale-105 border border-blue-500">
                  <div>
                    <p className="text-sm text-blue-200">Órdenes Procesadas</p>
                    <p className="text-3xl font-extrabold text-white mt-1">{totalOrdersProcessed}</p>
                  </div>
                  <CheckCheck size={48} className="text-blue-300 opacity-60" />
                </div>
                {/* Tarjeta de Valor Promedio del Pedido */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl shadow-xl flex items-center justify-between transform transition-transform hover:scale-105 border border-purple-500">
                  <div>
                    <p className="text-sm text-purple-200">Valor Promedio del Pedido</p>
                    <p className="text-3xl font-extrabold text-white mt-1">${averageOrderValue.toFixed(2)}</p>
                  </div>
                  <Percent size={48} className="text-purple-300 opacity-60" />
                </div>
                {/* Tarjeta de Órdenes Pendientes */}
                <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-6 rounded-xl shadow-xl flex items-center justify-between transform transition-transform hover:scale-105 border border-yellow-500">
                  <div>
                    <p className="text-sm text-yellow-200">Órdenes Pendientes</p>
                    <p className="text-3xl font-extrabold text-white mt-1">{orders.filter(o => o.status === 'pending').length}</p>
                  </div>
                  <ListOrdered size={48} className="text-yellow-300 opacity-60" />
                </div>
                {/* Tarjeta de Productos con Bajo Stock */}
                <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-xl shadow-xl flex items-center justify-between transform transition-transform hover:scale-105 border border-orange-500">
                  <div>
                    <p className="text-sm text-orange-200">Productos con Bajo Stock</p>
                    <p className="text-3xl font-extrabold text-white mt-1">{lowStockProducts}</p>
                  </div>
                  <AlertTriangle size={48} className="text-orange-300 opacity-60" />
                </div>
                {/* Tarjeta de Reseñas Aprobadas */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-xl shadow-xl flex items-center justify-between transform transition-transform hover:scale-105 border border-teal-500">
                  <div>
                    <p className="text-sm text-teal-200">Reseñas Aprobadas</p>
                    <p className="text-3xl font-extrabold text-white mt-1">{totalApprovedReviews}</p>
                  </div>
                  <MessageSquare size={48} className="text-teal-300 opacity-60" />
                </div>
              </div>

              {/* Gráfico de Tendencias de Ventas */}
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mt-8">
                <h4 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                  <TrendingUp size={24} className="text-green-400" /> Tendencias de Ventas Diarias
                </h4>
                {salesTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={salesTrendData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                      <XAxis dataKey="date" stroke="#cbd5e0" />
                      <YAxis stroke="#cbd5e0" />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                      />
                      <Legend wrapperStyle={{ color: '#cbd5e0', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} name="Ventas Diarias" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-center py-10">No hay datos de ventas para mostrar en el gráfico para el rango de fechas seleccionado.</p>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: Rendimiento de Productos */}
            <div className="bg-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700">
              <h3 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-3">
                <Package size={32} /> Rendimiento de Productos
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Productos Más Vendidos por Cantidad */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                  <h4 className="text-xl font-bold text-gray-100 mb-4">Productos Más Vendidos (Top 5 por Cantidad)</h4>
                  {topSellingProducts.sortedByQuantity.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-700 dark:bg-gray-900 dark:text-gray-200">
                          <tr>
                            <th scope="col" className="px-6 py-3">Producto</th>
                            <th scope="col" className="px-6 py-3 text-right">Cantidad</th>
                            <th scope="col" className="px-6 py-3 text-right">Ingresos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topSellingProducts.sortedByQuantity.slice(0, 5).map((item, index) => (
                            <tr key={index} className="bg-white border-b border-gray-700 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200">
                              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-gray-100">{item.name}</td>
                              <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{item.quantity}</td>
                              <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">${Math.floor(item.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-10">No hay datos de productos más vendidos para el rango de fechas seleccionado.</p>
                  )}
                </div>

                {/* Productos Menos Vendidos por Cantidad */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                  <h4 className="text-xl font-bold text-gray-100 mb-4">Productos Menos Vendidos (Top 5 por Cantidad)</h4>
                  {leastSellingProducts.sortedByQuantity.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-700 dark:bg-gray-900 dark:text-gray-200">
                          <tr>
                            <th scope="col" className="px-6 py-3">Producto</th>
                            <th scope="col" className="px-6 py-3 text-right">Cantidad</th>
                            <th scope="col" className="px-6 py-3 text-right">Ingresos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leastSellingProducts.sortedByQuantity.slice(0, 5).map((item, index) => (
                            <tr key={index} className="bg-white border-b border-gray-700 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200">
                              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-gray-100">{item.name}</td>
                              <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{item.quantity}</td>
                              <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">${Math.floor(item.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-10">No hay datos de productos menos vendidos para el rango de fechas seleccionado.</p>
                  )}
                </div>

                {/* Productos Más Vendidos por Ingresos */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                  <h4 className="text-xl font-bold text-gray-100 mb-4">Productos Más Vendidos (Top 5 por Ingresos)</h4>
                  {topSellingProducts.sortedByRevenue.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-700 dark:bg-gray-900 dark:text-gray-200">
                          <tr>
                            <th scope="col" className="px-6 py-3">Producto</th>
                            <th scope="col" className="px-6 py-3 text-right">Cantidad</th>
                            <th scope="col" className="px-6 py-3 text-right">Ingresos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topSellingProducts.sortedByRevenue.slice(0, 5).map((item, index) => (
                            <tr key={index} className="bg-white border-b border-gray-700 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200">
                              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-gray-100">{item.name}</td>
                              <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{item.quantity}</td>
                              <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">${Math.floor(item.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-10">No hay datos de productos más vendidos por ingresos para el rango de fechas seleccionado.</p>
                  )}
                </div>

                {/* Productos Menos Vendidos por Ingresos */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                  <h4 className="text-xl font-bold text-gray-100 mb-4">Productos Menos Vendidos (Top 5 por Ingresos)</h4>
                  {leastSellingProducts.sortedByRevenue.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-700 dark:bg-gray-900 dark:text-gray-200">
                          <tr>
                            <th scope="col" className="px-6 py-3">Producto</th>
                            <th scope="col" className="px-6 py-3 text-right">Cantidad</th>
                            <th scope="col" className="px-6 py-3 text-right">Ingresos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leastSellingProducts.sortedByRevenue.slice(0, 5).map((item, index) => (
                            <tr key={index} className="bg-white border-b border-gray-700 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200">
                              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-gray-100">{item.name}</td>
                              <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{item.quantity}</td>
                              <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">${Math.floor(item.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-10">No hay datos de productos menos vendidos por ingresos para el rango de fechas seleccionado.</p>
                  )}
                </div>
              </div>

              {/* Gráfico de Ventas por Categoría */}
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mt-8">
                <h4 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                  <Tags size={24} className="text-orange-400" /> Ventas por Categoría
                </h4>
                {salesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={salesByCategory}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                      <XAxis dataKey="name" stroke="#cbd5e0" />
                      <YAxis stroke="#cbd5e0" />
                      <Tooltip
                        content={<CustomTooltip unit=" $" />}
                        cursor={{ fill: 'rgba(148, 163, 184, 0.2)' }}
                      />
                      <Legend wrapperStyle={{ color: '#cbd5e0', paddingTop: '10px' }} />
                      <Bar dataKey="sales" fill="#82ca9d" name="Ingresos" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-center py-10">No hay datos de ventas por categoría para el rango de fechas seleccionado.</p>
                )}
              </div>
            </div>

            {/* SECCIÓN 3: Análisis de Órdenes */}
            <div className="bg-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700">
              <h3 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-3">
                <ListOrdered size={32} /> Análisis de Órdenes
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de Distribución de Estados de Órdenes */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                  <h4 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                    <List size={24} className="text-blue-400" /> Distribución de Estados de Órdenes
                  </h4>
                  {orderStatusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={orderStatusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                        >
                          {orderStatusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={ORDER_STATUS_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={<CustomTooltip />}
                          formatter={(value, name) => [`${value} órdenes`, name]}
                        />
                        <Legend wrapperStyle={{ color: '#cbd5e0', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-400 text-center py-10">No hay datos de estados de órdenes para mostrar.</p>
                  )}
                </div>

                {/* Gráfico de Ventas por Método de Entrega */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                  <h4 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                    <ShoppingBag size={24} className="text-green-400" /> Ventas por Método de Entrega
                  </h4>
                  {salesByDeliveryMethod.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={salesByDeliveryMethod}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="name" stroke="#cbd5e0" />
                        <YAxis stroke="#cbd5e0" />
                        <Tooltip
                          content={<CustomTooltip unit=" $" />}
                          cursor={{ fill: 'rgba(148, 163, 184, 0.2)' }}
                        />
                        <Legend wrapperStyle={{ color: '#cbd5e0', paddingTop: '10px' }} />
                        <Bar dataKey="sales" fill="#8884d8" name="Ingresos" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-400 text-center py-10">No hay datos de ventas por método de entrega para el rango de fechas seleccionado.</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: Clientes Clave */}
            <div className="bg-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700">
              <h3 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-3">
                <Users size={32} /> Clientes Clave (Top 10 por Gasto)
              </h3>
              {mostActiveCustomers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-700 dark:bg-gray-900 dark:text-gray-200">
                      <tr>
                        <th scope="col" className="px-6 py-3">Nombre</th>
                        <th scope="col" className="px-6 py-3">Teléfono</th>
                        <th scope="col" className="px-6 py-3">Dirección</th>
                        <th scope="col" className="px-6 py-3 text-right">Órdenes Totales</th>
                        <th scope="col" className="px-6 py-3 text-right">Gasto Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostActiveCustomers.map((customer, index) => (
                        <tr key={index} className="bg-white border-b border-gray-700 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200">
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-gray-100">{customer.name}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{customer.phone}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{customer.address}</td>
                          <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{customer.totalOrders}</td>
                          <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">${Math.floor(customer.totalSpent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-10">No hay datos de clientes clave para mostrar.</p>
              )}
            </div>

          </div>
        )}
      </div>

      {isProductFormOpen && (
        <ProductForm
          product={editingProduct}
          onClose={() => setIsProductFormOpen(false)}
          onSave={(data) => handleSaveProduct(data, editingProduct, setIsProductFormOpen, setEditingProduct)}
          showNotification={showNotification}
          firebaseConfig={firebaseConfig}
          appId={appId}
          categories={categories}
        />
      )}

      {isImportModalOpen && (
        <JsonImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImport={(data) => handleImportProducts(data, setIsImporting, setIsImportModalOpen)}
          showNotification={showNotification}
          isImporting={isImporting}
        />
      )}

      {isCategoryManagementModalOpen && (
        <CategoryManagementModal
          isOpen={isCategoryManagementModalOpen}
          onClose={() => setIsCategoryManagementModalOpen(false)}
          categories={categories}
          onSaveCategory={handleSaveCategory}
          onDeleteCategory={handleDeleteCategory}
          showNotification={showNotification}
        />
      )}

      {isOrderDetailsModalOpen && selectedOrderDetails && (
        <OrderDetailsModal
          isOpen={isOrderDetailsModalOpen}
          onClose={() => setIsOrderDetailsModalOpen(false)}
          order={selectedOrderDetails}
          showNotification={showNotification}
        />
      )}

      {/* Nuevo Modal de Respuesta de Reseña */}
      {isReviewResponseModalOpen && selectedReviewForResponse && (
        <ReviewResponseModal
          isOpen={isReviewResponseModalOpen}
          onClose={() => setIsReviewResponseModalOpen(false)}
          review={selectedReviewForResponse}
          onSaveResponse={handleSaveAdminResponse}
          showNotification={showNotification}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        message={confirmMessage}
        onConfirm={confirmAction}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;
