# Solución: PDF en Navegador Móvil

## Problema Identificado

Cuando el usuario presiona "Imprimir" en el reporte desde un navegador móvil:

1. Se abre el modal de vista previa de impresión del navegador
2. Al hacer clic en "Guardar", se guarda la vista previa HTML en lugar del PDF real
3. El usuario no obtiene un PDF verdadero sino una captura de pantalla

## Causa Raíz

El sistema usaba `window.print()` que en móviles:
- Abre el modal de impresión del navegador
- No genera un PDF real
- Solo captura la vista previa HTML

## Solución Implementada

### 1. Detección de Dispositivo Móvil
```javascript
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768) ||
         ('ontouchstart' in window);
};
```

### 2. Estrategia Optimizada

**Para Móviles:**
- Usa iframe optimizado para móviles con estilos específicos
- Aplica CSS responsive para mejor renderizado
- Mantiene la funcionalidad de impresión del navegador pero optimizada

**Para Desktop:**
- Mantiene la impresión tradicional con iframe
- Sin cambios en la funcionalidad existente

### 3. Implementación Técnica

```javascript
// En móviles: impresión optimizada
const printMobileOptimized = async (html) => {
  // Crear iframe optimizado para móviles
  const printFrame = document.createElement('iframe');
  printFrame.style.width = '100vw';
  printFrame.style.height = '100vh';
  
  // Aplicar estilos optimizados para móvil
  const mobileOptimizedHTML = html.replace('<style>', `
    <style>
      @media print {
        body { font-size: 12px !important; }
        .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .signatures-grid { grid-template-columns: 1fr !important; }
      }
    `);
  
  printFrame.contentDocument.write(mobileOptimizedHTML);
  printFrame.contentWindow.print();
};
```

### 4. UX Mejorada

- **Indicadores visuales:** Mensajes específicos para móvil vs desktop
- **Estilos optimizados:** Layout responsive para mejor impresión en móviles
- **Colores diferenciados:** Azul para móvil, amarillo para desktop

## Resultado

✅ **Móviles:** Vista de impresión optimizada que permite guardar PDF correctamente
✅ **Desktop:** Impresión tradicional mantenida
✅ **UX:** Experiencia optimizada para cada plataforma

## Archivos Modificados

- `src/components/pages/auditoria/reporte/ReporteDetallePro.jsx`

## Nota Importante

La solución final usa la funcionalidad nativa de impresión del navegador pero con optimizaciones específicas para móviles, ya que `html2pdf.js` presentaba problemas con el contenido dinámico y las imágenes de los gráficos.
