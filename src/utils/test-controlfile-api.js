// Test de conectividad con ControlFile API (con autenticación)
import { auth } from '../firebaseConfig';

// Función para logging robusto en producción
function log(message, data = null) {
  // Usar console.log para desarrollo y producción
  if (data) {
    console.log(`🔍 ${message}`, data);
  } else {
    console.log(`🔍 ${message}`);
  }
  
  // También mostrar en la UI si es posible
  if (typeof window !== 'undefined' && window.showNotification) {
    window.showNotification(message);
  }
}

// Función para obtener token de Firebase
async function getFirebaseToken() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado en Firebase');
    }
    
    // Obtener token fresco (forceRefresh: true para evitar tokens expirados)
    const token = await user.getIdToken(true);
    log('Token obtenido:', token.substring(0, 50) + '...');
    return token;
  } catch (error) {
    console.error('❌ Error obteniendo token:', error);
    throw error;
  }
}

// Test de conectividad con ControlFile API
export async function testControlFileAPI() {
  const tests = [
    {
      name: 'Health Check (sin auth)',
      url: 'https://controlfile.onrender.com/api/health',
      method: 'GET',
      requiresAuth: false
    },
    {
      name: 'Folders Root (con auth)',
      url: 'https://controlfile.onrender.com/api/folders/root?name=ControlAudit',
      method: 'GET',
      requiresAuth: true
    },
    {
      name: 'Uploads Presign (con auth)',
      url: 'https://controlfile.onrender.com/api/uploads/presign',
      method: 'POST',
      requiresAuth: true
    }
  ];

  log('🧪 INICIANDO TESTS DE CONTROLFILE API');
  
  // Obtener token una sola vez
  let authToken = null;
  try {
    authToken = await getFirebaseToken();
    log('✅ Token de autenticación obtenido');
  } catch (error) {
    log('⚠️ No se pudo obtener token de Firebase, algunos tests fallarán');
  }
  
  for (const test of tests) {
    try {
      log(`\n🔍 Testing: ${test.name}`);
      log(`📍 URL: ${test.url}`);
      log(`📝 Method: ${test.method}`);
      log(`🔐 Requires Auth: ${test.requiresAuth}`);
      
      // Preparar headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Agregar token si es requerido
      if (test.requiresAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        log('🔑 Using Bearer token');
      } else if (test.requiresAuth && !authToken) {
        log('⚠️ Test requiere auth pero no hay token, saltando...');
        continue;
      }
      
      // Preparar opciones del fetch
      const fetchOptions = {
        method: test.method,
        headers
      };
      
      // Agregar body para POST requests
      if (test.method === 'POST') {
        fetchOptions.body = JSON.stringify({
          name: 'test-file.jpg',
          size: 1024,
          mime: 'image/jpeg'
        });
      }
      
      const response = await fetch(test.url, fetchOptions);
      
      log(`✅ Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        log(`📄 Response: ${data.substring(0, 200)}...`);
      } else {
        const errorText = await response.text();
        log(`❌ Error Response: ${errorText}`);
        
        // Análisis específico de errores de ControlFile
        if (response.status === 401) {
          if (errorText.includes('AUTH_TOKEN_MISSING')) {
            log('🔍 Error: Token de autenticación faltante');
          } else if (errorText.includes('AUTH_TOKEN_EXPIRED')) {
            log('🔍 Error: Token expirado, intenta renovar');
          } else if (errorText.includes('APP_FORBIDDEN')) {
            log('🔍 Error: Usuario no tiene acceso a ControlFile');
          }
        }
      }
      
    } catch (error) {
      log(`❌ Failed: ${error.message}`);
    }
  }
  
  log('✅ TESTS DE CONTROLFILE API COMPLETADOS');
  
  return 'Test completed. Check console for results.';
}

// Test específico para folders/root con autenticación
export async function testFoldersRoot() {
  log('📁 INICIANDO TEST DE FOLDERS ROOT (AUTHENTICATED)');
  
  try {
    // Verificar autenticación
    const user = auth.currentUser;
    if (!user) {
      log('❌ No hay usuario autenticado en Firebase');
      log('💡 Debes hacer login primero');
      return;
    }
    
    log(`👤 Usuario autenticado: ${user.email}`);
    
    // Obtener token
    const token = await getFirebaseToken();
    
    const url = 'https://controlfile.onrender.com/api/folders/root?name=ControlAudit&pin=1';
    log(`📍 Testing: ${url}`);
    log(`🔑 Token: ${token.substring(0, 50)}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      log(`✅ Success:`, data);
      
      // Verificar si la carpeta se creó correctamente
      if (data.folderId) {
        log(`📁 Carpeta raíz creada/obtenida: ${data.folderId}`);
        log(`📌 Pinneada en taskbar: ${data.pinned ? 'Sí' : 'No'}`);
      }
    } else {
      const errorText = await response.text();
      log(`❌ Error Response:`, errorText);
      
      // Análisis detallado del error
      if (response.status === 401) {
        log('🔍 Error 401 - Problemas de autenticación:');
        if (errorText.includes('AUTH_TOKEN_MISSING')) {
          log('  • Token de autenticación faltante');
        } else if (errorText.includes('AUTH_TOKEN_EXPIRED')) {
          log('  • Token expirado');
        } else if (errorText.includes('APP_FORBIDDEN')) {
          log('  • Usuario no tiene acceso a ControlFile');
          log('  • Verificar claim allowedApps en Firebase');
        }
      } else if (response.status === 404) {
        log('🔍 Error 404 - Endpoint no encontrado');
        log('  • Verificar que /api/folders/root esté implementado en ControlFile');
      }
    }
    
  } catch (error) {
    log(`❌ Fetch Error:`, error);
  }
  
  log('✅ TEST DE FOLDERS ROOT COMPLETADO');
}

// Función para ejecutar todos los tests
export async function runAllTests() {
  log('🚀 INICIANDO TESTS COMPLETOS DE CONTROLFILE');
  
  // Verificar autenticación primero
  const user = auth.currentUser;
  if (!user) {
    log('❌ No hay usuario autenticado en Firebase');
    log('💡 Debes hacer login primero para ejecutar tests autenticados');
    return;
  }
  
  log(`👤 Usuario autenticado: ${user.email}`);
  
  await testControlFileAPI();
  await testFoldersRoot();
  
  log('✅ TODOS LOS TESTS COMPLETADOS!');
}

// Función para testear solo conectividad básica (sin auth)
export async function testBasicConnectivity() {
  log('🌐 INICIANDO TEST DE CONECTIVIDAD BÁSICA (NO AUTH)');
  
  try {
    const response = await fetch('https://controlfile.onrender.com/api/health');
    log(`📊 Health Check Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.text();
      log(`✅ ControlFile responde: ${data}`);
    } else {
      log(`❌ ControlFile no responde correctamente`);
    }
  } catch (error) {
    log(`❌ Error de conectividad: ${error.message}`);
  }
  
  log('✅ TEST DE CONECTIVIDAD COMPLETADO');
}
