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

    // 3. Perfil Firestore (apps/auditoria/users/{uid})
    const userProfile = {
      uid: userRecord.uid,
      email: EMAIL,
      displayName: DISPLAY_NAME,
      role: ROLE,

      // 👉 LÍMITES DE USUARIOS
      limites: {
        maxUsuarios: ROLE === 'supermax' ? null : MAX_USUARIOS,
        usuariosCreados: 0,
      },

      permisos: {
        puedeGestionarUsuarios: true,
        puedeGestionarSistema: ROLE === 'supermax',
        puedeCrearEmpresas: true,
        puedeCrearSucursales: true,
        puedeCrearAuditorias: true,
        puedeAgendarAuditorias: true,
        puedeCrearFormularios: true,
        puedeCompartirFormularios: true,
        puedeVerLogs: ROLE === 'supermax',
        puedeEliminarUsuarios: ROLE === 'supermax',
      },

      appId: 'auditoria',
      status: 'active',

      createdAt: admin.firestore.FieldValue.serverTimestamp(),

      // relaciones futuras
      empresas: [],
      auditorias: [],
      socios: [],

      configuracion: {
        notificaciones: true,
        tema: 'light',
      },
    };

    await admin
      .firestore()
      .collection('apps')
      .doc('auditoria')
      .collection('users')
      .doc(userRecord.uid)
      .set(userProfile, { merge: true });

    console.log('📄 Perfil Firestore creado / actualizado');
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
