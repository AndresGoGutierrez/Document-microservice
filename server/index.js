import express from "express"
import cors from "cors"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import pg from "pg"
import dotenv from "dotenv"
import fs from "fs"
import jwt from 'jsonwebtoken'

// Load environment variables
dotenv.config()

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create Express app
const app = express()
const PORT = process.env.PORT || 3001

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Configure CORS - IMPORTANT: This must come before any other middleware
app.use(
  cors({
    // Specify allowed origins instead of using wildcard *
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
    exposedHeaders: ["Content-Type", "Authorization", "x-access-token"],
    credentials: false,
  }),
)

// Middleware to handle preflight requests
app.options("*", cors())


// MICROSERVICIO: document-microservice
// ARCHIVO: server/index.js

// Middleware para extraer información del usuario del token
app.use((req, res, next) => {
  // Obtener el token de todos los lugares posibles
  const authHeader = req.headers.authorization;
  const xAccessToken = req.headers['x-access-token'];
  const cookieToken = req.cookies?.auth_token;
  
  console.log("[Backend] Headers completos:", req.headers);
  console.log("[Backend] Authorization header:", authHeader);
  console.log("[Backend] x-access-token header:", xAccessToken);
  console.log("[Backend] Cookie auth_token:", cookieToken);
  
  // Intentar extraer el token
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Quitar 'Bearer '
  } else if (xAccessToken) {
    token = xAccessToken;
  } else if (cookieToken) {
    token = cookieToken;
  }
  
  console.log("[Backend] Token extraído:", token ? "Token presente" : "Token no encontrado");
  
  if (token) {
    try {
      // Decodificar el token sin verificar la firma
      const decoded = jwt.decode(token);
      console.log("[Backend] Token decodificado:", decoded);
      
      req.user = {
        id: decoded.id || decoded.sub || 'anonymous',
        name: decoded.username || decoded.name || 'Usuario Anónimo'
      };
      console.log('[Backend] Usuario autenticado:', req.user);
    } catch (error) {
      console.error('[Backend] Error al decodificar token:', error);
      req.user = { id: 'anonymous', name: 'Usuario Anónimo' };
    }
  } else {
    console.log("[Backend] No se recibió token");
    req.user = { id: 'anonymous', name: 'Usuario Anónimo' };
  }
  
  next();
});// Middleware to parse JSON


app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log("Uploads directory created")
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true)
    } else {
      cb(new Error("Only PDF files are allowed"), false)
    }
  },
})

// Serve static files
app.use("/uploads", express.static(uploadsDir))

// Create tables if they don't exist
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(255) NOT NULL,
        filesize INTEGER NOT NULL,
        user_id VARCHAR(255),
        user_name VARCHAR(255),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}

// Routes
app.get("/api/documents", async (req, res) => {
  try {
    let query = `
      SELECT 
        id, 
        title, 
        description, 
        category, 
        filename, 
        filepath, 
        filesize, 
        user_id,
        user_name,
        uploaded_at as "uploadedAt"
      FROM documents 
    `
    const params = []

    if (req.query.userId) {
      query += ` WHERE user_id = $1 `
      params.push(req.query.userId)
    }

    query += ` ORDER BY uploaded_at DESC`
    
    const result = await pool.query(query, params)
    const documents = result.rows.map((doc) => ({
      ...doc,
      viewUrl: `/uploads/${path.basename(doc.filepath)}`,
      downloadUrl: `/api/documents/${doc.id}/download`,
    }))
    
    res.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    res.status(500).json({ message: "Error fetching documents" })
  }
})

app.post("/api/documents", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const { title, description, category } = req.body
    const userId = req.user.id
    const userName = req.user.name

    if (!title) {
      return res.status(400).json({ message: "Document title is required" })
    }

    const result = await pool.query(
      `
      INSERT INTO documents (title, description, category, filename, filepath, filesize, user_id, user_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
      [
        title, 
        description || "", 
        category || "other", 
        req.file.originalname, 
        req.file.path, 
        req.file.size,
        userId,
        userName
      ],
    )

    res.status(201).json({
      id: result.rows[0].id,
      message: "Document uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    res.status(500).json({ message: "Error uploading document" })
  }
})

app.get("/api/documents/:id/download", async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("SELECT filepath, filename FROM documents WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" })
    }

    const { filepath, filename } = result.rows[0]

    res.download(filepath, filename)
  } catch (error) {
    console.error("Error downloading document:", error)
    res.status(500).json({ message: "Error downloading document" })
  }
})

app.delete("/api/documents/:id", async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Get file path and user before deleting the record
    const fileResult = await pool.query("SELECT filepath, user_id FROM documents WHERE id = $1", [id])

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" })
    }
    
    // Check if user is the owner of the document
    // If the user is 'anonymous', they cannot delete documents
    if (userId === 'anonymous' || (userId !== 'anonymous' && fileResult.rows[0].user_id !== userId)) {
      return res.status(403).json({ message: "You do not have permission to delete this document" })
    }

    // Delete from database
    await pool.query("DELETE FROM documents WHERE id = $1", [id])

    res.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    res.status(500).json({ message: "Error deleting document" })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err)

  // Apply CORS headers to error responses as well
  res.header("Access-Control-Allow-Origin", req.headers.origin || "http://localhost:3000")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  res.status(500).json({
    message: err.message || "An unexpected error occurred",
    error: process.env.NODE_ENV === "production" ? {} : err,
  })
})

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await initializeDatabase()
})

app.get('/api/auth/token', async (req, res) => {
  try {
    // Get the token from the main application
    const response = await fetch('http://localhost:4000/api/auth/token', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching token: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ message: 'Error fetching token' });
  }
});

export default app
