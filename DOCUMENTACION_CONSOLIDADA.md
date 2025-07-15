# 📚 Documentación Consolidada del Sistema de Auditorías

## 🚀 Novedades 2024-06

- Permisos unificados: ahora todo el sistema usa `puedeCompartirFormularios` (antes `puedeCompartirAuditorias`).
- Nuevo hook `usePermiso` y componente `<Permiso />` para validación de permisos reutilizable en UI y lógica. Ejemplo:
  ```jsx
  <Permiso permiso="puedeCompartirFormularios">
    <Button>Compartir</Button>
  </Permiso>
  // O en lógica:
  const puede = usePermiso('puedeCrearEmpresas');
  ```
- Galería de formularios públicos optimizada:
  - Buscador por nombre/creador
  - Filtros avanzados (más copiados, mejor valorados, preguntas)
  - Rating anónimo (promedio, votos)
  - Contador de copias
  - Accordion con secciones y preguntas
  - Creador visible
  - Botón copiar y rating deshabilitados para el creador (con tooltip)
  - Chips de estado: público, compartido, propio
- Lógica de copiado: copiar un formulario crea un nuevo documento independiente; editar el original no afecta las copias.
- Refactor de permisos en usuarios y formularios para coherencia y mantenibilidad.
- Mejoras de UX: tooltips, feedback visual, loading en acciones, chips de estado.
- Seguridad: validación de permisos en frontend y backend, logs de intentos de acceso sin permisos.
- 100% responsivo y accesible.

---

## 📋 **Índice**
1. [Sistema Multi-Tenant](#sistema-multi-tenant)
2. [Sistema de Roles](#sistema-de-roles)
3. [Sistema de Auditorías](#sistema-de-auditorías)
4. [Sistema de Formularios](#sistema-de-formularios)
5. [Sistema de Usuarios](#sistema-de-usuarios)
6. [Sistema de Reportes](#sistema-de-reportes)
7. [Mejoras y Optimizaciones](#mejoras-y-optimizaciones)
8. [Configuración y Despliegue](#configuración-y-despliegue)
9. [Políticas de Documentación](#políticas-de-documentación)

---

## 🏗️ **Sistema Multi-Tenant**

### **Arquitectura**
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

### **Jerarquía de Acceso**

#### **Super Administrador (`role: 'supermax'`)**
- ✅ Ve **TODOS** los datos del sistema
- ✅ Gestiona todos los clientes administradores
- ✅ Acceso completo al sistema

#### **Cliente Administrador (`role: 'max'`)**
- ✅ Ve sus propios datos
- ✅ Ve datos de sus usuarios operarios
- ✅ Gestiona sus usuarios operarios
- ❌ No ve datos de otros clientes administradores

#### **Usuario Operario (`role: 'operario'`)**
- ✅ Ve sus propios datos
- ✅ Ve datos de su cliente administrador
- ✅ Ve datos públicos
- ❌ No ve datos de otros clientes administradores

### **Implementación en Componentes**

#### **ClienteDashboard.jsx - Arquitectura Modular**

El ClienteDashboard ha sido refactorizado en componentes más pequeños y manejables:

**Estructura de Componentes:**
```
src/components/pages/admin/
├── ClienteDashboard.jsx (193 líneas) - Componente principal
├── components/
│   ├── CalendarioAuditorias.jsx (148 líneas) - Calendario interactivo
│   ├── AgendarAuditoriaDialog.jsx (192 líneas) - Diálogo de agendamiento
│   ├── AuditoriasDelDia.jsx (134 líneas) - Lista de auditorías del día
│   ├── ProximasAuditorias.jsx (69 líneas) - Próximas auditorías
│   └── ResumenGeneral.jsx (63 líneas) - Resumen estadístico
└── hooks/
    └── useClienteDashboard.js (251 líneas) - Lógica de negocio
```

**Hook Personalizado - useClienteDashboard.js:**
```javascript
// Lógica centralizada para el dashboard
export const useClienteDashboard = () => {
  const { userProfile, role } = useContext(AuthContext);
  const [auditorias, setAuditorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Cargar datos con filtrado multi-tenant
  useEffect(() => {
    const cargarDatos = async () => {
      if (!userProfile) return;

      // Lógica de filtrado multi-tenant para empresas, sucursales, formularios y auditorías
      // ...
    };

    cargarDatos();
  }, [userProfile, role]);

  const handleAgendarAuditoria = async (formData) => {
    // Lógica para agendar auditoría
  };

  const handleCompletarAuditoria = async (auditoriaId) => {
    // Lógica para completar auditoría
  };

  const handleEliminarAuditoria = async (auditoriaId) => {
    // Lógica para eliminar auditoría
  };

  return {
    auditorias,
    empresas,
    sucursales,
    formularios,
    loading,
    handleAgendarAuditoria,
    handleCompletarAuditoria,
    handleEliminarAuditoria
  };
};
```

**Componente Principal Refactorizado:**
```javascript
function ClienteDashboard() {
  const { role } = useContext(AuthContext);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTab, setCurrentTab] = useState(0);

  // Hook personalizado para la lógica
  const {
    auditorias,
    empresas,
    sucursales,
    formularios,
    loading,
    handleAgendarAuditoria,
    handleCompletarAuditoria,
    handleEliminarAuditoria
  } = useClienteDashboard();

  return (
    <Box>
      {/* Pestañas */}
      <Tabs value={currentTab} onChange={handleTabChange}>
        <Tab icon={<CalendarToday />} label="Calendario" />
        <Tab icon={<History />} label="Historial" />
      </Tabs>

      {/* Contenido modular */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <CalendarioAuditorias 
              auditorias={auditorias}
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
            />
          </Grid>
          <Grid item xs={12} lg={6}>
            <AuditoriasDelDia
              selectedDate={selectedDate}
              auditoriasDelDia={auditoriasDelDiaSeleccionado}
              onAgendar={handleOpenDialog}
              onCompletar={handleCompletarAuditoria}
              onEliminar={handleEliminarAuditoria}
            />
            <ProximasAuditorias auditoriasPendientes={auditoriasPendientes} />
            <ResumenGeneral
              auditoriasPendientes={auditoriasPendientes}
              auditoriasCompletadas={auditoriasCompletadas}
              auditorias={auditorias}
            />
          </Grid>
        </Grid>
      )}

      {currentTab === 1 && (
        <HistorialAuditorias auditorias={auditoriasCompletadas} />
      )}

      <AgendarAuditoriaDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSave={handleSaveAuditoria}
        empresas={empresas}
        sucursales={sucursales}
        formularios={formularios}
        fechaPreestablecida={fechaPreestablecida}
      />
    </Box>
  );
}
```

**Beneficios de la Refactorización:**
- ✅ **Mantenibilidad**: Componentes más pequeños y fáciles de mantener
- ✅ **Reutilización**: Componentes independientes y reutilizables
- ✅ **Testabilidad**: Cada componente puede ser testeado por separado
- ✅ **Legibilidad**: Código más limpio y organizado
- ✅ **Separación de responsabilidades**: Lógica de negocio en hooks, UI en componentes
```javascript
// Cargar datos iniciales con filtrado multi-tenant
useEffect(() => {
  const cargarDatos = async () => {
    if (!userProfile) return;

    // ✅ Empresas filtradas por multi-tenant
    let empresasData = [];
    if (role === 'supermax') {
      // Super administradores ven todas las empresas
      const empresasSnapshot = await getDocs(collection(db, 'empresas'));
      empresasData = empresasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } else if (role === 'max') {
      // Clientes administradores ven sus empresas y las de sus usuarios operarios
      const empresasRef = collection(db, "empresas");
      const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.uid));
      const empresasSnapshot = await getDocs(empresasQuery);
      const misEmpresas = empresasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Obtener usuarios operarios del cliente administrador
      const usuariosRef = collection(db, "usuarios");
      const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
      const usuariosSnapshot = await getDocs(usuariosQuery);
      const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

      // Obtener empresas de los usuarios operarios
      let empresasOperarios = [];
      for (const operarioId of usuariosOperarios) {
        const operarioEmpresasQuery = query(empresasRef, where("propietarioId", "==", operarioId));
        const operarioEmpresasSnapshot = await getDocs(operarioEmpresasQuery);
        const operarioEmpresas = operarioEmpresasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        empresasOperarios.push(...operarioEmpresas);
      }

      empresasData = [...misEmpresas, ...empresasOperarios];
    }
    setEmpresas(empresasData);

    // ✅ Sucursales, formularios y auditorías con filtrado similar...
  };

  cargarDatos();
}, [userProfile, role]);
```

#### **HistorialAuditorias.jsx - Filtrado Multi-Tenant**
```javascript
const cargarAuditorias = async () => {
  if (!userProfile) return;

  let auditoriasData = [];

  if (role === 'supermax') {
    // Super administradores ven todas las auditorías completadas
    const auditoriasRef = collection(db, 'auditorias_agendadas');
    const q = query(
      auditoriasRef,
      where('estado', '==', 'completada'),
      orderBy('fechaCompletada', 'desc')
    );
    
    const snapshot = await getDocs(q);
    auditoriasData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } else if (role === 'max') {
    // Clientes administradores ven sus auditorías y las de sus usuarios operarios
    const auditoriasRef = collection(db, "auditorias_agendadas");
    
    // Obtener sus propias auditorías completadas
    const misAuditoriasQuery = query(
      auditoriasRef,
      where('usuarioId', '==', userProfile.uid),
      where('estado', '==', 'completada'),
      orderBy('fechaCompletada', 'desc')
    );
    const misAuditoriasSnapshot = await getDocs(misAuditoriasQuery);
    const misAuditorias = misAuditoriasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Obtener auditorías completadas de usuarios operarios
    let auditoriasOperarios = [];
    for (const operarioId of usuariosOperarios) {
      const operarioAuditoriasQuery = query(
        auditoriasRef,
        where('usuarioId', '==', operarioId),
        where('estado', '==', 'completada'),
        orderBy('fechaCompletada', 'desc')
      );
      const operarioAuditoriasSnapshot = await getDocs(operarioAuditoriasQuery);
      const operarioAuditorias = operarioAuditoriasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      auditoriasOperarios.push(...operarioAuditorias);
    }

    auditoriasData = [...misAuditorias, ...auditoriasOperarios];
  }
  
  setAuditorias(auditoriasData);
};
```

### **Estructura de Datos**
```javascript
// Usuario
{
  uid: "user123",
  email: "usuario@empresa.com",
  role: "operario", // "supermax", "max", "operario"
  clienteAdminId: "admin456", // ID del cliente administrador responsable
  createdAt: Timestamp,
  permisos: {...}
}

// Formulario
{
  id: "form789",
  nombre: "Auditoría de Seguridad",
  creadorId: "user123",
  clienteAdminId: "admin456", // Cliente administrador responsable
  secciones: [...],
  esPublico: false,
  permisos: {
    puedeVer: ["user123", "user124"],
    puedeEditar: ["user123"],
    puedeEliminar: ["user123"]
  }
}

// Auditoría Agendada
{
  id: "audit123",
  empresa: "Empresa ABC",
  sucursal: "Sucursal Centro",
  formulario: "Auditoría de Seguridad",
  usuarioId: "user123",
  clienteAdminId: "admin456", // ✅ Campo agregado para multi-tenant
  fecha: "2024-01-15",
  hora: "09:00",
  estado: "agendada",
  fechaCreacion: Timestamp,
  fechaActualizacion: Timestamp
}
```

---

## 🔐 **Sistema de Roles**

### **Roles Disponibles**

#### **1. Operario (`operario`)**
- **Descripción**: Usuarios normales del sistema
- **Permisos básicos**:
  - Crear auditorías (si tienen permiso)
  - Ver reportes propios
  - Acceso limitado según permisos específicos

#### **2. Administrador (`max`)**
- **Descripción**: Administradores del sistema
- **Permisos completos**:
  - Crear Empresas
  - Crear Sucursales
  - Crear Auditorías
  - Compartir Auditorías
  - Agregar Socios
  - Gestionar Usuarios

#### **3. Super Administrador (`supermax`)**
- **Descripción**: Dueños del sistema
- **Permisos máximos**:
  - Todos los permisos de administrador
  - Gestionar Sistema
  - Eliminar Usuarios
  - Ver Logs
  - Acceso completo

### **Códigos de Activación**
- **Administrador**: `AUDITORIA2024`
- **Super Administrador**: `SUPERMAX2024`

### **Configuración**
```javascript
// src/config/admin.js
export const ADMIN_ACTIVATION_CODE = import.meta.env.VITE_ADMIN_CODE || 'AUDITORIA2024';
export const SUPER_ADMIN_ACTIVATION_CODE = import.meta.env.VITE_SUPER_ADMIN_CODE || 'SUPERMAX2024';
```

---

## 📊 **Sistema de Auditorías**

### **Flujo de Auditoría**
1. **Selección de Empresa**: Usuario selecciona empresa de su cliente admin
2. **Selección de Formulario**: Sistema filtra formularios por permisos multi-tenant
3. **Completar Auditoría**: Usuario responde preguntas y sube imágenes
4. **Generar Reporte**: Sistema crea PDF con resultados
5. **Guardar**: Auditoría se guarda en Firestore con metadatos

### **Estructura de Auditoría**
```javascript
{
  id: "audit123",
  empresa: "Empresa ABC",
  sucursal: "Sucursal Centro",
  formulario: "Auditoría de Seguridad",
  usuarioId: "user123",
  clienteAdminId: "admin456",
  fecha: "2024-01-15",
  respuestas: [...],
  comentarios: [...],
  imagenes: [...],
  estado: "completada",
  fechaCreacion: Timestamp,
  fechaCompletada: Timestamp
}
```

### **Auditorías Agendadas**
- **Agendamiento**: Clientes administradores pueden agendar auditorías
- **Calendario**: Vista de calendario con auditorías programadas
- **Estados**: `agendada`, `completada`, `cancelada`
- **Filtrado**: Multi-tenant por cliente administrador

### **Reportes**
- **Generación**: PDF automático con resultados
- **Filtros**: Por empresa, fecha, formulario
- **Historial**: Vista de auditorías completadas
- **Exportación**: Descarga de reportes en PDF

---

## 📝 **Sistema de Formularios**

### **Creación de Formularios**
- **Multi-tenant**: Cada formulario pertenece a un cliente administrador
- **Secciones**: Formularios organizados en secciones
- **Preguntas**: Diferentes tipos de preguntas (texto, opción múltiple, imagen)
- **Permisos**: Control granular de acceso

### **Tipos de Preguntas**
- **Texto**: Respuesta libre
- **Opción Múltiple**: Selección de opciones
- **Imagen**: Subida de imágenes
- **Comentario**: Notas adicionales

### **Edición de Formularios**
- **Permisos**: Solo creadores pueden editar
- **Validación**: Verificación de permisos multi-tenant
- **Historial**: Seguimiento de cambios

---

## 👥 **Sistema de Usuarios**

### **Gestión de Usuarios**
- **Creación**: Clientes administradores pueden crear usuarios operarios
- **Asignación**: Usuarios se asignan a clientes administradores
- **Permisos**: Control granular de permisos por usuario
- **Logs**: Registro de acciones de usuarios

### **Funciones Multi-Tenant**
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

### **Verificación de Permisos**
```javascript
// Verificar acceso a empresas
const canViewEmpresa = (empresaId) => {
  // Lógica multi-tenant por rol
};

// Verificar acceso a auditorías
const canViewAuditoria = (auditoriaId) => {
  // Lógica multi-tenant por rol
};
```

---

## 📈 **Sistema de Reportes**

### **Generación de PDF**
- **Plantilla**: Diseño profesional con logo de empresa
- **Contenido**: Respuestas, comentarios, imágenes
- **Firma**: Sección para firma digital
- **Metadatos**: Información de auditoría y usuario

### **Filtros de Reportes**
- **Empresa**: Filtrar por empresa específica
- **Fecha**: Rango de fechas
- **Formulario**: Tipo de formulario
- **Usuario**: Auditorías de usuario específico

### **Historial de Reportes**
- **Vista**: Tabla con auditorías completadas
- **Detalles**: Información completa de cada auditoría
- **Descarga**: Exportar reportes individuales
- **Búsqueda**: Filtros avanzados

---

## ⚡ **Mejoras y Optimizaciones**

### **Auditoría Flexible**
- **Casa Central**: Auditorías en sede principal
- **Sucursales**: Auditorías en ubicaciones específicas
- **Flexibilidad**: Poder elegir según la necesidad

### **Optimizaciones de Rendimiento**
- **Lazy Loading**: Carga diferida de componentes
- **Filtrado**: Consultas optimizadas en Firestore
- **Caché**: Almacenamiento local de datos frecuentes
- **Paginación**: Carga por lotes para grandes volúmenes

### **Mejoras de UX**
- **Interfaz Responsiva**: Adaptable a diferentes dispositivos
- **Feedback Visual**: Mensajes claros de estado
- **Navegación Intuitiva**: Flujo de trabajo optimizado
- **Accesibilidad**: Cumplimiento de estándares WCAG

### **Correcciones Implementadas**
- **Tabla de Reportes**: Campos corregidos para mostrar datos correctos
- **Imágenes**: Manejo mejorado de archivos de imagen
- **Impresión**: Generación nativa de PDF
- **Multi-tenant**: Filtrado completo en todos los componentes

---

## 🔧 **Configuración y Despliegue**

### **Variables de Entorno**
```bash
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Códigos de administrador
VITE_ADMIN_CODE=AUDITORIA2024
VITE_SUPER_ADMIN_CODE=SUPERMAX2024

# Backblaze B2 (opcional)
VITE_B2_APPLICATION_KEY_ID=your_key_id
VITE_B2_APPLICATION_KEY=your_application_key
VITE_B2_BUCKET_ID=your_bucket_id
VITE_B2_BUCKET_NAME=your_bucket_name
```

### **Estructura del Proyecto**
```
src/
├── components/
│   ├── context/          # Context API para autenticación
│   ├── layout/           # Componentes de layout (navbar)
│   └── pages/            # Páginas principales
│       ├── admin/        # Dashboard de clientes administradores
│       ├── auditoria/    # Sistema de auditorías
│       ├── dashboard/    # Panel principal
│       ├── formulario/   # Gestión de formularios
│       ├── usuarios/     # Gestión de usuarios
│       └── ...
├── router/               # Configuración de rutas
├── config/               # Configuraciones del sistema
├── utils/                # Utilidades y helpers
├── firebaseConfig.js     # Configuración de Firebase
└── main.jsx             # Punto de entrada
```

### **Servicios Externos**
- **Firebase**: Autenticación, Firestore, Storage
- **Backblaze B2**: Almacenamiento de archivos (opcional)
- **Render**: Despliegue de aplicación
- **Cloudflare**: CDN y optimización

### **Comandos de Desarrollo**
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build
npm run preview

# Linting
npm run lint
```

---

## 🔐 **Sistema de Permisos**

### **Arquitectura de Permisos**

El sistema implementa un control granular de permisos basado en roles y permisos específicos:

#### **Roles del Sistema**
- **supermax**: Super administrador con acceso completo
- **max**: Cliente administrador con acceso a sus empresas y usuarios operarios
- **operario**: Usuario con acceso limitado a funcionalidades específicas

#### **Permisos Disponibles**
```javascript
const PERMISOS_LISTA = [
  { key: 'puedeCrearEmpresas', label: 'Crear Empresas' },
  { key: 'puedeCrearSucursales', label: 'Crear Sucursales' },
  { key: 'puedeCrearAuditorias', label: 'Crear Auditorías' },
  { key: 'puedeAgendarAuditorias', label: 'Agendar Auditorías' },
  { key: 'puedeCompartirAuditorias', label: 'Compartir Auditorías' },
  { key: 'puedeAgregarSocios', label: 'Agregar Socios' }
];
```

#### **Permisos por Defecto por Rol**
```javascript
const defaultPermissions = {
  operario: {
    puedeCrearEmpresas: false,
    puedeCrearSucursales: false,
    puedeCrearAuditorias: false,
    puedeAgendarAuditorias: false,
    puedeCompartirAuditorias: false,
    puedeAgregarSocios: false
  },
  max: {
    puedeCrearEmpresas: true,
    puedeCrearSucursales: true,
    puedeCrearAuditorias: true,
    puedeAgendarAuditorias: true,
    puedeCompartirAuditorias: true,
    puedeAgregarSocios: true
  },
  supermax: {
    puedeCrearEmpresas: true,
    puedeCrearSucursales: true,
    puedeCrearAuditorias: true,
    puedeAgendarAuditorias: true,
    puedeCompartirAuditorias: true,
    puedeAgregarSocios: true
  }
};
```

### **Implementación de Permisos**

#### **Hook usePermissions**
```javascript
// src/components/pages/admin/hooks/usePermissions.js
export const usePermissions = () => {
  const { userProfile, role } = useContext(AuthContext);

  const permissions = useMemo(() => {
    if (!userProfile) return {};
    
    const userPermisos = userProfile.permisos || {};
    const defaultPerms = defaultPermissions[role] || defaultPermissions.operario;
    
    return {
      ...defaultPerms,
      ...userPermisos
    };
  }, [userProfile, role]);

  const canAgendarAuditorias = useMemo(() => {
    return permissions.puedeAgendarAuditorias || role === 'supermax';
  }, [permissions.puedeAgendarAuditorias, role]);

  // ... otros permisos

  return {
    permissions,
    canAgendarAuditorias,
    canCrearAuditorias,
    canCrearEmpresas,
    canCrearSucursales,
    canCompartirAuditorias,
    canAgregarSocios,
    hasPermission
  };
};
```

#### **Validación en Componentes**
```javascript
// En ClienteDashboard.jsx
const { canAgendarAuditorias } = usePermissions();

// Botón condicional
const agendarButton = useMemo(() => {
  if (!canAgendarAuditorias) {
    return null; // No mostrar el botón si no tiene permisos
  }
  
  return (
    <Button onClick={() => handleOpenDialog()}>
      Agendar
    </Button>
  );
}, [handleOpenDialog, canAgendarAuditorias]);
```

#### **Componente PermissionAlert**
```javascript
// src/components/pages/admin/components/PermissionAlert.jsx
const PermissionAlert = ({ 
  canAgendarAuditorias, 
  canCrearAuditorias = true,
  canCrearEmpresas = true 
}) => {
  if (canAgendarAuditorias && canCrearAuditorias && canCrearEmpresas) {
    return null; // No mostrar alerta si tiene todos los permisos
  }

  const missingPermissions = [];
  
  if (!canAgendarAuditorias) {
    missingPermissions.push('Agendar Auditorías');
  }
  // ... otros permisos

  return (
    <Alert severity="info">
      <AlertTitle>Permisos Limitados</AlertTitle>
      <Typography>
        Tu cuenta tiene permisos limitados. No puedes realizar las siguientes acciones:
      </Typography>
      {/* Lista de permisos faltantes */}
    </Alert>
  );
};
```

### **Gestión de Permisos en Usuarios**

#### **Formulario de Usuario**
- ✅ Interfaz para asignar permisos específicos
- ✅ Permisos por defecto según rol
- ✅ Validación de permisos en tiempo real
- ✅ Historial de cambios de permisos

#### **Validación en Tiempo Real**
- ✅ Verificación de permisos antes de mostrar funcionalidades
- ✅ Mensajes informativos sobre permisos limitados
- ✅ Fallback graceful para usuarios sin permisos
- ✅ Logs de intentos de acceso sin permisos

### **Seguridad y Auditoría**

#### **Validación Multi-Nivel**
1. **Frontend**: Verificación en componentes y hooks
2. **Context**: Validación en AuthContext
3. **Backend**: Verificación en reglas de Firestore
4. **UI**: Feedback visual sobre permisos

#### **Logs de Seguridad**
```javascript
// Log de intento de acceso sin permisos
console.log('[SECURITY] Usuario sin permisos intentó acceder:', {
  userId: userProfile?.uid,
  action: 'agendar_auditoria',
  timestamp: new Date().toISOString()
});
```

## 🛡️ **Seguridad**

### **Aislamiento de Datos**
- ✅ Cada cliente administrador solo ve sus datos
- ✅ No hay fuga de información entre clientes
- ✅ Permisos granulares por formulario
- ✅ Validación en frontend y contexto

### **Autenticación**
- ✅ Firebase Authentication
- ✅ Roles y permisos por usuario
- ✅ Verificación de sesión
- ✅ Protección de rutas

### **Validación**
- ✅ Verificación de permisos en todos los componentes
- ✅ Filtrado automático según rol del usuario
- ✅ Mensajes de error apropiados para acceso denegado

---

## 📊 **Métricas y Monitoreo**

### **Logs del Sistema**
- **Acciones de Usuario**: Registro de operaciones importantes
- **Errores**: Captura y registro de errores
- **Performance**: Métricas de rendimiento
- **Auditoría**: Seguimiento de cambios críticos

### **Debug y Desarrollo**
```javascript
// Logs de debug para multi-tenant
console.log('[DEBUG] Datos cargados con filtrado multi-tenant:', {
  empresas: empresasData.length,
  sucursales: sucursalesData.length,
  formularios: formulariosData.length,
  auditorias: auditoriasData.length
});
```

---

## 📝 **Políticas de Documentación**

### **Principios de Documentación**

#### **1. Consolidación**
- ✅ **Un solo lugar**: Toda la documentación técnica en `DOCUMENTACION_CONSOLIDADA.md`
- ✅ **Sin duplicados**: Evitar crear múltiples archivos para el mismo tema
- ✅ **Actualización**: Modificar archivos existentes en lugar de crear nuevos

#### **2. Cuándo Crear Documentación**
- ✅ **Sistemas importantes**: Nuevas funcionalidades críticas del sistema
- ✅ **Arquitectura**: Cambios en la estructura del sistema
- ✅ **Seguridad**: Implementaciones de seguridad relevantes
- ✅ **Integración**: Nuevos servicios o APIs externas

#### **3. Cuándo NO Crear Documentación**
- ❌ **Correcciones menores**: Bugs simples o ajustes de UI
- ❌ **Funcionalidades pequeñas**: Mejoras menores sin impacto arquitectural
- ❌ **Duplicados**: Información que ya existe en otro lugar
- ❌ **Temporales**: Documentación para cambios experimentales

#### **4. Estructura de Documentación**

##### **README.md** (Punto de entrada)
- Instalación rápida
- Características principales
- Enlaces a documentación completa
- Información básica del proyecto

##### **DOCUMENTACION_CONSOLIDADA.md** (Documentación técnica)
- Arquitectura del sistema
- Implementaciones técnicas
- Configuraciones avanzadas
- Guías de desarrollo

##### **Documentación Específica** (Solo cuando sea necesario)
- Sistemas críticos que requieren documentación detallada
- Integraciones complejas
- Procesos de migración importantes

#### **5. Proceso de Actualización**

##### **Para Cambios Menores**
1. Actualizar sección correspondiente en `DOCUMENTACION_CONSOLIDADA.md`
2. Actualizar fecha de última modificación
3. Agregar comentarios en el código si es necesario

##### **Para Cambios Importantes**
1. Evaluar si requiere documentación específica
2. Si es necesario, crear archivo específico
3. Actualizar índice en `DOCUMENTACION_CONSOLIDADA.md`
4. Agregar referencia en `README.md`

#### **6. Mantenimiento**

##### **Revisión Periódica**
- Revisar documentación cada mes
- Eliminar información obsoleta
- Actualizar ejemplos de código
- Verificar enlaces y referencias

##### **Versionado**
- Mantener historial de cambios importantes
- Documentar breaking changes
- Actualizar números de versión

#### **7. Estándares de Calidad**

##### **Contenido**
- ✅ Información clara y concisa
- ✅ Ejemplos de código funcionales
- ✅ Imágenes o diagramas cuando sea necesario
- ✅ Enlaces a recursos adicionales

##### **Formato**
- ✅ Uso consistente de Markdown
- ✅ Estructura jerárquica clara
- ✅ Índice actualizado
- ✅ Fechas de última modificación

#### **8. Responsabilidades**

##### **Desarrolladores**
- Documentar cambios importantes
- Actualizar documentación existente
- Mantener ejemplos de código actualizados

##### **Líder Técnico**
- Revisar calidad de documentación
- Aprobar nuevas secciones
- Coordinar actualizaciones mayores

---

## 🚀 **Próximos Pasos**

### **Mejoras Planificadas**
1. **Optimización**: Índices en Firestore para consultas complejas
2. **Caché**: Implementar caché local para mejorar rendimiento
3. **Paginación**: Agregar paginación para grandes volúmenes de datos
4. **Filtros Avanzados**: Más opciones de filtrado y búsqueda
5. **Exportación**: Permitir exportar datos en diferentes formatos
6. **Notificaciones**: Sistema de notificaciones en tiempo real
7. **Analytics**: Métricas avanzadas de uso del sistema

### **Escalabilidad**
- **Microservicios**: Separación de servicios para mejor escalabilidad
- **CDN**: Optimización de entrega de contenido
- **Caché Distribuido**: Redis para caché compartido
- **Load Balancing**: Distribución de carga

---

**Última actualización**: $(date)
**Versión del sistema**: 2.0.0
**Estado**: Producción 