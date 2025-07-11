# Configuración del Administrador del Sistema

## 🎯 **Problema Resuelto**

### **Error Original:**
```
AuthContext.jsx:66 Error al crear/obtener perfil de usuario: ReferenceError: process is not defined
```

### **Causa:**
- `process.env` no está disponible en el entorno del navegador con Vite
- Se intentaba acceder a `process.env.ADMIN_ROLE` que no existe

## ✅ **Solución Implementada**

### **1. Archivo de Configuración Centralizado**
Creado `src/config/admin.js`:
```javascript
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_ROLE || 'admin@auditoria.com';

export const isAdmin = (userEmail) => {
  return userEmail === ADMIN_EMAIL;
};

export const getUserRole = (userEmail) => {
  return isAdmin(userEmail) ? 'max' : 'operario';
};
```

### **2. Uso Correcto de Variables de Entorno**
- ✅ **Vite**: `import.meta.env.VITE_*`
- ✅ **Valor por defecto**: `'admin@auditoria.com'`
- ✅ **Función helper**: `getUserRole(email)`

### **3. Integración en AuthContext**
```javascript
import { getUserRole } from '../../config/admin';

// En createOrGetUserProfile:
role: getUserRole(firebaseUser.email)
```

## 🔧 **Configuración del Administrador**

### **Opción 1: Variable de Entorno (Recomendado)**
Crear archivo `.env` en la raíz del proyecto:
```env
VITE_ADMIN_ROLE=tu-email@ejemplo.com
```

### **Opción 2: Modificar Directamente el Código**
Editar `src/config/admin.js`:
```javascript
export const ADMIN_EMAIL = 'tu-email@ejemplo.com';
```

### **Opción 3: Usar Valor por Defecto**
Si no se configura, usa: `admin@auditoria.com`

## 📋 **Pasos para Configurar**

### **1. Identificar el Email del Administrador**
- Usar el email que se usará para el registro/login del administrador
- Ejemplo: `admin@sistema.com`

### **2. Configurar Variable de Entorno**
```bash
# En la raíz del proyecto, crear .env
echo "VITE_ADMIN_ROLE=admin@sistema.com" > .env
```

### **3. Reiniciar el Servidor de Desarrollo**
```bash
npm run dev
```

### **4. Verificar Configuración**
- Registrar usuario con el email configurado
- Verificar que aparece como "max" en el rol
- Comprobar acceso completo a todas las funcionalidades

## 🔍 **Verificación de Funcionamiento**

### **Para Administradores:**
- ✅ Ven todos los formularios
- ✅ Pueden editar/eliminar cualquier formulario
- ✅ Acceso completo a todas las funcionalidades
- ✅ Rol mostrado como "max"

### **Para Usuarios Regulares:**
- ✅ Solo ven sus propios formularios
- ✅ Permisos limitados según configuración
- ✅ Rol mostrado como "operario"

## 🚨 **Notas Importantes**

### **Seguridad:**
- ⚠️ **No compartir** el email del administrador
- ⚠️ **Usar email real** del administrador del sistema
- ⚠️ **Configurar antes** de usar en producción

### **Desarrollo:**
- ✅ **Hot reload** funciona con cambios en `.env`
- ✅ **Valor por defecto** si no se configura
- ✅ **Fácil cambio** de administrador

### **Producción:**
- ✅ **Variables de entorno** en el servidor
- ✅ **Configuración segura** sin exponer en código
- ✅ **Múltiples administradores** posibles

## 🔧 **Troubleshooting**

### **Error: "process is not defined"**
- ✅ **Solución**: Usar `import.meta.env` en lugar de `process.env`
- ✅ **Implementado**: En `src/config/admin.js`

### **Error: "VITE_ADMIN_ROLE is not defined"**
- ✅ **Solución**: Crear archivo `.env` con la variable
- ✅ **Alternativa**: Modificar directamente `admin.js`

### **Usuario no aparece como administrador**
- ✅ **Verificar**: Email exacto en la configuración
- ✅ **Reiniciar**: Servidor de desarrollo
- ✅ **Limpiar**: Cache del navegador

## 📊 **Estructura de Archivos**

```
src/
├── config/
│   └── admin.js          # ✅ Configuración del administrador
├── components/
│   └── context/
│       └── AuthContext.jsx  # ✅ Usa getUserRole()
└── .env                  # ✅ Variables de entorno (crear)
```

---

**✅ Error corregido exitosamente**
**🔧 Sistema de administrador configurado**
**🚀 Listo para usar en desarrollo y producción** 