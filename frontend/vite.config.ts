import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Use 127.0.0.1, not "localhost": on Node 17+ "localhost" can resolve to ::1 (IPv6)
// first, while uvicorn listens on IPv4 only, which makes every proxied call fail on Windows.
// No `rewrite` on purpose: the backend routers are mounted under /api, so the prefix must be kept.
const BACKEND = 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Fail instead of silently moving to 5174 if the port is taken,
    // so http://localhost:5173 is always the real app.
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api':          { target: BACKEND, changeOrigin: true },
      '/docs':         { target: BACKEND, changeOrigin: true },
      '/redoc':        { target: BACKEND, changeOrigin: true },
      '/openapi.json': { target: BACKEND, changeOrigin: true },
      '/health':       { target: BACKEND, changeOrigin: true },
    },
  },
})
