# 🏢 Sistema de Auditorías Multi-Tenant

Sistema completo de auditorías empresariales con arquitectura multi-tenant, roles de usuario y gestión integral de formularios.

## 🚀 **Características Principales**

- ✅ **Multi-Tenant**: Aislamiento completo de datos por cliente
- ✅ **Roles de Usuario**: Super Admin, Cliente Admin, Operario
- ✅ **Auditorías Flexibles**: Casa central y sucursales
- ✅ **Formularios Dinámicos**: Creación y gestión de formularios personalizados
- ✅ **Reportes PDF**: Generación automática de reportes profesionales
- ✅ **Dashboard Intuitivo**: Interfaz moderna y responsiva
- ✅ **Gestión de Usuarios**: Control granular de permisos

## 📋 **Instalación Rápida**

### **1. Clonar y Instalar**
```bash
git clone <url-del-repositorio>
cd proyecto1518
npm install
```

### **2. Configurar Firebase**
```bash
# Crear archivo .env con tus credenciales
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### **3. Ejecutar**
```bash
npm run dev
```

## 🎯 **Roles del Sistema**

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **supermax** | Super Administrador | Acceso completo al sistema |
| **max** | Cliente Administrador | Gestiona sus empresas y usuarios |
| **operario** | Usuario Operario | Realiza auditorías asignadas |

## 🔐 **Códigos de Activación**

- **Administrador**: `AUDITORIA2024`
- **Super Administrador**: `SUPERMAX2024`

## 📚 **Documentación Completa**

Para información detallada sobre:
- Arquitectura multi-tenant
- Sistema de roles y permisos
- Gestión de auditorías y formularios
- Configuración avanzada
- Mejoras y optimizaciones

📖 **Ver [Documentación Consolidada](DOCUMENTACION_CONSOLIDADA.md)**

## 🛠️ **Tecnologías**

- **Frontend**: React + Vite + Material-UI
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Almacenamiento**: Backblaze B2 (opcional)
- **Despliegue**: Render + Cloudflare

## 📁 **Estructura del Proyecto**

```
src/
├── components/
│   ├── context/          # Context API (Auth, ColorMode)
│   ├── layout/           # Navbar y layout principal
│   └── pages/            # Páginas de la aplicación
│       ├── admin/        # Dashboard de clientes administradores
│       ├── auditoria/    # Sistema de auditorías
│       ├── formulario/   # Gestión de formularios
│       ├── usuarios/     # Gestión de usuarios
│       └── ...
├── router/               # Configuración de rutas
├── config/               # Configuraciones del sistema
├── utils/                # Utilidades y helpers
└── firebaseConfig.js     # Configuración de Firebase
```

## 🚀 **Comandos Útiles**

```bash
# Desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build
npm run preview

# Linting
npm run lint
```

## 🔧 **Configuración Avanzada**

### **Variables de Entorno Opcionales**
```bash
# Códigos de administrador
VITE_ADMIN_CODE=AUDITORIA2024
VITE_SUPER_ADMIN_CODE=SUPERMAX2024

# Backblaze B2 (opcional)
VITE_B2_APPLICATION_KEY_ID=tu_key_id
VITE_B2_APPLICATION_KEY=tu_application_key
VITE_B2_BUCKET_ID=tu_bucket_id
VITE_B2_BUCKET_NAME=tu_bucket_name
```

## 📊 **Estado del Proyecto**

- ✅ **Producción**: Sistema estable y funcional
- ✅ **Multi-Tenant**: Implementado completamente
- ✅ **Roles**: Sistema de permisos funcional
- ✅ **Auditorías**: Flujo completo implementado
- ✅ **Reportes**: Generación de PDF funcional
- 🔄 **Mejoras**: En desarrollo continuo

## 🤝 **Contribución**

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 **Soporte**

Para soporte técnico o consultas:
- 📧 Email: soporte@empresa.com
- 📱 WhatsApp: +1234567890
- 🌐 Web: https://empresa.com/soporte

---

**Versión**: 2.0.0  
**Última actualización**: $(date)  
**Estado**: Producción
