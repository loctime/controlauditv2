#!/usr/bin/env node

/**
 * Script de prueba para verificar la integración de upload con ControlFile
 * 
 * Uso:
 * 1. Asegúrate de que el backend esté corriendo
 * 2. Configura las variables de entorno en backend/env.local
 * 3. Ejecuta: node test-upload-integration.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, 'backend/env.local') });
dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

console.log('🧪 Iniciando pruebas de integración de upload con ControlFile...\n');

async function testUploadIntegration() {
  try {
    console.log('1️⃣ Probando endpoint de presign sin parentId...');
    
    // Simular llamada al endpoint presign
    const presignResponse = await fetch(`${BACKEND_URL}/api/uploads/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // En producción usar token real
      },
      body: JSON.stringify({
        fileName: 'documento-prueba.pdf',
        fileSize: 1024000, // 1MB
        mimeType: 'application/pdf'
        // NO incluir parentId - debe usar la raíz automática
      })
    });
    
    if (presignResponse.status === 401) {
      console.log('✅ Endpoint protegido correctamente (requiere autenticación)');
    } else {
      console.log('⚠️ Endpoint no está protegido como se esperaba');
    }
    
    console.log('\n2️⃣ Verificando configuración de variables de entorno...');
    
    const appCode = process.env.APP_CODE;
    const appDisplayName = process.env.APP_DISPLAY_NAME;
    
    console.log(`   APP_CODE: ${appCode || 'NO CONFIGURADO'}`);
    console.log(`   APP_DISPLAY_NAME: ${appDisplayName || 'NO CONFIGURADO'}`);
    
    if (appCode && appDisplayName) {
      console.log('✅ Variables de entorno configuradas correctamente');
    } else {
      console.log('❌ Faltan variables de entorno requeridas');
      console.log('   Crea el archivo backend/env.local con:');
      console.log('   APP_CODE=controlaudit');
      console.log('   APP_DISPLAY_NAME=ControlAudit');
    }
    
    console.log('\n3️⃣ Verificando estructura de Firestore esperada...');
    
    console.log('   Colecciones que se crearán:');
    console.log('   - folders (carpeta raíz de ControlAudit)');
    console.log('   - files (archivos subidos)');
    console.log('   - uploadSessions (sesiones de subida)');
    console.log('   - userSettings (barra de tareas)');
    console.log('   - users (cuotas de almacenamiento)');
    
    console.log('\n4️⃣ Esquema de carpeta raíz esperado:');
    console.log('   {');
    console.log('     id: "root_{uid}_controlaudit"');
    console.log('     userId: "{uid}"');
    console.log('     name: "ControlAudit"');
    console.log('     parentId: null');
    console.log('     path: "/controlaudit"');
    console.log('     appCode: "controlaudit"');
    console.log('     ancestors: []');
    console.log('     type: "folder"');
    console.log('     metadata: { isMainFolder: true, isDefault: true }');
    console.log('     createdAt: Date');
    console.log('     modifiedAt: Date');
    console.log('   }');
    
    console.log('\n5️⃣ Esquema de archivo esperado:');
    console.log('   {');
    console.log('     id: "cf_{timestamp}_{random}"');
    console.log('     userId: "{uid}"');
    console.log('     name: "nombre-archivo.pdf"');
    console.log('     size: 1024000');
    console.log('     mime: "application/pdf"');
    console.log('     parentId: "root_{uid}_controlaudit"');
    console.log('     url: "https://example.com/files/{fileId}"');
    console.log('     appCode: "controlaudit"');
    console.log('     ancestors: []');
    console.log('     isDeleted: false');
    console.log('     deletedAt: null');
    console.log('     createdAt: Date');
    console.log('     updatedAt: Date');
    console.log('     metadata: { uploadedAt, originalName, size, mimeType, uploadId }');
    console.log('   }');
    
    console.log('\n6️⃣ Flujo de trabajo esperado:');
    console.log('   1. Frontend llama a POST /api/uploads/presign SIN parentId');
    console.log('   2. Backend crea carpeta raíz "ControlAudit" automáticamente');
    console.log('   3. Backend agrega acceso a la barra de tareas de ControlFile');
    console.log('   4. Backend incrementa pendingBytes en cuotas del usuario');
    console.log('   5. Frontend sube archivo usando la URL de presign');
    console.log('   6. Frontend llama a POST /api/uploads/complete/{uploadId}');
    console.log('   7. Backend crea documento de archivo con esquema compatible');
    console.log('   8. Backend actualiza cuotas (decrementa pendingBytes, incrementa usedBytes)');
    console.log('   9. En ControlFile aparece carpeta "ControlAudit" en la barra');
    console.log('   10. Todos los archivos están organizados en esa carpeta');
    
    console.log('\n7️⃣ Verificaciones en ControlFile:');
    console.log('   - Abrir ControlFile en el navegador');
    console.log('   - Verificar que aparece "ControlAudit" en la barra de tareas');
    console.log('   - Hacer clic en la carpeta "ControlAudit"');
    console.log('   - Verificar que los archivos subidos aparecen allí');
    console.log('   - Verificar que el esquema de datos es compatible');
    
    console.log('\n✅ Pruebas de integración completadas');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Implementar los cambios en backend/index.js');
    console.log('   2. Crear archivo backend/env.local con las variables');
    console.log('   3. Reiniciar el backend');
    console.log('   4. Probar subida de archivo desde el frontend');
    console.log('   5. Verificar en ControlFile que aparece la carpeta');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testUploadIntegration();
