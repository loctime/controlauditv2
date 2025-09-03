import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = command === 'build' && mode === 'production'
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      // Proxy de API para desarrollo - evita problemas de CORS
      proxy: {
        '/api': {
          target: 'https://controlfile.onrender.com', // Backend de producción
          changeOrigin: true,
          secure: false,
        },
      },
      // Configuración de CORS para solucionar problemas de autenticación
      cors: {
        origin: [
                'https://auditoria.controldoc.app',
        'https://controlfile.onrender.com',
        'https://controlaudit.vercel.app',
          'https://auditoria-f9fc4.web.app',
          'https://auditoria-f9fc4.firebaseapp.com'
        ],
        credentials: true
      },
      // Headers de seguridad para solucionar problemas de COOP
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true'
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
        // Solo excluir módulos de Capacitor en producción, no en desarrollo
        external: isProduction ? [
          '@capacitor/core',
          '@capacitor/app',
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
        ] : [],
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
            // 'charts': ['google-charts'], // Comentado porque se carga dinámicamente desde CDN
            
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
        '@': resolve(__dirname, 'src')
      }
    },
    // Optimización de assets
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.woff', '**/*.woff2'],
    // Optimización de CSS
    css: {
      postcss: './postcss.config.js'
    }
  }
})
