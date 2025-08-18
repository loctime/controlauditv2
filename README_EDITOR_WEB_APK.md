# Guía de Edición Separada: Web vs APK

## 📋 Resumen

Este proyecto está configurado para manejar **dos entornos de desarrollo separados**:
- **Web/PC**: Optimizado para navegadores de escritorio
- **APK/Móvil**: Optimizado para dispositivos Android

## 🏗️ Arquitectura de CSS

### Archivos CSS Principales

```
src/
├── global.css                    # Estilos base globales
├── mobile-optimization.css       # Optimizaciones específicas para móvil
├── web-optimization.css          # Optimizaciones específicas para web
├── centering-fixes.css           # Fixes para centrado en web
├── safe-areas.css               # Configuraciones de safe areas
└── components/
    └── layout/
        └── navbar/
            └── Navbar.css        # Estilos específicos del navbar
```

### Importación en App.jsx

```javascript
import './safe-areas.css';        // Safe areas para móvil
import './mobile-optimization.css'; // Optimizaciones móvil
import './web-optimization.css';   // Optimizaciones web
import './centering-fixes.css';    // Fixes centrado web
```

## 🎯 Estrategia de Media Queries

### Breakpoint Principal: 769px

```css
/* Móvil: 0px - 768px */
@media (max-width: 768px) {
  /* Estilos móviles */
}

/* Web: 769px+ */
@media (min-width: 769px) {
  /* Estilos web */
}
```

### Breakpoints Secundarios

```css
/* Pantallas muy grandes */
@media (min-width: 1200px) {
  /* Optimizaciones adicionales */
}

/* Pantallas ultra grandes */
@media (min-width: 1600px) {
  /* Optimizaciones adicionales */
}
```

## 📱 Edición para APK/Móvil

### Archivos a Modificar

1. **`src/mobile-optimization.css`**
   - Optimizaciones específicas para dispositivos móviles
   - Safe areas y notches
   - Touch targets y accesibilidad
   - Scroll optimizado

2. **`src/safe-areas.css`**
   - Configuraciones de safe areas para iOS/Android
   - Variables CSS para insets

3. **`src/components/layout/navbar/Navbar.css`**
   - Sección `@media (max-width: 768px)`
   - Drawer móvil y navegación táctil

### Ejemplo de Edición Móvil

```css
/* En mobile-optimization.css */
@media (max-width: 768px) {
  .main-app-container {
    padding: 8px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  }
  
  .MuiButton-root {
    min-height: 44px; /* Touch target mínimo */
  }
}
```

### Características Móviles

- ✅ **Safe Areas**: Respeto de notches y barras de sistema
- ✅ **Touch Targets**: Mínimo 44px para elementos interactivos
- ✅ **Scroll Optimizado**: `-webkit-overflow-scrolling: touch`
- ✅ **Zoom Permitido**: `text-size-adjust: auto`
- ✅ **Drawer Lateral**: Navegación táctil
- ✅ **Responsive**: Adaptación a diferentes tamaños de pantalla

## 💻 Edición para Web/PC

### Archivos a Modificar

1. **`src/web-optimization.css`**
   - Optimizaciones específicas para navegadores de escritorio
   - Centrado de contenido
   - Layouts de escritorio

2. **`src/centering-fixes.css`**
   - Fixes específicos para centrado en web
   - Contenedores centrados

3. **`src/components/layout/navbar/Navbar.css`**
   - Sección `@media (min-width: 769px)`
   - Navegación horizontal

### Ejemplo de Edición Web

```css
/* En web-optimization.css */
@media (min-width: 769px) {
  .main-app-container {
    max-width: 1200px;
    margin: 0 auto;
    align-items: center;
  }
  
  .MuiAppBar-root {
    width: 100% !important;
    max-width: 100% !important;
  }
}
```

### Características Web

- ✅ **Contenido Centrado**: Ancho máximo con márgenes automáticos
- ✅ **Navbar Completo**: Ocupa todo el ancho de la pantalla
- ✅ **Navegación Horizontal**: Enlaces en línea
- ✅ **Responsive**: Diferentes anchos máximos según pantalla
- ✅ **Hover Effects**: Interacciones de mouse
- ✅ **Scroll Suave**: Scroll nativo del navegador

## 🔧 Comandos de Desarrollo

### Desarrollo Web
```bash
npm run dev
# Inicia servidor en http://localhost:5175
# Solo frontend (backend puede fallar)
```

### Desarrollo APK
```bash
npm run fer
# Compila para Android
# Requiere Android Studio y emulador
```

### Desarrollo Completo
```bash
npm run die
# Ejecuta tanto web como móvil
```

## 📐 Estructura de Contenedores

### Móvil (768px y menos)
```
body
└── #root
    └── .main-app-container (ancho completo)
        └── .page-container (ancho completo)
            └── .content-container (con safe areas)
```

### Web (769px+)
```
body
└── #root (centrado, max-width: 1200px)
    └── .main-app-container (centrado)
        └── .page-container (centrado)
            └── .content-container (centrado, max-width: 800px)
```

## 🎨 Sistema de Diseño

### Colores
```css
:root {
  --color-bg: #f5f5f5;
  --color-bg-paper: #fff;
  --color-text: #222;
  --color-link: #1976d2;
}
```

### Tipografía
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', ...;
  font-size: 16px;
  line-height: 1.5;
}
```

### Espaciado
```css
/* Móvil */
padding: 8px;
margin: 4px;

/* Web */
padding: 20px;
margin: 16px;
```

## 🚀 Flujo de Trabajo Recomendado

### 1. Desarrollo Inicial
1. Desarrollar funcionalidad en web (`npm run dev`)
2. Probar en diferentes tamaños de pantalla
3. Ajustar CSS móvil según sea necesario

### 2. Testing Móvil
1. Usar DevTools del navegador (modo móvil)
2. Probar en dispositivo físico
3. Verificar safe areas y touch targets

### 3. Testing APK
1. Compilar APK (`npm run fer`)
2. Instalar en dispositivo Android
3. Probar funcionalidad completa

### 4. Ajustes Finales
1. Refinar CSS según feedback
2. Optimizar performance
3. Documentar cambios

## 🔍 Debugging

### Herramientas de Desarrollo
- **Chrome DevTools**: Para testing responsive
- **React Developer Tools**: Para debugging de componentes
- **Android Studio**: Para debugging APK

### Logs Útiles
```javascript
// En Navbar.jsx
console.log('=== INFORMACIÓN DE NAVEGACIÓN ===');
console.log('Rol:', role);
console.log('Permisos:', permisos);
```

### CSS Debugging
```css
/* Agregar temporalmente para debug */
* {
  border: 1px solid red !important;
}
```

## 📝 Checklist de Edición

### Antes de Editar
- [ ] Identificar si el cambio es para web, móvil o ambos
- [ ] Verificar breakpoints actuales
- [ ] Probar en ambos entornos

### Durante la Edición
- [ ] Usar media queries apropiadas
- [ ] Mantener consistencia con el sistema de diseño
- [ ] Probar en diferentes tamaños de pantalla

### Después de Editar
- [ ] Probar en navegador web
- [ ] Probar en dispositivo móvil
- [ ] Verificar que no se rompió el otro entorno
- [ ] Documentar cambios importantes

## ⚠️ Consideraciones Importantes

### No Romper el Otro Entorno
- ✅ Usar media queries específicas
- ✅ Probar en ambos entornos
- ✅ Mantener funcionalidad base

### Performance
- ✅ CSS optimizado para cada entorno
- ✅ Lazy loading cuando sea posible
- ✅ Imágenes responsive

### Accesibilidad
- ✅ Touch targets mínimos en móvil
- ✅ Navegación por teclado en web
- ✅ Contraste adecuado en ambos

## 🔄 Mantenimiento

### Actualizaciones Regulares
1. Revisar compatibilidad con nuevas versiones
2. Actualizar dependencias
3. Optimizar performance

### Testing Continuo
1. Probar en diferentes dispositivos
2. Verificar funcionalidad en ambos entornos
3. Mantener documentación actualizada

---

## 📞 Soporte

Para dudas sobre la edición separada:
- Revisar este README
- Verificar ejemplos en el código
- Probar cambios en ambos entornos antes de commit

**¡Recuerda: Siempre prueba en web Y móvil antes de hacer commit!**
