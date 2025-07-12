# Estructura de Roles - Resumen Final

## 🎯 **Jerarquía de Roles Implementada**

### **1. Developer (`supermax`)**
- **Descripción**: Desarrolladores del sistema
- **Responsabilidades**:
  - Mantenimiento del sistema
  - Acceso completo a todas las funcionalidades
  - Gestión de configuración global
  - Soporte técnico
- **Código de activación**: `SUPERMAX2024`
- **Color**: Rojo (error)

### **2. Cliente Administrador (`max`)**
- **Descripción**: Clientes que administran sus propias empresas
- **Responsabilidades**:
  - Crear y gestionar usuarios para su empresa
  - Administrar empresas y sucursales
  - Realizar auditorías
  - Gestionar reportes
- **Código de activación**: `AUDITORIA2024`
- **Color**: Naranja (warning)

### **3. Usuario (`operario`)**
- **Descripción**: Usuarios creados por los clientes administradores
- **Responsabilidades**:
  - Realizar auditorías asignadas
  - Ver reportes propios
  - Acceso limitado según permisos específicos
- **Código de activación**: No aplica (creados por administradores)
- **Color**: Gris (default)

## 🔄 **Flujo de Trabajo**

### **Escenario 1: Developer**
1. **Registro**: Usuario se registra en el sistema
2. **Activación**: Usa código `SUPERMAX2024`
3. **Acceso**: Control total del sistema
4. **Funciones**: Mantenimiento, soporte, configuración

### **Escenario 2: Cliente Administrador**
1. **Registro**: Usuario se registra en el sistema
2. **Activación**: Usa código `AUDITORIA2024`
3. **Acceso**: Gestión de su empresa y usuarios
4. **Funciones**: Crear usuarios, gestionar auditorías

### **Escenario 3: Usuario**
1. **Creación**: Creado por un Cliente Administrador
2. **Asignación**: Recibe permisos específicos
3. **Acceso**: Funcionalidades limitadas
4. **Funciones**: Realizar auditorías asignadas

## 🛡️ **Sistema de Permisos**

### **Developer (`supermax`)**
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

### **Cliente Administrador (`max`)**
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

### **Usuario (`operario`)**
```javascript
permisos: {
  puedeCrearEmpresas: false,
  puedeCrearSucursales: false,
  puedeCrearAuditorias: false,
  puedeCompartirAuditorias: false,
  puedeAgregarSocios: false
}
```

## 📋 **Casos de Uso Típicos**

### **Para Developers**
- **Mantenimiento**: Actualizar sistema, corregir bugs
- **Soporte**: Ayudar a clientes administradores
- **Configuración**: Ajustar parámetros globales
- **Monitoreo**: Revisar logs y estadísticas

### **Para Clientes Administradores**
- **Gestión de Empresa**: Crear y configurar su empresa
- **Crear Usuarios**: Agregar empleados al sistema
- **Asignar Permisos**: Configurar qué puede hacer cada usuario
- **Realizar Auditorías**: Usar el sistema para sus auditorías

### **Para Usuarios**
- **Realizar Auditorías**: Completar formularios de auditoría
- **Ver Reportes**: Acceder a resultados de sus auditorías
- **Trabajo Diario**: Usar el sistema para sus tareas asignadas

## 🎨 **Interfaz Visual**

### **Dashboard**
- **Developer**: Acceso completo a todas las secciones
- **Cliente Admin**: Acceso a gestión de usuarios y contenido
- **Usuario**: Acceso limitado según permisos

### **Gestión de Usuarios**
- **Developer**: Puede ver y gestionar todos los usuarios
- **Cliente Admin**: Puede gestionar usuarios de su empresa
- **Usuario**: No tiene acceso a esta sección

### **Chips de Identificación**
- **Developer**: Chip rojo con "Developer"
- **Cliente Admin**: Chip naranja con "Cliente Administrador"
- **Usuario**: Chip gris con "Usuario"

## 🔧 **Configuración del Sistema**

### **Archivo .env**
```bash
# Código para Clientes Administradores
VITE_ADMIN_CODE=AUDITORIA2024

# Código para Developers
VITE_SUPER_ADMIN_CODE=SUPERMAX2024
```

### **Activación de Roles**
1. **Ir al Dashboard**
2. **Hacer clic** en "Hacerme Administrador"
3. **Ingresar código**:
   - `AUDITORIA2024` → Cliente Administrador
   - `SUPERMAX2024` → Developer
4. **Confirmar** y esperar recarga

## 🚀 **Ventajas del Sistema**

### **Para Developers**
- ✅ Control total del sistema
- ✅ Capacidad de soporte técnico
- ✅ Acceso a logs y debugging
- ✅ Gestión de configuración global

### **Para Clientes Administradores**
- ✅ Gestión independiente de su empresa
- ✅ Creación de usuarios propios
- ✅ Control de permisos específicos
- ✅ Autonomía en el uso del sistema

### **Para Usuarios**
- ✅ Interfaz simplificada
- ✅ Acceso solo a funciones necesarias
- ✅ Seguridad por limitación de permisos
- ✅ Enfoque en tareas específicas

## 📊 **Estructura de Datos**

### **En Firestore**
```javascript
// Colección: usuarios
{
  uid: "user-id",
  email: "user@example.com",
  displayName: "Nombre Usuario",
  role: "operario|max|supermax",
  empresaId: "empresa-id", // Para usuarios de clientes
  permisos: {
    // Permisos específicos según rol
  },
  createdAt: timestamp
}
```

---

**Esta estructura permite una separación clara de responsabilidades y un sistema escalable para diferentes tipos de usuarios.** 