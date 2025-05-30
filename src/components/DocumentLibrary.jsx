// In document-microservice/src/components/DocumentLibrary.jsx
import { useState, useEffect } from "react";
import { fetchDocuments, deleteDocument } from "../services/api";
import TokenDebugger from "./TokenDebugger";

function DocumentLibrary() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMyDocuments, setShowMyDocuments] = useState(false);

  // Get user info from localStorage
  const getUserInfo = () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;

    try {
      // Decode the token (without verifying the signature)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const userInfo = getUserInfo();
  const isAuthenticated = !!localStorage.getItem("auth_token");

  useEffect(() => {
    loadDocuments();
  }, [showMyDocuments]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // If showMyDocuments is true and the user is authenticated, filter by userId
      const userId = showMyDocuments && userInfo ? userInfo.id : null;
      const data = await fetchDocuments(userId);
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError("Error loading documents. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this document?")
    ) {
      try {
        await deleteDocument(id);
        setDocuments(documents.filter((doc) => doc.id !== id));
      } catch (err) {
        setError(
          "Error deleting the document. Please try again."
        );
        console.error(err);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Document Library
        </h1>
        <div className="flex space-x-4">
          {/* Add the token debugger */}
          <TokenDebugger />
          {isAuthenticated && (
            <button
              onClick={() => setShowMyDocuments(!showMyDocuments)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {showMyDocuments
                ? "View all documents"
                : "View my documents"}
            </button>
          )}
          <a
            href="/upload"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Upload Document
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">
            {showMyDocuments
              ? "You haven't uploaded any documents yet."
              : "No documents available."}
          </p>
          <a
            href="/upload"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Upload your first document
          </a>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Title</th>
                <th className="py-3 px-6 text-left">Category</th>
                <th className="py-3 px-6 text-left">Uploaded by</th>
                <th className="py-3 px-6 text-left">Size</th>
                <th className="py-3 px-6 text-left">Date</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-6 text-left">
                    <div className="font-medium">{doc.title}</div>
                    {doc.description && (
                      <div className="text-xs text-gray-500">
                        {doc.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-6 text-left">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs">
                      {doc.category || "General"}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-left">
                    {doc.user_name || "Anonymous User"}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {formatFileSize(doc.filesize)}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {formatDate(doc.uploadedAt)}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center space-x-2">
                      <a
                        href={doc.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </a>
                      <a
                        href={doc.downloadUrl}
                        className="text-green-600 hover:text-green-900"
                        title="Download"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </a>
                      {isAuthenticated &&
                        userInfo &&
                        userInfo.id === doc.user_id && (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DocumentLibrary;
