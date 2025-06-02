// MICROSERVICIO: document-microservice
// ARCHIVO: src/services/api.js

import { authService } from "./auth";
import axios from 'axios';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: false, // No enviar cookies
});

// Interceptor para añadir el token de autenticación a todas las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    console.log("Token para API:", token ? "Token presente" : "Token no encontrado");
    
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      config.headers["x-access-token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Obtener todos los documentos
export async function fetchDocuments(userId = null) {
  try {
    let url = `/documents`;
    if (userId) {
      url += `?userId=${userId}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    throw error;
  }
}

// Subir un documento
export async function uploadDocument(formData) {
  try {
    const response = await api.post(`/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error al subir documento:", error);
    throw error;
  }
}

// Eliminar un documento
export async function deleteDocument(documentId) {
  try {
    await api.delete(`/documents/${documentId}`);
    return true;
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    throw error;
  }
}

// Obtener detalles de un documento
export async function getDocumentDetails(documentId) {
  try {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener detalles del documento:", error);
    throw error;
  }
}