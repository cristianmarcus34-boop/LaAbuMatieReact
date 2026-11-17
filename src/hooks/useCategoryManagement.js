import { useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
//Este gancho se encargará de las operaciones CRUD para las categorías.
export const useCategoryManagement = (db, appId, showNotification) => {
  const handleSaveCategory = useCallback(async (categoryData) => {
    try {
      const categoriesColRef = collection(db, `artifacts/${appId}/public/data/categories`);
      if (categoryData.id) {
        const categoryRef = doc(categoriesColRef, categoryData.id);
        await updateDoc(categoryRef, { name: categoryData.name });
        showNotification('Categoría actualizada con éxito.', 'success');
      } else {
        await addDoc(categoriesColRef, { name: categoryData.name });
        showNotification('Categoría añadida con éxito.', 'success');
      }
    } catch (e) {
      console.error("Error al guardar categoría:", e);
      showNotification(`Error al guardar categoría: ${e.message}`, 'error');
      throw e; // Re-lanza el error para que el modal lo maneje si es necesario
    }
  }, [db, appId, showNotification]);

  const handleDeleteCategory = useCallback(async (categoryId) => {
    try {
      const categoryRef = doc(db, `artifacts/${appId}/public/data/categories`, categoryId);
      await deleteDoc(categoryRef);
      showNotification('Categoría eliminada con éxito.', 'info');
    } catch (e) {
      console.error("Error al eliminar categoría:", e);
      showNotification(`Error al eliminar categoría: ${e.message}`, 'error');
      throw e; // Re-lanza el error para que el modal lo maneje si es necesario
    }
  }, [db, appId, showNotification]);

  return {
    handleSaveCategory,
    handleDeleteCategory,
  };
};
