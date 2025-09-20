import { useState, useEffect, useCallback } from 'react';
import syncQueueService from '../services/syncQueue';

/**
 * Hook para detectar el estado de conectividad
 * Maneja tanto navigator.onLine como eventos de red
 */
export const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [autoSyncTriggered, setAutoSyncTriggered] = useState(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState(0);

  // Detectar tipo de conexión si está disponible
  const detectConnectionType = useCallback(() => {
    if (navigator.connection) {
      const connection = navigator.connection;
      setConnectionType(connection.effectiveType || connection.type || 'unknown');
    } else {
      setConnectionType('unknown');
    }
  }, []);

  // Función para verificar conectividad real (ping a un endpoint)
  const checkRealConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout

      // Usar un endpoint más confiable para móvil
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
        mode: 'no-cors' // Para evitar problemas CORS en móvil
      });

      clearTimeout(timeoutId);
      return true; // Si no hay error, asumimos conectividad
    } catch (error) {
      console.log('🔍 Verificación de conectividad falló:', error.message);
      return false;
    }
  }, []);

  // Función para activar sincronización automática con debounce
  const triggerAutoSync = useCallback(async () => {
    const now = Date.now();
    const DEBOUNCE_TIME = 10000; // 10 segundos entre intentos
    
    // Verificar debounce - evitar múltiples sincronizaciones muy seguidas
    if (now - lastSyncAttempt < DEBOUNCE_TIME) {
      console.log('⏳ Sincronización automática en cooldown, esperando...');
      return;
    }
    
    try {
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
  }, [detectConnectionType, checkRealConnectivity, autoSyncTriggered, triggerAutoSync]);

  const handleOffline = useCallback(() => {
    console.log('📴 Conexión perdida');
    setIsOnline(false);
    setAutoSyncTriggered(false); // Reset para permitir nueva sincronización automática
    setLastSyncAttempt(0); // Reset del debounce
    detectConnectionType();
  }, [detectConnectionType]);

  // Configurar listeners
  useEffect(() => {
    // Detectar tipo de conexión inicial
    detectConnectionType();

    // Verificación inicial de conectividad real (especialmente para móvil)
    const initialConnectivityCheck = async () => {
      if (navigator.onLine) {
        const realConnectivity = await checkRealConnectivity();
        if (!realConnectivity) {
          console.log('📱 Móvil: navigator.onLine dice online pero no hay conectividad real');
          setIsOnline(false);
        }
      }
    };

    // Ejecutar verificación inicial después de un breve delay
    const timeoutId = setTimeout(initialConnectivityCheck, 1000);

    // Listeners para cambios de conectividad
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listener para cambios en el tipo de conexión
    if (navigator.connection) {
      navigator.connection.addEventListener('change', detectConnectionType);
    }

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', detectConnectionType);
      }
    };
  }, [handleOnline, handleOffline, detectConnectionType, checkRealConnectivity]);

  // Función para obtener información detallada de la conexión
  const getConnectionInfo = useCallback(() => {
    const connection = navigator.connection;
    
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
