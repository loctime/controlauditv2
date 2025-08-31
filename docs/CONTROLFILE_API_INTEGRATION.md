# ControlFile Service - Integración Frontend

## 📋 Descripción

El servicio `ControlFileService` es una clase JavaScript que maneja la comunicación con el backend de ControlAudit para subida de archivos y gestión de usuarios. Proporciona una interfaz simplificada para interactuar con la API.

## 🔧 Configuración

### Importación
```javascript
import { controlFileService } from '../services/controlFileService';
```

### Configuración Automática
El servicio se configura automáticamente según el entorno:
- **Desarrollo**: `http://localhost:4000`
- **Producción**: `https://controlauditv2.onrender.com`

## 📁 Métodos Principales

### 1. Verificar Conectividad
```javascript
// Verificar si ControlFile está disponible
const isAvailable = await controlFileService.isControlFileAvailable();
console.log('ControlFile disponible:', isAvailable);

// Verificar conectividad completa
const isConnected = await controlFileService.checkConnectivity();
console.log('Conectividad:', isConnected);
```

### 2. Obtener Información de Diagnóstico
```javascript
const diagnosticInfo = await controlFileService.getDiagnosticInfo();
console.log('Información de diagnóstico:', diagnosticInfo);
```

**Respuesta:**
```json
{
  "baseURL": "https://controlauditv2.onrender.com",
  "environment": "production",
  "isDevelopment": false,
  "serviceAvailable": true,
  "timestamp": "2025-08-31T19:43:13.789Z",
  "userAgent": "Mozilla/5.0...",
  "hasAuth": true,
  "authUid": "Ez0zKfBsjsXxhUt8AXa6JMq3jXP2"
}
```

### 3. Subida Completa de Archivos
```javascript
// Subir archivo con metadatos
const file = fileInput.files[0];
const metadata = {
  tipo: 'logo_sistema',
  app: 'controlaudit',
  userId: userProfile?.uid,
  categoria: 'branding',
  uso: 'logo_principal',
  empresa: userProfile?.displayName || 'Sistema',
  test: false
};

try {
  const result = await controlFileService.uploadFileComplete(file, metadata);
  console.log('✅ Archivo subido:', result);
} catch (error) {
  console.error('❌ Error en subida:', error);
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "fileId": "cf_1756669394939_abc123",
  "url": "https://example.com/files/cf_1756669394939_abc123",
  "metadata": {
    "uploadedAt": "2025-08-31T19:43:14.939Z",
    "originalName": "logo.png",
    "size": 187659,
    "mimeType": "image/png"
  }
}
```

### 4. Subida Simulada (Fallback)
```javascript
// Si la API no está disponible, usar modo simulado
const simulatedResult = await controlFileService.simulateUpload(file, metadata);
console.log('✅ Subida simulada:', simulatedResult);
```

**Respuesta simulada:**
```json
{
  "success": true,
  "fileId": "cf_sim_1756669394939_abc123",
  "url": "https://example.com/simulated/cf_sim_1756669394939_abc123",
  "metadata": {
    "tipo": "logo_sistema",
    "app": "controlaudit",
    "simulated": true,
    "originalName": "logo.png",
    "size": 187659
  }
}
```

## 🧪 Métodos de Prueba

### 1. Probar Perfil de Usuario
```javascript
try {
  const result = await controlFileService.testProfile();
  console.log('✅ Perfil probado:', result);
} catch (error) {
  console.error('❌ Error en perfil:', error);
}
```

### 2. Probar Presign (Crear Sesión)
```javascript
try {
  const result = await controlFileService.testPresign();
  console.log('✅ Presign probado:', result);
} catch (error) {
  console.error('❌ Error en presign:', error);
}
```

### 3. Probar Subida Completa
```javascript
try {
  const result = await controlFileService.testCompleteUpload();
  console.log('✅ Subida completa probada:', result);
} catch (error) {
  console.error('❌ Error en subida completa:', error);
}
```

## 🔄 Flujo de Subida Completo

### Opción 1: Subida Directa (Recomendada)
```javascript
const handleFileUpload = async (file) => {
  try {
    const metadata = {
      tipo: 'documento',
      app: 'controlaudit',
      userId: userProfile?.uid,
      categoria: 'auditoria',
      empresa: 'Mi Empresa'
    };

    const result = await controlFileService.uploadFileComplete(file, metadata);
    
    if (result.simulated) {
      console.log('⚠️ Archivo subido en modo simulado');
    } else {
      console.log('✅ Archivo subido exitosamente');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error en subida:', error);
    throw error;
  }
};
```

### Opción 2: Flujo Manual (3 Pasos)
```javascript
const handleManualUpload = async (file) => {
  try {
    // 1. Crear sesión de subida
    const session = await controlFileService.createUploadSession({
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // 2. Subir archivo
    const uploadResult = await controlFileService.uploadFile(file, session.uploadId);
    
    // 3. Confirmar subida
    const confirmResult = await controlFileService.confirmUpload(session.uploadId);
    
    return confirmResult;
  } catch (error) {
    console.error('❌ Error en subida manual:', error);
    throw error;
  }
};
```

## 🚨 Manejo de Errores

### Errores Comunes
```javascript
try {
  const result = await controlFileService.uploadFileComplete(file, metadata);
} catch (error) {
  if (error.message.includes('No se puede conectar')) {
    console.log('🔴 Error de conectividad - usar modo simulado');
    const simulatedResult = await controlFileService.simulateUpload(file, metadata);
  } else if (error.message.includes('Token inválido')) {
    console.log('🔴 Error de autenticación - renovar token');
  } else if (error.message.includes('Archivo demasiado grande')) {
    console.log('🔴 Archivo excede el límite de 50MB');
  } else {
    console.log('🔴 Error desconocido:', error.message);
  }
}
```

### Verificar Estado del Servicio
```javascript
const checkServiceStatus = async () => {
  const diagnosticInfo = await controlFileService.getDiagnosticInfo();
  
  if (!diagnosticInfo.serviceAvailable) {
    console.log('⚠️ ControlFile no disponible - usando modo local');
    return false;
  }
  
  if (!diagnosticInfo.hasAuth) {
    console.log('⚠️ Usuario no autenticado');
    return false;
  }
  
  console.log('✅ Servicio disponible y autenticado');
  return true;
};
```

## 📱 Ejemplo de Uso Completo

```javascript
import { controlFileService } from '../services/controlFileService';
import { useAuth } from '../context/AuthContext';

const FileUploadComponent = () => {
  const { userProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      // Verificar conectividad
      const isConnected = await controlFileService.checkConnectivity();
      
      // Configurar metadatos
      const metadata = {
        tipo: 'test_upload',
        app: 'controlaudit',
        userId: userProfile?.uid,
        test: true
      };

      // Intentar subida real
      const result = await controlFileService.uploadFileComplete(file, metadata);
      
      setUploadResult(result);
      console.log('✅ Subida exitosa:', result);
      
    } catch (error) {
      console.error('❌ Error en subida:', error);
      
      // Si falla, intentar modo simulado
      if (error.message.includes('No se puede conectar')) {
        try {
          const simulatedResult = await controlFileService.simulateUpload(file, {
            ...metadata,
            tipo: 'test_upload_simulated'
          });
          
          setUploadResult({
            ...simulatedResult,
            simulated: true
          });
        } catch (simError) {
          setUploadError(`Error real: ${error.message}\nError simulado: ${simError.message}`);
        }
      } else {
        setUploadError(error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
        accept="image/*"
      />
      
      {uploading && <p>Subiendo archivo...</p>}
      
      {uploadResult && (
        <div>
          <h3>✅ Archivo subido exitosamente!</h3>
          <p>File ID: {uploadResult.fileId}</p>
          <p>URL: <a href={uploadResult.url} target="_blank">Ver archivo</a></p>
          {uploadResult.simulated && <p>⚠️ Modo simulado</p>}
        </div>
      )}
      
      {uploadError && (
        <div>
          <h3>❌ Error en la subida</h3>
          <p>{uploadError}</p>
        </div>
      )}
    </div>
  );
};
```

## 🔧 Configuración Avanzada

### Personalizar URL Base
```javascript
// El servicio detecta automáticamente el entorno
// Para desarrollo: http://localhost:4000
// Para producción: https://controlauditv2.onrender.com

// Si necesitas cambiar la URL manualmente:
controlFileService.baseURL = 'https://tu-backend-personalizado.com';
```

### Timeouts Personalizados
```javascript
// Los timeouts están configurados por defecto:
// - Conectividad: 5 segundos
// - Presign: 30 segundos
// - Upload: 60 segundos
// - Complete: 30 segundos
```

## 📊 Monitoreo y Logs

El servicio incluye logs detallados para debugging:

```javascript
// Habilitar logs detallados (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔧 ControlFile Service inicializado con URL:', controlFileService.baseURL);
  console.log('🌍 Entorno:', import.meta.env.DEV ? 'development' : 'production');
}
```

## 🚀 Mejores Prácticas

1. **Siempre manejar errores** con try/catch
2. **Verificar conectividad** antes de subidas importantes
3. **Usar modo simulado** como fallback
4. **Validar archivos** antes de subir (tamaño, tipo)
5. **Mostrar progreso** al usuario durante subidas
6. **Limpiar estados** después de completar operaciones

## 🔗 Enlaces Útiles

- [Documentación de la API Backend](./README_API.md)
- [Configuración de Firebase](../firebaseConfig.js)
- [Contexto de Autenticación](../context/AuthContext.jsx)
