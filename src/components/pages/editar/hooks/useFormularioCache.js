import { useCallback, useMemo } from 'react';

// ✅ Función para normalizar las secciones (manejar tanto arrays como objetos)
export const useNormalizarSecciones = () => {
  return useCallback((secciones) => {
    console.log('🔍 Normalizando secciones:', secciones);
    
    if (!secciones) {
      console.log('⚠️ No hay secciones definidas');
      return [];
    }
    
    // Si es un array, devolverlo tal como está
    if (Array.isArray(secciones)) {
      console.log('✅ Secciones ya es un array, longitud:', secciones.length);
      return secciones;
    }
    
    // Si es un objeto, convertirlo a array
    if (typeof secciones === 'object') {
      const seccionesArray = Object.values(secciones);
      console.log('🔄 Secciones convertidas de objeto a array, longitud:', seccionesArray.length);
      return seccionesArray;
    }
    
    console.log('❌ Formato de secciones no reconocido:', typeof secciones);
    return [];
  }, []);
};

// ✅ Hook para manejo de cache del formulario
export const useFormularioCache = (formularioSeleccionado, seccionesNormalizadas) => {
  // ✅ Cache del formulario en localStorage
  const cacheFormulario = useCallback(() => {
    if (!formularioSeleccionado?.id) return;
    
    try {
      const cacheKey = `formulario_${formularioSeleccionado.id}`;
      const cacheData = {
        formulario: formularioSeleccionado,
        timestamp: Date.now(),
        secciones: seccionesNormalizadas
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('✅ Formulario cacheado en localStorage:', cacheKey);
    } catch (error) {
      console.warn('⚠️ Error al cachear formulario:', error);
    }
  }, [formularioSeleccionado, seccionesNormalizadas]);

  // ✅ Recuperar formulario del cache
  const recuperarFormularioCache = useCallback(() => {
    if (!formularioSeleccionado?.id) return null;
    
    try {
      const cacheKey = `formulario_${formularioSeleccionado.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const tiempoExpiracion = 5 * 60 * 1000; // 5 minutos
        if (Date.now() - cacheData.timestamp < tiempoExpiracion) {
          console.log('✅ Formulario recuperado del cache:', cacheKey);
          return cacheData.formulario;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error al recuperar cache:', error);
    }
    return null;
  }, [formularioSeleccionado?.id]);

  return {
    cacheFormulario,
    recuperarFormularioCache
  };
};

// ✅ Hook para estadísticas del formulario
export const useFormularioStats = (seccionesNormalizadas) => {
  return useMemo(() => {
    const numSecciones = seccionesNormalizadas.length;
    const numPreguntas = seccionesNormalizadas.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0);
    return { numSecciones, numPreguntas };
  }, [seccionesNormalizadas]);
};
