import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  // Configuración para optimizar el desarrollo
  optimizeDeps: {
    exclude: ['@capacitor/ios', '@capacitor/android'],
    include: ['@capacitor/core', '@capacitor/app'],
    esbuildOptions: {
      // Asegurar que solo hay una versión de React
      inject: []
    }
  },
           build: {
           outDir: 'dist',
           sourcemap: false,
           minify: 'terser',
           terserOptions: {
             compress: {
               drop_console: true,
               drop_debugger: true,
               pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
             }
           },
           commonjsOptions: {
             include: [/node_modules/],
             transformMixedEsModules: true
           },
    rollupOptions: {
      external: [
        '@capacitor/app',
        '@capacitor/core',
        '@capacitor/android',
        '@capacitor/ios',
        '@capacitor/browser',
        '@capacitor/camera',
        '@capacitor/device',
        '@capacitor/filesystem',
        '@capacitor/geolocation',
        '@capacitor/haptics',
        '@capacitor/keyboard',
        '@capacitor/local-notifications',
        '@capacitor/network',
        '@capacitor/push-notifications',
        '@capacitor/screen-reader',
        '@capacitor/share',
        '@capacitor/splash-screen',
        '@capacitor/status-bar',
        '@capacitor/storage',
        '@capacitor/toast'
      ],
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom'],
          
          // UI Libraries
          'mui-core': ['@mui/material', '@mui/icons-material'],
          'bootstrap': ['bootstrap', 'react-bootstrap'],
          
          // Routing
          'router': ['react-router-dom'],
          
          // Charts and Visualization
          'charts': ['chart.js', 'react-chartjs-2', 'recharts'],
          
          // PDF and Document handling
          'pdf-tools': ['@react-pdf/renderer', 'jspdf', 'jspdf-autotable', 'pdf-lib', 'pdfkit', 'pdfmake'],
          
          // Excel and File handling
          'file-tools': ['exceljs', 'xlsx', 'file-saver'],
          
          // Calendar
          'calendar': ['@fullcalendar/core', '@fullcalendar/daygrid', '@fullcalendar/interaction', '@fullcalendar/react', 'react-calendar'],
          
          // Forms and Validation
          'forms': ['formik', 'yup'],
          
          // Utilities
          'utils': ['axios', 'date-fns', 'dayjs', 'uuid'],
          
          // Notifications and UI feedback
          'notifications': ['react-notifications-component', 'notistack', 'react-toastify', 'sweetalert2'],
          
          // Firebase
                         // 'firebase': ['firebase'], // Comentado temporalmente por problemas de resolución
          
          // Payment
          'payment': ['@mercadopago/sdk-react'],
          
          // Other tools
          'other-tools': ['html2canvas', 'html2pdf.js', 'react-signature-canvas', 'react-to-print', 'emailjs-com', 'docx']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  // Configuración para SPA (Single Page Application)
  base: './',
  // Manejo de rutas para producción
  preview: {
    port: 5173,
    host: true
  },
  // Optimización de resolución de módulos
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Forzar que todos los imports de React usen la misma instancia
      'react': resolve(__dirname, './node_modules/react'),
      'react-dom': resolve(__dirname, './node_modules/react-dom'),
      '@emotion/react': resolve(__dirname, './node_modules/@emotion/react'),
      '@emotion/styled': resolve(__dirname, './node_modules/@emotion/styled')
    },
    // Excluir paquetes de Capacitor que no se usan en desarrollo web
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled', '@emotion/cache']
  },
  // Optimización de assets
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.woff', '**/*.woff2'],
  // Optimización de CSS
  css: {
    postcss: './postcss.config.js'
  }
})
