# Sistema de Auditoría - React + Firebase

Sistema completo de gestión de auditorías empresariales desarrollado con React, Firebase y Material-UI.

## 🚀 Características

- **Autenticación completa** con Firebase Auth
- **Gestión de empresas y sucursales**
- **Creación y edición de formularios personalizados**
- **Proceso de auditoría estructurado**
- **Generación de reportes en PDF**
- **Interfaz moderna y responsive**
- **Protección de rutas**
- **Validación de formularios**

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + Vite
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **UI Framework**: Material-UI (MUI)
- **Navegación**: React Router v6
- **Validación**: Formik + Yup
- **Notificaciones**: React-Toastify
- **Generación de PDF**: jsPDF, html2canvas
- **Gráficos**: Chart.js, Recharts

## 📋 Funcionalidades Principales

### 🔐 Autenticación
- Registro de usuarios
- Inicio de sesión
- Recuperación de contraseña
- Protección de rutas
- Gestión de sesiones

### 🏢 Gestión de Empresas
- Crear y gestionar empresas
- Subir logos de empresas
- Agregar información de contacto
- Eliminar empresas

### 🏪 Gestión de Sucursales
- Crear sucursales por empresa
- Asociar sucursales a empresas
- Gestión de información de sucursales

### 📝 Formularios
- Crear formularios personalizados
- Agregar secciones y preguntas
- Editar formularios existentes
- Diferentes tipos de preguntas

### 🔍 Auditorías
- Seleccionar empresa y sucursal
- Elegir formulario de auditoría
- Responder preguntas por secciones
- Agregar comentarios y capturar imágenes
- Validación de respuestas completas

### 📊 Reportes
- Generar informes en PDF
- Incluir estadísticas y gráficos
- Agregar firmas digitales
- Exportar en diferentes formatos
- Filtros por empresa

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn
- Cuenta de Firebase

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd proyecto1518
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar Firebase**
   - Crear un proyecto en Firebase Console
   - Habilitar Authentication y Firestore
   - Copiar las credenciales de configuración
   - Actualizar `src/firebaseConfig.js` con tus credenciales

4. **Ejecutar el proyecto**
```bash
npm run dev
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── context/          # Context API para autenticación
│   ├── layout/           # Componentes de layout (navbar)
│   └── pages/            # Páginas principales
│       ├── auditoria/    # Sistema de auditorías
│       ├── dashboard/    # Panel principal
│       ├── formulario/   # Gestión de formularios
│       ├── usuarios/     # Gestión de usuarios
│       └── ...
├── router/               # Configuración de rutas
├── firebaseConfig.js     # Configuración de Firebase
└── main.jsx             # Punto de entrada
```

## 🔧 Configuración de Firebase

### Habilitar servicios necesarios:
1. **Authentication**: Email/Password
2. **Firestore Database**: Modo de producción
3. **Storage**: Para almacenar logos e imágenes

### Reglas de Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🎯 Uso del Sistema

### 1. Registro e Inicio de Sesión
- Crear una cuenta nueva
- Iniciar sesión con credenciales
- Recuperar contraseña si es necesario

### 2. Gestión de Empresas
- Agregar nuevas empresas
- Subir logos de empresas
- Gestionar información de contacto

### 3. Creación de Formularios
- Crear formularios personalizados
- Agregar secciones y preguntas
- Editar formularios existentes

### 4. Realizar Auditorías
- Seleccionar empresa y sucursal
- Elegir formulario de auditoría
- Completar todas las preguntas
- Agregar comentarios e imágenes
- Generar reporte

### 5. Generar Reportes
- Ver lista de auditorías realizadas
- Filtrar por empresa
- Generar PDF con resultados
- Imprimir o descargar reportes

## 🐛 Correcciones Realizadas

### Problemas Solucionados:
1. **Rutas inconsistentes** - Corregidas las rutas en navigation.js y routes.js
2. **Autenticación mejorada** - Integración completa con Firebase Auth
3. **Protección de rutas** - Implementado sistema de rutas protegidas
4. **Validación de formularios** - Agregadas validaciones con Formik y Yup
5. **Manejo de errores** - Mejorado el manejo de errores en todos los componentes
6. **Acceso a datos anidados** - Corregidos errores de acceso a propiedades opcionales
7. **UI/UX mejorada** - Interfaz más moderna y responsive
8. **Notificaciones** - Sistema de notificaciones con React-Toastify
9. **Estilos globales** - CSS mejorado para mejor experiencia de usuario

## 📝 Scripts Disponibles

```bash
npm run dev          # Ejecutar en modo desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de la build
npm run lint         # Ejecutar linter
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📞 Contacto

- **Email**: licvidalfernando@gmail.com
- **Proyecto**: Sistema de Auditoría

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ usando React y Firebase**
