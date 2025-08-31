// Script de prueba para verificar Firebase Admin SDK
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno primero
dotenv.config({ path: path.join(__dirname, 'env.local') });
dotenv.config();

import admin from './firebaseAdmin.js';

async function testFirebase() {
  try {
    console.log('🧪 Iniciando prueba de Firebase Admin SDK...');
    
    // Esperar un momento para que Firebase se inicialice
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar que Firebase esté inicializado
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin SDK no está inicializado');
      return;
    }
    
    console.log('✅ Firebase Admin SDK inicializado');
    
    // Probar Auth
    try {
      const auth = admin.auth();
      console.log('✅ Firebase Auth disponible');
    } catch (error) {
      console.error('❌ Error con Firebase Auth:', error.message);
    }
    
    // Probar Firestore
    try {
      const firestore = admin.firestore();
      console.log('✅ Firebase Firestore disponible');
      
      // Probar escritura
      const testDoc = firestore.collection('test').doc('connection-test');
      await testDoc.set({
        test: true,
        timestamp: new Date(),
        message: 'Prueba de conexión'
      });
      console.log('✅ Escritura en Firestore exitosa');
      
      // Probar lectura
      const doc = await testDoc.get();
      console.log('✅ Lectura en Firestore exitosa');
      console.log('📄 Datos leídos:', doc.data());
      
      // Limpiar
      await testDoc.delete();
      console.log('✅ Limpieza exitosa');
      
    } catch (error) {
      console.error('❌ Error con Firebase Firestore:', error.message);
      console.error('🔍 Detalles:', error);
    }
    
    console.log('✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testFirebase();
