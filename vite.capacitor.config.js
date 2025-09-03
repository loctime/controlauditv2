import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Configuración específica para Capacitor
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'es2020',
    modulePreload: false,
    terserOptions: {
      compress: {
        drop_console: false, // Mantener console.log para debugging en APK
        drop_debugger: false,
        pure_funcs: []
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      // NO excluir módulos de Capacitor
      external: [],
      output: {
        format: 'es',
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom'],
          
          // UI Libraries
          'mui-core': ['@mui/material', '@mui/icons-material'],
          'bootstrap': ['bootstrap', 'react-bootstrap'],
          
          // Routing
          'router': ['react-router-dom'],
          
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
          
          // Payment
          'payment': ['@mercadopago/sdk-react'],
          
          // Other tools
          'other-tools': ['html2canvas', 'html2pdf.js', 'react-signature-canvas', 'react-toastify', 'react-to-print', 'emailjs-com', 'docx']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  // Configuración para SPA
  base: './',
  // Optimización de resolución de módulos para Capacitor
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    // Resolver módulos de Capacitor correctamente
    dedupe: ['@capacitor/core'],
    // Asegurar que los módulos de Capacitor se resuelvan correctamente
    mainFields: ['module', 'main', 'browser']
  },
  // Optimización de assets
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.woff', '**/*.woff2'],
  // Optimización de CSS
  css: {
    postcss: './postcss.config.js'
  },
  // Configuración específica para módulos ES
  optimizeDeps: {
    include: [
      '@capacitor/core',
      '@capacitor/app',
      '@capacitor/browser',
      '@southdevs/capacitor-google-auth'
    ],
    exclude: []
  }
})
