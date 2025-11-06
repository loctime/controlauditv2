import { useState, useEffect, useCallback } from 'react';
import syncQueueService from '../services/syncQueue';

/**
 * Hook para detectar el estado de conectividad
 * Maneja tanto navigator.onLine como eventos de red
 */
export const useConnectivity = () => {
  // Verificar que estamos en el lado del cliente
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [connectionType, setConnectionType] = useState('unknown');
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [autoSyncTriggered, setAutoSyncTriggered] = useState(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState(0);

  // Detectar tipo de conexión si está disponible
  const detectConnectionType = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const connection = navigator.connection;
      setConnectionType(connection.effectiveType || connection.type || 'unknown');
    } else {
      setConnectionType('unknown');
    }
  }, []);

  // Función para verificar conectividad real (ping a un endpoint)
  const checkRealConnectivity = useCallback(async () => {
    try {
      // Verificar que estamos en el lado del cliente
      if (typeof window === 'undefined') {
        return true;
      }

      // Si navigator.onLine dice false, no intentar verificar (ahorra tiempo)
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return false;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout

      // Usar un endpoint más confiable para móvil
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
        mode: 'no-cors' // Para evitar problemas CORS en móvil
      });

      clearTimeout(timeoutId);
      return true; // Si no hay error, asumimos conectividad
    } catch (error) {
      // Silenciar errores de conectividad (es normal cuando no hay internet)
      if (error.name !== 'AbortError') {
        console.log('🔍 Verificación de conectividad falló:', error.message);
      }
      return false;
    }
  }, []);

  // Función para activar sincronización automática con debounce
  const triggerAutoSync = useCallback(async () => {
    try {
      // Verificar que estamos en el lado del cliente
      if (typeof window === 'undefined') {
        return;
      }

      const now = Date.now();
      const DEBOUNCE_TIME = 10000; // 10 segundos entre intentos
      
      // Verificar debounce - evitar múltiples sincronizaciones muy seguidas
      if (now - lastSyncAttempt < DEBOUNCE_TIME) {
        console.log('⏳ Sincronización automática en cooldown, esperando...');
        return;
      }
      
      setLastSyncAttempt(now);
      
      // Verificar si hay items pendientes de sincronización
      const queueStats = await syncQueueService.getQueueStats();
      
      if (queueStats && queueStats.total > 0) {
        console.log('🔄 Activando sincronización automática - items pendientes:', queueStats.total);
        
        // Pequeño delay para asegurar que la conexión esté estable
        setTimeout(async () => {
          try {
            await syncQueueService.processQueue();
            console.log('✅ Sincronización automática completada');
          } catch (error) {
            console.error('❌ Error en sincronización automática:', error);
          }
        }, 2000); // 2 segundos de delay
        
        setAutoSyncTriggered(true);
      } else {
        console.log('📭 No hay items pendientes para sincronizar');
      }
    } catch (error) {
      console.error('❌ Error al verificar cola de sincronización:', error);
    }
  }, [lastSyncAttempt]);

  // Manejar cambios de conectividad
  const handleOnline = useCallback(async () => {
    console.log('🌐 Conexión restaurada');
    // Usar setTimeout para evitar actualizaciones durante el render
    setTimeout(async () => {
      try {
        // Verificar conectividad real en móvil
        const realConnectivity = await checkRealConnectivity();
        setIsOnline(realConnectivity);
        if (realConnectivity) {
          setLastOnlineTime(Date.now());
          // Activar sincronización automática si no se ha activado ya
          if (!autoSyncTriggered) {
            await triggerAutoSync();
          }
        }
        detectConnectionType();
      } catch (error) {
        console.error('Error en handleOnline:', error);
        setIsOnline(false);
      }
    }, 0);
  }, [detectConnectionType, checkRealConnectivity, autoSyncTriggered, triggerAutoSync]);

  const handleOffline = useCallback(() => {
    console.log('📴 Conexión perdida');
    // Usar setTimeout para evitar actualizaciones durante el render
    setTimeout(() => {
      setIsOnline(false);
      setAutoSyncTriggered(false); // Reset para permitir nueva sincronización automática
      setLastSyncAttempt(0); // Reset del debounce
      detectConnectionType();
    }, 0);
  }, [detectConnectionType]);

  // Configurar listeners
  useEffect(() => {
    // Verificar que estamos en el lado del cliente
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Detectar tipo de conexión inicial
      detectConnectionType();

      // Verificación inicial de conectividad real (especialmente para móvil)
      // Usar setTimeout para evitar actualizaciones durante el render
      const initialConnectivityCheck = async () => {
        try {
          if (typeof navigator !== 'undefined' && navigator.onLine) {
            const realConnectivity = await checkRealConnectivity();
            if (!realConnectivity) {
              console.log('📱 Móvil: navigator.onLine dice online pero no hay conectividad real');
              // Usar setTimeout para evitar actualizar durante render
              setTimeout(() => {
                setIsOnline(false);
              }, 0);
            }
          }
        } catch (error) {
          console.error('Error en verificación inicial de conectividad:', error);
          // No actualizar estado si hay error, dejar el valor inicial
        }
      };

      // Ejecutar verificación inicial después de un breve delay
      const timeoutId = setTimeout(initialConnectivityCheck, 1000);

      // Listeners para cambios de conectividad
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Listener para cambios en el tipo de conexión
      if (typeof navigator !== 'undefined' && navigator.connection) {
        navigator.connection.addEventListener('change', detectConnectionType);
      }

      // Cleanup
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        
        if (typeof navigator !== 'undefined' && navigator.connection) {
          navigator.connection.removeEventListener('change', detectConnectionType);
        }
      };
    } catch (error) {
      console.error('❌ Error configurando listeners de conectividad:', error);
    }
  }, [handleOnline, handleOffline, detectConnectionType, checkRealConnectivity]);

  // Función para obtener información detallada de la conexión
  const getConnectionInfo = useCallback(() => {
    const connection = typeof navigator !== 'undefined' ? navigator.connection : null;
    
    return {
      isOnline,
      connectionType,
      lastOnlineTime,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
      // Calcular tiempo offline
      timeOffline: isOnline ? 0 : Date.now() - lastOnlineTime
    };
  }, [isOnline, connectionType, lastOnlineTime]);

  return {
    isOnline,
    connectionType,
    lastOnlineTime,
    checkRealConnectivity,
    getConnectionInfo,
    triggerAutoSync,
    autoSyncTriggered,
    lastSyncAttempt,
    // Helpers
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g',
    isFastConnection: connectionType === '4g' || connectionType === '5g',
    timeOffline: isOnline ? 0 : Date.now() - lastOnlineTime
  };
};

export default useConnectivity;
