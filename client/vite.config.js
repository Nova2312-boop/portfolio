import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    // Les appels /api partent vers le serveur Node pendant le développement
    proxy: { '/api': 'http://localhost:5000' },
  },
  build:
    mode === 'demo'
      ? // Aperçu autonome : tout dans un seul fichier JS, sans serveur
        { outDir: 'dist-demo', rollupOptions: { output: { inlineDynamicImports: true } } }
      : { chunkSizeWarningLimit: 800 },
}));
