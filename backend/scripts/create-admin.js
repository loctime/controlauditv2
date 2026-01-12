/**
 * Script — Crear / actualizar OWNER (admin) ControlAudit
 * -------------------------------------------------------
 * - Crea o reutiliza usuario en Firebase Auth
 * - Setea custom claims (appId, role, ownerId)
 * - Crea / actualiza documento owner-centric
 * - Define límites del sistema (operarios, empresas, etc.)
 */

import admin from '../firebaseAdmin.js';

// ===============================
// CONFIGURACIÓN OWNER
// ===============================
const EMAIL = 'hys@maximia.com.ar';
const PASSWORD = '123123123';
const DISPLAY_NAME = 'Owner Principal';

const APP_ID = 'auditoria';
const ROLE = 'admin';

// 🔒 LÍMITES DEL SISTEMA (EDITAR ACÁ)
const LIMITS = {
  maxOperarios: 10,              // 👈 usuarios que puede crear
  maxEmpresas: 50,
  maxSucursales: 200,
  maxAuditoriasMensuales: 1000,
};

// ===============================

async function createAdmin() {
  try {
    console.log('🚀 Creando / actualizando OWNER CONTROLAUDIT');

    // ===============================
    // 1. AUTH
    // ===============================
    let userRecord;
    let isNewUser = false;

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
    // 2. CUSTOM CLAIMS
    // ===============================
    await admin.auth().setCustomUserClaims(uid, {
      appId: APP_ID,
      role: ROLE,
      ownerId: uid, // 🔑 owner = él mismo
    });

    console.log('🔐 Custom claims seteados:', {
      appId: APP_ID,
      role: ROLE,
      ownerId: uid,
    });

    // ===============================
    // 3. OWNER DOCUMENT (Firestore)
    // ===============================
    const db = admin.firestore();

    const ownerRef = db
      .collection('apps')
      .doc(APP_ID)
      .collection('owners')
      .doc(uid);

    const snap = await ownerRef.get();

    const baseData = {
      ownerId: uid,
      uid,
      email: EMAIL,                // 👈 CLAVE para identificar cuentas
      displayName: DISPLAY_NAME,
      appId: APP_ID,
      role: ROLE,

      status: 'active',
      plan: 'admin',

      limits: {
        ...LIMITS,
      },

      migratedFrom: 'script',

      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!snap.exists) {
      await ownerRef.set({
        ...baseData,

        usage: {
          operarios: 0,
          empresas: 0,
          sucursales: 0,
          auditoriasMensuales: 0,
        },

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('📄 Documento OWNER creado');
    } else {
      await ownerRef.update(baseData);
      console.log('📄 Documento OWNER actualizado');
    }

    console.log('🎉 OWNER LISTO – MODELO CORRECTO');

    if (isNewUser) {
      console.log('🔑 Password inicial:', PASSWORD);
    }

    console.log('👉 IMPORTANTE: cerrar sesión y volver a loguearse para refrescar claims');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creando OWNER:', error);
    process.exit(1);
  }
}

createAdmin();
