// MICROSERVICIO: document-microservice
// ARCHIVO: src/components/ManualTokenInput.jsx

import { useState } from 'react';
import { authService } from '../services/auth';

const ManualTokenInput = () => {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) {
      authService.setToken(token.trim());
      setMessage('Token guardado correctamente');
      setTimeout(() => setMessage(''), 3000);
      setToken('');
    }
  };

  const handleRemoveToken = () => {
    authService.removeToken();
    setMessage('Token eliminado correctamente');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSyncFromMainApp = () => {
    try {
      // Intentar obtener el token desde la aplicación principal
      if (window.opener && window.opener !== window) {
        window.opener.postMessage({ type: 'REQUEST_TOKEN' }, 'http://localhost:5173');
        setMessage('Solicitando token de la aplicación principal...');
      } else {
        // Intentar abrir la aplicación principal para obtener el token
        const mainAppWindow = window.open('http://localhost:5173', '_blank');
        if (mainAppWindow) {
          setMessage('Abre la aplicación principal e inicia sesión, luego regresa aquí');
        }
      }
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error al sincronizar:', error);
      setMessage('Error al sincronizar con la aplicación principal');
      setTimeout(() => setMessage(''), 3000);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      <h3 className="font-bold mb-2">Gestión de Autenticación</h3>
      
      <div className="mb-4">
        <button 
          onClick={handleSyncFromMainApp}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 mb-2"
        >
          Sincronizar con Aplicación Principal
        </button>
        
        <button 
          onClick={handleRemoveToken}
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Eliminar Token Actual
        </button>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm mb-2">O ingresa tu token manualmente:</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Pega tu token aquí"
            className="border p-2 rounded"
          />
          <button 
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Guardar Token
          </button>
        </form>
      </div>
      
      {message && (
        <div className={`mt-2 p-2 rounded ${
          message.includes('eliminado') || message.includes('Error') 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ManualTokenInput;