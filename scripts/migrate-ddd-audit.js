#!/usr/bin/env node

/**
 * Script de migración de datos de auditoría
 * Migra datos del usuario SANABRIA desde Firebase viejo (auditoria-f9fc4) 
 * al Firebase nuevo ControlFile (controlstorage-eb796)
 * 
 * REQUISITOS:
 *   1. serviceAccountKey.json del proyecto auditoria-f9fc4 en backend/
 *   2. serviceAccountKey-controlfile.json del proyecto controlstorage-eb796 en backend/
 *      O variables de entorno TARGET_FIREBASE_*
 *   3. newUserId debe ser el UID del usuario en Firebase Auth ControlFile
 * 
 * USO:
 *   # Modo DRY-RUN (solo lectura, no escribe datos)
 *   DRY_RUN=true node scripts/migrate-sanabria-audit.js <newUserId>
 * 
 *   # Modo real (escribe datos en destino)
 *   DRY_RUN=false node scripts/migrate-sanabria-audit.js <newUserId>
 * 
 * EJEMPLO:
 *   DRY_RUN=true node scripts/migrate-sanabria-audit.js abc123xyz789
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const USER_EMAIL = 'ddd@gmail.com';
const OLD_UID = 'M80UldJYWkVBLtzM0meo6Mlj4TJ2';
const SOURCE_PROJECT_ID = 'auditoria-f9fc4';
const TARGET_PROJECT_ID = 'controlstorage-eb796';

// Modo DRY-RUN
const DRY_RUN = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';

// Obtener newUserId del argumento
const newUserId = process.argv[2];

if (!newUserId) {
  console.error('❌ Error: Debes proporcionar el newUserId como argumento');
  console.log('📋 Uso: DRY_RUN=true node scripts/migrate-sanabria-audit.js <newUserId>');
  console.log('📋 Ejemplo: DRY_RUN=true node scripts/migrate-sanabria-audit.js abc123xyz');
  process.exit(1);
}

console.log('═'.repeat(80));
console.log('🚀 MIGRACIÓN DE DATOS DE AUDITORÍA - USUARIO SANABRIA');
console.log('═'.repeat(80));
console.log(`📧 Email: ${USER_EMAIL}`);
console.log(`🆔 UID viejo: ${OLD_UID}`);
console.log(`🆔 UID nuevo: ${newUserId}`);
console.log(`📦 Proyecto origen: ${SOURCE_PROJECT_ID}`);
console.log(`📦 Proyecto destino: ${TARGET_PROJECT_ID}`);
console.log(`🔍 Modo: ${DRY_RUN ? 'DRY-RUN (solo lectura)' : 'ESCRITURA (migración real)'}`);
console.log('═'.repeat(80));
console.log('');

// Inicializar Firebase Admin Apps
let sourceApp, targetApp;
let sourceDb, targetDb;

try {
  // Cargar credenciales del Firebase viejo (origen)
  const sourceServiceAccountPath = join(__dirname, '..', 'backend', 'serviceAccountKey.json');
  const sourceServiceAccount = JSON.parse(readFileSync(sourceServiceAccountPath, 'utf8'));
  
  // Validar que sea el proyecto correcto
  if (sourceServiceAccount.project_id !== SOURCE_PROJECT_ID) {
    console.error(`❌ Error: El serviceAccountKey.json es del proyecto ${sourceServiceAccount.project_id}`);
    console.error(`   Se esperaba: ${SOURCE_PROJECT_ID}`);
    console.error('');
    console.error('💡 Solución: Necesitas un serviceAccountKey.json del proyecto auditoria-f9fc4');
    process.exit(1);
  }

  // Inicializar app origen
  sourceApp = admin.initializeApp({
    credential: admin.credential.cert(sourceServiceAccount),
    projectId: SOURCE_PROJECT_ID
  }, 'source');

  sourceDb = admin.firestore(sourceApp);
  console.log('✅ Firebase Admin SDK origen inicializado:', SOURCE_PROJECT_ID);

  // Cargar credenciales del Firebase nuevo (destino)
  // NOTA: Necesitas un archivo separado para el proyecto destino
  // Por ahora intentamos usar variables de entorno o un archivo alternativo
  const targetServiceAccountPath = join(__dirname, '..', 'backend', 'serviceAccountKey-controlfile.json');
  
  let targetServiceAccount;
  try {
    targetServiceAccount = JSON.parse(readFileSync(targetServiceAccountPath, 'utf8'));
  } catch (error) {
    // Intentar con variables de entorno
    if (process.env.TARGET_FIREBASE_PROJECT_ID && 
        process.env.TARGET_FIREBASE_CLIENT_EMAIL && 
        process.env.TARGET_FIREBASE_PRIVATE_KEY) {
      console.log('📝 Usando credenciales de destino desde variables de entorno');
      let privateKey = process.env.TARGET_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      targetServiceAccount = {
        type: "service_account",
        project_id: process.env.TARGET_FIREBASE_PROJECT_ID,
        private_key_id: process.env.TARGET_FIREBASE_PRIVATE_KEY_ID || "",
        private_key: privateKey,
        client_email: process.env.TARGET_FIREBASE_CLIENT_EMAIL,
        client_id: process.env.TARGET_FIREBASE_CLIENT_ID || "",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.TARGET_FIREBASE_CLIENT_EMAIL}`
      };
    } else {
      throw new Error('No se encontraron credenciales para el proyecto destino');
    }
  }

  // Validar proyecto destino
  if (targetServiceAccount.project_id !== TARGET_PROJECT_ID) {
    console.error(`❌ Error: Las credenciales destino son del proyecto ${targetServiceAccount.project_id}`);
    console.error(`   Se esperaba: ${TARGET_PROJECT_ID}`);
    process.exit(1);
  }

  // Inicializar app destino
  targetApp = admin.initializeApp({
    credential: admin.credential.cert(targetServiceAccount),
    projectId: TARGET_PROJECT_ID
  }, 'target');

  targetDb = admin.firestore(targetApp);
  console.log('✅ Firebase Admin SDK destino inicializado:', TARGET_PROJECT_ID);
  console.log('');

} catch (error) {
  console.error('❌ Error inicializando Firebase Admin SDK:', error.message);
  console.error('');
  console.error('💡 Solución:');
  console.error('   1. Coloca serviceAccountKey.json del proyecto auditoria-f9fc4 en backend/');
  console.error('   2. Coloca serviceAccountKey-controlfile.json del proyecto controlstorage-eb796 en backend/');
  console.error('   O configura variables de entorno TARGET_FIREBASE_*');
  process.exit(1);
}

// Campos para filtrar por email del usuario
const EMAIL_FIELDS = [
  'propietarioEmail',
  'creadoPorEmail',
  'creadorEmail',
  'emailContacto',
  'email',
  'emailUsuario',
  'usuarioEmail'
];

// Campos para filtrar por UID viejo (como respaldo)
const UID_FIELDS = [
  'propietarioId',
  'creadoPor',
  'creadorId',
  'usuarioId',
  'userId',
  'clienteAdminId'
];

// Colecciones a migrar
const COLLECTIONS_TO_MIGRATE = [
  'empresas',
  'sucursales',
  'empleados',
  'auditorias',
  'auditorias_agendadas',
  'formularios',
  'reportes',
  'capacitaciones',
  'files',
  'uploadSessions'
];

// Estadísticas
const stats = {
  total: 0,
  migrated: 0,
  skipped: 0,
  errors: 0,
  collections: {}
};

/**
 * Verifica si un documento pertenece al usuario por email o UID
 */
function belongsToUser(docData) {
  if (!docData) return false;
  
  // Verificar por email
  for (const field of EMAIL_FIELDS) {
    if (docData[field] === USER_EMAIL) {
      return true;
    }
  }
  
  // Verificar por UID viejo (como respaldo)
  for (const field of UID_FIELDS) {
    if (docData[field] === OLD_UID) {
      return true;
    }
  }
  
  return false;
}

/**
 * Migra una colección específica
 */
async function migrateCollection(collectionName) {
  console.log(`📦 Migrando colección: ${collectionName}`);
  console.log('─'.repeat(80));
  
  const sourceRef = sourceDb.collection(collectionName);
  const sourcePath = `${collectionName}`;
  console.log(`   [READ] ${sourcePath} (proyecto: ${SOURCE_PROJECT_ID})`);
  
  const targetRef = targetDb
    .collection('apps')
    .doc('auditoria')
    .collection('users')
    .doc(newUserId)
    .collection(collectionName);
  const targetBasePath = `apps/auditoria/users/${newUserId}/${collectionName}`;
  console.log(`   [TARGET BASE PATH] ${targetBasePath}`);
  
  let count = 0;
  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  
  try {
    // Obtener todos los documentos de la colección origen
    const snapshot = await sourceRef.get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Colección vacía o no existe`);
      console.log('');
      return { count: 0, migrated: 0, skipped: 0, errors: 0 };
    }
    
    console.log(`   📊 Total documentos encontrados: ${snapshot.size}`);
    
    // Procesar cada documento
    for (const doc of snapshot.docs) {
      count++;
      const docData = doc.data();
      const docId = doc.id;
      
      // Verificar si el documento pertenece al usuario
      if (!belongsToUser(docData)) {
        skipped++;
        if (count <= 5) {
          // Mostrar por qué se saltó (útil para debugging)
          const emailFields = EMAIL_FIELDS.filter(f => docData[f]);
          const uidFields = UID_FIELDS.filter(f => docData[f] === OLD_UID);
          const reason = emailFields.length > 0 
            ? `email=${docData[emailFields[0]]}` 
            : uidFields.length > 0 
              ? `uid=${docData[uidFields[0]]}` 
              : 'sin campos de identificación';
          console.log(`   ⏭️  [${docId}] Saltado - ${reason}`);
        }
        continue;
      }
      
      // Preparar datos (preservar estructura completa)
      const dataToMigrate = { ...docData };
      
      // Construir path completo de destino
      const targetPath = `apps/auditoria/users/${newUserId}/${collectionName}/${docId}`;
      
      if (DRY_RUN) {
        console.log(`   [DRY-RUN WRITE] ${targetPath}`);
        console.log(`   🔍 [${docId}] Se migraría:`);
        console.log(`      ${JSON.stringify(Object.keys(dataToMigrate)).substring(0, 100)}...`);
        migrated++;
      } else {
        try {
          // Log antes de escribir
          console.log(`   [WRITE] ${targetPath}`);
          
          // Usar set() con el mismo ID del documento
          const targetDocRef = targetRef.doc(docId);
          await targetDocRef.set(dataToMigrate);
          migrated++;
          
          // Log después de escribir exitosamente
          console.log(`   [WRITE OK] ${collectionName}/${docId}`);
          
          if (migrated <= 10 || migrated % 50 === 0) {
            console.log(`   ✅ [${docId}] Migrado`);
          }
        } catch (error) {
          errors++;
          console.error(`   [WRITE ERROR] ${collectionName}/${docId} -> ${error.message}`);
          console.error(`   ❌ [${docId}] Error: ${error.message}`);
        }
      }
    }
    
    console.log(`   📈 Resultado: ${migrated} migrados, ${skipped} saltados, ${errors} errores`);
    console.log('');
    
    return { count, migrated, skipped, errors };
    
  } catch (error) {
    console.error(`   ❌ Error procesando colección ${collectionName}:`, error.message);
    console.log('');
    return { count, migrated, skipped, errors: errors + 1 };
  }
}

/**
 * Crea el documento meta del usuario
 */
async function createMetaDocument() {
  console.log('📝 Creando documento meta del usuario');
  console.log('─'.repeat(80));
  
  const metaRef = targetDb
    .collection('apps')
    .doc('auditoria')
    .collection('users')
    .doc(newUserId)
    .collection('meta');
  const metaDoc = {
    email: USER_EMAIL,
    role: 'supermax',
    migratedFrom: {
      projectId: SOURCE_PROJECT_ID,
      oldUid: OLD_UID
    },
    migratedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  // Construir path completo de destino para documento meta
  const metaPath = `apps/auditoria/users/${newUserId}/meta/user`;
  
  if (DRY_RUN) {
    console.log(`   [DRY-RUN WRITE] ${metaPath}`);
    console.log('   🔍 Se crearía documento meta:');
    console.log(`      ${JSON.stringify(metaDoc, null, 2)}`);
    console.log('');
    return true;
  } else {
    try {
      // Log antes de escribir
      console.log(`   [WRITE] ${metaPath}`);
      
      await metaRef.doc('user').set(metaDoc);
      
      // Log después de escribir exitosamente
      console.log(`   [WRITE OK] meta/user`);
      console.log('   ✅ Documento meta creado');
      console.log('');
      return true;
    } catch (error) {
      console.error(`   [WRITE ERROR] meta/user -> ${error.message}`);
      console.error(`   ❌ Error creando documento meta: ${error.message}`);
      console.log('');
      return false;
    }
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    // Confirmación antes de ejecutar en modo real
    if (!DRY_RUN) {
      console.log('⚠️  ADVERTENCIA: Modo ESCRITURA activado');
      console.log('   Se escribirán datos en el Firebase destino');
      console.log('   Presiona Ctrl+C para cancelar (esperando 5 segundos)...');
      console.log('');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Crear documento meta
    await createMetaDocument();
    
    // Migrar cada colección
    for (const collectionName of COLLECTIONS_TO_MIGRATE) {
      const result = await migrateCollection(collectionName);
      stats.total += result.count;
      stats.migrated += result.migrated;
      stats.skipped += result.skipped;
      stats.errors += result.errors;
      stats.collections[collectionName] = result;
    }
    
    // Resumen final
    console.log('═'.repeat(80));
    console.log('📋 RESUMEN FINAL');
    console.log('═'.repeat(80));
    console.log(`   Total documentos procesados: ${stats.total}`);
    console.log(`   Documentos migrados: ${stats.migrated}`);
    console.log(`   Documentos saltados: ${stats.skipped}`);
    console.log(`   Errores: ${stats.errors}`);
    console.log('');
    console.log('   Por colección:');
    for (const [collection, result] of Object.entries(stats.collections)) {
      if (result.count > 0 || result.migrated > 0) {
        console.log(`   - ${collection}: ${result.migrated} migrados, ${result.skipped} saltados`);
      }
    }
    console.log('═'.repeat(80));
    
    if (DRY_RUN) {
      console.log('');
      console.log('💡 Este fue un DRY-RUN. Para ejecutar la migración real:');
      console.log(`   DRY_RUN=false node scripts/migrate-sanabria-audit.js ${newUserId}`);
    } else {
      console.log('');
      console.log('✅ Migración completada');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Cerrar conexiones
    if (sourceApp) {
      await sourceApp.delete();
    }
    if (targetApp) {
      await targetApp.delete();
    }
    process.exit(0);
  }
}

main();

