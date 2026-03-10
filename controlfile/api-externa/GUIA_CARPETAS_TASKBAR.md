# 🗂️ Guía de Carpetas en Taskbar - Apps Externas

Esta guía explica cómo las aplicaciones externas pueden crear carpetas que aparezcan automáticamente en el taskbar de ControlFile.

## 📋 Resumen Ejecutivo

**¿Qué es?** Sistema que permite a las apps externas crear carpetas que aparecen como botones en el taskbar de ControlFile.

**¿Para qué?** Acceso rápido a la funcionalidad de cada app desde ControlFile.

**¿Cómo?** Enviando `source: 'taskbar'` al crear carpetas.

## 🎯 Casos de Uso

### ControlAudit
- Carpeta "ControlAudit" en el taskbar
- Al hacer clic → Navega a la carpeta de auditorías del usuario

### ControlDoc
- Carpeta "ControlDoc" en el taskbar  
- Al hacer clic → Navega a la carpeta de documentos del usuario

### ControlGastos
- Carpeta "ControlGastos" en el taskbar
- Al hacer clic → Navega a la carpeta de gastos del usuario

## 🚀 Implementación Rápida

### ⚠️ IMPORTANTE: Colección Unificada
- **Todas las carpetas** se crean en la colección `files` con `type: 'folder'`
- **NO usar** la colección `folders` (deprecated)
- **Consistencia total** entre todos los endpoints

### 🔒 Contrato Obligatorio para Carpetas Taskbar

**Las carpetas de taskbar son POR USUARIO + APP**

**ID determinístico obligatorio:**
```
taskbar_${userId}_${normalizedAppId}
```

**PROHIBIDO usar:**
- ❌ `Date.now()`
- ❌ `Math.random()`
- ❌ IDs dinámicos
- ❌ Queries para verificar existencia
- ❌ Creación manual con API `/api/folders/create` para taskbar

**ÚNICO mecanismo válido:**
```typescript
import { ensureTaskbarAppFolder } from '@/utils/taskbar-folder';

const folderId = await ensureTaskbarAppFolder({
  appId: 'controlaudit',
  appName: 'ControlAudit',
  userId: user.uid,
  icon: 'ClipboardList',
  color: 'text-blue-600'
});
```

### 1. Crear Carpeta en Taskbar

```typescript
// ✅ CORRECTO: Usar el helper oficial ensureTaskbarAppFolder
import { ensureTaskbarAppFolder } from '@/utils/taskbar-folder';
import { getAuth } from 'firebase/auth';

const createTaskbarFolder = async (appId: string, appName: string) => {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // ✅ Helper idempotente: puede ejecutarse múltiples veces sin crear duplicados
  const folderId = await ensureTaskbarAppFolder({
    appId,
    appName,
    userId: user.uid,
    icon: 'ClipboardList',
    color: 'text-blue-600'
  });

  console.log('✅ Carpeta taskbar asegurada:', folderId);
  return folderId;
};

// Uso
const folderId = await createTaskbarFolder('controlaudit', 'ControlAudit');
// ✅ Siempre retorna: "taskbar_${userId}_controlaudit"
// ✅ Idempotente: puede llamarse múltiples veces sin problemas
```

### ⚠️ PROHIBIDO: Crear Carpetas Taskbar Manualmente

```typescript
// ❌ INCORRECTO: NO usar API para crear carpetas taskbar
const response = await fetch('https://controlfile.onrender.com/api/folders/create', {
  method: 'POST',
  body: JSON.stringify({
    id: `${appName.toLowerCase()}-main-${Date.now()}`, // ❌ PROHIBIDO
    source: 'taskbar'
  })
});

// ❌ INCORRECTO: NO usar createFolder() para taskbar
import { createFolder } from '@/services/controlFileB2Service';
await createFolder('ControlAudit', null, 'taskbar'); // ❌ PROHIBIDO
```

### 2. Verificar que Aparece en Taskbar

La carpeta aparecerá automáticamente en el taskbar de ControlFile como:

```
┌─────────────────────────────────────────┐
│ [ControlFile] [ControlAudit] [ControlDoc] │
└─────────────────────────────────────────┘
```

### 3. Navegación al Hacer Clic

Cuando el usuario hace clic en la carpeta del taskbar:

1. **ControlFile** navega a la carpeta
2. **Muestra el contenido** de esa carpeta
3. **El usuario puede** subir/descargar archivos normalmente

## 🔧 Configuración Avanzada

### Personalizar Apariencia

```typescript
// ✅ CORRECTO: Usar ensureTaskbarAppFolder con opciones personalizadas
import { ensureTaskbarAppFolder } from '@/utils/taskbar-folder';

const folderId = await ensureTaskbarAppFolder({
  appId: 'miapp',
  appName: 'Mi App',
  userId: user.uid,
  icon: 'Taskbar',           // Icono del botón
  color: 'text-blue-600'     // Color del botón
});

// El helper crea automáticamente la estructura correcta con:
// - ID determinístico: taskbar_${userId}_miapp
// - metadata.source: 'taskbar'
// - metadata.icon: 'Taskbar'
// - metadata.color: 'text-blue-600'
```

### Crear Subcarpetas

```typescript
// ✅ CORRECTO: Las subcarpetas se crean con source: 'navbar'
// Pueden usar la API o helpers específicos para subcarpetas
import { ensureSubFolder } from '@/services/controlFileB2Service';

const createSubfolder = async (parentId: string, subfolderName: string) => {
  // ✅ Helper que verifica existencia antes de crear (evita duplicados)
  const folderId = await ensureSubFolder(subfolderName, parentId);
  return folderId;
};

// O usando la API directamente (solo para subcarpetas, NO para taskbar)
const createSubfolderViaAPI = async (parentId: string, subfolderName: string) => {
  const idToken = await getAuth().currentUser?.getIdToken();
  
  const response = await fetch('https://controlfile.onrender.com/api/folders/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: subfolderName,
      parentId: parentId, // ✅ Carpeta padre (carpeta taskbar)
      metadata: {
        source: 'navbar'   // ✅ Subcarpetas van en navbar
      }
    })
  });

  return await response.json();
};
```

## 📊 Estructura de Datos

### Carpeta en Taskbar
```typescript
{
  id: "taskbar_user123_controlaudit", // ✅ ID determinístico: taskbar_${userId}_${appId}
  userId: "user123",
  appId: "controlaudit",
  name: "ControlAudit",
  slug: "controlaudit",
  type: "folder",
  parentId: null, // ✅ Siempre null para taskbar
  path: [],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  deletedAt: null,
  metadata: {
    source: "taskbar", // ✅ CLAVE - Solo esto importa
    appId: "controlaudit",
    icon: "ClipboardList",
    color: "text-blue-600",
    isSystem: true,
    isMainFolder: false,
    isDefault: false,
    description: "Carpeta principal de ControlAudit",
    permissions: {
      canEdit: true,
      canDelete: false, // ✅ No se puede eliminar (carpeta del sistema)
      canShare: true,
      canDownload: true
    },
    customFields: {
      appName: "ControlAudit",
      appId: "controlaudit",
      createdBy: "ensureTaskbarAppFolder"
    }
  }
}
```

### Subcarpeta
```typescript
{
  id: "folder_1234567890_abc123", // ✅ ID generado por el sistema (no determinístico)
  userId: "user123", 
  name: "Auditorías 2025",
  type: "folder",
  parentId: "taskbar_user123_controlaudit", // ✅ Referencia a carpeta taskbar padre
  metadata: {
    source: "navbar", // ✅ Subcarpetas van en navbar
    icon: "Folder",
    color: "text-gray-600",
    customFields: {
      appName: "ControlAudit"
    }
  }
}
```

## 🎨 Personalización Visual

### Colores Disponibles
```typescript
const colors = [
  'text-blue-600',    // Azul (recomendado para taskbar)
  'text-purple-600',  // Morado
  'text-green-600',   // Verde
  'text-red-600',     // Rojo
  'text-yellow-600',  // Amarillo
  'text-indigo-600',  // Índigo
  'text-pink-600',    // Rosa
  'text-gray-600'     // Gris
];
```

### Iconos Disponibles
```typescript
const icons = [
  'Taskbar',    // Para carpetas del taskbar
  'Folder',     // Para carpetas normales
  'Document',   // Para documentos
  'Image',      // Para imágenes
  'Video',      // Para videos
  'Audio'       // Para audio
];
```

## 🔄 Flujo Completo de Integración

### Paso 1: Usuario Inicia Sesión
```typescript
// En tu app
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const auth = getAuth();
const provider = new GoogleAuthProvider();

// Usuario se autentica con Firebase Auth Central
const result = await signInWithPopup(auth, provider);
const idToken = await result.user.getIdToken();
```

### Paso 2: Crear Carpeta en Taskbar
```typescript
// ✅ CORRECTO: Usar ensureTaskbarAppFolder
import { ensureTaskbarAppFolder } from '@/utils/taskbar-folder';
import { ensureSubFolder } from '@/services/controlFileB2Service';

// Crear carpeta principal (idempotente)
const mainFolderId = await ensureTaskbarAppFolder({
  appId: 'controlaudit',
  appName: 'ControlAudit',
  userId: user.uid,
  icon: 'ClipboardList',
  color: 'text-blue-600'
});

// Crear estructura de subcarpetas
await ensureSubFolder('2025', mainFolderId);
await ensureSubFolder('2024', mainFolderId);
await ensureSubFolder('Archivos', mainFolderId);
```

### Paso 3: Subir Archivos
```typescript
// Subir archivo a la carpeta
const uploadFile = async (file: File, folderId: string) => {
  const idToken = await getAuth().currentUser?.getIdToken();
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('parentId', folderId);
  
  const response = await fetch('https://controlfile.onrender.com/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`
    },
    body: formData
  });
  
  return await response.json();
};
```

## 🛡️ Seguridad y Permisos

### Validación Automática
- ✅ **Solo usuarios autenticados** pueden crear carpetas
- ✅ **Cada usuario** solo ve sus propias carpetas
- ✅ **Claims de usuario** validan acceso a la app
- ✅ **Aislamiento total** entre usuarios

### Autenticación Requerida
```typescript
// El usuario debe estar autenticado con Firebase Auth
const user = getAuth().currentUser;
const idToken = await user.getIdToken();
```

## 🐛 Troubleshooting

### Error: "No autorizado"
```typescript
// Verificar que el usuario esté autenticado
const user = getAuth().currentUser;
if (!user) {
  console.log('Usuario no autenticado');
  // Redirigir a login
}
```

### Error: "Carpeta ya existe"
```typescript
// ✅ NO es necesario manejar este error: ensureTaskbarAppFolder es idempotente
// El helper maneja automáticamente carpetas existentes usando merge: true
import { ensureTaskbarAppFolder } from '@/utils/taskbar-folder';

// Puede ejecutarse múltiples veces sin crear duplicados
const folderId = await ensureTaskbarAppFolder({
  appId: 'controlaudit',
  appName: 'ControlAudit',
  userId: user.uid
});

// ✅ Siempre retorna el mismo ID: "taskbar_${userId}_controlaudit"
// ✅ No crea duplicados aunque se ejecute N veces
```

### La carpeta no aparece en taskbar
```typescript
// Verificar que source sea 'taskbar'
const folderData = {
  // ...
  metadata: {
    source: 'taskbar' // ✅ Debe ser exactamente 'taskbar'
  }
};
```

## 📝 Ejemplo Completo

### App de ControlAudit

```typescript
// controlaudit-integration.ts
import { getAuth } from 'firebase/auth';
import { ensureTaskbarAppFolder } from '@/utils/taskbar-folder';
import { ensureSubFolder } from '@/services/controlFileB2Service';

class ControlAuditIntegration {
  async initializeUser() {
    const user = getAuth().currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    
    // ✅ Crear carpeta principal en taskbar usando helper oficial
    const mainFolderId = await ensureTaskbarAppFolder({
      appId: 'controlaudit',
      appName: 'ControlAudit',
      userId: user.uid,
      icon: 'ClipboardList',
      color: 'text-blue-600'
    });
    
    // ✅ Crear estructura de subcarpetas (source: 'navbar')
    await ensureSubFolder('2025', mainFolderId);
    await ensureSubFolder('2024', mainFolderId);
    await ensureSubFolder('Templates', mainFolderId);
    await ensureSubFolder('Reports', mainFolderId);
    
    return mainFolderId;
  }
  
  async uploadAuditFile(file: File, folderName: string) {
    const user = getAuth().currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    
    // Obtener carpeta principal
    const mainFolderId = await ensureTaskbarAppFolder({
      appId: 'controlaudit',
      appName: 'ControlAudit',
      userId: user.uid
    });
    
    // Buscar subcarpeta por nombre (usar listFiles o query específica)
    const folders = await this.getUserFolders(mainFolderId);
    const targetFolder = folders.find(f => f.name === folderName);
    
    if (!targetFolder) {
      // Crear subcarpeta si no existe
      return await ensureSubFolder(folderName, mainFolderId);
    }
    
    // Subir archivo usando el servicio oficial
    const { uploadEvidence } = await import('@/services/controlFileB2Service');
    const result = await uploadEvidence({
      file,
      auditId: 'temp',
      companyId: 'temp',
      parentId: targetFolder.id
    });
    
    return result.fileId;
  }
  
  private async getUserFolders(parentId: string) {
    const { listFiles } = await import('@/services/controlFileB2Service');
    return await listFiles(parentId);
  }
}

// Uso
const integration = new ControlAuditIntegration();

// Al inicializar la app (idempotente, puede ejecutarse múltiples veces)
await integration.initializeUser();

// Al subir un archivo
await integration.uploadAuditFile(file, '2025');
```

## 🎯 Mejores Prácticas

### 1. Usar Helper Oficial para Taskbar
```typescript
// ✅ CORRECTO: Usar ensureTaskbarAppFolder
import { ensureTaskbarAppFolder } from '@/utils/taskbar-folder';

const folderId = await ensureTaskbarAppFolder({
  appId: 'controlaudit',
  appName: 'ControlAudit',
  userId: user.uid
});
// ✅ ID determinístico: "taskbar_${userId}_controlaudit"
// ✅ Idempotente: puede ejecutarse múltiples veces

// ❌ INCORRECTO: Crear manualmente con Date.now()
const id = `controlaudit-main-${Date.now()}`; // ❌ PROHIBIDO

// ❌ INCORRECTO: IDs estáticos pueden duplicarse
const id = 'main-folder'; // ❌ Puede duplicarse entre usuarios
```

### 2. Manejo de Errores
```typescript
// ✅ CORRECTO: ensureTaskbarAppFolder maneja duplicados automáticamente
import { ensureTaskbarAppFolder } from '@/utils/taskbar-folder';

try {
  const folderId = await ensureTaskbarAppFolder({
    appId: 'controlaudit',
    appName: 'ControlAudit',
    userId: user.uid
  });
  console.log('✅ Carpeta asegurada:', folderId);
} catch (error) {
  // Solo errores de autenticación o Firebase
  console.error('Error:', error);
  // ❌ NO necesita manejar "carpeta ya existe" - es idempotente
}
```

### 3. Cuándo Llamar al Helper

```typescript
// ✅ CORRECTO: Llamar en inicialización de app
useEffect(() => {
  if (user) {
    ensureTaskbarAppFolder({
      appId: 'controlaudit',
      appName: 'ControlAudit',
      userId: user.uid
    });
  }
}, [user]);

// ✅ CORRECTO: Llamar en acciones críticas (una vez)
const handleInitialize = async () => {
  await ensureTaskbarAppFolder({ ... });
};

// ❌ INCORRECTO: NO llamar en loops
for (const item of items) {
  await ensureTaskbarAppFolder({ ... }); // ❌ Innecesario
}

// ❌ INCORRECTO: NO llamar en navegación
const handleNavigation = () => {
  ensureTaskbarAppFolder({ ... }); // ❌ Innecesario
  navigate('/tablero');
};
```

### 4. Verificación de Estado (Opcional)
```typescript
// ✅ Solo si realmente necesitas verificar antes de crear
// Nota: ensureTaskbarAppFolder ya es idempotente, esto es opcional
const checkFolderExists = async (appId: string) => {
  const { listFiles } = await import('@/services/controlFileB2Service');
  const folders = await listFiles(null);
  return folders.some(f => f.metadata?.appId === appId && f.metadata?.source === 'taskbar');
};
```

## ⚠️ Prohibiciones Explícitas

### ❌ NO crear carpetas taskbar manualmente
```typescript
// ❌ PROHIBIDO: Usar API para crear taskbar
await fetch('/api/folders/create', {
  body: JSON.stringify({ source: 'taskbar', ... })
});

// ❌ PROHIBIDO: Usar createFolder() para taskbar
await createFolder('ControlAudit', null, 'taskbar');

// ❌ PROHIBIDO: IDs dinámicos
const id = `taskbar-${Date.now()}`;
const id = `taskbar-${Math.random()}`;
```

### ✅ ÚNICO mecanismo válido
```typescript
// ✅ CORRECTO: Solo ensureTaskbarAppFolder
import { ensureTaskbarAppFolder } from '@/utils/taskbar-folder';

await ensureTaskbarAppFolder({
  appId: 'controlaudit',
  appName: 'ControlAudit',
  userId: user.uid
});
```

## 📞 Soporte

**¿Problemas?**
1. Verifica que el usuario esté autenticado
2. Usa `ensureTaskbarAppFolder` (NO APIs manuales)
3. Verifica que el helper esté importado correctamente
4. Revisa la consola del navegador
5. Contacta: soporte@controldoc.app

**¿Funcionando?**
- ✅ La carpeta aparece en el taskbar
- ✅ Al hacer clic navega correctamente
- ✅ Se pueden subir/descargar archivos
- ✅ Las subcarpetas se crean correctamente
- ✅ No hay duplicados (helper idempotente)

---

**¡Tu app ahora tiene acceso directo desde ControlFile!** 🚀
