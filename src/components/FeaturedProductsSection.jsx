// src/components/FeaturedProductsSection.jsx
import React from 'react';
import ProductCard from './ProductCard'; // Reutilizamos ProductCard para los productos destacados
import { Star } from 'lucide-react'; // Icono de estrella para la sección de destacados

// Componente FeaturedProductsSection: Muestra una colección de productos destacados.
// Props:
// - featuredProducts: Array de objetos de productos que se van a destacar.
// - onAddToCart: Función para añadir un producto al carrito.
// - onOpenDetails: Función para abrir el modal de detalles del producto.
// - favoriteProductIds: Array de IDs de productos favoritos.
// - onToggleFavorite: Función para alternar el estado de favorito.
const FeaturedProductsSection = ({
  featuredProducts,
  onAddToCart,
  onOpenDetails,
  favoriteProductIds,
  onToggleFavorite,
}) => {
  if (!featuredProducts || featuredProducts.length === 0) {
    return null; // No renderiza la sección si no hay productos destacados
  }

  return (
    // Contenedor principal de la sección de destacados
    // Con un fondo degradado sutil (ahora en tonos mostaza/ámbar), padding generoso,
    // bordes redondeados y una sombra marcada.
    // === CAMBIO AQUÍ: Asegurar overflow-hidden en el contenedor principal de la sección ===
    <section className="lam-featured p-6 sm:p-8 lg:p-9 rounded-3xl border overflow-hidden">
      {/* Título de la sección, prominente, con efecto de sombra de texto */}
      <h2 className="lam-featured-title text-3xl sm:text-4xl font-extrabold text-center mb-8 flex items-center justify-center gap-3">
        <Star size={22} className="text-amber-600 fill-current" />
        Favoritos de la casa
      </h2>
      {/* Contenedor para el carrusel de productos, con desplazamiento horizontal */}
      <div className="lam-featured-track flex overflow-x-auto snap-x snap-mandatory py-3 px-1 space-x-4 custom-scrollbar scroll-smooth">
        {featuredProducts.map((producto) => (
          // Cada tarjeta de producto en el carrusel
          // Con un ancho mínimo para asegurar que se muestren varias tarjetas y un efecto hover de escala.
          // === CAMBIO AQUÍ: Asegurar rounded-2xl y overflow-hidden en el contenedor de cada ProductCard ===
          <div
            key={producto.id}
            className="lam-featured-item min-w-[280px] sm:min-w-[320px] lg:min-w-[300px] xl:min-w-[280px] snap-start rounded-2xl overflow-hidden"
          >
            <ProductCard
              producto={producto}
              onAddToCart={onAddToCart}
              onOpenDetails={onOpenDetails}
              isFavorite={favoriteProductIds.includes(producto.id)}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedProductsSection;
