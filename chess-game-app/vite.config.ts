/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
import wasm from 'vite-plugin-wasm'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wasm()],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  // Configure for Stockfish Web Worker
  worker: {
    format: 'es'
  },
  // Ensure proper MIME types for WASM files
  assetsInclude: ['**/*.wasm'],
  // Configure server to serve files with correct MIME types
  server: {
    fs: {
      allow: ['..', './node_modules/stockfish']
    },
    // Configure MIME types for WASM files
    middlewareMode: false,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    exclude: ['stockfish']
  },
  // Define MIME types for different file extensions
  define: {
    global: 'globalThis'
  }
})
