import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@fullcalendar/react',
      '@fullcalendar/daygrid',
      '@fullcalendar/interaction',
      '@fullcalendar/core'
    ]
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          fullcalendar: ['@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/interaction']
        }
      }
    }
  }
})
