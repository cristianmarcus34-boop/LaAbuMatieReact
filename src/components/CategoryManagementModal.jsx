import React, { useState, useEffect } from 'react';
import { XCircle, Edit, Trash2, Save } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal'; // Importación corregida

// Componente para el modal de gestión de categorías
const CategoryManagementModal = ({ isOpen, onClose, categories, onSaveCategory, onDeleteCategory, showNotification }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [isConfirmCategoryDeleteModalOpen, setIsConfirmCategoryDeleteModalOpen] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);


  useEffect(() => {
    if (!isOpen) {
      setNewCategoryName('');
      setEditingCategoryId(null);
      setEditingCategoryName('');
      setCategoryToDeleteId(null);
      setIsConfirmCategoryDeleteModalOpen(false);
    }
  }, [isOpen]);

  const handleAddCategory = async () => {
    if (newCategoryName.trim() === '') {
      showNotification('El nombre de la categoría no puede estar vacío.', 'warning');
      return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      showNotification('Ya existe una categoría con ese nombre.', 'warning');
      return;
    }
    try {
      await onSaveCategory({ name: newCategoryName.trim() });
      showNotification('Categoría añadida con éxito.', 'success');
      setNewCategoryName('');
    } catch (error) {
      showNotification(`Error al añadir categoría: ${error.message}`, 'error');
    }
  };

  const handleEditClick = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleSaveEdit = async (categoryId) => {
    if (editingCategoryName.trim() === '') {
      showNotification('El nombre de la categoría no puede estar vacío.', 'warning');
      return;
    }
    if (categories.some(cat => cat.id !== categoryId && cat.name.toLowerCase() === editingCategoryName.trim().toLowerCase())) {
      showNotification('Ya existe otra categoría con ese nombre.', 'warning');
      return;
    }
    try {
      await onSaveCategory({ id: categoryId, name: editingCategoryName.trim() });
      showNotification('Categoría actualizada con éxito.', 'success');
      setEditingCategoryId(null);
      setEditingCategoryName('');
    } catch (error) {
      showNotification(`Error al actualizar categoría: ${error.message}`, 'error');
    }
  };

  const confirmDeleteCategory = (categoryId) => {
    setCategoryToDeleteId(categoryId);
    setIsConfirmCategoryDeleteModalOpen(true);
  };

  const performDeleteCategory = async () => {
    try {
      await onDeleteCategory(categoryToDeleteId);
      showNotification('Categoría eliminada con éxito.', 'info');
    } catch (error) {
      showNotification(`Error al eliminar categoría: ${error.message}`, 'error');
    } finally {
      setIsConfirmCategoryDeleteModalOpen(false);
      setCategoryToDeleteId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-1"
          aria-label="Cerrar gestión de categorías"
        >
          <XCircle size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Gestión de Categorías</h2>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Añadir Nueva Categoría</h3>
          <div className="flex gap-2">
            <input
              type="text"
              id="newCategoryName" 
              name="newCategoryName" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la nueva categoría"
              className="flex-grow px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm transition-colors duration-200"
            >
              Añadir
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Categorías Existentes</h3>
          {categories.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No hay categorías definidas.</p>
          ) : (
            <ul className="space-y-3">
              {categories.map(category => (
                <li key={category.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-md shadow-sm">
                  {editingCategoryId === category.id ? (
                    <input
                      type="text"
                      id={`editCategory-${category.id}`} 
                      name={`editCategory-${category.id}`} 
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="flex-grow px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <span className="text-gray-900 dark:text-gray-100 text-lg">{category.name}</span>
                  )}
                  <div className="flex space-x-2 ml-4">
                    {editingCategoryId === category.id ? (
                      <button
                        onClick={() => handleSaveEdit(category.id)}
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full"
                        aria-label="Guardar cambios de categoría"
                      >
                        <Save size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditClick(category)}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                        aria-label="Editar categoría"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => confirmDeleteCategory(category.id)} // Usar el modal de confirmación
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full"
                      aria-label="Eliminar categoría"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isConfirmCategoryDeleteModalOpen}
        message="¿Estás seguro de que quieres eliminar esta categoría? Los productos asociados a esta categoría no se eliminarán, pero su categoría quedará sin definir."
        onConfirm={performDeleteCategory}
        onCancel={() => setIsConfirmCategoryDeleteModalOpen(false)}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default CategoryManagementModal;
