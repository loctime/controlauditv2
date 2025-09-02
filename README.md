# ControlAudit v2

Sistema de auditoría integral con integración completa a ControlFile para gestión de archivos.

## 🚀 **Características Principales**

- **Sistema de Auditoría Completo**: Gestión de empresas, auditorías, preguntas y respuestas
- **Integración ControlFile**: Subida y gestión de archivos con estructura organizada
- **Autenticación Firebase**: Sistema de usuarios con roles y permisos
- **Aplicación Móvil**: APK Android nativa con Capacitor
- **Backend Node.js**: API REST con Express y Firebase Admin SDK

## 📱 **Aplicación Móvil**

### **Desarrollo:**
```bash
npm run dev      # Servidor web + aplicación Android
npm run fer      # Solo aplicación Android
npm run die      # Ambos (desarrollo + móvil)
```

### **Construcción APK:**
```bash
npm run build    # Construir para producción
cd android
./gradlew assembleDebug    # APK de debug
./gradlew assembleRelease  # APK de release
```

## 🔧 **Backend**

### **Configuración:**
```bash
cd backend
cp env.local.example env.local
# Editar env.local con tus credenciales
```

### **Variables de Entorno:**
```bash
APP_CODE=controlaudit
APP_DISPLAY_NAME=ControlAudit
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_PRIVATE_KEY=tu-clave-privada
FIREBASE_CLIENT_EMAIL=tu-email
```

### **Ejecutar:**
```bash
npm start        # Producción
npm run dev      # Desarrollo
```

## 📁 **Integración ControlFile**

### **Endpoints Principales:**
- `POST /api/uploads/presign` - Crear sesión de subida
- `POST /api/uploads/complete/:uploadId` - Completar subida
- `GET /api/folders/root` - Obtener carpeta raíz
- `POST /api/folders/create` - Crear subcarpetas

### **Flujo de Subida:**
1. **Presign**: Crear sesión y carpeta raíz automáticamente
2. **Upload**: Subir archivo con `parentId` correcto
3. **Complete**: Finalizar y crear registro en Firestore

## 🏗️ **Estructura del Proyecto**

```
controlauditv2/
├── src/                    # Frontend React
├── backend/                # API Node.js
├── android/                # Aplicación Android
├── docs/                   # Documentación
├── scripts/                # Scripts de construcción
└── public/                 # Archivos estáticos
```

## 🔐 **Autenticación**

- **Firebase Auth**: Sistema de usuarios con custom claims
- **Roles**: `supermax`, `max`, `operario`
- **Permisos**: Gestión granular por funcionalidad

## 📊 **Base de Datos**

- **Firestore**: Colecciones principales:
  - `usuarios` - Perfiles de usuario
  - `empresas` - Empresas auditadas
  - `auditorias` - Auditorías realizadas
  - `folders` - Estructura de carpetas ControlFile
  - `files` - Archivos subidos
  - `uploadSessions` - Sesiones de subida

## 🚀 **Despliegue**

### **Frontend (Vercel):**
```bash
npm run build
vercel --prod
```

### **Backend (Render):**
- Conectar repositorio GitHub
- Configurar variables de entorno
- Auto-deploy en push a main

## 📋 **Requisitos**

- Node.js 18+
- Java 21 (para Android)
- Android Studio (opcional)
- Firebase Project configurado

## 🤝 **Contribución**

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 **Licencia**

Este proyecto es privado y confidencial.

---

**Desarrollado por Loctime** 🚀
