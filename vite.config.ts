import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'AITeacherLivingSystem',
      fileName: 'ai-teacher-living-system'
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name].js'
      }
    }
  },
  worker: {
    format: 'es'
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, './src/core'),
      '@world': resolve(__dirname, './src/world'),
      '@interaction': resolve(__dirname, './src/interaction'),
      '@learning': resolve(__dirname, './src/learning'),
      '@evolution': resolve(__dirname, './src/evolution'),
      '@birth': resolve(__dirname, './src/birth')
    }
  }
});
