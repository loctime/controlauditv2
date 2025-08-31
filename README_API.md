# ControlFile API - Guía rápida

## Requisitos
- Node.js 18+
- Firebase (cliente y Admin)
- Backblaze B2 (o S3)

## Instalación
```
cd C:\Users\User\Desktop\controlFile
npm install
```

## Variables (.env.local)
Copia `env.example` a `.env.local` y completa:
- NEXT_PUBLIC_FIREBASE_*
- FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
- B2_*, B2_ENDPOINT
- ALLOWED_ORIGINS (coma-separado)
- EMBED_WIDGET_SECRET (opcional)

Ejemplo mínimo:
```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
EMBED_WIDGET_SECRET=dev-embed-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Ejecutar
- Solo backend (API):
```
cd backend
npm run dev
# http://localhost:3001
```
- Todo:
```
npm run dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```
- Docs: http://localhost:3001/api/docs

## Autenticación
### A) JWT Firebase (endpoints /api/*)
1. Ve a http://localhost:3000/auth/token y copia tu ID Token.
2. Usa `Authorization: Bearer <TOKEN>`.

### B) API Key + HMAC (endpoints /v1/keys/*)
1. Crear clave:
```
curl -X POST http://localhost:3001/v1/user/apikeys/create \
 -H "Authorization: Bearer <ID_TOKEN>" \
 -H "Content-Type: application/json" \
 -d '{"appName":"MiIntegracion","scopes":["files:read","files:write"]}'
```
2. Firmar requests (Node):
```
const crypto = require('crypto')
function sign({ method, path, body, secret }) {
  const ts = Math.floor(Date.now()/1000).toString()
  const bodyStr = body ? JSON.stringify(body) : '{}'
  const hash = crypto.createHash('sha256').update(bodyStr).digest('hex')
  const payload = `${method.toUpperCase()}\n${path}\n${ts}\n${hash}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return { ts, sig, bodyStr }
}
```

## Flujo de subida
1) Presign → `uploadSessionId`
2) Proxy-upload (multipart)
3) Confirm

## CORS
Ajusta `ALLOWED_ORIGINS` con los dominios de tus apps.

## Producción
Despliega backend (Render/Heroku/Fly). Configura variables y CORS. Docs: `https://TU_BACKEND/api/docs`.
