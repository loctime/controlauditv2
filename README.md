# ControlAudit v2

[![ControlFile Integration](https://img.shields.io/badge/ControlFile-Integration%20✅-success)](https://controlfile.onrender.com)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://auditoria.controldoc.app)
[![Build](https://img.shields.io/badge/Build-Passing-success)](https://vercel.com)

Sistema de auditoría integral con **integración completa y funcional** a ControlFile para gestión de archivos e imágenes de auditoría.

> 🎉 **INTEGRACIÓN COMPLETADA**: ControlAudit está 100% integrado con ControlFile y funcionando en producción.

## 🚀 **Características Principales**

- **Sistema de Auditoría Completo**: Gestión de empresas, auditorías, preguntas y respuestas
- **Integración ControlFile**: Subida y gestión de archivos con estructura organizada
- **🆕 Imágenes de Auditoría en ControlFile**: Almacenamiento automático de fotos de cámara y archivos subidos
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

## 📁 **Integración ControlFile - ✅ COMPLETA Y FUNCIONANDO**

### **Estado Actual:**
- ✅ **Integración 100% funcional** en producción
- ✅ **Subida de archivos** directa a ControlFile
- ✅ **🆕 Imágenes de auditoría** automáticamente en ControlFile
- ✅ **Gestión de carpetas** organizadas por auditoría, sección y pregunta
- ✅ **CORS configurado** para todos los dominios
- ✅ **Autenticación Firebase** funcionando

### **🆕 Nueva Funcionalidad - Imágenes de Auditoría:**
- **📸 Fotos de cámara** se suben automáticamente a ControlFile
- **📁 Archivos subidos** se almacenan en ControlFile con metadatos
- **🗂️ Estructura organizada** por auditoría, sección y pregunta
- **☁️ Indicadores visuales** de estado (Cloud/Local)
- **📊 Metadatos completos** de ControlFile
- **🔄 Fallback local** si ControlFile no está disponible

### **Endpoints Funcionando:**
- `GET /api/health` - Health check del sistema
- `GET /api/folders/root` - Obtener/crear carpeta raíz ControlAudit
- `POST /api/uploads/presign` - Crear sesión de subida
- `POST /api/uploads/confirm` - Confirmar subida completada

### **Flujo de Subida Optimizado:**
1. **Autenticación**: Token Firebase válido
2. **Carpeta Raíz**: Obtener/crear carpeta ControlAudit automáticamente
3. **🆕 Carpeta de Auditoría**: Crear carpeta específica para cada auditoría
4. **🆕 Subcarpetas**: Organizar por sección y pregunta
5. **Presign**: Crear sesión de subida con `parentId` correcto
6. **Upload**: Subir archivo directamente a ControlFile
7. **Confirm**: Finalizar y obtener URL del archivo
8. **Taskbar**: Carpeta se agrega automáticamente al taskbar

### **🆕 Estructura de Carpetas en ControlFile:**
```
ControlAudit/
├── Auditoría_2024-01-15_Empresa_Formulario/
│   ├── Sección_1/
│   │   ├── P1_1705123456789.jpg
│   │   ├── P2_1705123456790.jpg
│   │   └── ...
│   ├── Sección_2/
│   │   ├── P1_1705123456791.jpg
│   │   └── ...
│   └── ...
```

### **Dominios Soportados:**
- `https://auditoria.controldoc.app` - Producción principal
- `https://controlauditv2.vercel.app` - Vercel
- `http://localhost:5173` - Desarrollo local

## 🏗️ **Estructura del Proyecto**

```
controlauditv2/
├── src/                    # Frontend React
│   ├── components/pages/auditoria/
│   │   ├── auditoriaService.jsx    # 🆕 Servicio integrado con ControlFile
│   │   ├── components/
│   │   │   ├── ImagenAuditoria.jsx # 🆕 Componente de imagen con ControlFile
│   │   │   ├── PreguntaItem.jsx    # 🆕 Integrado con ImagenAuditoria
│   │   │   └── ...
│   │   └── ...
│   └── lib/
│       └── controlfile-upload.ts   # API unificada para ControlFile
├── backend/                # API Node.js
├── android/                # Aplicación Android
├── docs/                   # Documentación
│   ├── INTEGRACION_CONTROLFILE_COMPLETA.md
│   └── INTEGRACION_CONTROLFILE_AUDITORIAS.md # 🆕 Nueva documentación
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

## 🧪 **Herramientas de Diagnóstico**

### **Tests Disponibles en Dashboard:**
- **🔍 Diagnosticar Backend** - Diagnóstico general del entorno
- **🧪 Test ControlFile API** - Tests completos con autenticación
- **🌐 Test Conectividad** - Test básico sin autenticación

### **🆕 Tests de Imágenes de Auditoría:**
```javascript
// En la consola del navegador
import { runAllTests, testBasicConnectivity } from './src/utils/test-controlfile-api.js';

// Test básico
await testBasicConnectivity();

// Test completo (requiere login)
await runAllTests();

// 🆕 Test específico de imágenes de auditoría
const testImagenAuditoria = async () => {
  const imagen = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const resultado = await AuditoriaService.subirImagenAuditoria(
    imagen, 'test_audit_id', 0, 0
  );
  console.log('✅ Imagen subida:', resultado);
};
```

### **Monitoreo en Tiempo Real:**
- ✅ **Logs detallados** en consola del navegador
- ✅ **Métricas de rendimiento** de ControlFile
- ✅ **Estado de autenticación** Firebase
- ✅ **Verificación de CORS** automática
- 🆕 **Estado de imágenes** (Cloud/Local)
- 🆕 **Metadatos de ControlFile** en tiempo real

## 🚀 **Despliegue**

### **Frontend (Vercel):**
```bash
npm run build
vercel --prod
```

### **Verificación Post-Deploy:**
1. **Health Check**: `https://controlfile.onrender.com/api/health`
2. **Tests Dashboard**: Ejecutar tests de conectividad
3. **Subida de Archivos**: Probar subida desde InfoSistema
4. **🆕 Imágenes de Auditoría**: Probar cámara y subida de archivos
5. **Logs**: Verificar logs en consola del navegador

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

## 🆕 **Novedades - Integración ControlFile con Auditorías**

### **¿Qué es nuevo?**
- **Imágenes de auditoría** se almacenan automáticamente en ControlFile
- **Fotos de cámara** se suben directamente a ControlFile
- **Archivos subidos** se organizan por auditoría, sección y pregunta
- **Indicadores visuales** muestran si la imagen está en ControlFile o localmente
- **Metadatos completos** de ControlFile disponibles en la interfaz

### **¿Cómo funciona?**
1. **Al crear una auditoría**: Se crea automáticamente una carpeta en ControlFile
2. **Al tomar una foto**: Se comprime y sube automáticamente a ControlFile
3. **Al subir un archivo**: Se procesa y sube a ControlFile
4. **Si ControlFile falla**: Se guarda localmente como respaldo
5. **Visualización**: Se muestran indicadores de estado y metadatos

### **¿Dónde ver las imágenes?**
- **En la auditoría**: Cada pregunta muestra sus imágenes con indicadores
- **En ControlFile**: Organizadas por auditoría, sección y pregunta
- **En el taskbar**: Acceso directo a la carpeta de ControlAudit

**¡ControlAudit ahora es completamente integrado con ControlFile para el almacenamiento de imágenes de auditoría!** 🎉
