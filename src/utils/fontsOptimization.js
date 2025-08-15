// Optimización de importaciones de Fonts
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar Roboto de forma lazy
export const loadRoboto = async () => {
  await import('@fontsource/roboto/300.css');
  await import('@fontsource/roboto/400.css');
  await import('@fontsource/roboto/500.css');
  await import('@fontsource/roboto/700.css');
  await import('@fontsource/roboto/900.css');
  
  return {
    fontFamily: 'Roboto, sans-serif',
    weights: [300, 400, 500, 700, 900]
  };
};

// Función para cargar Google Fonts de forma lazy
export const loadGoogleFonts = async (fonts = []) => {
  const defaultFonts = [
    'Roboto:300,400,500,700,900',
    'Open+Sans:300,400,500,600,700,800',
    'Lato:300,400,700,900',
    'Poppins:300,400,500,600,700,800,900',
    'Inter:300,400,500,600,700,800,900',
    'Montserrat:300,400,500,600,700,800,900',
    'Source+Sans+Pro:300,400,600,700,900',
    'Ubuntu:300,400,500,700',
    'Nunito:300,400,500,600,700,800,900',
    'Raleway:300,400,500,600,700,800,900'
  ];
  
  const fontsToLoad = fonts.length > 0 ? fonts : defaultFonts;
  const fontUrls = fontsToLoad.map(font => 
    `https://fonts.googleapis.com/css2?family=${font}&display=swap`
  );
  
  // Cargar fuentes dinámicamente
  const loadFont = (url) => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.href = url;
      link.rel = 'stylesheet';
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  };
  
  try {
    await Promise.all(fontUrls.map(loadFont));
    return { success: true, fonts: fontsToLoad };
  } catch (error) {
    console.error('Error loading Google Fonts:', error);
    return { success: false, error };
  }
};

// Función para cargar fuentes personalizadas
export const loadCustomFonts = async (fontConfigs = []) => {
  const defaultConfigs = [
    {
      family: 'CustomFont',
      src: '/fonts/CustomFont.woff2',
      weight: '400',
      style: 'normal'
    }
  ];
  
  const configs = fontConfigs.length > 0 ? fontConfigs : defaultConfigs;
  
  const fontFaces = configs.map(config => `
    @font-face {
      font-family: '${config.family}';
      src: url('${config.src}') format('woff2');
      font-weight: ${config.weight || '400'};
      font-style: ${config.style || 'normal'};
      font-display: swap;
    }
  `).join('\n');
  
  // Crear y agregar estilos de fuentes
  const style = document.createElement('style');
  style.textContent = fontFaces;
  document.head.appendChild(style);
  
  return { success: true, fonts: configs };
};

// Configuración optimizada para fuentes
export const getFontsConfig = async (options = {}) => {
  const defaultConfig = {
    primary: 'Roboto',
    secondary: 'Open Sans',
    monospace: 'Courier New',
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
      black: 900
    },
    ...options
  };
  
  return { config: defaultConfig };
};

// Utilidades para fuentes
export const fontUtils = {
  // Precargar fuentes críticas
  preloadCriticalFonts: async () => {
    const criticalFonts = [
      '/fonts/Roboto-Regular.woff2',
      '/fonts/Roboto-Bold.woff2'
    ];
    
    const preloadLinks = criticalFonts.map(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      return link;
    });
    
    preloadLinks.forEach(link => document.head.appendChild(link));
  },
  
  // Verificar si una fuente está cargada
  isFontLoaded: (fontFamily) => {
    return document.fonts.check(`12px "${fontFamily}"`);
  },
  
  // Esperar a que una fuente se cargue
  waitForFont: (fontFamily, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Font ${fontFamily} failed to load within ${timeout}ms`));
      }, timeout);
      
      if (fontUtils.isFontLoaded(fontFamily)) {
        clearTimeout(timer);
        resolve();
        return;
      }
      
      document.fonts.ready.then(() => {
        if (fontUtils.isFontLoaded(fontFamily)) {
          clearTimeout(timer);
          resolve();
        } else {
          clearTimeout(timer);
          reject(new Error(`Font ${fontFamily} not found`));
        }
      });
    });
  },
  
  // Aplicar fuentes con fallbacks
  applyFonts: (fontConfig) => {
    const { primary, secondary, monospace } = fontConfig;
    
    const css = `
      body {
        font-family: '${primary}', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      }
      
      .font-secondary {
        font-family: '${secondary}', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      }
      
      .font-mono {
        font-family: '${monospace}', 'Courier New', Courier, monospace;
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  },
  
  // Optimizar carga de fuentes
  optimizeFontLoading: () => {
    // Configurar font-display: swap para todas las fuentes
    const fontDisplayCSS = `
      @font-face {
        font-display: swap;
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = fontDisplayCSS;
    document.head.appendChild(style);
    
    // Precargar fuentes críticas
    fontUtils.preloadCriticalFonts();
  },
  
  // Generar CSS de fuentes
  generateFontCSS: (fonts) => {
    return fonts.map(font => `
      @font-face {
        font-family: '${font.family}';
        src: url('${font.src}') format('${font.format || 'woff2'}');
        font-weight: ${font.weight || '400'};
        font-style: ${font.style || 'normal'};
        font-display: ${font.display || 'swap'};
      }
    `).join('\n');
  },
  
  // Aplicar fuentes a elementos específicos
  applyFontToElement: (element, fontFamily, options = {}) => {
    const { weight, style, size } = options;
    
    element.style.fontFamily = fontFamily;
    if (weight) element.style.fontWeight = weight;
    if (style) element.style.fontStyle = style;
    if (size) element.style.fontSize = size;
  },
  
  // Crear clases de utilidad para fuentes
  createFontUtilityClasses: (fonts) => {
    const utilityCSS = fonts.map(font => `
      .font-${font.name} {
        font-family: '${font.family}', ${font.fallback || 'sans-serif'};
      }
      
      .font-${font.name}-${font.weight} {
        font-family: '${font.family}', ${font.fallback || 'sans-serif'};
        font-weight: ${font.weight};
      }
    `).join('\n');
    
    const style = document.createElement('style');
    style.textContent = utilityCSS;
    document.head.appendChild(style);
  }
};

// Configuraciones predefinidas de fuentes
export const fontPresets = {
  // Preset moderno
  modern: {
    primary: 'Inter',
    secondary: 'Poppins',
    monospace: 'JetBrains Mono',
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900
    }
  },
  
  // Preset clásico
  classic: {
    primary: 'Roboto',
    secondary: 'Open Sans',
    monospace: 'Courier New',
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
      black: 900
    }
  },
  
  // Preset elegante
  elegant: {
    primary: 'Playfair Display',
    secondary: 'Lato',
    monospace: 'Source Code Pro',
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900
    }
  },
  
  // Preset minimalista
  minimal: {
    primary: 'Helvetica Neue',
    secondary: 'Arial',
    monospace: 'Monaco',
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700
    }
  }
};

// Hook personalizado para fuentes
export const useFonts = () => {
  const loadFonts = async (preset = 'modern') => {
    const fontConfig = fontPresets[preset];
    if (!fontConfig) {
      throw new Error(`Font preset '${preset}' not found`);
    }
    
    // Cargar fuentes de Google
    const googleFonts = [
      `${fontConfig.primary}:${Object.values(fontConfig.weights).join(',')}`,
      `${fontConfig.secondary}:${Object.values(fontConfig.weights).join(',')}`
    ];
    
    await loadGoogleFonts(googleFonts);
    fontUtils.applyFonts(fontConfig);
    
    return fontConfig;
  };
  
  const applyFontPreset = (preset) => {
    const fontConfig = fontPresets[preset];
    if (fontConfig) {
      fontUtils.applyFonts(fontConfig);
    }
  };
  
  const optimizeLoading = () => {
    fontUtils.optimizeFontLoading();
  };
  
  const waitForFont = (fontFamily, timeout) => {
    return fontUtils.waitForFont(fontFamily, timeout);
  };
  
  const isFontLoaded = (fontFamily) => {
    return fontUtils.isFontLoaded(fontFamily);
  };
  
  return {
    loadFonts,
    applyFontPreset,
    optimizeLoading,
    waitForFont,
    isFontLoaded,
    presets: fontPresets
  };
};
