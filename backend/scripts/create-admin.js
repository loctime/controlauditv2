// backend/scripts/create-admin.js
import admin from '../firebaseAdmin.js';

// ===============================
// CONFIGURACIÓN MANUAL
// ===============================
const EMAIL = 'licvidalfernando@gmail.com';          // <-- CAMBIAR
const PASSWORD = '123123123';            // <-- CAMBIAR
const DISPLAY_NAME = 'Administrador Principal';
const ROLE = 'max';                      // 'supermax' | 'max'
// 👉 CUPO DE USUARIOS (CLAVE)
const MAX_USUARIOS = 10;                  // <-- DEFINÍ ACÁ EL LÍMITE

// ===============================

async function createAdmin() {
  try {
    if (!admin) {
      throw new Error('Firebase Admin SDK no está inicializado');
    }

    console.log('🚀 Creando / actualizando administrador...');
    console.log(`👤 Email: ${EMAIL}`);
    console.log(`🎭 Rol: ${ROLE}`);
    console.log(`👥 Máx. usuarios permitidos: ${MAX_USUARIOS}`);

    let userRecord;
    let isNewUser = false;

    // 1. Verificar si existe en Auth
    try {
      userRecord = await admin.auth().getUserByEmail(EMAIL);
      console.log('✅ Usuario Auth existente:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        isNewUser = true;
        console.log('📝 Usuario no existe, creando...');
        userRecord = await admin.auth().createUser({
          email: EMAIL,
          password: PASSWORD,
          displayName: DISPLAY_NAME,
          emailVerified: true,
          disabled: false,
        });
        console.log('✅ Usuario Auth creado:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // 2. Asignar custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: ROLE,
    });

    console.log(`🔐 Claim asignado: role = ${ROLE}`);

    // ✅ MODELO OWNER-CENTRIC: Admins NO tienen documento en apps/auditoria/users
    // Los admins solo existen en:
    // - apps/auditoria/owners/{ownerId} (documento del owner)
    // - apps/auditoria/owners/{ownerId}/usuarios/{ownerId} (documento del usuario owner-centric)
    // 
    // El documento en /users es legacy y solo para operarios.
    // 
    // NOTA: El documento owner-centric se crea desde el frontend cuando el admin
    // inicia sesión por primera vez o cuando se crea explícitamente.
    
    console.log('⚠️ ADMIN - NO creando documento en apps/auditoria/users (solo owner-centric)');
    console.log('📝 El documento owner-centric se creará desde el frontend o manualmente');
    console.log('🎉 ADMINISTRADOR LISTO');

    if (isNewUser) {
      console.log('🔑 Password inicial:', PASSWORD);
      console.log('⚠️ Debe cambiar la contraseña al primer login');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    process.exit(1);
  }
}

createAdmin();
