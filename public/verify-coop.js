
// Script de verificación de Cross-Origin-Opener-Policy
console.log('🔍 Verificando configuración de COOP...');

// Verificar meta tags en el DOM
const metaTags = document.querySelectorAll('meta[http-equiv*="Cross-Origin"]');
console.log('📋 Meta tags de seguridad encontrados:', metaTags.length);

metaTags.forEach(tag => {
  console.log('-', tag.getAttribute('http-equiv'), ':', tag.getAttribute('content'));
});

// Verificar si hay errores de COOP en la consola
const originalError = console.error;
console.error = function(...args) {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Cross-Origin-Opener-Policy')) {
    console.warn('🚨 Error de COOP detectado:', ...args);
  }
  originalError.apply(console, args);
};

// Verificar configuración del navegador
console.log('🌐 Información del navegador:');
console.log('- User Agent:', navigator.userAgent);
console.log('- Protocolo:', window.location.protocol);
console.log('- Hostname:', window.location.hostname);

// Verificar si estamos en un iframe
if (window !== window.top) {
  console.warn('⚠️ La aplicación está corriendo en un iframe');
}

console.log('✅ Verificación de COOP completada');
