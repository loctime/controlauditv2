# 🛡️ Sistema de Navegación Guardada - Auditoría

## 📋 Descripción

Este sistema previene la pérdida de datos cuando el usuario intenta salir de la auditoría accidentalmente, ya sea usando el botón "atrás" del navegador, cerrando la pestaña, o navegando a otra página.

## 🚀 Características

### ✅ **Prevención de Pérdida de Datos**
- Detecta cuando el usuario intenta salir con cambios sin guardar
- Muestra confirmación antes de permitir la salida
- Autoguardado automático cada 30 segundos
- Restauración de auditorías guardadas al volver

### 🔄 **Autoguardado Inteligente**
- Guarda automáticamente en Firestore y localStorage
- Detecta cambios en respuestas, comentarios e imágenes
- Muestra indicador visual del estado de guardado
- Limpia datos antiguos automáticamente

### 🎯 **Experiencia de Usuario**
- Alertas visuales no intrusivas
- Confirmaciones claras y accesibles
- Opciones de guardar, descartar o cancelar
- Restauración automática al volver

## 📁 Estructura de Archivos

```
auditoria/
├── hooks/
│   └── useNavigationGuard.js          # Hook principal de navegación guardada
├── components/
│   ├── AutoSaveAlert.jsx              # Alerta de estado de autoguardado
│   └── ExitConfirmation.jsx           # Diálogo de confirmación de salida
├── services/
│   └── autoSaveService.js             # Servicio de autoguardado
└── Auditoria.jsx                      # Componente principal con integración
```

## 🔧 Componentes

### `useNavigationGuard.js`
Hook principal que maneja:
- Detección de navegación (beforeunload, popstate)
- Confirmaciones antes de salir
- Autoguardado automático
- Manejo de navegación programática

### `AutoSaveAlert.jsx`
Componente visual que muestra:
- Estado de guardado actual
- Último tiempo de guardado
- Indicador de cambios sin guardar
- Animaciones suaves

### `ExitConfirmation.jsx`
Diálogo de confirmación con:
- Opciones claras (Guardar, Descartar, Cancelar)
- Información del último guardado
- Diseño accesible y responsive

### `autoSaveService.js`
Servicio que maneja:
- Guardado en Firestore y localStorage
- Restauración de datos
- Limpieza automática
- Generación de hashes para comparación

## 🎮 Uso

### Integración Básica

```jsx
import { useNavigationGuard } from './hooks/useNavigationGuard';
import autoSaveService from './services/autoSaveService';

const Auditoria = () => {
  // Estados de autoguardado
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Funciones de autoguardado
  const checkUnsavedChanges = useCallback(() => {
    return hasData && hasUnsavedChanges;
  }, [hasData, hasUnsavedChanges]);

  const handleAutoSave = useCallback(async () => {
    // Lógica de guardado
  }, [dependencies]);

  const handleDiscardChanges = useCallback(async () => {
    // Lógica de descarte
  }, []);

  // Hook de navegación guardada
  const navigationGuard = useNavigationGuard({
    hasUnsavedChanges: checkUnsavedChanges,
    onSave: handleAutoSave,
    onDiscard: handleDiscardChanges,
    autoSaveInterval: 30000, // 30 segundos
    showConfirmation: true
  });

  return (
    <>
      {/* Contenido de auditoría */}
      
      {/* Alerta de autoguardado */}
      <AutoSaveAlert
        isSaving={isSaving}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
        showAlert={true}
      />
    </>
  );
};
```

## ⚙️ Configuración

### Intervalo de Autoguardado
```jsx
const navigationGuard = useNavigationGuard({
  autoSaveInterval: 30000, // 30 segundos (por defecto)
  // ... otras opciones
});
```

### Deshabilitar Confirmaciones
```jsx
const navigationGuard = useNavigationGuard({
  showConfirmation: false, // Deshabilitar confirmaciones
  // ... otras opciones
});
```

## 🔍 Detección de Cambios

El sistema detecta cambios en:
- ✅ Selección de empresa
- ✅ Selección de sucursal  
- ✅ Selección de formulario
- ✅ Respuestas a preguntas
- ✅ Comentarios
- ✅ Imágenes adjuntas
- ✅ Progreso de pasos

## 💾 Almacenamiento

### Firestore
- Colección: `auditorias_autosave`
- Documentos con ID único por sesión
- Datos: respuestas, comentarios, configuración

### localStorage
- Clave: `auditoria_autosave`
- Respaldo local para casos offline
- Limpieza automática después de 7 días

## 🚨 Casos de Uso

### 1. Usuario presiona "Atrás" del navegador
```
1. Sistema detecta navegación
2. Verifica cambios sin guardar
3. Muestra confirmación
4. Usuario elige: Guardar/Descartar/Cancelar
5. Ejecuta acción seleccionada
```

### 2. Usuario cierra pestaña
```
1. Sistema detecta beforeunload
2. Muestra mensaje de advertencia
3. Usuario puede cancelar o continuar
4. Si continúa, se pierden cambios
```

### 3. Usuario navega a otra página
```
1. Sistema detecta navegación
2. Verifica cambios sin guardar
3. Muestra diálogo de confirmación
4. Usuario elige acción
5. Navega según elección
```

## 🎨 Personalización

### Colores de Alertas
```jsx
// En AutoSaveAlert.jsx
const getStatusColor = () => {
  switch (statusType) {
    case 'success': return 'success';
    case 'error': return 'error';
    case 'warning': return 'warning';
    default: return 'info';
  }
};
```

### Mensajes de Confirmación
```jsx
// En useNavigationGuard.js
const showExitConfirmation = useCallback((message) => {
  return new Promise((resolve) => {
    // Personalizar mensaje aquí
  });
}, []);
```

## 🐛 Solución de Problemas

### Error: "No se puede acceder a localStorage"
- Verificar permisos del navegador
- Usar modo incógnito para testing
- Implementar fallback a sessionStorage

### Error: "Firestore no disponible"
- Sistema usa localStorage como respaldo
- Verificar conexión a internet
- Revisar configuración de Firebase

### Autoguardado no funciona
- Verificar que `userProfile?.uid` existe
- Revisar permisos de Firestore
- Comprobar que `hasUnsavedChanges` retorna true

## 🔮 Mejoras Futuras

- [ ] Sincronización en tiempo real
- [ ] Modo offline completo
- [ ] Compresión de imágenes automática
- [ ] Historial de versiones
- [ ] Exportación de datos guardados
- [ ] Notificaciones push de guardado

## 📝 Notas de Desarrollo

- El sistema es compatible con React Router v6
- Funciona en navegadores modernos (ES6+)
- Requiere Firebase configurado correctamente
- Soporta dispositivos móviles y desktop
- Accesible según estándares WCAG 2.1 