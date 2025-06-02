// MICROSERVICIO: document-microservice
// ARCHIVO: src/components/TokenSync.jsx

import { useEffect, useState } from 'react';
import { authService } from '../services/auth';

const TokenSync = () => {
  const [syncStatus, setSyncStatus] = useState('idle');

  useEffect(() => {
    // Función para sincronizar el token desde la aplicación principal
    const syncTokenFromMainApp = () => {
      try {
        // Intentar obtener el token desde la ventana padre
        if (window.opener && window.opener !== window) {
          window.opener.postMessage({ type: 'REQUEST_TOKEN' }, 'http://localhost:5173');
        }

        // Intentar obtener el token desde localStorage de la aplicación principal
        // Esto funciona si ambas aplicaciones están en el mismo dominio
        const mainAppToken = localStorage.getItem('auth_token');
        if (mainAppToken && mainAppToken !== authService.getToken()) {
          authService.setToken(mainAppToken);
          setSyncStatus('synced');
          console.log('Token sincronizado desde la aplicación principal');
        }
      } catch (error) {
        console.error('Error al sincronizar token:', error);
        setSyncStatus('error');
      }
    };

    // Escuchar mensajes de otras ventanas
    const handleMessage = (event) => {
      // Verificar el origen del mensaje por seguridad
      if (event.origin !== 'http://localhost:5173') return;

      if (event.data && event.data.type === 'TOKEN_RESPONSE' && event.data.token) {
        authService.setToken(event.data.token);
        setSyncStatus('synced');
        console.log('Token recibido de la aplicación principal');
      }
    };

    window.addEventListener('message', handleMessage);

    // Intentar sincronizar el token al cargar
    syncTokenFromMainApp();

    // Sincronizar cada 10 segundos
    const interval = setInterval(syncTokenFromMainApp, 10000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  return null; // Este componente no renderiza nada visible
};

export default TokenSync;