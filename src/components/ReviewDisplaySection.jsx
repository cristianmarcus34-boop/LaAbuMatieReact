import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Star, MessageSquare, User, Reply, ImageOff } from 'lucide-react'; // Añadido ImageOff para placeholders

const ReviewDisplaySection = ({ db, appId, showNotification }) => {
  const [reviews, setReviews] = useState([]);
  const [productsMap, setProductsMap] = useState({}); // Para mapear productId a {name, image}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar todos los productos para mapear IDs a nombres e imágenes
  useEffect(() => {
    if (!db) return;
    const fetchProducts = async () => {
      try {
        const productsColRef = collection(db, `artifacts/${appId}/public/data/products`);
        const productSnapshot = await getDocs(productsColRef);
        const map = {};
        productSnapshot.docs.forEach(doc => {
          const data = doc.data();
          map[doc.id] = { name: data.name, image: data.image }; // Guardar nombre y imagen
        });
        setProductsMap(map);
      } catch (err) {
        console.error("Error al cargar nombres/imágenes de productos para reseñas:", err);
        showNotification("Error al cargar información de productos para reseñas.", "error");
      }
    };
    fetchProducts();
  }, [db, appId, showNotification]);

  // Cargar reseñas aprobadas
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const reviewsColRef = collection(db, `artifacts/${appId}/public/data/product_reviews`);
    const q = query(reviewsColRef, where('approved', '==', true)); // Solo reseñas aprobadas

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(fetchedReviews.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0))); // Ordenar por fecha descendente
      setLoading(false);
    }, (err) => {
      console.error("Error al cargar reseñas:", err);
      setError("Error al cargar las reseñas.");
      setLoading(false);
      showNotification("Error al cargar las reseñas.", "error");
    });

    return () => unsubscribe();
  }, [db, appId, showNotification]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-400">Cargando reseñas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section className="lam-reviews-section max-w-6xl mx-auto my-16 p-8 bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 animate-fade-in-down">
      <h2 className="text-4xl font-extrabold text-teal-400 mb-10 text-center drop-shadow-md flex items-center justify-center gap-4">
        <MessageSquare size={48} /> Lo que dicen nuestros clientes
      </h2>

      {reviews.length === 0 ? (
        <p className="text-center text-gray-400 text-lg py-10">
          Aún no hay reseñas aprobadas. ¡Sé el primero en dejar una!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review) => {
            const productInfo = productsMap[review.productId];
            const productName = productInfo?.name || 'Producto Desconocido';
            const productImage = productInfo?.image;

            return (
              <article key={review.id} className="lam-review-card bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col justify-between transition-transform duration-300">
                <div>
                  <div className="flex items-center mb-3">
                    <User size={20} className="text-blue-400 mr-2" />
                    <p className="font-semibold text-gray-100 text-lg">{review.userName || 'Anónimo'}</p>
                  </div>
                  <div className="flex items-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={`mr-1 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-500'}`}
                      />
                    ))}
                    <span className="ml-2 text-gray-300 text-sm">({review.rating}/5)</span>
                  </div>
                  <p className="text-gray-300 mb-4 italic">"{review.comment}"</p>
                  
                  {/* Mostrar imagen del producto y nombre */}
                  <div className="flex items-center gap-3 mb-2 p-2 bg-gray-700 rounded-lg">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-12 h-12 object-cover rounded-md border border-gray-600"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/48x48/374151/d1d5db?text=IMG`; }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-600 flex items-center justify-center rounded-md text-gray-400">
                        <ImageOff size={24} />
                      </div>
                    )}
                    <p className="text-sm text-gray-400">
                      Producto: <span className="font-medium text-gray-200">{productName}</span>
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 text-right">
                    {review.timestamp ? new Date(review.timestamp.toDate()).toLocaleDateString('es-AR') : 'Fecha desconocida'}
                  </p>
                </div>

                {review.adminResponse?.text && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center mb-2">
                      <Reply size={18} className="text-purple-400 mr-2" />
                      <p className="font-semibold text-purple-300 text-sm">Respuesta del Admin:</p>
                    </div>
                    <p className="text-gray-300 text-sm pl-6 border-l-2 border-purple-500 italic">
                      "{review.adminResponse.text}"
                    </p>
                    <p className="text-xs text-gray-500 text-right mt-1">
                      {review.adminResponse.timestamp ? new Date(review.adminResponse.timestamp.toDate()).toLocaleDateString('es-AR') : 'Fecha desconocida'}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ReviewDisplaySection;
