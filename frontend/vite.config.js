import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// En GitHub Pages la app vive en /Tramite-en-claro/; en local (npm run dev) sigue en /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Tramite-en-claro/' : '/',
  plugins: [react()],
}));