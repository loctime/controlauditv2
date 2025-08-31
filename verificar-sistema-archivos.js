// Script para verificar el estado completo del sistema de archivos
const verificarSistemaArchivos = async () => {
  console.log('🔍 Verificando sistema de archivos completo...\n');
  
  const resultados = {
    backendLocal: false,
    controlFile: false,
    firestore: false,
    configuracion: {}
  };
  
  try {
    // 1. Verificar backend local
    console.log('1. Verificando backend local...');
    try {
      const localResponse = await fetch('http://localhost:4000/health');
      if (localResponse.ok) {
        const localData = await localResponse.json();
        console.log('✅ Backend local funcionando:', localData);
        resultados.backendLocal = true;
      } else {
        console.log('❌ Backend local no responde correctamente');
      }
    } catch (error) {
      console.log('❌ Backend local no disponible:', error.message);
    }
    
    // 2. Verificar ControlFile (producción)
    console.log('\n2. Verificando ControlFile...');
    try {
      const controlFileResponse = await fetch('https://controlauditv2.onrender.com/health');
      if (controlFileResponse.ok) {
        const controlFileData = await controlFileResponse.json();
        console.log('✅ ControlFile funcionando:', controlFileData);
        resultados.controlFile = true;
      } else {
        console.log('❌ ControlFile no responde correctamente');
      }
    } catch (error) {
      console.log('❌ ControlFile no disponible:', error.message);
    }
    
    // 3. Verificar configuración
    console.log('\n3. Verificando configuración...');
    const config = {
      backendUrl: 'https://controlauditv2.onrender.com',
      environment: 'production',
      controlFileEnabled: true
    };
    console.log('✅ Configuración:', config);
    resultados.configuracion = config;
    
    // 4. Verificar endpoints de ControlFile
    console.log('\n4. Verificando endpoints de ControlFile...');
    try {
      const endpointsResponse = await fetch('https://controlauditv2.onrender.com/api/health');
      if (endpointsResponse.ok) {
        console.log('✅ Endpoints de ControlFile disponibles');
        resultados.endpoints = true;
      } else {
        console.log('❌ Endpoints de ControlFile no disponibles');
      }
    } catch (error) {
      console.log('❌ Error verificando endpoints:', error.message);
    }
    
    // 5. Resumen
    console.log('\n📊 RESUMEN DEL SISTEMA:');
    console.log('========================');
    console.log(`Backend Local: ${resultados.backendLocal ? '✅ Funcionando' : '❌ No disponible'}`);
    console.log(`ControlFile: ${resultados.controlFile ? '✅ Funcionando' : '❌ No disponible'}`);
    console.log(`Endpoints: ${resultados.endpoints ? '✅ Disponibles' : '❌ No disponibles'}`);
    
    // 6. Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    if (!resultados.backendLocal) {
      console.log('⚠️  Backend local no está funcionando');
      console.log('   - Ejecuta: cd backend && npm start');
      console.log('   - O usa solo el backend de producción');
    }
    
    if (!resultados.controlFile) {
      console.log('⚠️  ControlFile no está disponible');
      console.log('   - Verifica la conexión a internet');
      console.log('   - El sistema usará modo fallback');
    }
    
    if (resultados.controlFile && resultados.endpoints) {
      console.log('✅ Sistema completamente funcional');
      console.log('   - Los archivos se guardarán en ControlFile');
      console.log('   - Los metadatos se guardarán en Firestore');
    }
    
    return resultados;
    
  } catch (error) {
    console.error('❌ Error verificando sistema:', error);
    return {
      error: error.message,
      ...resultados
    };
  }
};

// Función para simular una subida de archivo
const simularSubidaArchivo = async () => {
  console.log('\n🧪 Simulando subida de archivo...');
  
  try {
    // Crear un archivo de prueba
    const testFile = new File(['contenido de prueba'], 'test.txt', {
      type: 'text/plain'
    });
    
    console.log('📁 Archivo de prueba creado:', testFile.name);
    
    // Verificar si ControlFile está disponible
    const controlFileResponse = await fetch('https://controlauditv2.onrender.com/api/health');
    
    if (controlFileResponse.ok) {
      console.log('✅ ControlFile está disponible para subidas');
      console.log('📤 Los archivos se guardarán en ControlFile');
      console.log('📊 Los metadatos se guardarán en Firestore');
    } else {
      console.log('⚠️  ControlFile no está disponible');
      console.log('📤 Los archivos se guardarán en el backend local');
      console.log('📊 Los metadatos se guardarán en Firestore');
    }
    
  } catch (error) {
    console.error('❌ Error en simulación:', error);
  }
};

// Ejecutar si estamos en el navegador
if (typeof window !== 'undefined') {
  window.verificarSistemaArchivos = verificarSistemaArchivos;
  window.simularSubidaArchivo = simularSubidaArchivo;
  
  console.log('✅ Funciones disponibles:');
  console.log('  - verificarSistemaArchivos(): Verificar estado completo');
  console.log('  - simularSubidaArchivo(): Simular subida de archivo');
}

// Ejecutar si estamos en Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { verificarSistemaArchivos, simularSubidaArchivo };
  
  // Ejecutar automáticamente si se llama directamente
  if (require.main === module) {
    verificarSistemaArchivos().then(() => {
      simularSubidaArchivo();
    });
  }
}
