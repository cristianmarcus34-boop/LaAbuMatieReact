import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Star, CheckCircle, XCircle, Search, MessageSquare, User, Send, ArrowLeft } from 'lucide-react'; // AÑADIDO: ArrowLeft
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

// Componente para la selección de estrellas
const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={28}
          className={`cursor-pointer transition-colors duration-200
            ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-400'}
            ${readOnly ? 'cursor-default' : 'hover:text-yellow-500 hover:fill-current'}
          `}
          onClick={() => !readOnly && onRatingChange(star)}
        />
      ))}
    </div>
  );
};

const ProductReviewPage = ({ db, appId, userId, showNotification }) => {
  const navigate = useNavigate(); // Inicializar useNavigate
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState(''); // Para que el usuario pueda poner su nombre
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false); // Para mostrar si ya reseñó
  const [existingReview, setExistingReview] = useState(null); // Para mostrar la reseña existente

  // Cargar productos al inicio
  useEffect(() => {
    if (!db) return;
    const fetchProducts = async () => {
      try {
        const productsColRef = collection(db, `artifacts/${appId}/public/data/products`);
        const productSnapshot = await getDocs(productsColRef);
        const productsData = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products for review:", error);
        showNotification("Error al cargar productos para reseñas.", "error");
      }
    };
    fetchProducts();
  }, [db, appId, showNotification]);

  // Verificar si el usuario ya ha reseñado este producto
  const checkExistingReview = useCallback(async (productId) => {
    if (!db || !userId || !productId) return;
    try {
      const reviewsColRef = collection(db, `artifacts/${appId}/public/data/product_reviews`);
      const q = query(reviewsColRef, where('productId', '==', productId), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length > 0) {
        setUserHasReviewed(true);
        setExistingReview({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        setRating(querySnapshot.docs[0].data().rating);
        setComment(querySnapshot.docs[0].data().comment);
        setUserName(querySnapshot.docs[0].data().userName || '');
      } else {
        setUserHasReviewed(false);
        setExistingReview(null);
        setRating(0);
        setComment('');
        setUserName('');
      }
    } catch (error) {
      console.error("Error checking existing review:", error);
      showNotification("Error al verificar reseña existente.", "error");
    }
  }, [db, appId, userId, showNotification]);

  useEffect(() => {
    if (selectedProduct) {
      checkExistingReview(selectedProduct.id);
    }
  }, [selectedProduct, checkExistingReview]);


  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    // Reiniciar formulario al seleccionar un nuevo producto
    setRating(0);
    setComment('');
    setUserName('');
    setUserHasReviewed(false);
    setExistingReview(null);
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      showNotification('Por favor, selecciona un producto para reseñar.', 'warning');
      return;
    }
    if (rating === 0) {
      showNotification('Por favor, otorga una calificación de estrellas.', 'warning');
      return;
    }
    if (comment.trim() === '') {
      showNotification('Por favor, escribe un comentario para tu reseña.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewsColRef = collection(db, `artifacts/${appId}/public/data/product_reviews`);
      const reviewData = {
        productId: selectedProduct.id,
        userId: userId || 'anonymous', // Usar el ID de usuario si está disponible, sino 'anonymous'
        userName: userName.trim() || 'Anónimo', // Nombre que el usuario ingresa
        rating: rating,
        comment: comment.trim(),
        timestamp: serverTimestamp(),
        approved: false, // Las reseñas siempre inician como pendientes de aprobación
      };

      if (existingReview) {
        // Si ya existe una reseña, la actualizamos
        const reviewDocRef = doc(db, `artifacts/${appId}/public/data/product_reviews`, existingReview.id);
        await updateDoc(reviewDocRef, reviewData);
        showNotification('Tu reseña ha sido actualizada con éxito y está pendiente de aprobación.', 'success', 5000);
      } else {
        // Si no existe, creamos una nueva
        await addDoc(reviewsColRef, reviewData);
        showNotification('Tu reseña ha sido enviada con éxito y está pendiente de aprobación.', 'success', 5000);
      }

      // Limpiar formulario y reiniciar estado
      setSelectedProduct(null);
      setRating(0);
      setComment('');
      setUserName('');
      setUserHasReviewed(false);
      setExistingReview(null);

    } catch (error) {
      console.error("Error submitting review:", error);
      showNotification(`Error al enviar tu reseña: ${error.message}`, 'error', 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 sm:p-8">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-700">
        <h1 className="text-4xl font-extrabold text-purple-400 mb-8 text-center">Deja tu Reseña</h1>

        {/* Botón para volver al inicio */}
        <div className="flex justify-start mb-6">
          <button
            onClick={() => navigate('/')} // Navegar a la ruta principal
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            aria-label="Volver al inicio"
          >
            <ArrowLeft size={20} /> Volver al Inicio
          </button>
        </div>

        {!selectedProduct ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 text-center">Selecciona un Producto para Reseñar</h2>
            <div className="relative mb-6">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="productSearchReview"
                name="productSearchReview"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              />
            </div>

            {filteredProducts.length === 0 && searchTerm !== '' && (
              <p className="text-center text-gray-400 mt-4">No se encontraron productos para "{searchTerm}".</p>
            )}
            {filteredProducts.length === 0 && searchTerm === '' && (
              <p className="text-center text-gray-400 mt-4">Cargando productos o no hay productos disponibles.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-h-96 overflow-y-auto custom-scrollbar p-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-purple-500 transition-all duration-200 transform hover:scale-105 flex flex-col"
                >
                  <img
                    src={product.image || `https://placehold.co/150x150/374151/d1d5db?text=Producto`}
                    alt={product.name}
                    className="w-full h-32 object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/150x150/374151/d1d5db?text=Error`; }}
                  />
                  <div className="p-3 flex-grow flex items-center justify-center">
                    <p className="text-lg font-semibold text-gray-100 text-center">{product.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 text-center">Reseña para: {selectedProduct.name}</h2>
            <div className="flex justify-center mb-6">
              <img
                src={selectedProduct.image || `https://placehold.co/150x150/374151/d1d5db?text=Producto`}
                alt={selectedProduct.name}
                className="w-32 h-32 object-cover rounded-full shadow-lg border-2 border-purple-500"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/150x150/374151/d1d5db?text=Error`; }}
              />
            </div>

            {userHasReviewed && (
              <div className="bg-blue-800 bg-opacity-30 border border-blue-700 text-blue-200 p-4 rounded-lg flex items-center gap-3 mb-6">
                <CheckCircle size={24} />
                <p className="text-sm">Ya has enviado una reseña para este producto. Puedes modificarla si lo deseas.</p>
              </div>
            )}

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-400 mb-2">
                Tu Nombre (Opcional):
              </label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tu Calificación:
              </label>
              <StarRating rating={rating} onRatingChange={handleRatingChange} />
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-400 mb-2">
                Tu Comentario:
              </label>
              <textarea
                id="comment"
                name="comment"
                rows="5"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Qué te pareció este producto? Sé específico..."
                className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-full sm:w-auto px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <XCircle size={20} /> Cambiar Producto
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Send size={20} className="animate-pulse" /> Enviando...
                  </>
                ) : (
                  <>
                    <Send size={20} /> {existingReview ? 'Actualizar Reseña' : 'Enviar Reseña'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProductReviewPage;
