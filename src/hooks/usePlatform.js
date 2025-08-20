import { useState, useEffect } from 'react';

export const usePlatform = () => {
  const [isAPK, setIsAPK] = useState(false);
  const [isWeb, setIsWeb] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectPlatform = async () => {
      try {
        // Detectar si estamos en Capacitor (APK)
        if (window.Capacitor) {
          setIsAPK(true);
          setIsWeb(false);
        } else {
          // Detectar si estamos en web
          setIsAPK(false);
          setIsWeb(true);
        }
      } catch (error) {
        console.log('Error detectando plataforma:', error);
        // Por defecto asumimos web
        setIsAPK(false);
        setIsWeb(true);
      } finally {
        setIsLoading(false);
      }
    };

    detectPlatform();
  }, []);

  return {
    isAPK,
    isWeb,
    isLoading,
    platform: isAPK ? 'apk' : 'web'
  };
};
