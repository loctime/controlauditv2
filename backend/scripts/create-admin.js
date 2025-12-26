// backend/scripts/create-admin.js
import admin from '../firebaseAdmin.js';

const EMAIL = 'admin@controldoc.app'; // <-- CAMBIAR
const PASSWORD = '123456';
const DISPLAY_NAME = 'Administrador Principal';
const ROLE = 'supermax'; // 'supermax' | 'max'

async function createAdmin() {
  try {
    if (!admin) {
      throw new Error('Firebase Admin SDK no está inicializado. Verifica las credenciales.');
    }

    console.log('🚀 Creando administrador...');

    // 1. Crear usuario en Auth
    const userRecord = await admin.auth().createUser({
      email: EMAIL,
      password: PASSWORD,
      displayName: DISPLAY_NAME,
      emailVerified: true,
      disabled: false,
    });

    console.log('✅ Usuario Auth creado:', userRecord.uid);

    // 2. Asignar custom claim
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
    await admin
      .firestore()
      .collection('apps')
      .doc('auditoria')
      .collection('users')
      .doc(userRecord.uid)
      .set(userProfile);

    console.log('📄 Perfil Firestore creado en apps/auditoria/users/');

    console.log('🎉 ADMINISTRADOR CREADO CON ÉXITO');
    console.log('📧 Email:', EMAIL);
    console.log('🔑 Password:', PASSWORD);
    console.log('⚠️ Debe cambiar la contraseña al primer login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    process.exit(1);
  }
}

createAdmin();
