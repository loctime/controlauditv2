import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para detectar el estado de conectividad
 * Maneja tanto navigator.onLine como eventos de red
 */
export const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());

  // Detectar tipo de conexión si está disponible
  const detectConnectionType = useCallback(() => {
    if (navigator.connection) {
      const connection = navigator.connection;
      setConnectionType(connection.effectiveType || connection.type || 'unknown');
    } else {
      setConnectionType('unknown');
    }
  }, []);

  // Manejar cambios de conectividad
  const handleOnline = useCallback(() => {
    console.log('🌐 Conexión restaurada');
    setIsOnline(true);
    setLastOnlineTime(Date.now());
    detectConnectionType();
  }, [detectConnectionType]);

  const handleOffline = useCallback(() => {
    console.log('📴 Conexión perdida');
    setIsOnline(false);
    detectConnectionType();
  }, [detectConnectionType]);

  // Configurar listeners
  useEffect(() => {
    // Detectar tipo de conexión inicial
    detectConnectionType();

    // Listeners para cambios de conectividad
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listener para cambios en el tipo de conexión
    if (navigator.connection) {
      navigator.connection.addEventListener('change', detectConnectionType);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', detectConnectionType);
      }
    };
  }, [handleOnline, handleOffline, detectConnectionType]);

  // Función para verificar conectividad real (ping a un endpoint)
  const checkRealConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch('/ping', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('🔍 Verificación de conectividad falló:', error.message);
      return false;
    }
  }, []);

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
    // Helpers
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g',
    isFastConnection: connectionType === '4g' || connectionType === '5g',
    timeOffline: isOnline ? 0 : Date.now() - lastOnlineTime
  };
};

export default useConnectivity;
