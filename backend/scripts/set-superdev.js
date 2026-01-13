// ⚠️ Usar la instancia única de Firebase Admin del backend
import admin from "../firebaseAdmin.js";

// ===============================
// CONFIG
// ===============================
const DEV_UID = "rixIn0BwiVPHB4SgR0K0SlnpSLC2";
const APP_ID = "auditoria";
const ROLE = "admin";

async function run() {
  // 1. Obtener usuario actual
  const user = await admin.auth().getUser(DEV_UID);
  const currentClaims = user.customClaims || {};

  console.log("🔎 Claims actuales:", currentClaims);

  // 2. Construir claims completos (merge seguro)
  const newClaims = {
    ...currentClaims,      // mantiene lo existente
    appId: APP_ID,
    role: ROLE,
    ownerId: DEV_UID,
    superdev: true         // opcional
  };

  // 3. Setear claims
  await admin.auth().setCustomUserClaims(DEV_UID, newClaims);

  console.log("✅ Claims actualizados correctamente:");
  console.log(newClaims);

  console.log("⚠️ IMPORTANTE: cerrar sesión y volver a loguearse");
}

run().catch(err => {
  console.error("❌ Error seteando claims:", err);
  process.exit(1);
});
