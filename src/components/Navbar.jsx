import { Link, useNavigate } from "react-router-dom";
import { FileText, Upload } from "lucide-react";
import Logo from "../assets/Logo_black.png";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src={Logo} alt="CodeDev Logo" className="h-8 w-auto" />
            </Link>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Volver
            </button>

            <Link
              to="/"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Libreria
            </Link>

            <Link
              to="/upload"
              className="flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Upload className="mr-1 h-4 w-4" />
              Subir
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
