import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config for Render (Web Service)
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
    // Use your Render hostname (no protocol)
    allowedHosts: ['collabify-0myy.onrender.com'],
  },
  // Ensure preview server matches Render runtime too
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
  },
  plugins: [
    react(),
  ],
})
