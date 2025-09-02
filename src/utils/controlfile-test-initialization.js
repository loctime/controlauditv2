// Archivo de prueba para verificar la inicialización de ControlAudit
// Este archivo prueba que se cree la carpeta raíz y se pinee en el taskbar

import { 
  initializeControlAudit,
  getOrCreateControlAuditRootFolder,
  pinControlAuditToTaskbar,
  subirArchivoARaiz
} from '../lib/controlfile-upload';

/**
 * 🧪 PRUEBA 1: Inicialización completa de ControlAudit
 * Verifica que se cree la carpeta raíz y se pinee en taskbar
 */
export async function testControlAuditInitialization() {
  try {
    console.log('🧪 [TEST] Iniciando prueba de inicialización de ControlAudit...');
    
    // 1. Inicializar ControlAudit (carpeta raíz + taskbar)
    const rootFolder = await initializeControlAudit();
    
    console.log('✅ [TEST] ControlAudit inicializado:', {
      folderId: rootFolder.folderId,
      name: rootFolder.name,
      path: rootFolder.path
    });
    
    // 2. Verificar que la carpeta raíz existe
    const verifyFolder = await getOrCreateControlAuditRootFolder();
    
    if (verifyFolder.folderId === rootFolder.folderId) {
      console.log('✅ [TEST] Carpeta raíz verificada correctamente');
    } else {
      console.error('❌ [TEST] Error: IDs de carpeta no coinciden');
      return false;
    }
    
    // 3. Verificar que está pineado en taskbar
    const taskbarItem = await pinControlAuditToTaskbar(rootFolder.folderId);
    
    if (taskbarItem) {
      console.log('✅ [TEST] ControlAudit pineado en taskbar:', taskbarItem);
    } else {
      console.warn('⚠️ [TEST] No se pudo verificar taskbar');
    }
    
    console.log('🎉 [TEST] Prueba de inicialización COMPLETADA exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ [TEST] Error en prueba de inicialización:', error);
    return false;
  }
}

/**
 * 🧪 PRUEBA 2: Subida de archivo con inicialización automática
 * Verifica que se suba un archivo con parentId correcto
 */
export async function testFileUploadWithInitialization() {
  try {
    console.log('🧪 [TEST] Iniciando prueba de subida con inicialización...');
    
    // Crear un archivo de prueba
    const testContent = 'Este es un archivo de prueba para ControlAudit';
    const testFile = new File([testContent], 'test_controlaudit.txt', { 
      type: 'text/plain' 
    });
    
    console.log('📁 [TEST] Archivo de prueba creado:', testFile.name);
    
    // Subir archivo (esto debería inicializar ControlAudit automáticamente)
    const result = await subirArchivoARaiz(testFile);
    
    console.log('✅ [TEST] Archivo subido exitosamente:', {
      fileId: result.fileId,
      parentId: result.parentId,
      folderName: result.folderName
    });
    
    // Verificar que el parentId no sea null
    if (result.parentId && result.parentId !== 'null') {
      console.log('✅ [TEST] parentId correcto:', result.parentId);
    } else {
      console.error('❌ [TEST] Error: parentId es null o undefined');
      return false;
    }
    
    console.log('🎉 [TEST] Prueba de subida COMPLETADA exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ [TEST] Error en prueba de subida:', error);
    return false;
  }
}

/**
 * 🧪 PRUEBA 3: Verificación completa del sistema
 * Ejecuta todas las pruebas en secuencia
 */
export async function runAllTests() {
  try {
    console.log('🚀 [TEST] Iniciando suite completa de pruebas de ControlAudit...');
    
    // Prueba 1: Inicialización
    const initResult = await testControlAuditInitialization();
    if (!initResult) {
      console.error('❌ [TEST] Prueba de inicialización FALLÓ');
      return false;
    }
    
    console.log('⏳ [TEST] Esperando 2 segundos antes de la siguiente prueba...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Prueba 2: Subida de archivo
    const uploadResult = await testFileUploadWithInitialization();
    if (!uploadResult) {
      console.error('❌ [TEST] Prueba de subida FALLÓ');
      return false;
    }
    
    console.log('🎉 [TEST] TODAS las pruebas COMPLETADAS exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ [TEST] Error en suite de pruebas:', error);
    return false;
  }
}

/**
 * 📋 INSTRUCCIONES DE USO:
 * 
 * 1. Para probar solo la inicialización:
 *    const success = await testControlAuditInitialization();
 * 
 * 2. Para probar solo la subida:
 *    const success = await testFileUploadWithInitialization();
 * 
 * 3. Para ejecutar todas las pruebas:
 *    const success = await runAllTests();
 * 
 * 🎯 RESULTADO ESPERADO:
 * - Se crea la carpeta raíz "ControlAudit" en ControlFile
 * - Se pine la carpeta en la barra de tareas del usuario
 * - Los archivos se suben con parentId correcto (no null)
 * - La carpeta aparece en https://files.controldoc.app
 * - Al hacer clic en la carpeta del taskbar, se abre en ControlFile
 * 
 * 🔍 VERIFICACIÓN MANUAL:
 * 1. Ir a https://files.controldoc.app
 * 2. Buscar la carpeta "ControlAudit"
 * 3. Verificar que contenga el archivo de prueba
 * 4. Verificar que el archivo tenga parentId correcto
 */
