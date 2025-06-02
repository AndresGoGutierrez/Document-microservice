// MICROSERVICIO: document-microservice
// ARCHIVO: src/hooks/useAuth.js

import { useState, useEffect } from 'react';
import { authService } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          const userData = await authService.verifyToken();
          if (userData && userData.isValid) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
            // Si el token no es válido, eliminarlo
            authService.removeToken();
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Verificar autenticación cada 30 segundos
    const interval = setInterval(checkAuth, 30000);

    return () => clearInterval(interval);
  }, []);

  return { user, loading, isAuthenticated };
};