import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useNavigationGuard = ({
  hasUnsavedChanges,
  onSave,
  onDiscard,
  autoSaveInterval = 30000, // 30 segundos
  showConfirmation = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const autoSaveRef = useRef(null);
  const lastSavedData = useRef(null);
  const isNavigating = useRef(false);

  // Función para verificar si hay cambios sin guardar
  const checkUnsavedChanges = useCallback(() => {
    return hasUnsavedChanges && hasUnsavedChanges();
  }, [hasUnsavedChanges]);

  // Función para mostrar confirmación antes de salir
  const showExitConfirmation = useCallback((message = '¿Estás seguro de que quieres salir? Se perderán los cambios no guardados.') => {
    return new Promise((resolve) => {
      if (!showConfirmation) {
        resolve(true);
        return;
      }

      // Usar SweetAlert2 si está disponible, sino usar confirm nativo
      if (window.Swal) {
        window.Swal.fire({
          title: '⚠️ Cambios sin guardar',
          text: message,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Salir sin guardar',
          cancelButtonText: 'Cancelar',
          reverseButtons: true
        }).then((result) => {
          resolve(result.isConfirmed);
        });
      } else {
        resolve(window.confirm(message));
      }
    });
  }, [showConfirmation]);

  // Función para guardar automáticamente
  const autoSave = useCallback(async () => {
    if (!onSave || !checkUnsavedChanges()) {
      return;
    }

    try {
      console.log('🔄 Autoguardando cambios...');
      await onSave();
      console.log('✅ Autoguardado completado');
    } catch (error) {
      console.error('❌ Error en autoguardado:', error);
    }
  }, [onSave, checkUnsavedChanges]);

  // Función para manejar navegación
  const handleNavigation = useCallback(async (targetPath) => {
    if (isNavigating.current) {
      return;
    }

    if (checkUnsavedChanges()) {
      const shouldExit = await showExitConfirmation();
      
      if (shouldExit) {
        // Intentar guardar antes de salir
        if (onSave) {
          try {
            await onSave();
            console.log('💾 Cambios guardados antes de salir');
          } catch (error) {
            console.error('❌ Error al guardar antes de salir:', error);
          }
        }
        
        isNavigating.current = true;
        navigate(targetPath);
      }
    } else {
      isNavigating.current = true;
      navigate(targetPath);
    }
  }, [checkUnsavedChanges, showExitConfirmation, onSave, navigate]);

  // Función para descartar cambios y salir
  const handleDiscardAndExit = useCallback(async (targetPath) => {
    if (onDiscard) {
      try {
        await onDiscard();
        console.log('🗑️ Cambios descartados');
      } catch (error) {
        console.error('❌ Error al descartar cambios:', error);
      }
    }
    
    isNavigating.current = true;
    navigate(targetPath);
  }, [onDiscard, navigate]);

  // Prevenir navegación con botón atrás/adelante del navegador
  useEffect(() => {
    const handlePopState = async (event) => {
      if (checkUnsavedChanges()) {
        event.preventDefault();
        
        const shouldExit = await showExitConfirmation(
          '¿Quieres salir de la auditoría? Se perderán los cambios no guardados.'
        );
        
        if (shouldExit) {
          // Intentar guardar antes de salir
          if (onSave) {
            try {
              await onSave();
            } catch (error) {
              console.error('❌ Error al guardar antes de salir:', error);
            }
          }
          
          // Permitir la navegación
          window.history.pushState(null, '', window.location.href);
          window.history.forward();
        } else {
          // Prevenir la navegación
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Agregar event listener solo para popstate
    window.addEventListener('popstate', handlePopState);

    // Agregar estado al historial para poder detectar navegación
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [checkUnsavedChanges, showExitConfirmation, onSave]);

  // Configurar autoguardado
  useEffect(() => {
    if (autoSaveInterval > 0 && onSave) {
      autoSaveRef.current = setInterval(autoSave, autoSaveInterval);
    }

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [autoSaveInterval, onSave, autoSave]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, []);

  return {
    handleNavigation,
    handleDiscardAndExit,
    autoSave,
    checkUnsavedChanges
  };
}; 