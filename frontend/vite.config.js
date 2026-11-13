import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// En GitHub Pages la app vive en /Tramite-en-claro/; en local (npm run dev) sigue en /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Tramite-en-claro/' : '/',
  plugins: [react()],
  server: {
    // Expone el servidor en la red local para abrirlo desde el iPhone (misma Wi-Fi).
    host: true,
    proxy: {
      // En desarrollo el frontend llama a /api/...; Vite lo reenvía al backend local.
      // El backend no usa prefijo /api: /api/ask → http://localhost:3000/ask
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}));