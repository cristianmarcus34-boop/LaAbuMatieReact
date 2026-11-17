import { useState, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, setDoc } from 'firebase/firestore';
//Este gancho contiene toda la lógica para agregar, editar, eliminar e importar productos, así como para gestionar los productos destacados manualmente.
export const useProductManagement = (db, appId, showNotification) => {
  const handleAddProduct = useCallback((setIsProductFormOpen, setEditingProduct) => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  }, []);

  const handleEditProduct = useCallback((product, setIsProductFormOpen, setEditingProduct) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  }, []);

  const handleSaveProduct = useCallback(async (productData, editingProduct, setIsProductFormOpen, setEditingProduct) => {
    try {
      if (editingProduct) {
        const productRef = doc(db, `artifacts/${appId}/public/data/products`, editingProduct.id);
        await updateDoc(productRef, productData);
        showNotification('Producto actualizado con éxito.', 'success');
      } else {
        const productsColRef = collection(db, `artifacts/${appId}/public/data/products`);
        await addDoc(productsColRef, productData);
        showNotification('Producto añadido con éxito.', 'success');
      }
      setIsProductFormOpen(false);
      setEditingProduct(null);
    } catch (e) {
      console.error("Error al guardar producto:", e);
      showNotification(`Error al guardar producto: ${e.message}`, 'error');
    }
  }, [db, appId, showNotification]);

  const handleDeleteProduct = useCallback(async (productId, setConfirmMessage, setConfirmAction, setIsConfirmModalOpen) => {
    setConfirmMessage('¿Estás seguro de que quieres eliminar este producto? Esta acción es irreversible.');
    setConfirmAction(() => async () => {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/products`, productId));
        showNotification('Producto eliminado con éxito.', 'success');
      } catch (e) {
        console.error("Error al eliminar producto:", e);
        showNotification(`Error al eliminar producto: ${e.message}`, 'error');
      } finally {
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  }, [db, appId, showNotification]);

  const handleImportProducts = useCallback(async (jsonData, setIsImporting, setIsImportModalOpen) => {
    setIsImporting(true);
    try {
      const batch = writeBatch(db);
      const productsColRef = collection(db, `artifacts/${appId}/public/data/products`);
      for (const productData of jsonData) {
        const docRef = productData.id ? doc(productsColRef, productData.id) : doc(productsColRef);
        const productToSave = {
          ...productData,
          precio: Number(productData.precio) || 0,
          precioMediaDocena: productData.precioMediaDocena ? Number(productData.precioMediaDocena) : null,
          precioDocena: productData.precioDocena ? Number(productData.precioDocena) : null,
          stock: Number(productData.stock) || 0,
          sauces: productData.category === 'Pastas' && Array.isArray(productData.sauces)
            ? productData.sauces.map(s => ({
                id: s.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
                name: s.name || '',
                price: Number(s.price) || 0,
                isFree: s.isFree || false,
              }))
            : [],
          flavors: productData.category === 'Pastas' && Array.isArray(productData.flavors)
            ? productData.flavors.map(f => ({
                id: f.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
                name: f.name || '',
              }))
            : [],
          sizes: productData.category === 'Papas Fritas' && Array.isArray(productData.sizes)
            ? productData.sizes.map(s => ({
                id: s.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
                name: s.name || '',
                price: Number(s.price) || 0,
              }))
            : [],
        };
        batch.set(docRef, productToSave, { merge: true });
      }
      await batch.commit();
      showNotification(`Se importaron ${jsonData.length} productos con éxito.`, 'success', 5000);
      setIsImportModalOpen(false);
    } catch (e) {
      console.error("Error al importar productos:", e);
      showNotification(`Error al importar productos: ${e.message}`, 'error', 7000);
    } finally {
      setIsImporting(false);
    }
  }, [db, appId, showNotification]);

  const handleToggleManualFeatured = useCallback(async (productId, isCurrentlyFeatured, manualFeaturedProductIds) => {
    try {
      const featuredConfigDocRef = doc(db, `artifacts/${appId}/public/data/featured_products_config/manual_selection`);
      let updatedFeaturedIds;

      if (isCurrentlyFeatured) {
        updatedFeaturedIds = manualFeaturedProductIds.filter(id => id !== productId);
        showNotification('Producto quitado de destacados manuales.', 'info', 1500);
      } else {
        updatedFeaturedIds = [...manualFeaturedProductIds, productId];
        showNotification('Producto añadido a destacados manuales.', 'success', 1500);
      }
      await setDoc(featuredConfigDocRef, { productIds: updatedFeaturedIds });
    } catch (e) {
      console.error("Error al actualizar productos destacados manuales:", e);
      showNotification(`Error al actualizar destacados: ${e.message}`, 'error');
    }
  }, [db, appId, showNotification]);

  return {
    handleAddProduct,
    handleEditProduct,
    handleSaveProduct,
    handleDeleteProduct,
    handleImportProducts,
    handleToggleManualFeatured,
  };
};
