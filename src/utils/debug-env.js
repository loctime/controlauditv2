// Debug de variables de entorno
console.log('🔍 Debug de variables de entorno:');

// Verificar import.meta.env
if (typeof import.meta !== 'undefined') {
  console.log('✅ import.meta disponible');
  console.log('🔧 import.meta.env:', import.meta.env);
  console.log('🔧 VITE_APP_BACKEND_URL:', import.meta.env?.VITE_APP_BACKEND_URL);
  console.log('🔧 DEV:', import.meta.env?.DEV);
  console.log('🔧 PROD:', import.meta.env?.PROD);
  console.log('🔧 MODE:', import.meta.env?.MODE);
} else {
  console.log('❌ import.meta no disponible');
}

// Verificar process.env (para Node.js)
if (typeof process !== 'undefined' && process.env) {
  console.log('✅ process.env disponible');
  console.log('🔧 process.env.VITE_APP_BACKEND_URL:', process.env.VITE_APP_BACKEND_URL);
} else {
  console.log('❌ process.env no disponible');
}

// Verificar window.location
if (typeof window !== 'undefined' && window.location) {
  console.log('✅ window.location disponible');
  console.log('🔧 hostname:', window.location.hostname);
  console.log('🔧 protocol:', window.location.protocol);
  console.log('🔧 port:', window.location.port);
} else {
  console.log('❌ window.location no disponible');
}

console.log('✅ Debug completado');


