#!/usr/bin/env node

/**
 * Script de corrección estructural de Firestore
 * Reorganiza documentos de apps/{collection}/{doc} a apps/auditoria/users/{uid}/{collection}/{doc}
 * 
 * REQUISITOS:
 *   - serviceAccountKey-controlfile.json del proyecto controlstorage-eb796 en backend/
 *     O variables de entorno FIREBASE_*
 * 
 * USO:
 *   # Modo DRY-RUN (solo lectura, no escribe datos)
 *   DRY_RUN=true node scripts/fix-firestore-structure.js
 * 
 *   # Modo real (mueve documentos)
 *   DRY_RUN=false node scripts/fix-firestore-structure.js
 * 
 *   # Modo real con borrado de origen
 *   DRY_RUN=false DELETE_SOURCE=true node scripts/fix-firestore-structure.js
 * 
 * EJEMPLO:
 *   DRY_RUN=true node scripts/fix-firestore-structure.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const PROJECT_ID = 'controlstorage-eb796';

// Modo DRY-RUN
const DRY_RUN = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';
const DELETE_SOURCE = process.env.DELETE_SOURCE === 'true' || process.env.DELETE_SOURCE === '1';

console.log('═'.repeat(80));
console.log('🔧 CORRECCIÓN ESTRUCTURAL DE FIRESTORE');
console.log('═'.repeat(80));
console.log(`📦 Proyecto: ${PROJECT_ID}`);
console.log(`🔍 Modo: ${DRY_RUN ? 'DRY-RUN (solo lectura)' : 'ESCRITURA (migración real)'}`);
console.log(`🗑️  Borrar origen: ${DELETE_SOURCE ? 'SÍ' : 'NO'}`);
console.log('═'.repeat(80));
console.log('');

// Campos para extraer UID del usuario del documento
const UID_FIELDS = [
  'propietarioId',
  'creadoPor',
  'creadorId',
  'usuarioId',
  'userId',
  'clienteAdminId',
  'uid',
  'ownerId'
];

// Colecciones a procesar (excluyendo las que ya están en la estructura correcta)
const COLLECTIONS_TO_PROCESS = [
  'empresas',
  'sucursales',
  'empleados',
  'auditorias',
  'auditorias_agendadas',
  'formularios',
  'reportes',
  'capacitaciones',
  'files',
  'uploadSessions',
  'accidentes',
  'ausencias',
  'accionesRequeridas'
];

// Inicializar Firebase Admin SDK
let app, db;

try {
  // Cargar credenciales
  const serviceAccountPath = join(__dirname, '..', 'backend', 'serviceAccountKey-controlfile.json');
  
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  } catch (error) {
    // Intentar con variables de entorno
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      console.log('📝 Usando credenciales desde variables de entorno');
      let privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || "",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      };
    } else {
      throw new Error('No se encontraron credenciales');
    }
  }

  // Validar proyecto
  if (serviceAccount.project_id !== PROJECT_ID) {
    console.error(`❌ Error: Las credenciales son del proyecto ${serviceAccount.project_id}`);
    console.error(`   Se esperaba: ${PROJECT_ID}`);
    process.exit(1);
  }

  // Inicializar app
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID
  });

  db = admin.firestore(app);
  console.log('✅ Firebase Admin SDK inicializado:', PROJECT_ID);
  console.log('');

} catch (error) {
  console.error('❌ Error inicializando Firebase Admin SDK:', error.message);
  console.error('');
  console.error('💡 Solución:');
  console.error('   1. Coloca serviceAccountKey-controlfile.json del proyecto controlstorage-eb796 en backend/');
  console.error('   O configura variables de entorno FIREBASE_*');
  process.exit(1);
}

// Estadísticas
const stats = {
  total: 0,
  moved: 0,
  skipped: 0,
  errors: 0,
  deleted: 0,
  collections: {},
  uids: new Set()
};

/**
 * Extrae el UID del usuario de un documento
 */
function extractUserId(docData) {
  if (!docData) return null;
  
  for (const field of UID_FIELDS) {
    if (docData[field] && typeof docData[field] === 'string') {
      const uid = docData[field].trim();
      // Validar que sea un UID válido (al menos 20 caracteres, alfanumérico)
      if (uid.length >= 20 && /^[a-zA-Z0-9]+$/.test(uid)) {
        return uid;
      }
    }
  }
  
  return null;
}

/**
 * Crea explícitamente los documentos intermedios necesarios
 */
async function ensureIntermediateDocuments(uid) {
  if (DRY_RUN) {
    return true;
  }

  try {
    // Crear apps/auditoria/users/{uid} si no existe
    const userRef = db.collection('apps').doc('auditoria')
      .collection('users').doc(uid);
    
    const userSnap = await userRef.get();
    
    if (!userSnap.exists()) {
      // Crear documento mínimo del usuario
      await userRef.set({
        uid: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        structureFixed: true,
        fixedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`   📝 Creado documento intermedio: apps/auditoria/users/${uid}`);
    }
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error creando documentos intermedios para ${uid}:`, error.message);
    return false;
  }
}

/**
 * Procesa una colección específica
 */
async function processCollection(collectionName) {
  console.log(`📦 Procesando colección: ${collectionName}`);
  console.log('─'.repeat(80));
  
  // Estructura actual: apps/{collection}/{doc}
  // Estructura destino: apps/auditoria/users/{uid}/{collection}/{doc}
  const sourceCollectionRef = db.collection(collectionName);  
  let count = 0;
  let moved = 0;
  let skipped = 0;
  let errors = 0;
  let deleted = 0;
  
  try {
    // Obtener todos los documentos de la colección origen
    const snapshot = await sourceCollectionRef.get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Colección vacía o no existe`);
      console.log('');
      return { count: 0, moved: 0, skipped: 0, errors: 0, deleted: 0 };
    }
    
    console.log(`   📊 Total documentos encontrados: ${snapshot.size}`);
    
    // Procesar cada documento
    for (const doc of snapshot.docs) {
      count++;
      const docData = doc.data();
      const docId = doc.id;
      
      // Extraer UID del usuario
      const userId = extractUserId(docData);
      
      if (!userId) {
        skipped++;
        if (count <= 5) {
          console.log(`   ⏭️  [${docId}] Saltado - sin UID válido`);
        }
        continue;
      }
      
      stats.uids.add(userId);
      
      // Ruta destino
      const targetRef = db.collection('apps').doc('auditoria')
        .collection('users').doc(userId)
        .collection(collectionName).doc(docId);
      
      // Verificar si ya existe en destino
      const targetSnap = await targetRef.get();
      if (targetSnap.exists()) {
        skipped++;
        if (count <= 5) {
          console.log(`   ⚠️  [${docId}] Ya existe en destino - saltado`);
        }
        continue;
      }
      
      if (DRY_RUN) {
        console.log(`   🔍 [${docId}] Se movería:`);
        console.log(`      Desde: apps/${collectionName}/${docId}`);
        console.log(`      Hacia: apps/auditoria/users/${userId}/${collectionName}/${docId}`);
        moved++;
      } else {
        try {
          // Asegurar documentos intermedios
          await ensureIntermediateDocuments(userId);
          
          // Mover documento (preservar todos los datos)
          await targetRef.set(docData);
          moved++;
          
          // Opcionalmente borrar origen
          if (DELETE_SOURCE) {
            await doc.ref.delete();
            deleted++;
          }
          
          if (moved <= 10 || moved % 50 === 0) {
            console.log(`   ✅ [${docId}] Movido a apps/auditoria/users/${userId}/${collectionName}/`);
            if (DELETE_SOURCE) {
              console.log(`      🗑️  Origen borrado`);
            }
          }
        } catch (error) {
          errors++;
          console.error(`   ❌ [${docId}] Error: ${error.message}`);
        }
      }
    }
    
    console.log(`   📈 Resultado: ${moved} movidos, ${skipped} saltados, ${errors} errores${DELETE_SOURCE ? `, ${deleted} borrados` : ''}`);
    console.log('');
    
    return { count, moved, skipped, errors, deleted };
    
  } catch (error) {
    console.error(`   ❌ Error procesando colección ${collectionName}:`, error.message);
    console.log('');
    return { count, moved, skipped, errors: errors + 1, deleted };
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
      console.log('   Se moverán documentos en Firestore');
      if (DELETE_SOURCE) {
        console.log('   ⚠️  ADVERTENCIA CRÍTICA: Se borrarán los documentos origen');
      }
      console.log('   Presiona Ctrl+C para cancelar (esperando 5 segundos)...');
      console.log('');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Procesar cada colección
    for (const collectionName of COLLECTIONS_TO_PROCESS) {
      const result = await processCollection(collectionName);
      stats.total += result.count;
      stats.moved += result.moved;
      stats.skipped += result.skipped;
      stats.errors += result.errors;
      stats.deleted += result.deleted;
      stats.collections[collectionName] = result;
    }
    
    // Resumen final
    console.log('═'.repeat(80));
    console.log('📋 RESUMEN FINAL');
    console.log('═'.repeat(80));
    console.log(`   Total documentos procesados: ${stats.total}`);
    console.log(`   Documentos movidos: ${stats.moved}`);
    console.log(`   Documentos saltados: ${stats.skipped}`);
    console.log(`   Errores: ${stats.errors}`);
    if (DELETE_SOURCE) {
      console.log(`   Documentos borrados del origen: ${stats.deleted}`);
    }
    console.log(`   UIDs únicos encontrados: ${stats.uids.size}`);
    console.log('');
    console.log('   Por colección:');
    for (const [collection, result] of Object.entries(stats.collections)) {
      if (result.count > 0 || result.moved > 0) {
        console.log(`   - ${collection}: ${result.moved} movidos, ${result.skipped} saltados`);
      }
    }
    console.log('');
    if (stats.uids.size > 0) {
      console.log('   UIDs encontrados:');
      Array.from(stats.uids).slice(0, 10).forEach(uid => {
        console.log(`   - ${uid}`);
      });
      if (stats.uids.size > 10) {
        console.log(`   ... y ${stats.uids.size - 10} más`);
      }
    }
    console.log('═'.repeat(80));
    
    if (DRY_RUN) {
      console.log('');
      console.log('💡 Este fue un DRY-RUN. Para ejecutar la corrección real:');
      console.log(`   DRY_RUN=false node scripts/fix-firestore-structure.js`);
      if (stats.moved > 0) {
        console.log('');
        console.log('💡 Para borrar documentos origen después de mover:');
        console.log(`   DRY_RUN=false DELETE_SOURCE=true node scripts/fix-firestore-structure.js`);
      }
    } else {
      console.log('');
      console.log('✅ Corrección estructural completada');
      if (!DELETE_SOURCE && stats.moved > 0) {
        console.log('');
        console.log('💡 Los documentos origen aún existen. Para borrarlos:');
        console.log(`   DRY_RUN=false DELETE_SOURCE=true node scripts/fix-firestore-structure.js`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Cerrar conexiones
    if (app) {
      await app.delete();
    }
    process.exit(0);
  }
}

main();

