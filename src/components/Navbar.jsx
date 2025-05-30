import { Link } from "react-router-dom"
import { FileText, Upload } from "lucide-react"

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-semibold">Document Library</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Library
            </Link>
            <Link
              to="/upload"
              className="flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Upload className="mr-1 h-4 w-4" />
              Upload
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
