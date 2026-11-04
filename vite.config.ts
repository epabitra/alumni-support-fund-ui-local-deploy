import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages repository name - CHANGE THIS to your repo name
// Example: If your repo URL is https://github.com/username/alumni-support-fund
// Then set REPO_NAME to 'alumni-support-fund'
const REPO_NAME = 'alumni-support-fund-ui'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Set base path for GitHub Pages deployment
  // In development, use '/', in production use '/REPO_NAME/'
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['axios', 'formik', 'yup'],
        },
      },
    },
  },
}))
