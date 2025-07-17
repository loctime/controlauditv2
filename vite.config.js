import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Cargar variables de entorno según el modo
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    
    // Configuración de optimización
    optimizeDeps: {
      include: [
        '@fullcalendar/react',
        '@fullcalendar/daygrid',
        '@fullcalendar/interaction',
        '@fullcalendar/core'
      ]
    },
    
    // Configuración de build
    build: {
      rollupOptions: {
        external: [],
        output: {
          manualChunks: {
            fullcalendar: ['@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/interaction']
          }
        }
      },
      // Configuración específica por entorno
      sourcemap: mode === 'development',
      minify: mode === 'production'
    },
    
    // Configuración del servidor de desarrollo
    server: {
      port: 5173,
      host: true, // Permite acceso desde red local
      cors: true
    },
    
    // Configuración de preview (para testing)
    preview: {
      port: 4173,
      host: true
    },
    
    // Variables de entorno disponibles en el cliente
    define: {
      __APP_ENV__: JSON.stringify(mode),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },
    
    // Configuración de alias para imports más limpios
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@config': '/src/config',
        '@utils': '/src/utils',
        '@services': '/src/services'
      }
    }
  }
})
