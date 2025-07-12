# Sistema de Código de Administrador

## 🎯 **Nuevo Sistema Implementado**

### **Problema Solucionado**
- **Antes**: Necesitabas configurar emails específicos en archivos
- **Ahora**: Sistema de códigos de activación seguro y flexible

### **Ventajas del Nuevo Sistema**
- ✅ **Más seguro**: No expones emails en el código
- ✅ **Más flexible**: Puedes activar cualquier usuario
- ✅ **Más fácil**: Solo necesitas el código
- ✅ **Reutilizable**: El mismo código funciona para múltiples usuarios

## 🔐 **Cómo Funciona**

### **1. Código por Defecto**
- **Código**: `AUDITORIA2024`
- **Ubicación**: `src/config/admin.js`
- **Configurable**: Se puede cambiar con variable de entorno

### **2. Activación de Administrador**
1. **Ir al Dashboard** (`/dashboard`)
2. **Hacer clic** en "Hacerme Administrador"
3. **Ingresar el código** en el modal
4. **Confirmar** para activar permisos
5. **Recargar** la página automáticamente

### **3. Permisos Otorgados**
- **Rol**: `max` (Super Administrador)
- **Permisos completos**:
  - Crear Empresas
  - Crear Sucursales
  - Crear Auditorías
  - Compartir Auditorías
  - Agregar Socios
  - Gestionar Usuarios

## 🔧 **Configuración**

### **Cambiar el Código por Defecto**

#### **Opción 1: Variable de Entorno (Recomendado)**
Crear archivo `.env` en la raíz del proyecto:
```bash
VITE_ADMIN_CODE=TU_CODIGO_PERSONALIZADO
```

#### **Opción 2: Modificar el Código**
Editar `src/config/admin.js`:
```javascript
export const ADMIN_ACTIVATION_CODE = 'TU_CODIGO_PERSONALIZADO';
```

### **Ejemplos de Códigos Seguros**
```bash
# Códigos recomendados
VITE_ADMIN_CODE=ADMIN2024XYZ
VITE_ADMIN_CODE=SUPERADMIN123
VITE_ADMIN_CODE=AUDITORIA_SYSTEM_2024
VITE_ADMIN_CODE=ADMIN_ACCESS_CODE_2024
```

## 📋 **Flujo de Trabajo**

### **Para Nuevos Administradores**
1. **Registrarse** en el sistema
2. **Ir al Dashboard**
3. **Hacer clic** en "Hacerme Administrador"
4. **Ingresar código** de activación
5. **Confirmar** y esperar recarga
6. **Acceder** a gestión de usuarios

### **Para Usuarios Existentes**
1. **Iniciar sesión**
2. **Ir al Dashboard**
3. **Usar código** de activación
4. **Obtener permisos** de administrador

## 🛡️ **Seguridad**

### **Características de Seguridad**
- **Código oculto**: No se muestra en la interfaz
- **Validación**: Solo códigos válidos activan permisos
- **Auditoría**: Cambios registrados en Firestore
- **Flexible**: Fácil de cambiar sin modificar código

### **Buenas Prácticas**
- **Usar códigos complejos**: Combinar letras, números y símbolos
- **Cambiar periódicamente**: Actualizar el código regularmente
- **Compartir de forma segura**: No enviar por email o chat
- **Documentar**: Mantener registro de códigos activos

## 🎨 **Interfaz de Usuario**

### **Modal de Activación**
- **Título**: "Activar Administrador"
- **Campo**: Código (tipo password)
- **Ayuda**: Muestra el código por defecto
- **Botones**: Cancelar y Activar
- **Feedback**: Mensajes de éxito/error

### **Estados Visuales**
- **Botón visible**: Solo si no eres administrador
- **Código oculto**: Campo de tipo password
- **Validación**: Mensajes de error claros
- **Confirmación**: Toast de éxito

## 🔄 **Integración con Firebase**

### **Actualización en Firestore**
```javascript
// Estructura actualizada
{
  uid: "user-id",
  email: "user@example.com",
  role: "max", // Cambiado de 'operario' a 'max'
  permisos: {
    puedeCrearEmpresas: true,
    puedeCrearSucursales: true,
    puedeCrearAuditorias: true,
    puedeCompartirAuditorias: true,
    puedeAgregarSocios: true
  }
}
```

### **Verificación de Permisos**
- **Función**: `isAdmin(userProfile)`
- **Lógica**: Verifica rol 'max' o 'admin'
- **Uso**: En componentes protegidos

## 🚀 **Funcionalidades Futuras**

### **Mejoras Sugeridas**
1. **Códigos temporales**: Códigos que expiran
2. **Múltiples códigos**: Diferentes niveles de acceso
3. **Historial de activaciones**: Log de cambios de rol
4. **Notificaciones**: Alertas cuando se activa admin
5. **Desactivación**: Código para revocar permisos

### **Seguridad Avanzada**
1. **Autenticación de dos factores**
2. **Códigos únicos por usuario**
3. **Límite de intentos**
4. **Bloqueo temporal**

## 🐛 **Solución de Problemas**

### **Error: "Código incorrecto"**
- Verificar que el código esté bien escrito
- Confirmar que no hay espacios extra
- Revisar la configuración en `.env`

### **Error: "No se pudo identificar usuario"**
- Verificar que estés logueado
- Recargar la página
- Verificar conexión con Firebase

### **Botón no aparece**
- Verificar que no seas ya administrador
- Recargar la página
- Verificar que estés en el Dashboard

## 📞 **Soporte**

Para problemas con el sistema de códigos:
- Verificar la configuración de Firebase
- Revisar la consola del navegador
- Confirmar que el código esté correcto
- Verificar permisos de Firestore

---

**¿Necesitas ayuda para configurar o usar el sistema de códigos?** 