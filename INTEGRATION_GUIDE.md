## Integración de apps externas con ControlFile (Auth central + Storage)

Esta guía te muestra cómo conectar otra app (por ejemplo ControlAudit/ControlDoc) para usar el login de tu proyecto de Auth central y guardar/leer archivos del usuario en ControlFile.

### 1) Requisitos
- Proyecto de Auth central: `controlstorage-eb796` (Firebase Auth)
- Backend ControlFile desplegado (Render) con envs:
  - `FB_ADMIN_IDENTITY` (service account de `controlstorage-eb796`)
  - `FB_ADMIN_APPDATA` (service account del proyecto de datos de ControlFile, ej. `controlfile-data`)
  - `FB_DATA_PROJECT_ID=controlfile-data`
  - `APP_CODE=controlfile`
  - `ALLOWED_ORIGINS` incluye tu otro frontend (ej. `https://auditoria.controldoc.app`, `http://localhost:5173`)

### 2) Claims de acceso (una sola vez por usuario)
Asigna `allowedApps` al usuario que probará:

```bash
npm run set-claims -- --email tu-correo@dominio --apps controlfile,controlaudit,controldoc --plans controlfile=pro;controlaudit=basic;controldoc=trial
```

Verifica en el frontend con:

```ts
const tokenResult = await auth.currentUser!.getIdTokenResult(true);
console.log(tokenResult.claims.allowedApps);
```

### 3) Frontend de la app externa
Inicializa Firebase client apuntando a `controlstorage-eb796` y usa el mini SDK para hablar con ControlFile.

```ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ControlFileClient } from '@/lib/controlfile-sdk';

const firebaseApp = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
});
const auth = getAuth(firebaseApp);

export const controlFile = new ControlFileClient(
  'https://<tu-backend-controlfile>.onrender.com',
  async () => auth.currentUser!.getIdToken()
);

export async function loginWithGoogle() {
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function uploadExample(file: File) {
  const presign = await controlFile.presignUpload({ name: file.name, size: file.size, mime: file.type, parentId: null });
  if (presign.url) {
    // Upload simple (PUT)
    const put = await fetch(presign.url, { method: 'PUT', body: file });
    if (!put.ok) throw new Error('PUT failed');
    await controlFile.confirm({ uploadSessionId: presign.uploadSessionId, etag: put.headers.get('etag') || undefined });
  } else if (presign.multipart) {
    // Multipart: sube cada parte usando presign.multipart.parts
    // Luego confirma con parts [{ PartNumber, ETag }]
  }
}

export async function listRoot() {
  const { items } = await controlFile.list({ parentId: null, pageSize: 50 });
  return items;
}
```

### 4) Pruebas con Postman/curl
Obtén un ID token desde tu frontend (Auth central) y úsalo como `Authorization: Bearer <ID_TOKEN>`.

Listar archivos:
```bash
curl -X GET "https://<backend-controlfile>/api/files/list?parentId=null&pageSize=20" \
  -H "Authorization: Bearer $ID_TOKEN"
```

Presign upload:
```bash
curl -X POST "https://<backend-controlfile>/api/uploads/presign" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"demo.txt","size":12,"mime":"text/plain","parentId":null}'
```

Confirm upload (single PUT):
```bash
curl -X POST "https://<backend-controlfile>/api/uploads/confirm" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uploadSessionId":"us_...","etag":"..."}'
```

Presign GET:
```bash
curl -X POST "https://<backend-controlfile>/api/files/presign-get" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileId":"f_..."}'
```

### 5) Troubleshooting
- 401 No autorizado: Asegúrate de enviar `Authorization: Bearer <ID_TOKEN>` válido.
- 403 Forbidden: El claim `allowedApps` no incluye la app destino (`APP_CODE`). Re-ejecuta `set-claims` o cambia `APP_CODE`.
- CORS bloqueado: Agrega el dominio del frontend a `ALLOWED_ORIGINS` del backend de ControlFile.
- Firestore PERMISSION_DENIED / CONSUMER_INVALID:
  - `FB_ADMIN_APPDATA` debe ser el service account del proyecto de datos real (ej. `controlfile-data`) con permisos de Firestore.
  - Verifica que `FB_DATA_PROJECT_ID` coincida exactamente con el ID del proyecto de datos.
  - En GCP/Firebase habilita la API de `Firestore` para ese proyecto.
- Puerto en uso: Si Next usa 3001, mueve el backend: `PORT=4001` en `backend/.env` y reinicia.

### 6) Checklist de éxito
- Login en app externa y `getIdToken()` devuelve token del proyecto `controlstorage-eb796`.
- `GET /api/files/list` responde 200 con items.
- `POST /api/uploads/presign` responde 200 y permite subir.
- `POST /api/uploads/confirm` responde 200 y se crea el `fileId`.
- `POST /api/files/presign-get` retorna URL de descarga.


