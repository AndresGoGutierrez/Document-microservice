// MICROSERVICIO: document-microservice
// ARCHIVO: src/services/auth.js

import axios from "axios";

// URL base para el servicio de autenticación
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:4000/api/auth";

console.log("Configuración de autenticación:", {
  AUTH_API_URL,
  ENV_AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL,
});

// Crear una instancia de axios para autenticación
const authApi = axios.create({
  baseURL: AUTH_API_URL,
  withCredentials: false, // Cambiar a false para evitar problemas de CORS
  headers: {
    "Content-Type": "application/json",
  },
});

// Servicio de autenticación
export const authService = {
  // Verificar el token actual
  verifyToken: async () => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      console.log("No hay token almacenado");
      return null;
    }

    try {
      console.log("Verificando token:", token);

      const response = await authApi.post(
        `/verify`,
        { token },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-access-token": token,
          },
        }
      );

      console.log("Respuesta de verificación:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error al verificar token:", error.response?.data || error.message);
      return null;
    }
  },

  // Obtener el token actual
  getToken: () => {
    const token = localStorage.getItem("auth_token");
    console.log("Token obtenido desde localStorage:", token ? "Token presente" : "Token no encontrado");
    return token;
  },

  // Establecer el token
  setToken: (token) => {
    if (token) {
      localStorage.setItem("auth_token", token);
      console.log("Token guardado en localStorage");
    }
  },

  // Eliminar el token
  removeToken: () => {
    localStorage.removeItem("auth_token");
    console.log("Token eliminado de localStorage");
  },

  // Comprobar si el usuario está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem("auth_token");
  },

  // Decodificar el token para obtener información del usuario
  decodeToken: () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error al decodificar token:", error);
      return null;
    }
  }
};

export default authService;