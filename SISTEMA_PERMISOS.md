# Sistema de Permisos y Colaboración - Auditoría

## 🎯 **Descripción General**

Este sistema implementa un control de acceso basado en usuarios que garantiza que cada usuario solo pueda ver y gestionar sus propios recursos, con opciones flexibles de colaboración.

## 🔐 **Características Principales**

### **1. Control de Empresas**
- **Propiedad Exclusiva**: Cada empresa tiene un propietario único
- **Visibilidad Limitada**: Solo puedes ver las empresas que has creado
- **Compartir con Socios**: Los socios pueden ver tus empresas y tú las suyas

### **2. Control de Auditorías**
- **Auditorías Propias**: Solo puedes ver las auditorías que has realizado
- **Compartir Auditorías**: Puedes compartir auditorías específicas con otros usuarios
- **Auditorías de Socios**: Puedes ver auditorías de tus socios

### **3. Sistema de Socios**
- **Colaboración Completa**: Los socios comparten acceso a empresas y auditorías
- **Gestión Flexible**: Puedes agregar socios por email
- **Acceso Recíproco**: Los socios tienen acceso mutuo a recursos

## 🏗️ **Arquitectura del Sistema**

### **Estructura de Datos**

#### **Colección: usuarios**
```javascript
{
  uid: "string",                    // ID único del usuario
  email: "string",                  // Email del usuario
  displayName: "string",            // Nombre mostrado
  createdAt: "timestamp",           // Fecha de creación
  empresas: ["empresaId1", "empresaId2"], // IDs de empresas propias
  auditorias: ["auditoriaId1", "auditoriaId2"], // IDs de auditorías propias
  socios: ["socioId1", "socioId2"], // IDs de usuarios que son socios
  permisos: {
    puedeCrearEmpresas: true,
    puedeCompartirAuditorias: true,
    puedeAgregarSocios: true
  },
  configuracion: {
    notificaciones: true,
    tema: 'light'
  }
}
```

#### **Colección: empresas**
```javascript
{
  id: "string",                     // ID único de la empresa
  nombre: "string",                 // Nombre de la empresa
  direccion: "string",              // Dirección
  telefono: "string",               // Teléfono
  logo: "string",                   // URL del logo
  propietarioId: "string",          // ID del propietario
  propietarioEmail: "string",       // Email del propietario
  createdAt: "timestamp",           // Fecha de creación
  socios: ["socioId1", "socioId2"] // IDs de socios
}
```

#### **Colección: reportes (auditorías)**
```javascript
{
  id: "string",                     // ID único de la auditoría
  empresa: "object",                // Datos de la empresa
  sucursal: "string",               // Sucursal auditada
  formulario: "object",             // Datos del formulario
  usuario: "string",                // Nombre del usuario
  usuarioId: "string",              // ID del usuario
  fecha: "timestamp",               // Fecha de la auditoría
  respuestas: "array",              // Respuestas de la auditoría
  comentarios: "array",             // Comentarios
  imagenes: "array",                // Imágenes
  secciones: "array",               // Estructura de secciones
  estado: "string",                 // Estado de la auditoría
  compartidoCon: ["userId1", "userId2"] // IDs de usuarios con acceso
}
```

## 🔧 **Funciones del AuthContext**

### **Gestión de Perfiles**
- `createOrGetUserProfile()`: Crea o obtiene el perfil del usuario
- `updateUserProfile()`: Actualiza el perfil del usuario
- `getUserEmpresas()`: Obtiene empresas del usuario
- `getUserAuditorias()`: Obtiene auditorías del usuario

### **Sistema de Socios**
- `getUserSocios()`: Obtiene socios del usuario
- `agregarSocio()`: Agrega un nuevo socio por email
- `compartirAuditoria()`: Comparte una auditoría específica

### **Control de Acceso**
- `canViewEmpresa()`: Verifica si el usuario puede ver una empresa
- `canViewAuditoria()`: Verifica si el usuario puede ver una auditoría
- `crearEmpresa()`: Crea una nueva empresa con permisos

## 📱 **Interfaz de Usuario**

### **Página de Perfil (`/perfil`)**
- **Mis Empresas**: Lista de empresas propias
- **Mis Auditorías**: Lista de auditorías realizadas
- **Mis Socios**: Gestión de socios y colaboración
- **Auditorías Compartidas**: Auditorías compartidas con el usuario
- **Info del Sistema**: Documentación del sistema

### **Funcionalidades Disponibles**
- ✅ Agregar socios por email
- ✅ Compartir auditorías específicas
- ✅ Ver empresas y auditorías de socios
- ✅ Gestionar permisos de cuenta
- ✅ Configurar preferencias

## 🚀 **Flujo de Trabajo**

### **1. Registro de Usuario**
1. Usuario se registra con email/contraseña
2. Se crea automáticamente un perfil en la colección `usuarios`
3. Se asignan permisos por defecto
4. El usuario puede comenzar a crear empresas

### **2. Creación de Empresa**
1. Usuario crea una empresa desde `/establecimiento`
2. Se asigna automáticamente como propietario
3. La empresa se agrega a su lista de empresas
4. Solo él puede ver y gestionar esta empresa

### **3. Realización de Auditoría**
1. Usuario selecciona una empresa que puede ver
2. Completa la auditoría
3. Se guarda con su ID de usuario
4. Solo él puede ver esta auditoría inicialmente

### **4. Compartir Recursos**
1. **Agregar Socio**: Desde perfil, agregar socio por email
2. **Compartir Auditoría**: Desde perfil, compartir auditoría específica
3. **Ver Recursos Compartidos**: Los socios ven empresas y auditorías mutuas

## 🔒 **Seguridad**

### **Reglas de Acceso**
- **Empresas**: Solo propietario y socios pueden ver
- **Auditorías**: Solo creador y usuarios con acceso específico pueden ver
- **Perfiles**: Solo el propio usuario puede modificar su perfil

### **Validaciones**
- Verificación de existencia de usuarios antes de agregar socios
- Validación de permisos antes de mostrar recursos
- Control de acceso en todas las operaciones

## 📊 **Beneficios del Sistema**

### **Para el Usuario**
- ✅ **Privacidad**: Solo ve sus propios datos
- ✅ **Colaboración**: Puede compartir recursos específicos
- ✅ **Flexibilidad**: Control granular sobre qué compartir
- ✅ **Simplicidad**: Interfaz intuitiva para gestionar permisos

### **Para el Sistema**
- ✅ **Escalabilidad**: Fácil agregar nuevos tipos de permisos
- ✅ **Mantenibilidad**: Código organizado y reutilizable
- ✅ **Seguridad**: Control de acceso robusto
- ✅ **Performance**: Consultas optimizadas por usuario

## 🛠️ **Tecnologías Utilizadas**

- **Firebase Auth**: Autenticación de usuarios
- **Firestore**: Base de datos con reglas de seguridad
- **React Context**: Gestión de estado global
- **Material-UI**: Interfaz de usuario
- **React Router**: Navegación entre páginas

## 🔄 **Próximas Mejoras**

### **Funcionalidades Futuras**
- [ ] Notificaciones cuando se comparten recursos
- [ ] Historial de cambios en auditorías
- [ ] Roles más granulares (admin, editor, viewer)
- [ ] Exportación de datos compartidos
- [ ] Auditoría de accesos y cambios

### **Optimizaciones**
- [ ] Caché de permisos para mejor performance
- [ ] Paginación en listas grandes
- [ ] Búsqueda avanzada en recursos compartidos
- [ ] Filtros por fecha y tipo de recurso

## 📝 **Notas de Implementación**

### **Consideraciones Importantes**
1. **Migración**: Los usuarios existentes necesitarán perfiles creados
2. **Compatibilidad**: El sistema es compatible con datos existentes
3. **Performance**: Las consultas están optimizadas para evitar sobrecarga
4. **Escalabilidad**: La arquitectura permite agregar más tipos de recursos

### **Mantenimiento**
- Revisar regularmente las reglas de Firestore
- Monitorear el uso de recursos compartidos
- Actualizar permisos según necesidades del negocio
- Documentar cambios en la estructura de datos 