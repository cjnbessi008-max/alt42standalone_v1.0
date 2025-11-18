import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser',
        target: 'es2015',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['idb']
                }
            }
        }
    },
    server: {
        port: 3000,
        open: true
    },
    preview: {
        port: 4173
    }
});
