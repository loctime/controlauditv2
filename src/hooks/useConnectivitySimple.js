import { useState, useEffect } from 'react';

/**
 * Hook simple para detectar conectividad básica
 * Versión simplificada que evita problemas en producción
 */
export const useConnectivitySimple = () => {
  // Verificar que estamos en el lado del cliente
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' && typeof navigator !== 'undefined' 
      ? navigator.onLine 
      : true
  );

  useEffect(() => {
    // Verificar que estamos en el lado del cliente
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => {
      console.log('🌐 Conexión restaurada');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📴 Conexión perdida');
      setIsOnline(false);
    };

    // Listeners para cambios de conectividad
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    connectionType: 'unknown',
    lastOnlineTime: Date.now(),
    checkRealConnectivity: async () => isOnline,
    getConnectionInfo: () => ({
      isOnline,
      connectionType: 'unknown',
      lastOnlineTime: Date.now(),
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false,
      timeOffline: isOnline ? 0 : 0
    }),
    triggerAutoSync: async () => {
      // Función vacía para compatibilidad
    },
    autoSyncTriggered: false,
    lastSyncAttempt: 0,
    isSlowConnection: false,
    isFastConnection: false,
    timeOffline: 0
  };
};

export default useConnectivitySimple;
