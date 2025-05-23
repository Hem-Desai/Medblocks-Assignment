import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// Custom plugin to copy WASM files to the build output
function copyWasmPlugin() {
  return {
    name: 'copy-wasm-files',
    writeBundle() {
      // Create the assets/wasm directory in the build output
      const targetWasmDir = path.resolve(__dirname, 'dist/assets/wasm');
      if (!fs.existsSync(targetWasmDir)) {
        fs.mkdirSync(targetWasmDir, { recursive: true });
      }
      
      // Copy SQL.js WASM files
      const sqlJsSourceDir = path.resolve(__dirname, 'node_modules/sql.js/dist');
      if (fs.existsSync(sqlJsSourceDir)) {
        const sqlJsWasmFiles = fs.readdirSync(sqlJsSourceDir).filter(file => file.endsWith('.wasm'));
        
        for (const wasmFile of sqlJsWasmFiles) {
          const sourceWasmPath = path.resolve(sqlJsSourceDir, wasmFile);
          const targetWasmPath = path.resolve(targetWasmDir, wasmFile);
          fs.copyFileSync(sourceWasmPath, targetWasmPath);
          console.log(`Copied SQL.js WASM file to ${targetWasmPath}`);
        }
      } else {
        console.warn(`SQL.js WASM directory not found at ${sqlJsSourceDir}`);
      }
      
      // Copy PGlite WASM files
      const pgliteSourceDir = path.resolve(__dirname, 'node_modules/@electric-sql/pglite/dist');
      if (fs.existsSync(pgliteSourceDir)) {
        const pgliteWasmFiles = fs.readdirSync(pgliteSourceDir).filter(file => file.endsWith('.wasm'));
        
        for (const wasmFile of pgliteWasmFiles) {
          const sourceWasmPath = path.resolve(pgliteSourceDir, wasmFile);
          const targetWasmPath = path.resolve(targetWasmDir, wasmFile);
          fs.copyFileSync(sourceWasmPath, targetWasmPath);
          console.log(`Copied PGlite WASM file to ${targetWasmPath}`);
        }
      } else {
        console.warn(`PGlite WASM directory not found at ${pgliteSourceDir}`);
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyWasmPlugin()
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
