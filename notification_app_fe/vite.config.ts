import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  optimizeDeps: {
    include: ['logging-middleware'],
  },
  build: {
    commonjsOptions: {
      include: [/logging_middleware/, /node_modules/],
    },
  },
})


