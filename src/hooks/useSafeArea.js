import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar las safe areas en dispositivos móviles
 * @returns {Object} Objeto con las dimensiones de las safe areas
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      // Obtener las safe areas usando CSS env() o valores por defecto
      const style = getComputedStyle(document.documentElement);
      
      const top = parseInt(style.getPropertyValue('--safe-area-inset-top')) || 0;
      const right = parseInt(style.getPropertyValue('--safe-area-inset-right')) || 0;
      const bottom = parseInt(style.getPropertyValue('--safe-area-inset-bottom')) || 0;
      const left = parseInt(style.getPropertyValue('--safe-area-inset-left')) || 0;

      setSafeArea({ top, right, bottom, left });
    };

    // Actualizar al montar el componente
    updateSafeArea();

    // Actualizar cuando cambie la orientación o el tamaño de la ventana
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
};

/**
 * Hook para obtener si el dispositivo es móvil
 * @returns {boolean} true si es móvil
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

/**
 * Hook para obtener las dimensiones de la ventana
 * @returns {Object} Objeto con width y height
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};
