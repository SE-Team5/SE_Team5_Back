import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/_/backend': {
        target: 'http://localhost:5000',
        rewrite: (path) => path.replace(/^\/_\/backend/, ''),
        changeOrigin: true,
      },
    },
  },
})
