# Páginas por Rol - Sistema Dinámico

## 🎯 **Sistema de Navegación Dinámico**

El sistema ahora muestra automáticamente solo las páginas que cada usuario puede ver, basándose en su **rol** y **permisos específicos**. Cuando un administrador cambia los permisos de un usuario, el menú se actualiza automáticamente.

## 📋 **Páginas por Rol**

### **1. Usuario (`operario`)**

#### **Páginas Siempre Disponibles:**
- ✅ **Panel de Control** (`/dashboard`)
- ✅ **Inicio** (`/`)
- ✅ **Mi Perfil** (`/perfil`)

#### **Páginas Condicionales:**
- 🔐 **Auditoría** (`/auditoria`) - Solo si tiene `puedeCrearAuditorias: true`
- 🔐 **Reporte** (`/reporte`) - Solo si tiene `puedeCrearAuditorias: true`

#### **Páginas NO Disponibles:**
- ❌ Formularios
- ❌ Editar Formulario
- ❌ Establecimientos
- ❌ Sucursales
- ❌ Usuarios
- ❌ Logs del Sistema
- ❌ Configuración

---

### **2. Cliente Administrador (`max`)**

#### **Páginas Siempre Disponibles:**
- ✅ **Panel de Control** (`/dashboard`)
- ✅ **Inicio** (`/`)
- ✅ **Formularios** (`/formulario`)
- ✅ **Editar Formulario** (`/editar`)
- ✅ **Mi Perfil** (`/perfil`)

#### **Páginas Condicionales:**
- 🔐 **Auditoría** (`/auditoria`) - Solo si tiene `puedeCrearAuditorias: true`
- 🔐 **Establecimientos** (`/establecimiento`) - Solo si tiene `puedeCrearEmpresas: true`
- 🔐 **Sucursales** (`/sucursales`) - Solo si tiene `puedeCrearSucursales: true`
- 🔐 **Reporte** (`/reporte`) - Solo si tiene `puedeCrearAuditorias: true`
- 🔐 **Usuarios** (`/usuarios`) - Solo si tiene `puedeGestionarUsuarios: true`

#### **Páginas NO Disponibles:**
- ❌ Logs del Sistema
- ❌ Configuración

---

### **3. Developer (`supermax`)**

#### **Páginas Siempre Disponibles:**
- ✅ **Panel de Control** (`/dashboard`)
- ✅ **Inicio** (`/`)
- ✅ **Formularios** (`/formulario`)
- ✅ **Editar Formulario** (`/editar`)
- ✅ **Mi Perfil** (`/perfil`)

#### **Páginas Condicionales:**
- 🔐 **Auditoría** (`/auditoria`) - Siempre disponible (rol supermax)
- 🔐 **Establecimientos** (`/establecimiento`) - Siempre disponible (rol supermax)
- 🔐 **Sucursales** (`/sucursales`) - Siempre disponible (rol supermax)
- 🔐 **Reporte** (`/reporte`) - Siempre disponible (rol supermax)
- 🔐 **Usuarios** (`/usuarios`) - Siempre disponible (rol supermax)
- 🔐 **Logs del Sistema** (`/usuarios/logs`) - Solo si tiene `puedeVerLogs: true`
- 🔐 **Configuración** (`/configuracion`) - Solo si tiene `puedeGestionarSistema: true`

## 🔧 **Cómo Funciona el Sistema**

### **Función `getMenuItems(role, permisos)`**

```javascript
// Ejemplo de uso
const menuItems = getMenuItems('max', {
  puedeCrearAuditorias: true,
  puedeCrearEmpresas: false,
  puedeGestionarUsuarios: true
});
```

### **Lógica de Filtrado**

1. **Verificación de Rol**: `item.roles.includes(role)`
2. **Verificación de Permisos**: `item.required === true || item.required`
3. **Combinación**: Solo muestra items que cumplan ambas condiciones

## 📊 **Ejemplos Prácticos**

### **Ejemplo 1: Usuario Básico**
```javascript
// Rol: operario
// Permisos: { puedeCrearAuditorias: false }

// Menú resultante:
- Panel de Control
- Inicio
- Mi Perfil
```

### **Ejemplo 2: Usuario con Permisos de Auditoría**
```javascript
// Rol: operario
// Permisos: { puedeCrearAuditorias: true }

// Menú resultante:
- Panel de Control
- Inicio
- Auditoría ✅
- Reporte ✅
- Mi Perfil
```

### **Ejemplo 3: Cliente Administrador Completo**
```javascript
// Rol: max
// Permisos: {
//   puedeCrearAuditorias: true,
//   puedeCrearEmpresas: true,
//   puedeCrearSucursales: true,
//   puedeGestionarUsuarios: true
// }

// Menú resultante:
- Panel de Control
- Inicio
- Auditoría ✅
- Formularios ✅
- Editar Formulario ✅
- Establecimientos ✅
- Sucursales ✅
- Reporte ✅
- Usuarios ✅
- Mi Perfil
```

### **Ejemplo 4: Developer Completo**
```javascript
// Rol: supermax
// Permisos: {
//   puedeVerLogs: true,
//   puedeGestionarSistema: true
// }

// Menú resultante:
- Panel de Control
- Inicio
- Auditoría ✅
- Formularios ✅
- Editar Formulario ✅
- Establecimientos ✅
- Sucursales ✅
- Reporte ✅
- Usuarios ✅
- Logs del Sistema ✅
- Configuración ✅
- Mi Perfil
```

## 🎨 **Interfaz Visual**

### **Menú Dinámico**
- **Solo muestra** páginas accesibles
- **Se actualiza automáticamente** cuando cambian permisos
- **Iconos consistentes** para cada sección
- **Navegación intuitiva** según rol

### **Feedback Visual**
- **Páginas disponibles**: Enlaces normales
- **Páginas no disponibles**: No aparecen en el menú
- **Permisos insuficientes**: Redirección automática

## 🔄 **Actualización en Tiempo Real**

### **Cuando un Administrador Cambia Permisos:**
1. **Edita usuario** en `/usuarios`
2. **Cambia permisos** específicos
3. **Guarda cambios** en Firestore
4. **Usuario ve menú actualizado** al recargar

### **Ejemplo de Cambio:**
```javascript
// Antes
Usuario: { puedeCrearAuditorias: false }
Menú: Panel de Control, Inicio, Mi Perfil

// Después (administrador cambia permisos)
Usuario: { puedeCrearAuditorias: true }
Menú: Panel de Control, Inicio, Auditoría, Reporte, Mi Perfil
```

## 🛡️ **Seguridad**

### **Doble Verificación**
- **Frontend**: Menú dinámico basado en permisos
- **Backend**: Verificación en cada ruta protegida
- **Firestore**: Reglas de seguridad adicionales

### **Prevención de Acceso**
- **Rutas protegidas**: Verificación de permisos
- **Redirección automática**: Si no tiene acceso
- **Mensajes claros**: Explicación de restricciones

## 🚀 **Ventajas del Sistema**

### **Para Administradores**
- ✅ **Control granular** de permisos
- ✅ **Interfaz limpia** para cada usuario
- ✅ **Flexibilidad total** en asignación de permisos

### **Para Usuarios**
- ✅ **Interfaz simplificada** según sus necesidades
- ✅ **Menos confusión** con opciones no disponibles
- ✅ **Enfoque** en tareas específicas

### **Para Developers**
- ✅ **Sistema escalable** y mantenible
- ✅ **Fácil agregar** nuevas páginas y permisos
- ✅ **Documentación clara** de accesos

---

**¿Necesitas ayuda para configurar permisos específicos o agregar nuevas páginas al sistema?** 