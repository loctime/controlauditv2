# Sistema de Gestión de Usuarios - Documentación

## 🎯 **Funcionalidades Implementadas**

### **1. Página de Administración de Usuarios**
- **Ubicación**: `/usuarios`
- **Acceso**: Solo administradores (`role: 'max'` o `role: 'admin'`)
- **Funcionalidades**:
  - Ver lista de todos los usuarios
  - Crear nuevos usuarios con permisos específicos
  - Editar usuarios existentes
  - Eliminar usuarios
  - Gestionar roles y permisos

### **2. Modal de Creación/Edición de Usuarios**
- **Campos requeridos**:
  - Nombre completo
  - Email
  - Contraseña (solo para nuevos usuarios)
  - Rol
  - Permisos específicos

### **3. Sistema de Roles**
- **Super Administrador (`max`)**: Acceso completo al sistema
- **Administrador (`admin`)**: Puede gestionar usuarios y contenido
- **Operario (`operario`)**: Acceso limitado según permisos

### **4. Sistema de Permisos**
- **Crear Empresas**: Permite crear nuevas empresas
- **Crear Sucursales**: Permite crear sucursales
- **Crear Auditorías**: Permite realizar auditorías
- **Compartir Auditorías**: Permite compartir auditorías con otros usuarios
- **Agregar Socios**: Permite agregar socios a empresas

## 🔧 **Configuración del Administrador**

### **Archivo de Configuración**
```javascript
// src/config/admin.js
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_ROLE || 'admin@auditoria.com';
```

### **Variables de Entorno**
```bash
# .env
VITE_ADMIN_ROLE=tu-email@dominio.com
```

### **Cómo Cambiar el Administrador**
1. Crear archivo `.env` en la raíz del proyecto
2. Agregar: `VITE_ADMIN_ROLE=tu-email@dominio.com`
3. Reiniciar la aplicación

## 📋 **Flujo de Trabajo**

### **Para Administradores**
1. **Acceder a la página**: Ir a `/usuarios`
2. **Crear usuario**: Hacer clic en "Agregar Usuario"
3. **Completar formulario**:
   - Nombre completo
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Seleccionar rol
   - Configurar permisos
4. **Guardar**: El usuario se crea en Firebase Auth y Firestore

### **Para Usuarios Nuevos**
1. **Primer acceso**: Usar email y contraseña proporcionados
2. **Cambiar contraseña**: Recomendado en el primer inicio de sesión
3. **Acceso limitado**: Según los permisos asignados

## 🛡️ **Seguridad**

### **Verificación de Permisos**
- Solo usuarios con `role: 'max'` o `role: 'admin'` pueden acceder
- Verificación en el frontend y backend
- Protección de rutas implementada

### **Validaciones**
- Email único en el sistema
- Contraseña mínima de 6 caracteres
- Campos obligatorios validados
- Prevención de eliminación de cuenta propia

## 🎨 **Interfaz de Usuario**

### **Tabla de Usuarios**
- **Columnas**:
  - Nombre completo
  - Email
  - Rol (con chips de colores)
  - Permisos (chips individuales)
  - Fecha de creación
  - Acciones (editar/eliminar)

### **Modal de Usuario**
- **Formulario responsive**
- **Validación en tiempo real**
- **Checkboxes para permisos**
- **Selector de roles**

### **Feedback Visual**
- **Notificaciones toast** para acciones
- **Estados de carga** durante operaciones
- **Confirmaciones** para acciones destructivas
- **Mensajes de error** descriptivos

## 🔄 **Integración con Firebase**

### **Firebase Auth**
- Creación de usuarios con email/password
- Autenticación automática
- Gestión de sesiones

### **Firestore**
- **Colección**: `usuarios`
- **Documentos**: Un documento por usuario
- **Campos**:
  ```javascript
  {
    uid: "firebase-auth-uid",
    email: "usuario@ejemplo.com",
    displayName: "Nombre Completo",
    role: "operario|admin|max",
    permisos: {
      puedeCrearEmpresas: boolean,
      puedeCrearSucursales: boolean,
      puedeCrearAuditorias: boolean,
      puedeCompartirAuditorias: boolean,
      puedeAgregarSocios: boolean
    },
    createdAt: timestamp,
    empresas: ["empresa-id-1", "empresa-id-2"],
    auditorias: ["auditoria-id-1"],
    socios: ["usuario-id-1"],
    configuracion: {
      notificaciones: boolean,
      tema: "light|dark"
    }
  }
  ```

## 🚀 **Funcionalidades Futuras**

### **Mejoras Sugeridas**
1. **Cambio de contraseña**: Permitir a usuarios cambiar su contraseña
2. **Recuperación de contraseña**: Sistema de reset por email
3. **Perfiles de usuario**: Páginas de perfil personalizadas
4. **Historial de acciones**: Log de actividades de usuarios
5. **Importación masiva**: Crear múltiples usuarios desde CSV
6. **Notificaciones**: Alertas cuando se asignan nuevos permisos

### **Seguridad Avanzada**
1. **Autenticación de dos factores**
2. **Sesiones múltiples**
3. **Reglas de Firestore más granulares**
4. **Auditoría de cambios**

## 🐛 **Solución de Problemas**

### **Error: "No tienes permisos"**
- Verificar que el usuario tenga `role: 'max'` o `role: 'admin'`
- Revisar la configuración en `src/config/admin.js`

### **Error: "Email ya en uso"**
- El email ya está registrado en Firebase Auth
- Usar un email diferente o eliminar el usuario existente

### **Error: "Contraseña débil"**
- Firebase requiere mínimo 6 caracteres
- Agregar números y caracteres especiales

### **Usuario no aparece en la lista**
- Verificar que se guardó correctamente en Firestore
- Revisar la colección `usuarios` en Firebase Console

## 📞 **Soporte**

Para problemas o preguntas sobre el sistema de gestión de usuarios:
- Revisar esta documentación
- Verificar la configuración de Firebase
- Consultar los logs de la consola del navegador
- Verificar las reglas de Firestore

---

**¿Necesitas ayuda con alguna funcionalidad específica del sistema de usuarios?** 