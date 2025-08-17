# Manejo de Safe Areas en ControlAudit

## Descripción

Este documento explica cómo se manejan las "Safe Areas" (áreas seguras) en la aplicación ControlAudit para dispositivos móviles. Las safe areas son las áreas de la pantalla que están disponibles para el contenido de la aplicación, excluyendo las barras del sistema como la barra de navegación, la barra de estado, y los notches.

## Configuraciones Implementadas

### 1. Variables CSS Globales

Se han definido variables CSS en `src/global.css` y `src/safe-areas.css`:

```css
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}
```

### 2. Configuración del Viewport

En `index.html`, el viewport está configurado correctamente:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
```

### 3. Configuración de Android

En `android/app/src/main/res/values/styles.xml`:

```xml
<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
<item name="android:windowTranslucentNavigation">false</item>
<item name="android:windowTranslucentStatus">false</item>
<item name="android:fitsSystemWindows">true</item>
```

### 4. Configuración de Capacitor

En `capacitor.config.ts`:

```typescript
StatusBar: {
  style: 'light',
  backgroundColor: '#1976d2',
  overlaysWebView: true
}
```

**Nota importante:** La configuración `overlaysWebView: true` permite que la barra de estado se superponga al contenido web, lo que significa que la barra de navegación de la aplicación se extiende hasta arriba para cubrir el área de la barra de estado del sistema, creando una experiencia más inmersiva.

### 5. Configuración de la Barra de Estado

La barra de estado está configurada para:
- **Color de fondo:** `#1976d2` (azul Material-UI)
- **Estilo de texto:** `light` (texto claro sobre fondo oscuro)
- **Superposición:** `true` (la barra se superpone al contenido web)

Esto significa que:
1. La barra de estado del sistema tendrá el mismo color que la barra de navegación de la app
2. La barra de navegación se extiende hasta arriba para cubrir el área de la barra de estado
3. El contenido de la app se posiciona correctamente debajo de la barra de navegación extendida

## Componentes y Hooks

### 1. Hook useSafeArea

```javascript
import { useSafeArea } from '../../hooks/useSafeArea';

const MyComponent = () => {
  const safeArea = useSafeArea();
  // safeArea = { top: 0, right: 0, bottom: 34, left: 0 }
};
```

### 2. Hook useIsMobile

```javascript
import { useIsMobile } from '../../hooks/useSafeArea';

const MyComponent = () => {
  const isMobile = useIsMobile();
  // isMobile = true/false
};
```

### 3. Componente SafeAreaContainer

```javascript
import SafeAreaContainer from '../../common/SafeAreaContainer';

const MyComponent = () => {
  return (
    <SafeAreaContainer fullHeight={true} respectSafeArea={true}>
      <div>Mi contenido</div>
    </SafeAreaContainer>
  );
};
```

## Uso en Componentes

### Ejemplo Básico

```javascript
import SafeAreaContainer from '../../common/SafeAreaContainer';

const MyPage = () => {
  return (
    <SafeAreaContainer fullHeight={true}>
      <div>Contenido que respeta las safe areas</div>
    </SafeAreaContainer>
  );
};
```

### Ejemplo con Estilos Personalizados

```javascript
import SafeAreaContainer from '../../common/SafeAreaContainer';

const MyPage = () => {
  return (
    <SafeAreaContainer 
      fullHeight={true}
      sx={{
        backgroundColor: '#f5f5f5',
        padding: 2
      }}
    >
      <div>Contenido personalizado</div>
    </SafeAreaContainer>
  );
};
```

### Ejemplo sin Safe Areas

```javascript
import SafeAreaContainer from '../../common/SafeAreaContainer';

const MyPage = () => {
  return (
    <SafeAreaContainer respectSafeArea={false}>
      <div>Contenido que no respeta las safe areas</div>
    </SafeAreaContainer>
  );
};
```

## Estilos CSS Aplicados

### Para Dispositivos Móviles (≤768px)

```css
body {
  padding-top: var(--safe-area-inset-top);
  padding-bottom: var(--safe-area-inset-bottom);
  padding-left: var(--safe-area-inset-left);
  padding-right: var(--safe-area-inset-right);
}

.MuiAppBar-root {
  padding-top: var(--safe-area-inset-top);
  height: calc(56px + var(--safe-area-inset-top));
}

.floating-button {
  bottom: calc(16px + var(--safe-area-inset-bottom));
}
```

### Para Pantallas Pequeñas (≤480px)

```css
body {
  padding-top: calc(var(--safe-area-inset-top) * 0.5);
  padding-bottom: calc(var(--safe-area-inset-bottom) * 0.5);
  padding-left: calc(var(--safe-area-inset-left) * 0.5);
  padding-right: calc(var(--safe-area-inset-right) * 0.5);
}
```

## Casos de Uso Específicos

### 1. Páginas Completas

Usar `SafeAreaContainer` con `fullHeight={true}`:

```javascript
<SafeAreaContainer fullHeight={true}>
  <PageContent />
</SafeAreaContainer>
```

### 2. Elementos Flotantes

Usar las variables CSS directamente:

```css
.floating-button {
  position: fixed;
  bottom: calc(16px + var(--safe-area-inset-bottom));
  right: calc(16px + var(--safe-area-inset-right));
}
```

### 3. Diálogos y Modales

Los diálogos de Material-UI ya están configurados para respetar las safe areas:

```css
.MuiDialog-paper {
  margin-bottom: var(--safe-area-inset-bottom);
  max-height: calc(100vh - var(--safe-area-inset-top) - var(--safe-area-inset-bottom));
}
```

### 4. Barras de Navegación

Las barras de navegación están configuradas para respetar las safe areas:

```css
.MuiBottomNavigation-root {
  padding-bottom: var(--safe-area-inset-bottom);
  height: calc(56px + var(--safe-area-inset-bottom));
}
```

## Testing

### En Dispositivos Físicos

1. Probar en dispositivos con notch (iPhone X y posteriores)
2. Probar en dispositivos con barra de navegación gestual
3. Probar en diferentes orientaciones (portrait/landscape)
4. Probar en dispositivos Android con diferentes configuraciones

### En Simuladores

1. Usar el simulador de iOS con diferentes modelos de iPhone
2. Usar el emulador de Android con diferentes configuraciones de navegación
3. Cambiar la orientación del dispositivo durante las pruebas

## Troubleshooting

### Problema: El contenido se superpone con la barra de navegación

**Solución**: Asegurarse de que el componente use `SafeAreaContainer` o tenga padding-bottom configurado.

### Problema: Las safe areas no se aplican en Android

**Solución**: Verificar que `android:fitsSystemWindows="true"` esté configurado en `styles.xml`.

### Problema: El contenido no respeta el notch en iOS

**Solución**: Verificar que `viewport-fit=cover` esté configurado en el meta viewport.

## Notas Importantes

1. Las safe areas solo se aplican en dispositivos móviles (≤768px)
2. Los valores se calculan automáticamente usando `env()` de CSS
3. El hook `useSafeArea` proporciona valores en tiempo real
4. El componente `SafeAreaContainer` maneja automáticamente las safe areas
5. Las configuraciones de Android e iOS están optimizadas para cada plataforma

## Referencias

- [CSS Environment Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [Safe Area Insets](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Capacitor Status Bar Plugin](https://capacitorjs.com/docs/apis/status-bar)
- [Material-UI Responsive Design](https://mui.com/material-ui/customization/breakpoints/)
