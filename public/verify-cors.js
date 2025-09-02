
// Script de verificación de CORS para ControlFile
console.log('🔍 Verificando configuración de CORS...');

// Verificar configuración de ControlFile
console.log('🌐 Verificando ControlFile...');

// Función para probar conexión a ControlFile
async function testControlFileConnection() {
  try {
    console.log('🔗 Probando conexión a ControlFile...');
    
    // Verificar si el servicio está disponible
    const response = await fetch('https://controlauditv2.onrender.com/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ ControlFile está disponible');
      return true;
    } else {
      console.log('⚠️ ControlFile responde pero con error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error conectando a ControlFile:', error.message);
    return false;
  }
}

// Verificar configuración del navegador
console.log('🌐 Información del navegador:');
console.log('- User Agent:', navigator.userAgent);
console.log('- Protocolo:', window.location.protocol);
console.log('- Hostname:', window.location.hostname);
console.log('- Puerto:', window.location.port);

// Verificar si estamos en un iframe
if (window !== window.top) {
  console.warn('⚠️ La aplicación está corriendo en un iframe');
}

// Verificar headers de CORS
console.log('📋 Verificando headers de CORS...');
const metaTags = document.querySelectorAll('meta[http-equiv*="Cross-Origin"]');
console.log('Meta tags de seguridad encontrados:', metaTags.length);

metaTags.forEach(tag => {
  console.log('-', tag.getAttribute('http-equiv'), ':', tag.getAttribute('content'));
});

// Probar conexión
testControlFileConnection().then(success => {
  if (success) {
    console.log('✅ Verificación de CORS completada - ControlFile funciona');
  } else {
    console.log('❌ Verificación de CORS completada - Problemas detectados');
  }
});

console.log('✅ Verificación de CORS iniciada');
