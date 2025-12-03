import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: resolve(__dirname, '../public/cart-app'),
    emptyOutDir: true,
    assetsDir: '.',
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'cart-app.js',
        chunkFileNames: 'cart-app-[name].js',
        assetFileNames: 'cart-app[extname]',
      },
    },
  },
});
