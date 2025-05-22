import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// Custom plugin to copy PGlite WASM files to the build output
function copyPGliteWasmPlugin() {
  return {
    name: 'copy-pglite-wasm',
    writeBundle() {
      const sourceDir = path.resolve(__dirname, 'node_modules/@electric-sql/pglite/dist');
      const targetDir = path.resolve(__dirname, 'dist');
      
      if (fs.existsSync(sourceDir)) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Copy all WASM files from PGlite
        const wasmFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.wasm'));
        
        for (const wasmFile of wasmFiles) {
          const sourceWasmPath = path.resolve(sourceDir, wasmFile);
          const targetWasmPath = path.resolve(targetDir, wasmFile);
          fs.copyFileSync(sourceWasmPath, targetWasmPath);
          console.log(`Copied PGlite WASM file to ${targetWasmPath}`);
        }
      } else {
        console.warn(`PGlite WASM directory not found at ${sourceDir}`);
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyPGliteWasmPlugin()
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    port: 5173,
    host: 'localhost',
  },
  // Handle WebAssembly files
  assetsInclude: ['**/*.wasm'],
});
