import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: true,
    https: false,
    proxy: {
      // Proxy solo per le richieste a /files/
      '/files': {
        target: 'http://localhost:80', // Nginx
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/files/, '/files')
      }
    }
  }
})
