// Script para detectar y solucionar problemas causados por bloqueadores de anuncios
// Los errores net::ERR_BLOCKED_BY_CLIENT indican que un bloqueador está interfiriendo

console.log('🔧 Detectando problemas de bloqueadores de anuncios...');

// Función para detectar bloqueadores de anuncios
const detectAdBlockers = () => {
  const indicators = [];
  
  // Verificar si hay scripts bloqueados
  const blockedScripts = document.querySelectorAll('script[src*="googleapis.com"]');
  blockedScripts.forEach(script => {
    if (script.src && !script.src.includes('data:') && !script.src.includes('blob:')) {
      indicators.push(`Script bloqueado: ${script.src}`);
    }
  });
  
  // Verificar si hay requests bloqueados
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('googleapis.com') && entry.duration === 0) {
        indicators.push(`Request bloqueado: ${entry.name}`);
      }
    });
  });
  
  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (error) {
    console.log('PerformanceObserver no disponible');
  }
  
  return indicators;
};

// Función para crear excepciones para localhost
const createLocalhostExceptions = () => {
  console.log('📝 Creando excepciones para localhost...');
  
  // Crear un elemento para mostrar instrucciones
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff6b6b;
    color: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 300px;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  
  instructions.innerHTML = `
    <h4>🚫 Bloqueador detectado</h4>
    <p>Para que la aplicación funcione correctamente, agrega estas excepciones a tu bloqueador:</p>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>localhost:5173</li>
      <li>localhost:4000</li>
      <li>*.googleapis.com</li>
      <li>*.firebaseapp.com</li>
    </ul>
    <button onclick="this.parentElement.remove()" style="background: white; color: #ff6b6b; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
      Entendido
    </button>
  `;
  
  document.body.appendChild(instructions);
  
  // Remover automáticamente después de 30 segundos
  setTimeout(() => {
    if (instructions.parentElement) {
      instructions.remove();
    }
  }, 30000);
};

// Función para verificar conectividad con Firebase
const checkFirebaseConnectivity = async () => {
  const endpoints = [
    'https://firestore.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint}/v1/projects/auditoria-f9fc4`, {
        method: 'OPTIONS',
        mode: 'no-cors'
      });
      results.push({ endpoint, status: 'accessible' });
    } catch (error) {
      results.push({ endpoint, status: 'blocked', error: error.message });
    }
  }
  
  return results;
};

// Función para crear un proxy local para Firebase
const createFirebaseProxy = () => {
  console.log('🔄 Creando proxy local para Firebase...');
  
  // Crear un proxy simple para requests de Firebase
  const originalFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    if (url.includes('googleapis.com') && url.includes('firestore')) {
      console.log('🔄 Proxy: Redirigiendo request de Firestore');
      
      // Intentar usar el backend local como proxy
      const proxyUrl = url.replace('https://firestore.googleapis.com', 'http://localhost:4000/firebase-proxy');
      
      try {
        return await originalFetch(proxyUrl, options);
      } catch (error) {
        console.warn('⚠️ Proxy falló, usando request original');
        return originalFetch(url, options);
      }
    }
    
    return originalFetch(url, options);
  };
  
  console.log('✅ Proxy de Firebase configurado');
};

// Función principal para ejecutar todas las verificaciones
const runAdBlockerDiagnostics = async () => {
  console.log('🔍 Ejecutando diagnóstico completo...');
  
  // 1. Detectar bloqueadores
  const blockedItems = detectAdBlockers();
  if (blockedItems.length > 0) {
    console.log('🚫 Elementos bloqueados detectados:', blockedItems);
    createLocalhostExceptions();
  } else {
    console.log('✅ No se detectaron elementos bloqueados');
  }
  
  // 2. Verificar conectividad con Firebase
  const connectivityResults = await checkFirebaseConnectivity();
  console.log('🌐 Resultados de conectividad:', connectivityResults);
  
  // 3. Crear proxy si es necesario
  const hasBlockedEndpoints = connectivityResults.some(result => result.status === 'blocked');
  if (hasBlockedEndpoints) {
    createFirebaseProxy();
  }
  
  // 4. Mostrar resumen
  console.log('📊 Resumen del diagnóstico:');
  console.log(`- Elementos bloqueados: ${blockedItems.length}`);
  console.log(`- Endpoints bloqueados: ${connectivityResults.filter(r => r.status === 'blocked').length}`);
  console.log(`- Proxy configurado: ${hasBlockedEndpoints}`);
  
  return {
    blockedItems,
    connectivityResults,
    proxyEnabled: hasBlockedEndpoints
  };
};

// Ejecutar diagnóstico si estamos en el navegador
if (typeof window !== 'undefined') {
  // Ejecutar después de que la página se cargue
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAdBlockerDiagnostics);
  } else {
    runAdBlockerDiagnostics();
  }
  
  // Hacer disponible globalmente
  window.runAdBlockerDiagnostics = runAdBlockerDiagnostics;
  window.createLocalhostExceptions = createLocalhostExceptions;
  window.createFirebaseProxy = createFirebaseProxy;
  
  console.log('✅ Funciones de diagnóstico disponibles:');
  console.log('  - runAdBlockerDiagnostics(): Ejecutar diagnóstico completo');
  console.log('  - createLocalhostExceptions(): Mostrar instrucciones de excepciones');
  console.log('  - createFirebaseProxy(): Configurar proxy para Firebase');
}

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectAdBlockers,
    createLocalhostExceptions,
    checkFirebaseConnectivity,
    createFirebaseProxy,
    runAdBlockerDiagnostics
  };
}
