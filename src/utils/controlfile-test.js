// Utilidades de prueba para ControlFile
// Este archivo contiene funciones para probar la funcionalidad de ControlFile

import { uploadFile, getControlFileBaseUrl } from '../lib/controlfile-upload.js';
import { validateFileForControlFile, buildDownloadUrl } from '../config/controlfile.js';

/**
 * Prueba la conectividad con ControlFile
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<Object>} Resultado de la prueba
 */
export async function testControlFileConnectivity(idToken) {
  try {
    console.log('🧪 Probando conectividad con ControlFile...');
    
    const baseUrl = getControlFileBaseUrl();
    console.log('📍 URL base:', baseUrl);
    
    // Probar endpoint de health
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthOk = healthResponse.ok;
    
    console.log('🏥 Health check:', healthOk ? '✅ OK' : '❌ Error');
    
    return {
      success: true,
      baseUrl,
      healthCheck: healthOk,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error en prueba de conectividad:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Prueba la subida de un archivo a ControlFile
 * @param {File} file - Archivo de prueba
 * @param {string} idToken - Firebase ID token
 * @param {string} parentId - ID de la carpeta destino
 * @returns {Promise<Object>} Resultado de la prueba
 */
export async function testControlFileUpload(file, idToken, parentId = 'test_uploads') {
  try {
    console.log('🧪 Probando subida a ControlFile...');
    
    // Validar archivo
    const validation = validateFileForControlFile(file);
    if (!validation.isValid) {
      throw new Error(`Archivo no válido: ${validation.errors.join(', ')}`);
    }
    
    console.log('✅ Archivo válido:', {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      type: file.type
    });
    
    // Subir archivo
    const uploadResult = await uploadFile(file, idToken, parentId);
    
    if (uploadResult.success) {
      const downloadUrl = buildDownloadUrl(uploadResult.fileId);
      
      console.log('✅ Subida exitosa:', {
        fileId: uploadResult.fileId,
        downloadUrl,
        uploadSessionId: uploadResult.uploadSessionId
      });
      
      return {
        success: true,
        fileId: uploadResult.fileId,
        downloadUrl,
        uploadSessionId: uploadResult.uploadSessionId,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('La subida no fue exitosa');
    }
  } catch (error) {
    console.error('❌ Error en prueba de subida:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Ejecuta todas las pruebas de ControlFile
 * @param {string} idToken - Firebase ID token
 * @param {File} testFile - Archivo de prueba (opcional)
 * @returns {Promise<Object>} Resultado de todas las pruebas
 */
export async function runAllControlFileTests(idToken, testFile = null) {
  console.log('🚀 Iniciando pruebas completas de ControlFile...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  try {
    // Prueba 1: Conectividad
    console.log('\n📡 Prueba 1: Conectividad');
    results.tests.connectivity = await testControlFileConnectivity(idToken);
    
    // Prueba 2: Subida (si hay archivo de prueba)
    if (testFile) {
      console.log('\n📤 Prueba 2: Subida de archivo');
      results.tests.upload = await testControlFileUpload(testFile, idToken, 'test_uploads');
    }
    
    // Resumen
    const allTestsPassed = Object.values(results.tests).every(test => test.success);
    results.summary = {
      totalTests: Object.keys(results.tests).length,
      passedTests: Object.values(results.tests).filter(test => test.success).length,
      allPassed: allTestsPassed
    };
    
    console.log('\n📊 Resumen de pruebas:');
    console.log(`Total: ${results.summary.totalTests}`);
    console.log(`Pasadas: ${results.summary.passedTests}`);
    console.log(`Estado: ${results.summary.allPassed ? '✅ TODAS PASARON' : '❌ ALGUNAS FALLARON'}`);
    
    return results;
  } catch (error) {
    console.error('❌ Error ejecutando pruebas:', error);
    results.error = error.message;
    return results;
  }
}

/**
 * Crea un archivo de prueba para las pruebas
 * @param {string} name - Nombre del archivo
 * @param {string} type - Tipo MIME
 * @param {number} size - Tamaño en bytes
 * @returns {File} Archivo de prueba
 */
export function createTestFile(name = 'test.txt', type = 'text/plain', size = 1024) {
  const content = 'Este es un archivo de prueba para ControlFile. '.repeat(Math.ceil(size / 50));
  const blob = new Blob([content], { type });
  
  return new File([blob], name, {
    type,
    lastModified: Date.now()
  });
}

export default {
  testControlFileConnectivity,
  testControlFileUpload,
  runAllControlFileTests,
  createTestFile
};
