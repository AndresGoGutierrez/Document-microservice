// Script para iniciar tanto el servidor frontend como el backend
import { spawn } from "child_process"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Verificar que el directorio server existe
const serverDir = join(__dirname, "server")
if (!fs.existsSync(serverDir)) {
  console.error('Error: El directorio "server" no existe.')
  console.log("Creando directorio server...")
  fs.mkdirSync(serverDir, { recursive: true })
}

// Verificar que el archivo server/index.js existe
const serverFile = join(serverDir, "index.js")
if (!fs.existsSync(serverFile)) {
  console.error('Error: El archivo "server/index.js" no existe.')
  console.log("Por favor, asegúrate de que el archivo server/index.js existe antes de ejecutar este script.")
  process.exit(1)
}

// Verificar que el directorio uploads existe
const uploadsDir = join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  console.log("Creando directorio uploads...")
  fs.mkdirSync(uploadsDir, { recursive: true })
}

console.log("Iniciando servidores...")

// Función para iniciar un proceso
function startProcess(command, args, name) {
  const proc = spawn(command, args, {
    stdio: "pipe",
    shell: true,
  })

  proc.stdout.on("data", (data) => {
    console.log(`[${name}] ${data.toString().trim()}`)
  })

  proc.stderr.on("data", (data) => {
    console.error(`[${name}] ${data.toString().trim()}`)
  })

  proc.on("close", (code) => {
    console.log(`[${name}] proceso terminado con código ${code}`)
    if (code !== 0) {
      console.error(`[${name}] Error: El proceso terminó con código de error ${code}`)
    }
  })

  return proc
}

// Iniciar el servidor backend
const backendServer = startProcess("node", ["server/index.js"], "Backend")

// Esperar un momento para que el servidor backend se inicie
setTimeout(() => {
  // Iniciar el servidor frontend
  const frontendServer = startProcess("npm", ["run", "dev"], "Frontend")

  // Manejar la terminación del script
  process.on("SIGINT", () => {
    console.log("Deteniendo servidores...")
    backendServer.kill()
    frontendServer.kill()
    process.exit(0)
  })
}, 2000)

console.log("Ambos servidores deberían estar ejecutándose ahora.")
console.log("Presiona Ctrl+C para detener ambos servidores.")
