# 📁 Estructura de CSS - ControlAudit v2

## 🎯 **Resumen**
Este documento explica la estructura de CSS en el proyecto para evitar conflictos y mantener una organización clara.

## 📂 **Estructura Actual**

### **1. CSS Principal Unificado**
```
src/styles/main.css
```
- ✅ **Variables globales** (colores, safe areas)
- ✅ **Reset y estilos base**
- ✅ **Responsive design** (móvil, tablet, desktop)
- ✅ **Utilidades globales**
- ✅ **Componentes específicos**

### **2. CSS por Página/Componente**
```
src/components/pages/
├── admin/ClienteDashboard.css
├── home/Home.css
├── auditoria/reporte/
│   ├── ReportesPage.css
│   └── Firma.css
├── perfil/PerfilEmpresas.css
└── layout/navbar/Navbar.css
```

## 🔄 **Orden de Carga**

1. **`src/styles/main.css`** - Estilos globales y base
2. **CSS de componentes específicos** - Estilos locales por página

## 📱 **Responsive Design**

### **Breakpoints Definidos**
```css
/* Móviles */
@media (max-width: 768px) { ... }

/* Tablets */
@media (min-width: 769px) and (max-width: 1024px) { ... }

/* Desktop */
@media (min-width: 1025px) { ... }
```

### **Clases Utilitarias**
```css
.mobile-optimized    /* Optimizaciones para móviles */
.desktop-centered    /* Centrado para desktop */
.text-center         /* Texto centrado */
.d-flex             /* Display flex */
```

## 🎨 **Variables CSS**

### **Colores**
```css
:root {
  --color-bg: #f5f5f5;
  --color-text: #222;
  --color-link: #1976d2;
  /* ... más variables */
}
```

### **Safe Areas (Móviles)**
```css
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}
```

## 🚫 **Archivos CSS Obsoletos**

Los siguientes archivos ya NO se usan (se unificaron en `main.css`):
- ❌ `src/global.css`
- ❌ `src/mobile-optimization.css`
- ❌ `src/web-optimization.css`
- ❌ `src/desktop-optimization.css`
- ❌ `src/centering-fixes.css`
- ❌ `src/safe-areas.css`

## 💡 **Buenas Prácticas**

### **Para Nuevos Componentes**
1. **Usar variables CSS** en lugar de colores hardcodeados
2. **Crear CSS específico** solo si es necesario
3. **Usar clases utilitarias** cuando sea posible
4. **Seguir el patrón responsive** establecido

### **Ejemplo de CSS de Componente**
```css
/* src/components/mi-componente/MiComponente.css */
.mi-componente {
  background-color: var(--color-bg-paper);
  color: var(--color-text);
  padding: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .mi-componente {
    padding: 0.5rem;
  }
}
```

## 🔧 **Solución de Problemas**

### **Si algo se ve mal:**
1. **Verificar el orden de carga** en `App.jsx`
2. **Revisar conflictos** entre CSS específicos
3. **Usar DevTools** para inspeccionar estilos aplicados
4. **Verificar media queries** conflictivas

### **Para agregar nuevos estilos:**
1. **Estilos globales** → `src/styles/main.css`
2. **Estilos específicos** → CSS del componente
3. **Variables nuevas** → Agregar a `:root` en `main.css`

## 📝 **Notas Importantes**

- ✅ **Un solo archivo principal** para evitar conflictos
- ✅ **Variables CSS** para consistencia
- ✅ **Responsive design** integrado
- ✅ **Safe areas** para móviles
- ✅ **Modo oscuro** soportado
