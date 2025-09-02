// Test de conectividad con ControlFile API (con autenticación)
import { auth } from '../firebaseConfig';

// Función para obtener token de Firebase
async function getFirebaseToken() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado en Firebase');
    }
    
    // Obtener token fresco (forceRefresh: true para evitar tokens expirados)
    const token = await user.getIdToken(true);
    console.log('🔑 Token obtenido:', token.substring(0, 50) + '...');
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

  console.group('🧪 TESTING CONTROLFILE API CONNECTIVITY');
  
  // Obtener token una sola vez
  let authToken = null;
  try {
    authToken = await getFirebaseToken();
  } catch (error) {
    console.warn('⚠️ No se pudo obtener token de Firebase, algunos tests fallarán');
  }
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`📍 URL: ${test.url}`);
      console.log(`📝 Method: ${test.method}`);
      console.log(`🔐 Requires Auth: ${test.requiresAuth}`);
      
      // Preparar headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Agregar token si es requerido
      if (test.requiresAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('🔑 Using Bearer token');
      } else if (test.requiresAuth && !authToken) {
        console.log('⚠️ Test requiere auth pero no hay token, saltando...');
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
      
      console.log(`✅ Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`📄 Response: ${data.substring(0, 200)}...`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Error Response: ${errorText}`);
        
        // Análisis específico de errores de ControlFile
        if (response.status === 401) {
          if (errorText.includes('AUTH_TOKEN_MISSING')) {
            console.log('🔍 Error: Token de autenticación faltante');
          } else if (errorText.includes('AUTH_TOKEN_EXPIRED')) {
            console.log('🔍 Error: Token expirado, intenta renovar');
          } else if (errorText.includes('APP_FORBIDDEN')) {
            console.log('🔍 Error: Usuario no tiene acceso a ControlFile');
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
  }
  
  console.groupEnd();
  
  return 'Test completed. Check console for results.';
}

// Test específico para folders/root con autenticación
export async function testFoldersRoot() {
  console.group('📁 TESTING FOLDERS ROOT ENDPOINT (AUTHENTICATED)');
  
  try {
    // Verificar autenticación
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No hay usuario autenticado en Firebase');
      console.log('💡 Debes hacer login primero');
      console.groupEnd();
      return;
    }
    
    console.log(`👤 Usuario autenticado: ${user.email}`);
    
    // Obtener token
    const token = await getFirebaseToken();
    
    const url = 'https://controlfile.onrender.com/api/folders/root?name=ControlAudit&pin=1';
    console.log(`📍 Testing: ${url}`);
    console.log(`🔑 Token: ${token.substring(0, 50)}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success:`, data);
      
      // Verificar si la carpeta se creó correctamente
      if (data.folderId) {
        console.log(`📁 Carpeta raíz creada/obtenida: ${data.folderId}`);
        console.log(`📌 Pinneada en taskbar: ${data.pinned ? 'Sí' : 'No'}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Error Response:`, errorText);
      
      // Análisis detallado del error
      if (response.status === 401) {
        console.log('🔍 Error 401 - Problemas de autenticación:');
        if (errorText.includes('AUTH_TOKEN_MISSING')) {
          console.log('  • Token de autenticación faltante');
        } else if (errorText.includes('AUTH_TOKEN_EXPIRED')) {
          console.log('  • Token expirado');
        } else if (errorText.includes('APP_FORBIDDEN')) {
          console.log('  • Usuario no tiene acceso a ControlFile');
          console.log('  • Verificar claim allowedApps en Firebase');
        }
      } else if (response.status === 404) {
        console.log('🔍 Error 404 - Endpoint no encontrado');
        console.log('  • Verificar que /api/folders/root esté implementado en ControlFile');
      }
    }
    
  } catch (error) {
    console.error(`❌ Fetch Error:`, error);
  }
  
  console.groupEnd();
}

// Función para ejecutar todos los tests
export async function runAllTests() {
  console.log('🚀 Starting ControlFile API Tests...');
  
  // Verificar autenticación primero
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ No hay usuario autenticado en Firebase');
    console.log('💡 Debes hacer login primero para ejecutar tests autenticados');
    return;
  }
  
  console.log(`👤 Usuario autenticado: ${user.email}`);
  
  await testControlFileAPI();
  await testFoldersRoot();
  
  console.log('✅ All tests completed!');
}

// Función para testear solo conectividad básica (sin auth)
export async function testBasicConnectivity() {
  console.group('🌐 TESTING BASIC CONNECTIVITY (NO AUTH)');
  
  try {
    const response = await fetch('https://controlfile.onrender.com/api/health');
    console.log(`📊 Health Check Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.text();
      console.log(`✅ ControlFile responde: ${data}`);
    } else {
      console.log(`❌ ControlFile no responde correctamente`);
    }
  } catch (error) {
    console.error(`❌ Error de conectividad: ${error.message}`);
  }
  
  console.groupEnd();
}
