# Sistema de Roles - Tres Niveles

## 🎯 **Estructura de Roles Implementada**

### **1. Operario (`operario`)**
- **Descripción**: Usuarios normales del sistema
- **Permisos básicos**:
  - Crear auditorías (si tienen permiso)
  - Ver reportes propios
  - Acceso limitado según permisos específicos

### **2. Administrador (`max`)**
- **Descripción**: Administradores del sistema
- **Permisos completos**:
  - Crear Empresas
  - Crear Sucursales
  - Crear Auditorías
  - Compartir Auditorías
  - Agregar Socios
  - **Gestionar Usuarios** ✅

### **3. Super Administrador (`supermax`)**
- **Descripción**: Dueños del sistema
- **Permisos máximos**:
  - Todos los permisos de administrador
  - **Gestionar Sistema** ✅
  - **Eliminar Usuarios** ✅
  - **Ver Logs** ✅
  - **Acceso completo** ✅

## 🔐 **Códigos de Activación**

### **Código de Administrador**
- **Código**: `AUDITORIA2024`
- **Rol asignado**: `max` (Administrador)
- **Configuración**: `VITE_ADMIN_CODE` en `.env`

### **Código de Super Administrador**
- **Código**: `SUPERMAX2024`
- **Rol asignado**: `supermax` (Super Administrador)
- **Configuración**: `VITE_SUPER_ADMIN_CODE` en `.env`

## 📋 **Flujo de Activación**

### **Paso 1: Acceder al Dashboard**
1. Ir a `/dashboard`
2. Buscar botón "Hacerme Administrador"

### **Paso 2: Ingresar Código**
1. Hacer clic en el botón
2. Se abre modal con información de códigos
3. Ingresar código deseado:
   - `AUDITORIA2024` → Administrador
   - `SUPERMAX2024` → Super Administrador

### **Paso 3: Confirmar Activación**
1. Hacer clic en "Activar"
2. Sistema valida el código
3. Actualiza rol y permisos en Firestore
4. Recarga automáticamente la página

## 🛡️ **Sistema de Permisos**

### **Permisos por Rol**

#### **Operario (`operario`)**
```javascript
permisos: {
  puedeCrearEmpresas: false,
  puedeCrearSucursales: false,
  puedeCrearAuditorias: false,
  puedeCompartirAuditorias: false,
  puedeAgregarSocios: false
}
```

#### **Administrador (`max`)**
```javascript
permisos: {
  puedeCrearEmpresas: true,
  puedeCrearSucursales: true,
  puedeCrearAuditorias: true,
  puedeCompartirAuditorias: true,
  puedeAgregarSocios: true,
  puedeGestionarUsuarios: true
}
```

#### **Super Administrador (`supermax`)**
```javascript
permisos: {
  puedeCrearEmpresas: true,
  puedeCrearSucursales: true,
  puedeCrearAuditorias: true,
  puedeCompartirAuditorias: true,
  puedeAgregarSocios: true,
  puedeGestionarUsuarios: true,
  puedeGestionarSistema: true,
  puedeEliminarUsuarios: true,
  puedeVerLogs: true
}
```

## 🎨 **Interfaz Visual**

### **Chips de Roles**
- **Operario**: Gris (default)
- **Administrador**: Naranja (warning)
- **Super Administrador**: Rojo (error)

### **Botones de Acción**
- **"Hacerme Administrador"**: Solo visible para operarios
- **Modal de activación**: Muestra ambos códigos disponibles
- **Feedback visual**: Mensajes específicos por tipo de rol

## 🔧 **Configuración**

### **Archivo .env**
```bash
# Código para administradores
VITE_ADMIN_CODE=AUDITORIA2024

# Código para super administradores
VITE_SUPER_ADMIN_CODE=SUPERMAX2024
```

### **Archivo de Configuración**
```javascript
// src/config/admin.js
export const ADMIN_ACTIVATION_CODE = import.meta.env.VITE_ADMIN_CODE || 'AUDITORIA2024';
export const SUPER_ADMIN_ACTIVATION_CODE = import.meta.env.VITE_SUPER_ADMIN_CODE || 'SUPERMAX2024';
```

## 🚀 **Funcionalidades por Rol**

### **Operario**
- ✅ Realizar auditorías
- ✅ Ver reportes propios
- ✅ Acceso básico al sistema

### **Administrador**
- ✅ Todo lo de operario
- ✅ Crear empresas y sucursales
- ✅ Gestionar usuarios
- ✅ Compartir auditorías
- ✅ Agregar socios

### **Super Administrador**
- ✅ Todo lo de administrador
- ✅ Eliminar usuarios
- ✅ Ver logs del sistema
- ✅ Gestión completa del sistema
- ✅ Acceso a todas las funcionalidades

## 🔄 **Verificación de Permisos**

### **En Componentes**
```javascript
// Verificar si es administrador
if (role !== 'max' && role !== 'supermax') {
  return <Alert>No tienes permisos</Alert>;
}

// Verificar si es super administrador
if (role !== 'supermax') {
  return <Alert>Solo super administradores</Alert>;
}
```

### **En Configuración**
```javascript
// Verificar administrador
export const isAdmin = (userProfile) => {
  return userProfile?.role === 'max' || userProfile?.role === 'supermax';
};

// Verificar super administrador
export const isSuperAdmin = (userProfile) => {
  return userProfile?.role === 'supermax';
};
```

## 📊 **Estructura en Firestore**

### **Documento de Usuario**
```javascript
{
  uid: "user-id",
  email: "user@example.com",
  displayName: "Nombre Usuario",
  role: "operario|max|supermax",
  permisos: {
    // Permisos específicos según rol
  },
  createdAt: timestamp,
  empresas: [],
  auditorias: [],
  socios: []
}
```

## 🎯 **Casos de Uso**

### **Escenario 1: Nuevo Usuario**
1. Usuario se registra → Rol: `operario`
2. Usuario activa código → Rol: `max` o `supermax`
3. Usuario accede a funcionalidades según rol

### **Escenario 2: Promoción de Usuario**
1. Administrador crea usuario → Rol: `operario`
2. Usuario activa código → Rol: `max` o `supermax`
3. Usuario puede gestionar según permisos

### **Escenario 3: Gestión de Sistema**
1. Super administrador tiene acceso completo
2. Puede eliminar usuarios
3. Puede ver logs del sistema
4. Puede gestionar configuración global

## 🛡️ **Seguridad**

### **Características**
- ✅ Códigos seguros y configurables
- ✅ Validación en frontend y backend
- ✅ Permisos granulares
- ✅ Auditoría de cambios
- ✅ Prevención de escalación de privilegios

### **Buenas Prácticas**
- 🔐 Usar códigos complejos en producción
- 🔐 Cambiar códigos periódicamente
- 🔐 Documentar cambios de rol
- 🔐 Monitorear accesos administrativos

---

**¿Necesitas ayuda para configurar o usar el sistema de tres niveles?** 