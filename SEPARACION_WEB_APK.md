# Separación Web vs APK - ControlAudit

## Resumen

Se ha implementado una separación completa entre la versión web y la versión APK para evitar incompatibilidades de diseño y funcionalidad.

## Estructura

### 🔵 Versión Web
- **Propósito**: Gestión administrativa y configuración
- **Funcionalidades**:
  - Gestión de formularios
  - Administración de establecimientos
  - Generación de reportes
  - Gestión de usuarios
  - Configuración del sistema
  - Dashboard de administración

### 📱 Versión APK
- **Propósito**: Realización de auditorías en campo
- **Funcionalidades**:
  - Solo auditoría
  - Sin navbar
  - Interfaz optimizada para móvil
  - Pantalla completa

## Archivos Clave

### Detección de Plataforma
- `src/hooks/usePlatform.js` - Hook para detectar si estamos en APK o web

### Rutas
- `src/router/routesWeb.js` - Rutas específicas para web (sin auditoría)
- `src/router/routesAPK.js` - Rutas específicas para APK (solo auditoría)
- `src/router/AppRouter.jsx` - Router principal que decide qué rutas usar

### Navegación
- `src/router/navigation.js` - Menú específico para web (sin auditoría)
- `src/components/layout/navbar/Navbar.jsx` - Navbar que no se muestra en APK

### Componentes
- `src/components/pages/home/Home.jsx` - Home optimizado para web
- `src/components/pages/auditoria/auditoria/AuditoriaAPK.jsx` - Wrapper para auditoría en APK

## Cómo Funciona

1. **Detección Automática**: El hook `usePlatform` detecta automáticamente si estamos en APK o web
2. **Rutas Diferentes**: Según la plataforma, se cargan rutas diferentes
3. **Interfaz Adaptada**: 
   - Web: Navbar completo con todas las funcionalidades
   - APK: Sin navbar, solo auditoría en pantalla completa

## Ventajas

### Para Web
- ✅ Diseño optimizado para pantallas grandes
- ✅ Todas las funcionalidades administrativas
- ✅ Mejor experiencia de usuario en desktop
- ✅ Sin limitaciones de diseño móvil

### Para APK
- ✅ Interfaz específica para auditorías
- ✅ Pantalla completa sin distracciones
- ✅ Optimización específica para móvil
- ✅ Carga más rápida (solo lo necesario)

## Desarrollo

### Agregar Funcionalidad Web
1. Agregar la ruta en `routesWeb.js`
2. Agregar el item en `navigation.js`
3. Crear el componente optimizado para web

### Agregar Funcionalidad APK
1. Agregar la ruta en `routesAPK.js`
2. Crear componente específico para APK si es necesario

### Modificar Auditoría
- Los cambios en `Auditoria.jsx` afectan tanto web como APK
- Para cambios específicos de APK, usar `AuditoriaAPK.jsx`

## Notas Importantes

- La auditoría sigue siendo accesible desde web, pero no está en el menú principal
- El APK solo muestra auditoría, sin acceso a otras funcionalidades
- Los estilos CSS están separados por plataforma
- La detección de plataforma es automática y transparente para el usuario
