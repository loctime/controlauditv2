// Archivo de prueba para verificar la configuración de ControlFile
import { ENV_CONFIG, getBackendUrl } from '../config/environment';
import { getControlFileBaseUrl, buildControlFileUrl } from '../config/controlfile';

console.log('🧪 Testing ControlFile Configuration...');

// Probar configuración de entorno
console.log('🔧 ENV_CONFIG:', ENV_CONFIG);
console.log('🔧 BACKEND_BASE_URL:', ENV_CONFIG.BACKEND_BASE_URL);
console.log('🔧 BACKEND_URL:', ENV_CONFIG.BACKEND_URL);

// Probar función getBackendUrl
console.log('🔗 getBackendUrl("/api/uploads/presign"):', getBackendUrl('/api/uploads/presign'));
console.log('🔗 getBackendUrl("/api/uploads/confirm"):', getBackendUrl('/api/uploads/confirm'));

// Probar configuración de ControlFile
console.log('📁 getControlFileBaseUrl():', getControlFileBaseUrl());
console.log('📁 buildControlFileUrl("/api/uploads/presign"):', buildControlFileUrl('/api/uploads/presign'));

// Verificar variables de entorno
console.log('🌍 Variables de entorno detectadas:', {
  VITE_APP_BACKEND_URL: (import.meta as any).env?.VITE_APP_BACKEND_URL,
  DEV: (import.meta as any).env?.DEV,
  PROD: (import.meta as any).env?.PROD,
  MODE: (import.meta as any).env?.MODE
});

console.log('✅ Test de configuración completado');

