// backend/scripts/create-admin.js
import admin from '../firebaseAdmin.js';

// ===============================
// CONFIGURACIÓN DEL CLIENTE
// ===============================
const EMAIL = 'licvidalfernando@gmail.com';
const PASSWORD = '123123123';
const DISPLAY_NAME = 'Cliente Principal';

// CONTROLAUDIT
const APP_ID = 'auditoria';
const ROLE = 'admin'; // cliente pagador / owner

// ===============================

async function createAdmin() {
  try {
    if (!admin) {
      throw new Error('Firebase Admin no inicializado');
    }

    console.log('🚀 Creando / actualizando CLIENTE CONTROLAUDIT');

    let userRecord;
    let isNewUser = false;

    // ===============================
    // 1. AUTH
    // ===============================
    try {
      userRecord = await admin.auth().getUserByEmail(EMAIL);
      console.log('✅ Usuario Auth existente:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        isNewUser = true;
        userRecord = await admin.auth().createUser({
          email: EMAIL,
          password: PASSWORD,
          displayName: DISPLAY_NAME,
          emailVerified: true,
        });
        console.log('✅ Usuario Auth creado:', userRecord.uid);
      } else {
        throw error;
      }
    }

    const uid = userRecord.uid;

    // ===============================
    // 2. CUSTOM CLAIMS (CLAVE)
    // ===============================
    await admin.auth().setCustomUserClaims(uid, {
      appId: APP_ID,
      role: ROLE,
      ownerId: uid, // 🔴 FUNDAMENTAL
    });

    console.log('🔐 Custom claims seteados:', {
      appId: APP_ID,
      role: ROLE,
      ownerId: uid,
    });

    // ===============================
    // 3. DOCUMENTO OWNER-CENTRIC
    // ===============================
    const db = admin.firestore();

    const userRef = db
      .collection('apps')
      .doc(APP_ID)
      .collection('owners')
      .doc(uid)
      .collection('usuarios')
      .doc(uid);

    const snap = await userRef.get();

    if (!snap.exists) {
      await userRef.set({
        uid,
        email: EMAIL,
        displayName: DISPLAY_NAME,
        appId: APP_ID,
        role: ROLE,

        status: 'active',
        activo: true,

        configuracion: {
          tema: 'light',
          notificaciones: true,
        },

        permisos: {
          puedeCrearEmpresas: true,
          puedeCrearSucursales: true,
          puedeCrearAuditorias: true,
          puedeGestionarUsuarios: true,
          puedeEliminarUsuarios: true,
          puedeGestionarSistema: true,
          puedeCompartirFormularios: true,
          puedeVerLogs: true,
          puedeAgregarSocios: true,
        },

        empresas: [],
        auditorias: [],
        socios: [],

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('📄 Documento owner-centric creado');
    } else {
      console.log('📄 Documento owner-centric ya existía');
    }

    console.log('🎉 CLIENTE LISTO – MODELO CORRECTO');

    if (isNewUser) {
      console.log('🔑 Password inicial:', PASSWORD);
    }

    console.log('👉 IMPORTANTE: cerrar sesión y volver a loguearse para refrescar claims');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando cliente:', error);
    process.exit(1);
  }
}

createAdmin();
