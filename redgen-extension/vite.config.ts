import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// A simple plugin to copy files to dist after build
const copyFiles = () => {
    return {
        name: 'copy-files',
        closeBundle: async () => {
            // Copy manifest.json
            fs.copyFileSync('manifest.json', 'dist/manifest.json');
            // Copy service-worker.js
            fs.copyFileSync('service-worker.js', 'dist/service-worker.js');
            console.log('✅ Manifest and Service Worker copied to dist');
        }
    };
};

export default defineConfig({
    plugins: [react(), copyFiles()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                sidepanel: resolve(__dirname, 'index.html'),
            },
            output: {
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name].[ext]',
            },
        },
    },
});
