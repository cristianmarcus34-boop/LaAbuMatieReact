import { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';

// Componentes de Interfaz
import ProductCard from './components/ProductCard';
import ShoppingCartModal from './components/ShoppingCartModal';
import OrderFormModal from './components/OrderFormModal';
import OrderSummaryModal from './components/OrderSummaryModal';
import ProductDetailsModal from './components/ProductDetailsModal';
import ToastNotification from './components/ToastNotification';
import FeaturedProductsSection from './components/FeaturedProductsSection';
import Footer from './components/Footer';
import PowaContactForm from './components/PowaContactForm';
import WhatsAppConfirmationModal from './components/WhatsAppConfirmationModal';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ProductReviewPage from './pages/ProductReviewPage';
import ReviewDisplaySection from './components/ReviewDisplaySection';
import AdBadge from './components/AdBadge';

// Iconos e Imagenes
import {
  ShoppingCart, Search, Sun, Moon, ArrowUp, Heart,
  LogOut, LayoutDashboard, Loader2, AlertTriangle,
  MousePointerClick, FileText, CheckCircle, Star
} from 'lucide-react';

// Hooks Personalizados
import { useServiceWorkerUpdate } from './useServiceWorkerUpdate';
import { useLiveUpdate } from './hooks/useLiveUpdate';
import { useToast } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';
import { useScrollToTop } from './hooks/useScrollToTop';
import { useFirebase } from './hooks/useFirebase';
import { useProducts } from './hooks/useProducts';
import { useFavorites } from './hooks/useFavorites';
import { useFeaturedProducts } from './hooks/useFeaturedProducts';
import { useCart } from './hooks/useCart';
import { useOrderFlow } from './hooks/useOrderFlow';
import { useAdminWelcome } from './hooks/useAdminWelcome';

import './App.css';

function App() {
  const { showManualUpdatePrompt, confirmUpdate } = useServiceWorkerUpdate();
  const { hasUpdate, refreshPage } = useLiveUpdate();
  const navigate = useNavigate();

  // --- Lógica de Sincronización de Actualizaciones ---
  useEffect(() => {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('sw-messages');
      channel.onmessage = (event) => {
        if (event.data === 'refresh') window.location.reload();
      };
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'REFRESH_APP') window.location.reload();
      });
    }
  }, []);

  // --- Estados de UI para Modales de Producto ---
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductDetailsModalOpen, setIsProductDetailsModalOpen] = useState(false);
  const [isCombinedPizzaSelection, setIsCombinedPizzaSelection] = useState(false);
  const [isCombinedEmpanadaSelection, setIsCombinedEmpanadaSelection] = useState(false);
  const [combinedType, setCombinedType] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');

  // --- Configuración Dinámica de Firebase (Canvas o Local) ---
  const canvasAppId = typeof __app_id !== 'undefined' ? __app_id : null;
  const canvasFirebaseConfigRaw = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
  const canvasInitialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

  const { finalConfig, finalId } = useMemo(() => {
    let config = {};
    let id = 'default-app-id';
    if (canvasFirebaseConfigRaw) {
      try {
        config = JSON.parse(canvasFirebaseConfigRaw);
        id = canvasAppId || config.projectId || id;
      } catch (e) { console.error("Error parsing config:", e); }
    }
    if (!config.projectId) {
      config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
      };
      id = config.projectId || id;
    }
    return { finalConfig: config, finalId: id };
  }, [canvasFirebaseConfigRaw, canvasAppId]);

  const actualFirebaseProjectId = finalId;

  // --- Inicialización de Hooks de Lógica ---
  const { toast, showNotification: originalShowNotification } = useToast();
  const showNotification = useCallback((...args) => originalShowNotification?.(...args), [originalShowNotification]);

  const [isDarkMode, toggleDarkMode] = useTheme();
  const [showScrollToTopButton, scrollToTop] = useScrollToTop();
  const [hasShownAdminWelcome, setHasShownAdminWelcome] = useAdminWelcome();

  const {
    db, userId, userProfile, isAuthReady, isLoadingAuth,
    handleAdminLogin: firebaseAdminLogin, handleAdminLogout: firebaseAdminLogout,
  } = useFirebase(finalConfig, canvasInitialAuthToken, showNotification, currentPage, actualFirebaseProjectId);

  const {
    productos, loadingProducts, error, searchTerm, setSearchTerm,
    sortedProductosPorCategoria, toggleCategoria, categoriasAbiertas, allProducts,
  } = useProducts(db, actualFirebaseProjectId, isAuthReady, showNotification);

  const { favoriteProductIds, toggleFavorite, favoriteProducts } = useFavorites(db, actualFirebaseProjectId, userId, showNotification, allProducts);
  const { featuredProducts } = useFeaturedProducts(db, actualFirebaseProjectId, productos);
  const { cartItems, handleAddToCart, handleIncreaseQuantity, handleDecreaseQuantity, handleRemoveItem, handleClearCart } = useCart(showNotification);

  const {
    isCartModalOpen, setIsCartModalOpen, isOrderFormModalOpen, setIsOrderFormModalOpen,
    isOrderSummaryModalOpen, setIsOrderSummaryModalOpen, isWhatsAppConfirmationModalOpen, setIsWhatsAppConfirmationModalOpen,
    currentOrder, setCurrentOrder, handleBackToCartFromForm, handleBackToFormFromSummary,
    handlePlaceOrderClick, handleSendOrder, handleConfirmOrderAndSendWhatsApp,
    handleWhatsAppSentConfirmation, existingOrdersCount,
  } = useOrderFlow(db, actualFirebaseProjectId, userId, cartItems, handleClearCart, showNotification, navigate, actualFirebaseProjectId, allProducts);

  // --- Handlers de Administración ---
  const handleAdminLogin = useCallback(async (email, password) => {
    const result = await firebaseAdminLogin(email, password);
    if (result.success) {
      setHasShownAdminWelcome(true);
      setCurrentPage('dashboard-admin');
      navigate('/dashboard-admin');
    }
  }, [firebaseAdminLogin, navigate, setHasShownAdminWelcome]);

  const handleAdminLogout = useCallback(async () => {
    const result = await firebaseAdminLogout();
    if (result.success) {
      setHasShownAdminWelcome(false);
      setCurrentPage('home');
      navigate('/');
    }
  }, [firebaseAdminLogout, navigate, setHasShownAdminWelcome]);

  // --- Handlers de Modales de Producto ---
  const handleOpenProductDetails = useCallback((product, options = {}) => {
    setSelectedProduct(product);
    setIsProductDetailsModalOpen(true);
    setIsCombinedPizzaSelection(options.isCombinedPizzaSelection || false);
    setIsCombinedEmpanadaSelection(options.isCombinedEmpanadaSelection || false);
    setCombinedType(options.combinedType || null);
  }, []);

  const handleCloseProductDetails = useCallback(() => {
    setIsProductDetailsModalOpen(false);
    setSelectedProduct(null);
  }, []);

  // --- Handlers de Navegación Footer ---
  const handleOpenPowaContactForm = () => navigate('/contact');
  const handleOpenAdminLoginFromFooter = () => navigate('/login-admin');
  const handleGoToHome = () => navigate('/');
  const handleGoToProducts = () => navigate('/');
  const handleGoToReviews = () => navigate('/reviews');
  const handleGoToBranches = () => showNotification("Próximamente", "info");
  const handleGoToFAQ = () => showNotification("Próximamente", "info");

  // --- Renderizado de Carga ---
  if (loadingProducts || isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 transition-colors">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-orange-600 animate-pulse">Cargando sabores caseros...</h1>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
        <Helmet>
          <title>La Abu Matie - Rotisería y Pizzería | Quilmes</title>
          <meta name="description" content="Pide las mejores milanesas y pizzas caseras en Villa La Florida." />
        </Helmet>

        <Routes>
          <Route path="/" element={
            <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4 sm:p-8">
              {/* Botones Flotantes */}
              <div className="fixed top-6 left-6 flex space-x-4 z-50">
                <button onClick={toggleDarkMode} className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg">
                  {isDarkMode ? <Sun className="text-yellow-400" /> : <Moon className="text-gray-600" />}
                </button>
                {userProfile?.role === 'admin' && (
                  <button onClick={() => navigate('/dashboard-admin')} className="bg-green-600 text-white p-3 rounded-full shadow-lg">
                    <LayoutDashboard />
                  </button>
                )}
              </div>

              {/* Header Logo y Título */}
              <div className="mt-16 mb-12 flex flex-col items-center gap-4">
                <img src="/LaAbuMatieLogo.jpeg" className="w-32 h-32 rounded-full border-4 border-orange-500 shadow-xl animate-pizza-jiggle" alt="Logo" />
                <h1 className="text-5xl md:text-7xl font-black text-center bg-gradient-to-r from-orange-700 to-yellow-500 bg-clip-text text-transparent">
                  La Abu Matie App
                </h1>
              </div>

              {/* Notificación de Actualización */}
              {hasUpdate && (
                <div onClick={refreshPage} className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-3 rounded-full shadow-2xl cursor-pointer z-50 animate-bounce">
                  🔄 Nueva versión disponible - Toca para actualizar
                </div>
              )}

              {/* Botón Carrito Flotante */}
              <button
                onClick={() => setIsCartModalOpen(true)}
                className={`fixed bottom-10 right-6 p-4 rounded-full shadow-2xl z-40 flex items-center gap-2 text-white transition-all ${cartItems.length > 0 ? 'bg-red-600 scale-110' : 'bg-emerald-600'}`}
              >
                <ShoppingCart size={28} />
                <span className="text-xl font-bold">{cartItems.length}</span>
              </button>

              {/* Sección de Instrucciones de Pedido Detallada */}
              <section className="max-w-4xl mx-auto my-16 p-8 bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-xl border border-yellow-200 dark:border-gray-600 animate-fade-in-down">
                <h2 className="text-4xl font-bold text-center text-orange-700 dark:text-orange-300 mb-8 drop-shadow-md">
                  ¡Así de Fácil es Pedir!
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 text-center mb-10">
                  Sigue estos simples pasos para disfrutar de nuestros deliciosos sabores caseros:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">

                  {/* Paso 1 */}
                  <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-transform duration-300">
                    <div className="bg-red-500 text-white p-4 rounded-full mb-4 shadow-md">
                      <MousePointerClick size={36} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">1. Elige tus Favoritos</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Explora nuestro menú y presiona el botón "Añadir al Carrito" en los productos que más te gusten.
                    </p>
                  </div>

                  {/* Paso 2 */}
                  <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-transform duration-300">
                    <div className="bg-emerald-500 text-white p-4 rounded-full mb-4 shadow-md">
                      <ShoppingCart size={36} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">2. Revisa tu Carrito</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Cuando estés listo, haz clic en el icono del carrito (<ShoppingCart size={20} className="inline-block" />) en la esquina inferior derecha para ver tu selección.
                    </p>
                  </div>

                  {/* Paso 3 */}
                  <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-transform duration-300">
                    <div className="bg-purple-500 text-white p-4 rounded-full mb-4 shadow-md">
                      <FileText size={36} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">3. Confirma y Envía</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Desde el carrito, presiona "Realizar Pedido" y sigue las sencillas instrucciones para completar tu compra. ¡Listo!
                    </p>
                  </div>
                </div>

                <div className="mt-10 text-center text-gray-800 dark:text-gray-200 text-lg font-medium flex items-center justify-center gap-2">
                  <CheckCircle size={24} className="text-green-500" />
                  ¡Prepara tu paladar para el sabor casero de La Abu Matie!
                </div>
              </section>

              {/* Reseñas y Contenido Principal */}
              <ReviewDisplaySection db={db} appId={actualFirebaseProjectId} showNotification={showNotification} />

              <div className="space-y-10 max-w-7xl mx-auto pb-20">
                <FeaturedProductsSection
                  featuredProducts={featuredProducts}
                  onAddToCart={handleAddToCart}
                  onOpenDetails={handleOpenProductDetails}
                  favoriteProductIds={favoriteProductIds}
                  onToggleFavorite={toggleFavorite}
                />

                <div className="my-10 flex justify-center">
                  <AdBadge targetUrl="https://www.krustyburger.com.ar" />  {/* <--- AÑADIDO AQUÍ */}
                </div>

                {/* Acordeón de Favoritos */}
                {favoriteProducts.length > 0 && (
                  <div className="rounded-2xl overflow-hidden shadow-lg border dark:border-gray-800">
                    <button onClick={() => toggleCategoria('Favoritos')} className="w-full p-6 bg-emerald-600 text-white flex justify-between font-bold text-2xl">
                      <span><Heart className="inline mr-2 fill-current" /> Favoritos ({favoriteProducts.length})</span>
                      <span>{categoriasAbiertas['Favoritos'] ? '−' : '+'}</span>
                    </button>
                    {categoriasAbiertas['Favoritos'] && (
                      <div className="p-6 bg-white dark:bg-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {favoriteProducts.map(p => (
                          <ProductCard key={p.id} producto={p} onAddToCart={handleAddToCart} onOpenDetails={handleOpenProductDetails} isFavorite={true} onToggleFavorite={toggleFavorite} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Categorías Dinámicas */}
                {sortedProductosPorCategoria.map(([categoria, items]) => (
                  items.length > 0 && (
                    <div key={categoria} className="rounded-2xl overflow-hidden shadow-lg border dark:border-gray-800">
                      <button onClick={() => toggleCategoria(categoria)} className="w-full p-6 bg-orange-500 text-white flex justify-between font-bold text-2xl capitalize">
                        <span>{categoria} ({items.length})</span>
                        <span>{categoriasAbiertas[categoria] ? '−' : '+'}</span>
                      </button>
                      {categoriasAbiertas[categoria] && (
                        <div className="p-6 bg-white dark:bg-gray-800">
                          <div className="relative mb-6 max-w-md mx-auto">
                            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 rounded-lg border dark:bg-gray-700 dark:text-white" />
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {items.map(p => (
                              <ProductCard key={p.id} producto={p} onAddToCart={handleAddToCart} onOpenDetails={handleOpenProductDetails} isFavorite={favoriteProductIds.includes(p.id)} onToggleFavorite={toggleFavorite} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>

              {/* Render de Modales de la Parte 2 */}
              {isCartModalOpen && (
                <ShoppingCartModal
                  cartItems={cartItems}
                  onClose={() => setIsCartModalOpen(false)}
                  onIncreaseQuantity={handleIncreaseQuantity}
                  onDecreaseQuantity={handleDecreaseQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                  showNotification={showNotification}
                  onPlaceOrderDirectly={handlePlaceOrderClick}
                  allProducts={allProducts}
                />
              )}

              {isOrderFormModalOpen && (
                <OrderFormModal
                  cartItems={cartItems}
                  onClose={() => setIsOrderFormModalOpen(false)}
                  onBack={handleBackToCartFromForm}
                  onSendOrder={handleSendOrder}
                  showNotification={showNotification}
                  existingOrdersCount={existingOrdersCount}
                />
              )}

              {isOrderSummaryModalOpen && currentOrder && (
                <OrderSummaryModal
                  order={currentOrder}
                  onClose={() => { setIsOrderSummaryModalOpen(false); setCurrentOrder(null); }}
                  onBack={handleBackToFormFromSummary}
                  onConfirmOrderAndSendWhatsApp={handleConfirmOrderAndSendWhatsApp}
                  showNotification={showNotification}
                  allProducts={allProducts}
                />
              )}

              {isProductDetailsModalOpen && selectedProduct && (
                <ProductDetailsModal
                  product={selectedProduct}
                  onClose={handleCloseProductDetails}
                  onAddToCart={handleAddToCart}
                  db={db}
                  appId={actualFirebaseProjectId}
                  userId={userId}
                  showNotification={showNotification}
                  userProfile={userProfile}
                  allProducts={allProducts}
                  isCombinedPizzaSelection={isCombinedPizzaSelection}
                  isCombinedEmpanadaSelection={isCombinedEmpanadaSelection}
                  combinedType={combinedType}
                />
              )}

              {isWhatsAppConfirmationModalOpen && currentOrder && (
                <WhatsAppConfirmationModal
                  order={currentOrder}
                  onClose={() => setIsWhatsAppConfirmationModalOpen(false)}
                  onConfirmWhatsAppSent={handleWhatsAppSentConfirmation}
                />
              )}

              <ToastNotification key={toast?.id} {...toast} />
              <Footer
                onOpenPowaContactForm={handleOpenPowaContactForm}
                onOpenAdminLogin={handleOpenAdminLoginFromFooter}
                userProfile={userProfile}
                onGoToHome={handleGoToHome}
                onGoToProducts={handleGoToProducts}
                onGoToBranches={handleGoToBranches}
                onGoToFAQ={handleGoToFAQ}
                onGoToReviews={handleGoToReviews}
              />
            </div>
          } />

          {/* Rutas Extra */}
          <Route path="/login-admin" element={<AdminLogin onLogin={handleAdminLogin} onClose={() => navigate('/')} />} />
          <Route path="/dashboard-admin" element={
            userProfile?.role === 'admin' ? (
              <AdminDashboard
                db={db} appId={actualFirebaseProjectId} onLogout={handleAdminLogout}
                showNotification={showNotification} onGoToHome={() => navigate('/')}
                hasShownAdminWelcome={hasShownAdminWelcome} setHasShownAdminWelcome={setHasShownAdminWelcome}
                firebaseConfig={finalConfig}
              />
            ) : <Route path="*" element={<navigate to="/" />} />
          } />
          <Route path="/contact" element={<PowaContactForm onClose={() => navigate('/')} showNotification={showNotification} />} />
          <Route path="/reviews" element={<ProductReviewPage db={db} appId={actualFirebaseProjectId} userId={userId} showNotification={showNotification} />} />
          <Route path="*" element={<h2 className="text-3xl font-bold text-center mt-10">404 - No Encontrada</h2>} />
        </Routes>
      </div>
    </HelmetProvider>
  );
}

export default App;