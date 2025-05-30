import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import DocumentUpload from "./components/DocumentUpload"
import DocumentLibrary from "./components/DocumentLibrary"
import "./App.css"

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<DocumentLibrary />} />
            <Route path="/upload" element={<DocumentUpload />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
