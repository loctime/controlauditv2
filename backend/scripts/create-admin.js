// backend/scripts/create-admin.js
import admin from '../firebaseAdmin.js';

const EMAIL = 'dev@gmail.com'; // <-- CAMBIAR
const PASSWORD = '123123123';
const DISPLAY_NAME = 'Administrador Principal';
const ROLE = 'max'; // 'supermax' | 'max'

async function createAdmin() {
  try {
    if (!admin) {
      throw new Error('Firebase Admin SDK no está inicializado. Verifica las credenciales.');
    }

    console.log('🚀 Creando/actualizando administrador...');

    let userRecord;
    let isNewUser = false;

    // 1. Verificar si el usuario ya existe en Auth
    try {
      userRecord = await admin.auth().getUserByEmail(EMAIL);
      console.log('✅ Usuario Auth ya existe:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Usuario no existe, crearlo
        isNewUser = true;
        console.log('📝 Usuario no existe, creando nuevo usuario...');
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

    // 2. Asignar custom claim (actualizar si ya existe)
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: ROLE,
    });

    console.log(`🔐 Claim asignado: role = ${ROLE}`);

    // 3. Crear perfil en Firestore (auditoría) - Ruta correcta: apps/auditoria/users/{uid}
    const userProfile = {
      uid: userRecord.uid,
      email: EMAIL,
      displayName: DISPLAY_NAME,
      role: ROLE,
      permisos: {
        puedeGestionarUsuarios: true,
        puedeGestionarSistema: true,
        puedeCrearEmpresas: true,
        puedeCrearSucursales: true,
        puedeCrearAuditorias: true,
        puedeCompartirFormularios: true,
        puedeAgregarSocios: true,
        puedeVerLogs: true,
        puedeEliminarUsuarios: true,
      },
      appId: 'auditoria',
      createdAt: new Date(),
      empresas: [],
      auditorias: [],
      socios: [],
      configuracion: {
        notificaciones: true,
        tema: 'light'
      },
      status: 'active',
    };

    // Usar la estructura correcta de Firestore: apps/auditoria/users/{uid}
    // Usar merge para no sobrescribir datos existentes
    await admin
      .firestore()
      .collection('apps')
      .doc('auditoria')
      .collection('users')
      .doc(userRecord.uid)
      .set(userProfile, { merge: true });

    console.log('📄 Perfil Firestore creado/actualizado en apps/auditoria/users/');

    console.log('🎉 ADMINISTRADOR CONFIGURADO CON ÉXITO');
    console.log('📧 Email:', EMAIL);
    if (isNewUser) {
      console.log('🔑 Password:', PASSWORD);
      console.log('⚠️ Debe cambiar la contraseña al primer login');
    } else {
      console.log('ℹ️ Usuario existente, solo se actualizó el perfil y claims');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    process.exit(1);
  }
}

createAdmin();
