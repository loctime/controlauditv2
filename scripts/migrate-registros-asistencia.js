/**
 * Script de migración: Registros de Asistencia
 * 
 * Migra datos existentes de capacitacion.registroAsistencia a la nueva colección registrosAsistencia
 * 
 * Uso:
 * node scripts/migrate-registros-asistencia.js [userId]
 * 
 * Si no se proporciona userId, migra todos los usuarios
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configuración Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Obtiene todas las capacitaciones de un usuario
 */
async function getCapacitaciones(userId) {
  const capacitacionesRef = collection(db, 'apps', 'auditoria', 'users', userId, 'capacitaciones');
  const snapshot = await getDocs(capacitacionesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Migra registroAsistencia de una capacitación a la nueva colección
 */
async function migrarRegistroAsistencia(userId, capacitacion) {
  // Verificar si ya tiene registroAsistencia
  if (!capacitacion.registroAsistencia) {
    console.log(`  ⏭️  Capacitación ${capacitacion.id} no tiene registroAsistencia, omitiendo...`);
    return null;
  }

  const registroAsistencia = capacitacion.registroAsistencia;
  
  // Verificar si ya fue migrado (buscar registros existentes)
  const registrosRef = collection(db, 'apps', 'auditoria', 'users', userId, 'registrosAsistencia');
  const q = query(registrosRef, where('capacitacionId', '==', capacitacion.id));
  const existingSnapshot = await getDocs(q);
  
  if (existingSnapshot.size > 0) {
    console.log(`  ⏭️  Capacitación ${capacitacion.id} ya tiene registros migrados, omitiendo...`);
    return null;
  }

  // Preparar datos del nuevo registro
  const nuevoRegistro = {
    capacitacionId: capacitacion.id,
    empleadoIds: registroAsistencia.empleados || [],
    imagenIds: registroAsistencia.imagenes?.map(img => img.id || img.fileId) || [],
    imagenes: registroAsistencia.imagenes || [],
    fecha: registroAsistencia.fecha || registroAsistencia.creadoEn || Timestamp.now(),
    creadoPor: registroAsistencia.creadoPor || userId,
    createdAt: registroAsistencia.creadoEn || registroAsistencia.fecha || Timestamp.now(),
    appId: 'auditoria',
    // Metadata de migración
    migradoDesde: 'capacitacion.registroAsistencia',
    fechaMigracion: Timestamp.now()
  };

  // Crear documento en nueva colección
  const batch = writeBatch(db);
  const nuevoRegistroRef = doc(registrosRef);
  batch.set(nuevoRegistroRef, nuevoRegistro);

  await batch.commit();

  console.log(`  ✅ Migrado registro para capacitación ${capacitacion.id}:`);
  console.log(`     - Empleados: ${nuevoRegistro.empleadoIds.length}`);
  console.log(`     - Imágenes: ${nuevoRegistro.imagenes.length}`);
  
  return nuevoRegistroRef.id;
}

/**
 * Obtiene todos los usuarios del sistema
 */
async function getAllUsers() {
  const usersRef = collection(db, 'apps', 'auditoria', 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => doc.id);
}

/**
 * Migra registros de asistencia para un usuario específico
 */
async function migrarUsuario(userId) {
  console.log(`\n📋 Migrando registros para usuario: ${userId}`);
  
  try {
    const capacitaciones = await getCapacitaciones(userId);
    console.log(`   Encontradas ${capacitaciones.length} capacitaciones`);
    
    let migradas = 0;
    let omitidas = 0;
    
    for (const capacitacion of capacitaciones) {
      const resultado = await migrarRegistroAsistencia(userId, capacitacion);
      if (resultado) {
        migradas++;
      } else {
        omitidas++;
      }
    }
    
    console.log(`\n✅ Usuario ${userId}:`);
    console.log(`   - Registros migrados: ${migradas}`);
    console.log(`   - Omitidos: ${omitidas}`);
    
    return { migradas, omitidas };
  } catch (error) {
    console.error(`❌ Error migrando usuario ${userId}:`, error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const userId = process.argv[2];
  
  // Autenticación (opcional, solo si es necesario)
  if (process.env.FIREBASE_ADMIN_EMAIL && process.env.FIREBASE_ADMIN_PASSWORD) {
    try {
      await signInWithEmailAndPassword(
        auth,
        process.env.FIREBASE_ADMIN_EMAIL,
        process.env.FIREBASE_ADMIN_PASSWORD
      );
      console.log('✅ Autenticado correctamente');
    } catch (error) {
      console.warn('⚠️  No se pudo autenticar, continuando sin autenticación...');
    }
  }
  
  console.log('🚀 Iniciando migración de registros de asistencia...\n');
  
  try {
    if (userId) {
      // Migrar usuario específico
      await migrarUsuario(userId);
    } else {
      // Migrar todos los usuarios
      const users = await getAllUsers();
      console.log(`📊 Encontrados ${users.length} usuarios\n`);
      
      let totalMigradas = 0;
      let totalOmitidas = 0;
      
      for (const user of users) {
        const resultado = await migrarUsuario(user);
        totalMigradas += resultado.migradas;
        totalOmitidas += resultado.omitidas;
      }
      
      console.log('\n' + '='.repeat(50));
      console.log('📊 RESUMEN TOTAL:');
      console.log(`   - Registros migrados: ${totalMigradas}`);
      console.log(`   - Omitidos: ${totalOmitidas}`);
      console.log('='.repeat(50));
    }
    
    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
