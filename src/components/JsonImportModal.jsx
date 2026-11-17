import React, { useState, useRef } from 'react';
import { XCircle, Loader2, UploadCloud } from 'lucide-react'; // Asegúrate de tener estos iconos

// Componente para el modal de importación JSON
const JsonImportModal = ({ onClose, onImport, showNotification, isImporting }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName('');
    }
  };

  const handleUploadClick = () => {
    if (!fileInputRef.current?.files[0]) {
      showNotification("Por favor, selecciona un archivo JSON primero.", "warning");
      return;
    }
    const file = fileInputRef.current.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        onImport(json);
      } catch (error) {
        showNotification("Error al parsear el archivo JSON. Asegúrate de que es un JSON válido.", "error");
        console.error("Error parsing JSON file:", error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-1"
          aria-label="Cerrar modal de importación"
        >
          <XCircle size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Importar Productos (JSON)</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Sube un archivo JSON con tus productos. El formato debe ser un array de objetos de producto.
        </p>
        <input
          type="file"
          accept=".json"
          id="jsonFileInput" 
          name="jsonFile"    
          ref={fileInputRef}
          onChange={handleFileChange}
          className="w-full text-gray-700 dark:text-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
        />
        {fileName && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Archivo seleccionado: {fileName}</p>}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleUploadClick}
            disabled={isImporting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting && <Loader2 size={20} className="animate-spin mr-2" />}
            {isImporting ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JsonImportModal;
