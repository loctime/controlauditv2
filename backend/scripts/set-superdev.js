import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../serviceAccountKey-controlfile.json"),
    "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const DEV_UID = "rixIn0BwiVPHB4SgR0K0SlnpSLC2"; // tu usuario real

async function run() {
  await admin.auth().setCustomUserClaims(DEV_UID, {
    superdev: true,
  });

  console.log("✅ superdev habilitado para:", DEV_UID);
  console.log("⚠️ El usuario debe volver a loguearse para refrescar el token");
}

run().catch(console.error);
