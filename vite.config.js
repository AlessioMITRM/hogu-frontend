import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    host: true,
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
