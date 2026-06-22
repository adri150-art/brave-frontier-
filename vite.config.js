// §1.7 — Build config : un seul bundle minifié dans dist/
import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: 'index.html',
            output: {
                // Pas de hash sur le nom pour que le fichier soit toujours dist/assets/bundle.js
                entryFileNames: 'assets/bundle.js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name][extname]',
            },
        },
        minify: 'esbuild',
        sourcemap: true,
    },
    server: {
        open: true,
        port: 5173,
    },
});
