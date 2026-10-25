import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Desarrollo: Vite en :5173 y las llamadas a /api se redirigen a Laravel (php artisan serve en :8000).
// Producción: `npm run build` deja la web en backend/public/spa y Laravel la sirve junto con la API
// desde un solo servidor (ver backend/routes/web.php).
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '')
  const backend = env.BACKEND_URL || 'http://127.0.0.1:8000'

  return {
    base: command === 'build' ? '/spa/' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
      },
    },
    preview: {
      proxy: {
        '/api': { target: backend, changeOrigin: true },
      },
    },
    build: {
      outDir: path.resolve(import.meta.dirname, '../backend/public/spa'),
      emptyOutDir: true,
    },
  }
})
