/**
 * Utilidades para manejar las safe areas en dispositivos móviles
 */

/**
 * Obtiene las dimensiones de las safe areas usando JavaScript
 * @returns {Object} Objeto con las dimensiones de las safe areas
 */
export const getSafeAreaInsets = () => {
  // Intentar obtener las safe areas usando CSS env()
  const style = getComputedStyle(document.documentElement);
  
  const top = parseInt(style.getPropertyValue('--safe-area-inset-top')) || 0;
  const right = parseInt(style.getPropertyValue('--safe-area-inset-right')) || 0;
  const bottom = parseInt(style.getPropertyValue('--safe-area-inset-bottom')) || 0;
  const left = parseInt(style.getPropertyValue('--safe-area-inset-left')) || 0;

  return { top, right, bottom, left };
};

/**
 * Aplica las safe areas a un elemento usando JavaScript
 * @param {HTMLElement} element - El elemento al que aplicar las safe areas
 * @param {Object} options - Opciones de configuración
 */
export const applySafeAreas = (element, options = {}) => {
  const {
    applyTop = true,
    applyBottom = true,
    applyLeft = true,
    applyRight = true,
    basePadding = 0
  } = options;

  const insets = getSafeAreaInsets();
  
  if (applyTop) {
    element.style.paddingTop = `${basePadding + insets.top}px`;
  }
  if (applyBottom) {
    element.style.paddingBottom = `${basePadding + insets.bottom}px`;
  }
  if (applyLeft) {
    element.style.paddingLeft = `${basePadding + insets.left}px`;
  }
  if (applyRight) {
    element.style.paddingRight = `${basePadding + insets.right}px`;
  }
};

/**
 * Verifica si el dispositivo es móvil
 * @returns {boolean} true si es móvil
 */
export const isMobile = () => {
  return window.innerWidth <= 768;
};

/**
 * Verifica si el dispositivo tiene safe areas
 * @returns {boolean} true si tiene safe areas
 */
export const hasSafeAreas = () => {
  const insets = getSafeAreaInsets();
  return insets.top > 0 || insets.bottom > 0 || insets.left > 0 || insets.right > 0;
};

/**
 * Obtiene el estilo CSS para safe areas
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Objeto de estilos CSS
 */
export const getSafeAreaStyles = (options = {}) => {
  const {
    applyTop = true,
    applyBottom = true,
    applyLeft = true,
    applyRight = true,
    basePadding = 0
  } = options;

  const styles = {};

  if (applyTop) {
    styles.paddingTop = `calc(${basePadding}px + env(safe-area-inset-top, 0px))`;
  }
  if (applyBottom) {
    styles.paddingBottom = `calc(${basePadding}px + env(safe-area-inset-bottom, 0px))`;
  }
  if (applyLeft) {
    styles.paddingLeft = `calc(${basePadding}px + env(safe-area-inset-left, 0px))`;
  }
  if (applyRight) {
    styles.paddingRight = `calc(${basePadding}px + env(safe-area-inset-right, 0px))`;
  }

  return styles;
};

/**
 * Configura las variables CSS de safe areas
 */
export const setupSafeAreaVariables = () => {
  const root = document.documentElement;
  
  // Configurar variables CSS para safe areas
  root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
  root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
  root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
  root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
};

/**
 * Inicializa las safe areas en la aplicación
 */
export const initializeSafeAreas = () => {
  // Configurar variables CSS
  setupSafeAreaVariables();
  
  // Aplicar safe areas al body si es móvil
  if (isMobile()) {
    const body = document.body;
    applySafeAreas(body, {
      applyTop: true,
      applyBottom: true,
      applyLeft: true,
      applyRight: true,
      basePadding: 0
    });
  }
  
  // Escuchar cambios de orientación
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (isMobile()) {
        const body = document.body;
        applySafeAreas(body, {
          applyTop: true,
          applyBottom: true,
          applyLeft: true,
          applyRight: true,
          basePadding: 0
        });
      }
    }, 100);
  });
  
  // Escuchar cambios de tamaño de ventana
  window.addEventListener('resize', () => {
    if (isMobile()) {
      const body = document.body;
      applySafeAreas(body, {
        applyTop: true,
        applyBottom: true,
        applyLeft: true,
        applyRight: true,
        basePadding: 0
      });
    }
  });
};
