// In document-microservice/src/services/api.js
// Base URL of the API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api"

// Function to get the authentication token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token")
  console.log("Token obtained:", token ? "Token present" : "Token not found")
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "x-access-token": token,
      }
    : {}
}

// Get all documents
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
      throw new Error("Error getting documents")
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting documents:", error)
    throw error
  }
}

// Upload a document
export async function uploadDocument(formData) {
  try {
    const response = await fetch(`${API_URL}/documents`, {
      method: "POST",
      body: formData,
      mode: "cors",
      credentials: "same-origin",
      headers: {
        ...getAuthHeaders(),
        // Do not set Content-Type, it will be set automatically for FormData
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Error uploading document")
    }

    return await response.json()
  } catch (error) {
    console.error("Error uploading document:", error)
    throw error
  }
}

// Delete a document
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
      throw new Error("Error deleting document")
    }

    return true
  } catch (error) {
    console.error("Error deleting document:", error)
    throw error
  }
}

// Get document details
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
      throw new Error("Error getting document details")
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting document details:", error)
    throw error
  }
}
