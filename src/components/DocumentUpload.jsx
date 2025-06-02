// In document-microservice/src/components/DocumentUpload.jsx
import { useState } from "react"
import { uploadDocument } from "../services/api"
import { useNavigate } from "react-router-dom"

function DocumentUpload() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("general")
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  
  // Check if the user is authenticated
  const isAuthenticated = !!localStorage.getItem("auth_token")

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]

    if (selectedFile && selectedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed")
      setFile(null)
      return
    }

    if (selectedFile && selectedFile.size > 20 * 1024 * 1024) {
      setError("The file must not exceed 20MB")
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    if (!file) {
      setError("You must select a PDF file")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("category", category)
      formData.append("file", file)

      await uploadDocument(formData)

      // Redirect to the document library
      navigate("/")
    } catch (err) {
      setError(err.message || "Error uploading the document")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Document</h1>

      {/* {!isAuthenticated && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>
            You are uploading a document as an anonymous user. To associate this document with your account,{" "}
            <a 
              href={`${import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5173'}/login`} 
              className="font-bold underline"
            >
              log in
            </a>{" "}
            first.
          </p>
        </div>
      )} */}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Document title"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Document description (optional)"
            rows="3"
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="general">General</option>
            <option value="informe">Report</option>
            <option value="manual">Manual</option>
            <option value="presentacion">Presentation</option>
            <option value="articulo">Article</option>
            <option value="otro">Other</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file">
            PDF File *
          </label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            accept="application/pdf"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Only PDF files. Maximum size: 20MB</p>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Uploading..." : "Upload Document"}
          </button>
          <a href="/" className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}

export default DocumentUpload