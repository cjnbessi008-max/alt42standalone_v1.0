import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/frontend/components'),
      '@services': path.resolve(__dirname, './src/frontend/services'),
      '@utils': path.resolve(__dirname, './src/frontend/utils'),
      '@types': path.resolve(__dirname, './src/frontend/types'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'shape-morph.js',
        assetFileNames: 'shape-morph.[ext]',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
