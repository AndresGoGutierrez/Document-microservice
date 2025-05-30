// En document-microservice/src/services/api.js
// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api"

// Función para obtener el token de autenticación de localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token")
  console.log("Token obtenido:", token ? "Token presente" : "Token no encontrado")
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "x-access-token": token,
      }
    : {}
}

// Obtener todos los documentos
export async function fetchDocuments(userId = null) {
  try {
    let url = `${API_URL}/documents`
    if (userId) {
      url += `?userId=${userId}`
    }
    
    const response = await fetch(url, {
      mode: "cors",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      throw new Error("Error al obtener documentos")
    }

    return await response.json()
  } catch (error) {
    console.error("Error al obtener documentos:", error)
    throw error
  }
}

// Subir un documento
export async function uploadDocument(formData) {
  try {
    const response = await fetch(`${API_URL}/documents`, {
      method: "POST",
      body: formData,
      mode: "cors",
      credentials: "same-origin",
      headers: {
        ...getAuthHeaders(),
        // No establecer Content-Type, se establecerá automáticamente para FormData
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Error al subir documento")
    }

    return await response.json()
  } catch (error) {
    console.error("Error al subir documento:", error)
    throw error
  }
}

// Eliminar un documento
export async function deleteDocument(documentId) {
  try {
    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      method: "DELETE",
      mode: "cors",
      credentials: "same-origin",
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      throw new Error("Error al eliminar documento")
    }

    return true
  } catch (error) {
    console.error("Error al eliminar documento:", error)
    throw error
  }
}

// Obtener detalles de un documento
export async function getDocumentDetails(documentId) {
  try {
    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      mode: "cors",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      throw new Error("Error al obtener detalles del documento")
    }

    return await response.json()
  } catch (error) {
    console.error("Error al obtener detalles del documento:", error)
    throw error
  }
}