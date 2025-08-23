# SOLUCIÓN PARA PROBLEMA DE CENTRADO EN APK MÓVIL

## Problema Identificado

La página de auditoría en la APK móvil presentaba un problema de centrado donde:
- Un lado tenía un pequeño margen
- El otro lado se cortaba como si el contenido continuara fuera de la pantalla
- El contenido no estaba perfectamente centrado en la pantalla

## Análisis del Problema

El problema se debía a múltiples factores:

1. **Conflictos entre archivos CSS**: Había múltiples archivos CSS con reglas que se contradecían
2. **Configuraciones de viewport**: El viewport no estaba correctamente configurado para la APK
3. **Safe areas**: Las safe areas no se estaban aplicando correctamente
4. **Márgenes desiguales**: Los márgenes laterales no estaban balanceados
5. **Overflow horizontal**: Había scroll horizontal no deseado

## Solución Implementada

Se crearon 3 archivos CSS específicos para corregir el problema:

### 1. `src/styles/apk-centering-fix.css`
- **Propósito**: Corregir el centrado general de la página de auditoría
- **Funciones**:
  - Reset completo de contenedores principales
  - Centrado perfecto usando flexbox
  - Control de overflow horizontal
  - Aplicación correcta de safe areas

### 2. `src/styles/apk-viewport-fix.css`
- **Propósito**: Corregir problemas específicos del viewport en la APK
- **Funciones**:
  - Reset del viewport para WebView de Android
  - Configuración correcta de safe areas
  - Prevención de scroll horizontal
  - Configuraciones específicas para WebView

### 3. `src/styles/apk-margin-fix.css`
- **Propósito**: Corregir el problema específico de márgenes desiguales
- **Funciones**:
  - Reset completo de márgenes laterales
  - Balanceo de márgenes en todos los componentes
  - Corrección específica del problema de margen desigual

## Cambios Realizados

### Archivos Modificados:

1. **`src/components/pages/auditoria/auditoria/Auditoria.css`**
   - Se agregaron reglas específicas para APK móvil al final del archivo
   - Reset completo de contenedores y componentes
   - Centrado perfecto con flexbox

2. **`src/main.jsx`**
   - Se agregaron las importaciones de los 3 nuevos archivos CSS:
     ```javascript
     import "./styles/apk-centering-fix.css";
     import "./styles/apk-viewport-fix.css";
     import "./styles/apk-margin-fix.css";
     ```

### Archivos Creados:

1. **`src/styles/apk-centering-fix.css`** - Fix para centrado general
2. **`src/styles/apk-viewport-fix.css`** - Fix para viewport en APK
3. **`src/styles/apk-margin-fix.css`** - Fix para márgenes desiguales

## Características de la Solución

### ✅ Reset Completo
- Eliminación de todos los márgenes y padding innecesarios
- Reset de transformaciones y posicionamiento
- Control total del box model

### ✅ Centrado Perfecto
- Uso de flexbox para centrado horizontal y vertical
- Aplicación de `align-items: center` en todos los contenedores
- Control de `justify-content` para distribución vertical

### ✅ Safe Areas
- Aplicación correcta de `env(safe-area-inset-*)`
- Respeto de las áreas seguras del dispositivo
- Padding adaptativo según el dispositivo

### ✅ Control de Overflow
- Eliminación completa del scroll horizontal
- Control de `overflow-x: hidden`
- Scroll vertical suave con `-webkit-overflow-scrolling: touch`

### ✅ Responsive Design
- Media queries específicas para móviles (≤768px)
- Media queries para pantallas muy pequeñas (≤480px)
- Configuraciones específicas para WebView de Android

## Reglas CSS Clave

### Para Contenedores Principales:
```css
.auditoria-container {
  width: 100vw !important;
  max-width: 100vw !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  overflow-x: hidden !important;
}
```

### Para Safe Areas:
```css
padding-left: calc(16px + env(safe-area-inset-left, 0px)) !important;
padding-right: calc(16px + env(safe-area-inset-right, 0px)) !important;
```

### Para WebView:
```css
-webkit-overflow-scrolling: touch !important;
overscroll-behavior: none !important;
```

## Resultado Esperado

Después de aplicar esta solución:

1. ✅ La página de auditoría estará perfectamente centrada en la APK
2. ✅ No habrá márgenes desiguales
3. ✅ No habrá scroll horizontal
4. ✅ Las safe areas se respetarán correctamente
5. ✅ El contenido se adaptará a diferentes tamaños de pantalla
6. ✅ La experiencia será consistente en todos los dispositivos móviles

## Verificación

Para verificar que la solución funciona correctamente:

1. Compilar la APK: `npm run fer`
2. Instalar en dispositivo móvil
3. Navegar a la página de auditoría
4. Verificar que:
   - El contenido esté centrado
   - No haya scroll horizontal
   - Los márgenes sean uniformes
   - Las safe areas se respeten

## Mantenimiento

Si se realizan cambios en el futuro:

1. **No eliminar** los archivos CSS de fix para APK
2. **Verificar** que las reglas CSS no entren en conflicto
3. **Probar** en dispositivos móviles reales
4. **Documentar** cualquier cambio adicional

## Notas Importantes

- Los archivos CSS usan `!important` para asegurar que sobrescriban otras reglas
- Las reglas están específicamente dirigidas a dispositivos móviles (≤768px)
- Se mantiene la funcionalidad existente para web y desktop
- La solución es compatible con todos los navegadores móviles y WebView de Android
