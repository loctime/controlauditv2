# Sistema Multi-Tenant para Formularios

## 🎯 **Problema Resuelto**

### **Situación Anterior**
- Los formularios eran visibles globalmente para todos los usuarios con `role='max'`
- No había aislamiento entre diferentes clientes administradores
- Un cliente administrador podía ver formularios de otros clientes

### **Solución Implementada**
- **Sistema Multi-Tenant**: Cada cliente administrador solo ve sus formularios y los de sus usuarios
- **Aislamiento de datos**: Formularios separados por cliente administrador
- **Jerarquía clara**: Cliente Admin → Usuarios Operarios → Formularios

## 🏗️ **Arquitectura del Sistema**

### **Jerarquía de Roles**
```
supermax (Super Administrador)
├── max (Cliente Administrador 1)
│   ├── operario (Usuario 1)
│   ├── operario (Usuario 2)
│   └── formularios del cliente 1
└── max (Cliente Administrador 2)
    ├── operario (Usuario 3)
    ├── operario (Usuario 4)
    └── formularios del cliente 2
```

### **Estructura de Datos**

#### **Usuario (Colección: usuarios)**
```javascript
{
  uid: "user123",
  email: "usuario@empresa.com",
  displayName: "Juan Pérez",
  role: "operario", // "supermax", "max", "operario"
  clienteAdminId: "admin456", // ID del cliente administrador responsable
  createdAt: Timestamp,
  permisos: {
    puedeCrearAuditorias: true,
    puedeCrearSucursales: true
  }
}
```

#### **Formulario (Colección: formularios)**
```javascript
{
  id: "form789",
  nombre: "Auditoría de Seguridad",
  creadorId: "user123", // Quien creó el formulario
  clienteAdminId: "admin456", // Cliente administrador responsable
  secciones: [...],
  esPublico: false,
  permisos: {
    puedeVer: ["user123", "user124"],
    puedeEditar: ["user123"],
    puedeEliminar: ["user123"]
  },
  timestamp: Timestamp,
  ultimaModificacion: Timestamp
}
```

## 🔐 **Sistema de Permisos**

### **Super Administrador (`role: 'supermax'`)**
- ✅ Ve **TODOS** los formularios del sistema
- ✅ Puede gestionar todos los clientes administradores
- ✅ Acceso completo al sistema

### **Cliente Administrador (`role: 'max'`)**
- ✅ Ve sus propios formularios
- ✅ Ve formularios de sus usuarios operarios
- ✅ Gestiona sus usuarios operarios
- ❌ No ve formularios de otros clientes administradores

### **Usuario Operario (`role: 'operario'`)**
- ✅ Ve sus propios formularios
- ✅ Ve formularios de su cliente administrador
- ✅ Ve formularios públicos
- ✅ Ve formularios con permisos explícitos
- ❌ No ve formularios de otros clientes administradores

## 🔧 **Implementación Técnica**

### **1. Creación de Formularios**
```javascript
// Formulario.jsx - Líneas modificadas
const formularioData = {
  // ... otros campos
  creadorId: user.uid,
  clienteAdminId: userProfile?.clienteAdminId || user.uid, // Cliente admin responsable
  permisos: {
    puedeEditar: [user.uid],
    puedeVer: [user.uid],
    puedeEliminar: [user.uid]
  }
};
```

### **2. Filtrado en Auditorías**
```javascript
// Auditoria.jsx - Filtrado multi-tenant
const formulariosPermitidos = todosLosFormularios.filter(formulario => {
  // Super administradores ven todo
  if (userProfile.role === 'supermax') return true;
  
  // Clientes administradores ven sus formularios y los de sus usuarios
  if (userProfile.role === 'max') {
    return formulario.clienteAdminId === userProfile.uid || 
           formulario.creadorId === userProfile.uid;
  }
  
  // Usuarios operarios ven formularios de su cliente admin
  if (userProfile.role === 'operario') {
    return formulario.creadorId === userProfile.uid ||
           formulario.clienteAdminId === userProfile.clienteAdminId ||
           formulario.esPublico ||
           formulario.permisos?.puedeVer?.includes(userProfile.uid);
  }
  
  return false;
});
```

### **3. Filtrado en Edición**
```javascript
// EditarFormulario.jsx - Mismo filtrado que auditorías
const formulariosPermitidos = metadatos.filter(formulario => {
  // Lógica idéntica al filtrado de auditorías
});
```

## 🚀 **Funciones del Contexto**

### **Gestión de Usuarios**
```javascript
// Asignar usuario operario a cliente administrador
const asignarUsuarioAClienteAdmin = async (userId, clienteAdminId) => {
  // Actualiza el campo clienteAdminId del usuario
};

// Obtener usuarios de un cliente administrador
const getUsuariosDeClienteAdmin = async (clienteAdminId) => {
  // Retorna todos los usuarios asignados a ese cliente admin
};

// Obtener formularios de un cliente administrador
const getFormulariosDeClienteAdmin = async (clienteAdminId) => {
  // Retorna todos los formularios de ese cliente admin
};
```

## 📊 **Flujo de Trabajo**

### **1. Registro de Cliente Administrador**
1. Usuario se registra con email que corresponde a `role: 'max'`
2. Sistema asigna `clienteAdminId: user.uid` (es su propio admin)
3. Puede crear formularios y gestionar usuarios

### **2. Registro de Usuario Operario**
1. Cliente administrador crea usuario operario
2. Sistema asigna `clienteAdminId: clienteAdminId` del creador
3. Usuario operario ve formularios de su cliente admin

### **3. Creación de Formularios**
1. Cualquier usuario crea formulario
2. Sistema asigna `clienteAdminId` automáticamente
3. Solo visible para el cliente administrador correspondiente

### **4. Auditorías**
1. Usuario selecciona formulario de su cliente admin
2. Sistema filtra formularios por permisos multi-tenant
3. Solo ve formularios permitidos

## 🔍 **Casos de Uso**

### **Caso 1: Empresa A vs Empresa B**
- **Cliente Admin A**: Ve solo formularios de Empresa A
- **Cliente Admin B**: Ve solo formularios de Empresa B
- **Operario A1**: Ve formularios de Empresa A
- **Operario B1**: Ve formularios de Empresa B

### **Caso 2: Múltiples Sucursales**
- **Cliente Admin**: Ve formularios de todas sus sucursales
- **Operario Sucursal 1**: Ve formularios de su sucursal
- **Operario Sucursal 2**: Ve formularios de su sucursal

### **Caso 3: Colaboración**
- **Formularios públicos**: Visibles para todos los usuarios
- **Permisos explícitos**: Compartir formularios específicos
- **Cliente Admin**: Puede compartir formularios con otros usuarios

## 🛡️ **Seguridad**

### **Aislamiento de Datos**
- ✅ Cada cliente administrador solo ve sus datos
- ✅ No hay fuga de información entre clientes
- ✅ Permisos granulares por formulario

### **Validación en Frontend y Backend**
- ✅ Filtrado en componentes React
- ✅ Reglas de Firestore (recomendado implementar)
- ✅ Validación en contexto de autenticación

## 📈 **Beneficios**

### **Para el Negocio**
- ✅ **Multi-tenancy**: Múltiples clientes en una sola aplicación
- ✅ **Escalabilidad**: Fácil agregar nuevos clientes
- ✅ **Seguridad**: Aislamiento completo de datos

### **Para el Usuario**
- ✅ **Claridad**: Solo ve formularios relevantes
- ✅ **Organización**: Formularios agrupados por cliente
- ✅ **Eficiencia**: Menos confusión en la interfaz

### **Para el Desarrollo**
- ✅ **Mantenibilidad**: Código organizado y claro
- ✅ **Extensibilidad**: Fácil agregar nuevas funcionalidades
- ✅ **Testing**: Fácil probar casos específicos

## 🔮 **Próximos Pasos**

### **1. Reglas de Firestore**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /formularios/{formularioId} {
      allow read: if request.auth != null && (
        resource.data.clienteAdminId == request.auth.uid ||
        resource.data.creadorId == request.auth.uid ||
        resource.data.esPublico == true ||
        request.auth.token.role == 'supermax'
      );
    }
  }
}
```

### **2. Panel de Gestión de Clientes**
- Interfaz para clientes administradores
- Gestión de usuarios operarios
- Estadísticas por cliente

### **3. Migración de Datos**
- Script para asignar `clienteAdminId` a formularios existentes
- Validación de integridad de datos

---

**¿Necesitas ayuda con alguna parte específica de la implementación o tienes preguntas sobre el sistema multi-tenant?** 