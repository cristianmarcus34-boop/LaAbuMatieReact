import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import FeaturedProductsSection from '../components/FeaturedProductsSection';
import ToastNotification from '../components/ToastNotification';
import AdBadge from '../components/AdBadge'; // Nueva plaquita

// Importaciones de Firebase
import { collection, onSnapshot, query } from 'firebase/firestore';

// Lucide React Icons
import { Search, Heart } from 'lucide-react';

const HomePage = ({ db, appId, userId, showNotification, userProfile }) => {
  const [productos, setProductos] = useState([]);
  const [categoriasAbiertas, setCategoriasAbiertas] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [favoriteProductIds, setFavoriteProductIds] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedFavorites = localStorage.getItem('favoriteProductIds');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    }
    return [];
  });
  const [cartItems, setCartItems] = useState([]); // Placeholder para CarritoContext

  // Lógica para cargar productos desde Firestore
  useEffect(() => {
    if (!db || !appId) {
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);
    const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
    const q = query(productsCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => {
        const { id, ...dataWithoutId } = doc.data();
        return {
          id: doc.id,
          ...dataWithoutId,
        };
      });
      setProductos(productsData);

      const initialCategoriesState = productsData.reduce((acc, p) => {
        if (p.category) {
          acc[p.category] = false;
        }
        return acc;
      }, {});
      setCategoriasAbiertas(initialCategoriesState);
      setLoadingProducts(false);
    }, (err) => {
      setError("No se pudieron cargar los productos. Por favor, inténtalo de nuevo más tarde.");
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, [db, appId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('favoriteProductIds', JSON.stringify(favoriteProductIds));
    }
  }, [favoriteProductIds]);

  const toggleCategoria = useCallback((categoria) => {
    setCategoriasAbiertas((prev) => ({
      ...prev,
      [categoria]: !prev[categoria],
    }));
  }, []);

  const toggleFavorite = useCallback((productId) => {
    setFavoriteProductIds(prevIds => {
      if (prevIds.includes(productId)) {
        showNotification('Producto removido de favoritos', 'error', 1500);
        return prevIds.filter(id => id !== productId);
      } else {
        showNotification('Producto añadido a favoritos', 'success', 1500);
        return [...prevIds, productId];
      }
    });
  }, [showNotification]);

  const allProducts = useMemo(() => {
    return productos.filter(producto =>
      producto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [productos, searchTerm]);

  const productosPorCategoria = useMemo(() => {
    const grouped = allProducts.reduce((acc, producto) => {
      const categoria = producto.category || 'Sin categoría';
      if (!acc[categoria]) acc[categoria] = [];
      acc[categoria].push(producto);
      return acc;
    }, {});
    return grouped;
  }, [allProducts]);

  const sortedProductosPorCategoria = useMemo(() => {
    const categoriesArray = Object.entries(productosPorCategoria);
    categoriesArray.forEach(([categoria, productosArray]) => {
      productosArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });
    return categoriesArray;
  }, [productosPorCategoria]);

  const favoriteProducts = useMemo(() => {
    return allProducts.filter(p => favoriteProductIds.includes(p.id))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allProducts, favoriteProductIds]);

  const featuredProducts = useMemo(() => {
    return productos.slice(0, 5)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [productos]);

  const handleAddToCart = useCallback((productToAdd, quantityToAdd = 1) => {
    setCartItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.id === productToAdd.id);
        if (existingItem) {
            showNotification(`${productToAdd.name} +${quantityToAdd} unidad(es)`, 'info', 1500);
            return prevItems.map((item) =>
                item.id === productToAdd.id ? { ...item, quantity: item.quantity + quantityToAdd } : item
            );
        } else {
            showNotification(`"${productToAdd.name}" añadido al carrito`, 'success', 2000);
            return [...prevItems, { ...productToAdd, quantity: quantityToAdd }];
        }
    });
  }, [showNotification]);

  const handleOpenProductDetails = useCallback((product) => {
    console.log("Open product details for:", product.name);
    showNotification(`Detalles de ${product.name}`, 'info');
  }, [showNotification]);

  if (loadingProducts) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8" style={{minHeight: '100vh'}}>
        <div className="w-full mb-12 mt-24 flex justify-center">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold drop-shadow-2xl">
            <span className="inline-flex items-center gap-4 text-transparent bg-clip-text bg-gradient-to-br from-amber-600 via-orange-500 to-yellow-400 dark:from-amber-500 dark:via-orange-400 dark:to-yellow-200">
              La Abu Matie
            </span>
          </h1>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {[...Array(8)].map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-8 animate-pulse">
          Cargando delicias de la Abu...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-red-600 dark:text-red-400" style={{minHeight: '100vh'}}>
        <p className="text-xl font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8"> 
      {/* Título y Logo: La Abu Matie */}
      <div className="w-full mt-24 sm:mt-28 md:mt-32 mb-12 flex flex-col sm:flex-row justify-center items-center gap-4"> 
        <img
          src="/logo-abu-matie.jpeg" // Actualizado a logo de la Abu
          alt="La Abu Matie Logo"
          className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 xl:h-32 xl:w-32 object-contain rounded-full shadow-lg"
        />
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold drop-shadow-2xl text-center">
          <span className="inline-flex items-center text-transparent bg-clip-text bg-gradient-to-br from-amber-700 via-orange-600 to-yellow-500 dark:from-amber-500 dark:via-orange-400 dark:to-yellow-200">
            La Abu Matie
          </span>
        </h1>
      </div>

      {/* Buscador */}
      <div className="max-w-xl mx-auto mb-10 relative">
        <input
          type="text"
          id="search-input" 
          name="search"    
          placeholder="Busca algo rico de la Abu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 pl-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-400 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={24} />
      </div>

      <div className="space-y-10 max-w-7xl mx-auto">
        <FeaturedProductsSection
          featuredProducts={featuredProducts}
          onAddToCart={handleAddToCart}
          onOpenDetails={handleOpenProductDetails}
          favoriteProductIds={favoriteProductIds}
          onToggleFavorite={toggleFavorite}
        />

        {favoriteProducts.length > 0 && (
          <div
            key="Favoritos"
            className="rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden transform transition-all duration-300 hover:scale-[1.005] hover:shadow-2xl"
          >
            <button
              onClick={() => toggleCategoria('Favoritos')}
              className="w-full flex justify-between items-center px-6 sm:px-8 py-5 text-left text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 dark:from-orange-700 dark:to-amber-800 hover:from-orange-600 hover:to-amber-700 transition-all duration-300 rounded-t-3xl text-white shadow-md focus:outline-none focus:ring-4 focus:ring-orange-300"
              aria-expanded={categoriasAbiertas['Favoritos']}
            >
              <span className="capitalize flex items-center gap-2">
                <Heart size={28} className="text-red-200 fill-current" /> Favoritos
              </span>
              <span className="text-3xl transition-transform duration-300 transform">
                {categoriasAbiertas['Favoritos'] ? '−' : '+'}
              </span>
            </button>

            {categoriasAbiertas['Favoritos'] && (
              <div className="p-6 sm:p-8 animate-fade-in-down">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                  {favoriteProducts.map(producto => (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      onAddToCart={handleAddToCart}
                      onOpenDetails={handleOpenProductDetails}
                      isFavorite={favoriteProductIds.includes(producto.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {sortedProductosPorCategoria.map(([categoria, productos]) => (
          productos.length > 0 ? (
            <div
              key={categoria}
              className="rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden transform transition-all duration-300 hover:scale-[1.005] hover:shadow-2xl"
            >
              <button
                onClick={() => toggleCategoria(categoria)}
                className="w-full flex justify-between items-center px-6 sm:px-8 py-5 text-left text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 dark:from-orange-700 dark:to-amber-800 hover:from-orange-600 hover:to-amber-700 transition-all duration-300 rounded-t-3xl text-white shadow-md focus:outline-none focus:ring-4 focus:ring-orange-300"
                aria-expanded={categoriasAbiertas[categoria]}
              >
                <span className="capitalize flex items-center gap-2">
                  {categoria}
                </span>
                <span className="text-3xl transition-transform duration-300 transform">
                  {categoriasAbiertas[categoria] ? '−' : '+'}
                </span>
              </button>

              {categoriasAbiertas[categoria] && (
                <div className="p-6 sm:p-8 animate-fade-in-down">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                    {productos.map(producto => (
                      <ProductCard
                        key={producto.id}
                        producto={producto}
                        onAddToCart={handleAddToCart}
                        onOpenDetails={handleOpenProductDetails}
                        isFavorite={favoriteProductIds.includes(producto.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null
        ))}
      </div>

      {/* PUBLICIDAD FLOTANTE (KRUSTY BURGER) */}
      <AdBadge targetUrl="https://www.krustyburger.com.ar" />
      
    </div>
  );
};

export default HomePage;