## ControlAudit - Integración con ControlFile (Backend Compartido)

Este documento resume cómo integrar la app ControlAudit con el backend y el proyecto de datos compartido.

### Variables de entorno

Backend (Render) de ControlAudit:
- APP_CODE=controlaudit
- FB_ADMIN_IDENTITY={JSON service account del proyecto de Auth central (controlstorage-eb796)}
- FB_ADMIN_APPDATA={JSON service account del proyecto de datos compartido}
- FB_DATA_PROJECT_ID=<id del proyecto de datos compartido>
- B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, B2_ENDPOINT
- ALLOWED_ORIGINS=... (incluye https://auditoria.controldoc.app)
- NODE_ENV=production, PORT=4001

Frontend (Vercel) de ControlAudit:
- NEXT_PUBLIC_BACKEND_URL=https://<tu-backend-controlaudit>
- NEXT_PUBLIC_FIREBASE_* del proyecto de Auth central

### Modelo de datos (Firestore)

Colecciones top-level compartidas: `folders`, `files`, `trash`, `uploadSessions`, `shares`, `users`.

Campos mínimos:
- folders: id, userId, name, parentId, path, appCode, ancestors[], createdAt, modifiedAt, type='folder'
- files: id, userId, name, size, mime, parentId, bucketKey, etag, appCode, ancestors[], isDeleted, createdAt, updatedAt

appCode:
- controlfile ve todo (no filtra por appCode)
- controlaudit filtra por appCode=='controlaudit'

ancestors:
- Lista de IDs de carpetas ancestro para consultas jerárquicas y borrado en cascada.

### Comportamiento del backend

- Autenticación: Middleware verifica allowedApps e impone appCode si APP_CODE!='controlfile'.
- Subida (POST /api/uploads/presign, /confirm):
  - Si no envías parentId, se autocrea/usa una carpeta raíz por app ("controlaudit") para ese usuario (solo cuando APP_CODE='controlaudit').
  - Se guardan appCode y ancestors en `uploadSessions` y luego en `files`.
- Listado (GET /api/files/list):
  - Filtra por userId e isDeleted=false; si APP_CODE!='controlfile' también filtra por appCode.
- Operaciones (presign-get, rename, delete, restore, permanent-delete, replace, zip):
  - Validan propiedad (userId) y visibilidad por appCode.

### Índices de Firestore sugeridos

Añadir índices compuestos que cubran:
- files: (userId ASC, isDeleted ASC, parentId ASC, updatedAt DESC)
- files: (userId ASC, appCode ASC, isDeleted ASC, parentId ASC, updatedAt DESC)

Edita `firestore.indexes.json` en el monorepo y despliega los índices en Firebase.

### Bucket de archivos (Backblaze B2)

Ambas apps deben apuntar al mismo bucket si se desea compartir binarios. Variables: B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, B2_ENDPOINT.

### Requisitos de acceso

- Asignar a los usuarios el claim allowedApps que incluya 'controlaudit' para poder usar la app.

### Notas de migración

- Los items existentes sin appCode se considerarán de 'controlfile'.
- Para mover items de controlfile a controlaudit, actualizar su appCode y, opcionalmente, moverlos bajo la carpeta raíz de controlaudit.


