import { useState, useEffect } from 'react';
import { usePlatform } from './usePlatform.js';
import { getBackendUrl } from '../config/environment.js';

export const useUpdateChecker = () => {
  const { isAPK, isWeb } = usePlatform();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [latestVersion, setLatestVersion] = useState(null);
  const [latestRelease, setLatestRelease] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);

  // Obtener versión actual de la APK
  const getCurrentAPKVersion = async () => {
    try {
      // En Capacitor, podemos obtener la versión de la app
      if (window.Capacitor && window.Capacitor.Plugins?.App) {
        const info = await window.Capacitor.Plugins.App.getInfo();
        return info.version;
      }
      
      // Fallback: obtener desde el backend
      const backendUrl = `${getBackendUrl()}/api/current-version`;
      const response = await fetch(backendUrl);
      
      if (response.ok) {
        const data = await response.json();
        return data.version;
      }
      
      // Fallback final: obtener desde package.json o configuración
      return import.meta.env.VITE_APP_VERSION || '0.0.0';
    } catch (error) {
      console.log('No se pudo obtener versión actual:', error);
      return '0.0.0';
    }
  };

  // Comparar versiones (semver)
  const isNewerVersion = (newVersion, currentVersion) => {
    try {
      const newParts = newVersion.replace('v', '').split('.').map(Number);
      const currentParts = currentVersion.replace('v', '').split('.').map(Number);
      
      for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
        const newPart = newParts[i] || 0;
        const currentPart = currentParts[i] || 0;
        
        if (newPart > currentPart) return true;
        if (newPart < currentPart) return false;
      }
      
      return false; // Son iguales
    } catch (error) {
      console.error('Error comparando versiones:', error);
      return false;
    }
  };

  // Verificar actualizaciones
  const checkForUpdates = async () => {
    if (!isAPK) return; // Solo verificar en APK
    
    setIsChecking(true);
    setError(null);
    
    try {
      // Obtener versión actual
      const current = await getCurrentAPKVersion();
      setCurrentVersion(current);
      
      // Obtener última versión desde el backend
      const backendUrl = `${getBackendUrl()}/api/latest-apk`;
      const response = await fetch(backendUrl);
      
      if (!response.ok) {
        throw new Error('No se pudo obtener información de la última versión');
      }
      
      const data = await response.json();
      
      if (data.success && data.release) {
        const latest = data.release.tag_name;
        setLatestVersion(latest);
        setLatestRelease(data.release);
        
        // Verificar si hay actualización disponible
        const hasNewVersion = isNewerVersion(latest, current);
        setHasUpdate(hasNewVersion);
        
        console.log(`📱 Versión actual: ${current}, Última: ${latest}, Actualización disponible: ${hasNewVersion}`);
      }
      
    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error);
      setError(error.message);
    } finally {
      setIsChecking(false);
    }
  };

  // Verificar al montar el componente
  useEffect(() => {
    if (isAPK) {
      checkForUpdates();
    }
  }, [isAPK]);

  // Verificar cada 30 minutos si estamos en APK
  useEffect(() => {
    if (!isAPK) return;
    
    const interval = setInterval(() => {
      checkForUpdates();
    }, 30 * 60 * 1000); // 30 minutos
    
    return () => clearInterval(interval);
  }, [isAPK]);

  return {
    hasUpdate,
    currentVersion,
    latestVersion,
    latestRelease,
    isChecking,
    error,
    checkForUpdates,
    isAPK,
    isWeb
  };
};
