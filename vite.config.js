import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Development server configuration
  server: {
    port: 3000,
    strictPort: false,
    host: '0.0.0.0',  // Bind to all interfaces
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },

  // Production build configuration
  build: {
    // Output directory
    outDir: 'dist',

    // Assets directory
    assetsDir: 'assets',

    // Chunk size warnings
    chunkSizeWarningLimit: 500,

    // Source map for production debugging (optional - can be disabled for smaller bundle)
    sourcemap: false,

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    },

    // Rollup options for optimal bundling
    rollupOptions: {
      output: {
        // Manual chunks configuration for better caching
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-axios': ['axios'],
          'vendor-ui': ['react-toastify'],
          'vendor-state': ['zustand']
        },

        // Asset naming for cache busting
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];

          if (/png|jpe?g|gif|svg/.test(ext)) {
            return `images/[name].[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
            return `fonts/[name].[hash][extname]`;
          } else if (ext === 'css') {
            return `css/[name].[hash][extname]`;
          }
          return `[name].[hash][extname]`;
        }
      }
    },

    // CSS code splitting
    cssCodeSplit: true,

    // Report compressed size
    reportCompressedSize: true
  },

  // Optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'react-router-dom'],
    exclude: []
  },

  // Define environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
  }
})

