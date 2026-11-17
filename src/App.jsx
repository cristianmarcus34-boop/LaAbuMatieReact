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
  ShoppingCart, Search, Sun, Moon, Heart,
  LayoutDashboard, Loader2, FileText,
  ArrowRight, ChefHat, MapPin, Sparkles, UtensilsCrossed
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
import './theme.css';

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
            <div className="lam-store min-h-screen">
              <header className="lam-header">
                <div className="lam-header-inner">
                  <button type="button" className="lam-brand" onClick={handleGoToHome} aria-label="La Abu Matie, inicio">
                    <img src="/LaAbuMatieLogo.jpeg" alt="" />
                    <span>
                      <strong>La Abu Matie</strong>
                      <small>Rotisería · Villa La Florida</small>
                    </span>
                  </button>
                  <nav className="lam-header-actions" aria-label="Navegación principal">
                    <button className="lam-nav-link" onClick={() => document.getElementById('lam-menu')?.scrollIntoView({ behavior: 'smooth' })}>
                      Menú
                    </button>
                    <button className="lam-nav-link" onClick={() => document.getElementById('lam-reviews')?.scrollIntoView({ behavior: 'smooth' })}>
                      Reseñas
                    </button>
                    {userProfile?.role === 'admin' && (
                      <button className="lam-admin-link" onClick={() => navigate('/dashboard-admin')}>
                        <LayoutDashboard size={17} /> Administración
                      </button>
                    )}
                    <button className="lam-theme-button" onClick={toggleDarkMode} aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}>
                      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                  </nav>
                </div>
              </header>

              {/* Notificación de Actualización */}
              {hasUpdate && (
                <button onClick={refreshPage} className="lam-update-banner">
                  Hay una nueva versión disponible <ArrowRight size={16} />
                </button>
              )}

              <main>
                <section className="lam-hero">
                  <div className="lam-hero-copy">
                    <p className="lam-eyebrow"><Sparkles size={15} /> Cocina casera, hecha con cariño</p>
                    <h1>Un sabor que<br /><em>se siente en casa.</em></h1>
                    <p className="lam-hero-description">
                      Platos abundantes, recetas de siempre y ese toque casero que convierte cada comida en un buen momento.
                    </p>
                    <div className="lam-hero-actions">
                      <button className="lam-primary-button" onClick={() => document.getElementById('lam-menu')?.scrollIntoView({ behavior: 'smooth' })}>
                        Descubrir el menú <ArrowRight size={18} />
                      </button>
                      <button className="lam-secondary-button" onClick={() => document.getElementById('lam-reviews')?.scrollIntoView({ behavior: 'smooth' })}>
                        Conocé nuestras reseñas
                      </button>
                    </div>
                    <div className="lam-hero-note">
                      <MapPin size={16} /> Villa La Florida, Quilmes
                    </div>
                  </div>
                  <div className="lam-hero-image">
                    <img src="/img/milanesa-napolitana-fritas.jfif" alt="Milanesa casera con papas fritas" />
                    <div className="lam-image-caption">
                      <span className="lam-caption-icon"><ChefHat size={20} /></span>
                      <span><strong>Como hecho en casa</strong><small>Recetas con sabor de familia</small></span>
                    </div>
                  </div>
                </section>

                <section className="lam-how-it-works" aria-labelledby="lam-how-title">
                  <div className="lam-section-heading">
                    <p className="lam-eyebrow">Simple y rico</p>
                    <h2 id="lam-how-title">Tu próximo antojo, en pocos pasos</h2>
                  </div>
                  <div className="lam-steps-grid">
                    <article className="lam-step-card">
                      <span className="lam-step-number">01</span>
                      <span className="lam-step-icon"><UtensilsCrossed size={21} /></span>
                      <h3>Elegí tus favoritos</h3>
                      <p>Recorré el menú y encontrá algo rico para compartir.</p>
                    </article>
                    <article className="lam-step-card">
                      <span className="lam-step-number">02</span>
                      <span className="lam-step-icon"><ShoppingCart size={21} /></span>
                      <h3>Armá tu pedido</h3>
                      <p>Sumá tus platos al carrito y revisá cada detalle.</p>
                    </article>
                    <article className="lam-step-card">
                      <span className="lam-step-number">03</span>
                      <span className="lam-step-icon"><FileText size={21} /></span>
                      <h3>Confirmá y disfrutá</h3>
                      <p>Completá tus datos y coordiná tu pedido fácilmente.</p>
                    </article>
                  </div>
                </section>

                <div className="lam-menu-content">
                  <FeaturedProductsSection
                    featuredProducts={featuredProducts}
                    onAddToCart={handleAddToCart}
                    onOpenDetails={handleOpenProductDetails}
                    favoriteProductIds={favoriteProductIds}
                    onToggleFavorite={toggleFavorite}
                  />

                  <section className="lam-menu-section" id="lam-menu">
                    <div className="lam-menu-heading">
                      <div>
                        <p className="lam-eyebrow">Hecho para disfrutar</p>
                        <h2>Nuestro menú</h2>
                        <p>Buscá tu próximo favorito entre nuestras opciones caseras.</p>
                      </div>
                      <label className="lam-search">
                        <Search size={19} aria-hidden="true" />
                        <input
                          type="search"
                          aria-label="Buscar en el menú"
                          placeholder="¿Qué se te antoja?"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button type="button" onClick={() => setSearchTerm('')} aria-label="Borrar búsqueda">
                            ×
                          </button>
                        )}
                      </label>
                    </div>

                    <div className="lam-category-chips" aria-label="Categorías del menú">
                      {sortedProductosPorCategoria.map(([categoria, items]) => (
                        <button
                          key={categoria}
                          className={categoriasAbiertas[categoria] ? 'lam-category-chip is-active' : 'lam-category-chip'}
                          onClick={() => toggleCategoria(categoria)}
                        >
                          {categoria}<span>{items.length}</span>
                        </button>
                      ))}
                    </div>

                    {favoriteProducts.length > 0 && (
                      <section className="lam-category-panel">
                        <button className="lam-category-heading" onClick={() => toggleCategoria('Favoritos')} aria-expanded={Boolean(categoriasAbiertas.Favoritos)}>
                          <span><Heart size={20} /> Tus favoritos <small>{favoriteProducts.length} productos</small></span>
                          <span className="lam-category-toggle">{categoriasAbiertas.Favoritos ? '−' : '+'}</span>
                        </button>
                        {categoriasAbiertas.Favoritos && (
                          <div className="lam-product-grid">
                            {favoriteProducts.map(p => (
                              <ProductCard key={p.id} producto={p} onAddToCart={handleAddToCart} onOpenDetails={handleOpenProductDetails} isFavorite={true} onToggleFavorite={toggleFavorite} />
                            ))}
                          </div>
                        )}
                      </section>
                    )}

                    {sortedProductosPorCategoria.map(([categoria, items]) => {
                      const isCategoryOpen = Boolean(categoriasAbiertas[categoria]) || Boolean(searchTerm.trim());
                      return items.length > 0 && (
                        <section className="lam-category-panel" key={categoria}>
                          <button className="lam-category-heading" onClick={() => toggleCategoria(categoria)} aria-expanded={isCategoryOpen}>
                            <span>{categoria}<small>{items.length} opciones</small></span>
                            <span className="lam-category-toggle">{isCategoryOpen ? '−' : '+'}</span>
                          </button>
                          {isCategoryOpen && (
                            <div className="lam-product-grid">
                              {items.map(p => (
                                <ProductCard key={p.id} producto={p} onAddToCart={handleAddToCart} onOpenDetails={handleOpenProductDetails} isFavorite={favoriteProductIds.includes(p.id)} onToggleFavorite={toggleFavorite} />
                              ))}
                            </div>
                          )}
                        </section>
                      );
                    })}
                    {searchTerm && sortedProductosPorCategoria.length === 0 && (
                      <p className="lam-empty-search">No encontramos productos para “{searchTerm}”. Probá con otra búsqueda.</p>
                    )}
                  </section>

                  <div className="lam-partner-promo">
                    <AdBadge targetUrl="https://www.krustyburger.com.ar" />
                  </div>
                </div>

                <div id="lam-reviews">
                  <ReviewDisplaySection db={db} appId={actualFirebaseProjectId} showNotification={showNotification} />
                </div>
              </main>

              {/* Carrito accesible mientras se recorre el menú */}
              <button
                onClick={() => setIsCartModalOpen(true)}
                className="lam-floating-cart"
                aria-label={`Abrir carrito, ${cartItems.length} productos`}
              >
                <ShoppingCart size={20} />
                <span>Mi pedido</span>
                <span className="lam-cart-count">{cartItems.length}</span>
              </button>

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