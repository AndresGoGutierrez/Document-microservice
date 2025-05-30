import express from "express"
import cors from "cors"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import pg from "pg"
import dotenv from "dotenv"
import fs from "fs"
import jwt from 'jsonwebtoken'

// Cargar variables de entorno
dotenv.config()

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Crear aplicación Express
const app = express()
const PORT = process.env.PORT || 3001

// Configurar conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Configurar CORS - IMPORTANTE: Esto debe estar antes de cualquier otra middleware
app.use(
  cors({
    // Especificar orígenes permitidos en lugar de usar el comodín *
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
    credentials: true,
  }),
)

// Middleware para manejar preflight requests
app.options("*", cors())


app.use((req, res, next) => {
  // Obtener el token de autorización
  const authHeader = req.headers.authorization;
  const xAccessToken = req.headers['x-access-token'];
  console.log("[Backend] Headers completos:", req.headers);
  console.log("[Backend] Authorization header:", authHeader);
  console.log("[Backend] x-access-token header:", xAccessToken);
  
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Quitar 'Bearer '
  } else if (xAccessToken) {
    token = xAccessToken;
  }

  console.log("[Backend] Token extraído:", token ? "Token presente" : "Token no encontrado");

  if (token) {
    try {
      // No verificamos la firma del token porque no tenemos la clave secreta
      // Solo extraemos la información del payload
      const decoded = jwt.decode(token)
      console.log("Token decodificado:", decoded)
      req.user = {
        id: decoded.id || decoded.sub || 'anonymous',
        name: decoded.username || decoded.name || 'Usuario Anónimo'
      }
      console.log('Usuario autenticado:', req.user)
    } catch (error) {
      console.error('Error al decodificar token:', error)
      req.user = { id: 'anonymous', name: 'Usuario Anónimo' }
    }
  } else {
    console.log("No se recibió token")
    req.user = { id: 'anonymous', name: 'Usuario Anónimo' }
  }
  
  next()
})

// Middleware para parsear JSON
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, "../uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log("Directorio de uploads creado")
}

// Configurar multer para subida de archivos
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
  limits: { fileSize: 20 * 1024 * 1024 }, // 10MB límite
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true)
    } else {
      cb(new Error("Solo se permiten archivos PDF"), false)
    }
  },
})

// Servir archivos estáticos
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
    console.log("Base de datos inicializada correctamente")
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
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
    console.error("Error al obtener documentos:", error)
    res.status(500).json({ message: "Error al obtener documentos" })
  }
})

app.post("/api/documents", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se ha subido ningún archivo" })
    }

    const { title, description, category } = req.body
    const userId = req.user.id
    const userName = req.user.name

    if (!title) {
      return res.status(400).json({ message: "El título del documento es obligatorio" })
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
      message: "Documento subido correctamente",
    })
  } catch (error) {
    console.error("Error al subir documento:", error)
    res.status(500).json({ message: "Error al subir documento" })
  }
})

app.get("/api/documents/:id/download", async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("SELECT filepath, filename FROM documents WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Documento no encontrado" })
    }

    const { filepath, filename } = result.rows[0]

    res.download(filepath, filename)
  } catch (error) {
    console.error("Error al descargar documento:", error)
    res.status(500).json({ message: "Error al descargar documento" })
  }
})

app.delete("/api/documents/:id", async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Obtener ruta del archivo y usuario antes de eliminar el registro
    const fileResult = await pool.query("SELECT filepath, user_id FROM documents WHERE id = $1", [id])

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: "Documento no encontrado" })
    }
    
    // Verificar si el usuario es el propietario del documento
    // Si el usuario es 'anonymous', no puede eliminar documentos
    if (userId === 'anonymous' || (userId !== 'anonymous' && fileResult.rows[0].user_id !== userId)) {
      return res.status(403).json({ message: "No tienes permiso para eliminar este documento" })
    }

    // Eliminar de la base de datos
    await pool.query("DELETE FROM documents WHERE id = $1", [id])

    res.json({ message: "Documento eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar documento:", error)
    res.status(500).json({ message: "Error al eliminar documento" })
  }
})

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error("Error del servidor:", err)

  // Aplicar cabeceras CORS también a las respuestas de error
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  res.status(500).json({
    message: err.message || "Ha ocurrido un error inesperado",
    error: process.env.NODE_ENV === "production" ? {} : err,
  })
})

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`)
  await initializeDatabase()
})

app.get('/api/auth/token', async (req, res) => {
  try {
    // Obtener el token de la aplicación principal
    const response = await fetch('http://localhost:4000/api/auth/token', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener token: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error al obtener token:', error);
    res.status(500).json({ message: 'Error al obtener token' });
  }
});

export default app
