# Configuración de ControlFile

## 🎯 Objetivo
Configurar la integración entre ControlAudit y la API de ControlFile para que los archivos se suban a B2 (Backblaze) en lugar de solo crear registros en Firestore.

## 🔍 Problema Actual
- **Frontend**: Usa proyecto Firebase `auditoria-f9fc4`
- **ControlFile API**: Usa proyecto Firebase `controlstorage-eb796`
- **Resultado**: Tokens no son válidos (401 Unauthorized)

## ✅ Solución

### Opción 1: Configurar ControlFile para usar el mismo proyecto Firebase

1. **Modificar la API de ControlFile** para que use el proyecto `auditoria-f9fc4`
2. **Actualizar las credenciales** en la API de ControlFile:

```bash
# En la API de ControlFile, cambiar a:
FIREBASE_PROJECT_ID=auditoria-f9fc4
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-pyief@auditoria-f9fc4.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

3. **Cambiar la URL en el frontend**:

```javascript
// En src/services/controlFileService.js
this.baseURL = 'https://controlfile.onrender.com'; // ✅ URL correcta de ControlFile
```

### Opción 2: Configurar autenticación entre proyectos

1. **Crear un endpoint de autenticación** en la API de ControlFile que acepte tokens de otros proyectos
2. **Implementar verificación de tokens** entre proyectos Firebase
3. **Mantener ambos proyectos** pero sincronizar autenticación

### Opción 3: Registrar usuarios en ambos proyectos

1. **Crear usuarios** en el proyecto `controlstorage-eb796` con los mismos emails
2. **Sincronizar autenticación** entre proyectos
3. **Usar tokens específicos** para cada proyecto

## 🚀 Implementación Recomendada

### Paso 1: Configurar ControlFile (Opción 1)

1. **Acceder a la configuración** de la API de ControlFile
2. **Cambiar las credenciales** de Firebase al proyecto `auditoria-f9fc4`
3. **Reiniciar** la API de ControlFile

### Paso 2: Actualizar Frontend

1. **Cambiar la URL base** en `src/services/controlFileService.js`:

```javascript
this.baseURL = 'https://controlfile.onrender.com';
```

2. **Probar la integración**:

```javascript
// En la consola del navegador
const controlFileService = new ControlFileService();
await controlFileService.isControlFileAvailable(); // Debe retornar true
```

### Paso 3: Verificar Funcionamiento

1. **Subir un archivo** desde la aplicación
2. **Verificar** que se guarde en B2
3. **Comprobar** que aparezca en ControlFile

## 📋 Checklist

- [ ] Configurar ControlFile para usar proyecto `auditoria-f9fc4`
- [ ] Cambiar URL base en frontend
- [ ] Probar autenticación
- [ ] Probar subida de archivos
- [ ] Verificar almacenamiento en B2
- [ ] Documentar proceso

## 🔧 Configuración Actual

### Frontend (ControlAudit)
```javascript
// Proyecto Firebase: auditoria-f9fc4
// URL: https://controlauditv2.onrender.com
```

### ControlFile API
```javascript
// Proyecto Firebase: controlstorage-eb796
// URL: https://controlfile.onrender.com
// B2 Bucket: controlfile
```

## 📞 Contacto

Para configurar la API de ControlFile, contactar al administrador del proyecto o seguir los pasos de configuración documentados.

---

**Estado**: ⚠️ Temporalmente usando backend actual hasta configurar autenticación de ControlFile
