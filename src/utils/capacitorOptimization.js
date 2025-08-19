// Optimización de importaciones de Capacitor
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar Capacitor Core de forma lazy
export const loadCapacitorCore = async () => {
  const { Capacitor } = await import('@capacitor/core');
  return Capacitor;
};

// Función para cargar plugins de Capacitor de forma lazy
export const loadCapacitorPlugins = async () => {
  const [
    { App },
    { Browser },
    { Camera },
    { Device },
    { Filesystem },
    { Geolocation },
    { Haptics },
    { Keyboard },
    { LocalNotifications },
    { Network },
    { PushNotifications },
    { ScreenReader },
    { Share },
    { SplashScreen },
    { StatusBar },
    { Storage },
    { Toast }
  ] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/browser'),
    import('@capacitor/camera'),
    import('@capacitor/device'),
    import('@capacitor/filesystem'),
    import('@capacitor/geolocation'),
    import('@capacitor/haptics'),
    import('@capacitor/keyboard'),
    import('@capacitor/local-notifications'),
    import('@capacitor/network'),
    import('@capacitor/push-notifications'),
    import('@capacitor/screen-reader'),
    import('@capacitor/share'),
    import('@capacitor/splash-screen'),
    import('@capacitor/status-bar'),
    import('@capacitor/storage'),
    import('@capacitor/toast')
  ]);

  return {
    App,
    Browser,
    Camera,
    Device,
    Filesystem,
    Geolocation,
    Haptics,
    Keyboard,
    LocalNotifications,
    Network,
    PushNotifications,
    ScreenReader,
    Share,
    SplashScreen,
    StatusBar,
    Storage,
    Toast
  };
};

// Configuración optimizada para Capacitor
export const getCapacitorConfig = async (options = {}) => {
  const Capacitor = await loadCapacitorCore();
  
  const defaultConfig = {
    plugins: {
      SplashScreen: {
        launchShowDuration: 3000,
        backgroundColor: '#ffffffff',
        androidSplashResourceName: 'splash',
        androidScaleType: 'CENTER_CROP',
        showSpinner: true,
        androidSpinnerStyle: 'large',
        iosSpinnerStyle: 'small',
        spinnerColor: '#999999',
        splashFullScreen: true,
        splashImmersive: true,
        layoutName: 'launch_screen',
        layoutNameDark: 'launch_screen_dark'
      },
      StatusBar: {
        style: 'light',
        backgroundColor: '#1976d2',
        overlaysWebView: true
      }
    }
  };

  return { ...defaultConfig, ...options };
};

// Verificar si estamos en un entorno Capacitor
export const isCapacitorAvailable = () => {
  return typeof window !== 'undefined' && 
         window.Capacitor && 
         window.Capacitor.isNative;
};

// Verificar si estamos en Android
export const isAndroid = () => {
  return typeof window !== 'undefined' && 
         window.Capacitor && 
         window.Capacitor.getPlatform() === 'android';
};

// Verificar si estamos en iOS
export const isIOS = () => {
  return typeof window !== 'undefined' && 
         window.Capacitor && 
         window.Capacitor.getPlatform() === 'ios';
};

// Verificar si estamos en web
export const isWeb = () => {
  return typeof window !== 'undefined' && 
         (!window.Capacitor || !window.Capacitor.isNative);
};

// Utilidades para la aplicación
export const appUtils = {
  // Minimizar la aplicación
  minimizeApp: async () => {
    const { App } = await loadCapacitorPlugins();
    return await App.minimizeApp();
  }
};

// Utilidades para la cámara
export const cameraUtils = {
  // Tomar foto
  takePicture: async (options = {}) => {
    const { Camera } = await loadCapacitorPlugins();
    const defaultOptions = {
      quality: 90,
      allowEditing: false,
      resultType: 'uri',
      source: 'CAMERA',
      ...options
    };
    return await Camera.getPhoto(defaultOptions);
  },
  
  // Seleccionar imagen de la galería
  pickImage: async (options = {}) => {
    const { Camera } = await loadCapacitorPlugins();
    const defaultOptions = {
      quality: 90,
      allowEditing: false,
      resultType: 'uri',
      source: 'PHOTOLIBRARY',
      ...options
    };
    return await Camera.getPhoto(defaultOptions);
  },
  
  // Verificar permisos de cámara
  checkPermissions: async () => {
    const { Camera } = await loadCapacitorPlugins();
    return await Camera.checkPermissions();
  },
  
  // Solicitar permisos de cámara
  requestPermissions: async () => {
    const { Camera } = await loadCapacitorPlugins();
    return await Camera.requestPermissions();
  }
};

// Utilidades para archivos
export const filesystemUtils = {
  // Leer archivo
  readFile: async (path, options = {}) => {
    const { Filesystem } = await loadCapacitorPlugins();
    const defaultOptions = {
      encoding: 'utf8',
      ...options
    };
    return await Filesystem.readFile({ path, ...defaultOptions });
  },
  
  // Escribir archivo
  writeFile: async (path, data, options = {}) => {
    const { Filesystem } = await loadCapacitorPlugins();
    const defaultOptions = {
      encoding: 'utf8',
      recursive: false,
      ...options
    };
    return await Filesystem.writeFile({ path, data, ...defaultOptions });
  },
  
  // Eliminar archivo
  deleteFile: async (path) => {
    const { Filesystem } = await loadCapacitorPlugins();
    return await Filesystem.deleteFile({ path });
  },
  
  // Crear directorio
  mkdir: async (path, options = {}) => {
    const { Filesystem } = await loadCapacitorPlugins();
    const defaultOptions = {
      recursive: false,
      ...options
    };
    return await Filesystem.mkdir({ path, ...defaultOptions });
  },
  
  // Leer directorio
  readdir: async (path) => {
    const { Filesystem } = await loadCapacitorPlugins();
    return await Filesystem.readdir({ path });
  },
  
  // Eliminar directorio
  rmdir: async (path, options = {}) => {
    const { Filesystem } = await loadCapacitorPlugins();
    const defaultOptions = {
      recursive: false,
      ...options
    };
    return await Filesystem.rmdir({ path, ...defaultOptions });
  }
};

// Utilidades para notificaciones
export const notificationUtils = {
  // Mostrar toast
  showToast: async (message, duration = 'short') => {
    const { Toast } = await loadCapacitorPlugins();
    return await Toast.show({
      text: message,
      duration: duration,
      position: 'bottom'
    });
  },
  
  // Mostrar notificación local
  scheduleNotification: async (notification) => {
    const { LocalNotifications } = await loadCapacitorPlugins();
    return await LocalNotifications.schedule({ notifications: [notification] });
  }
};

// Utilidades para el dispositivo
export const deviceUtils = {
  // Obtener información del dispositivo
  getInfo: async () => {
    const { Device } = await loadCapacitorPlugins();
    return await Device.getInfo();
  },
  
  // Obtener idioma del dispositivo
  getLanguageCode: async () => {
    const { Device } = await loadCapacitorPlugins();
    return await Device.getLanguageCode();
  }
};

// Utilidades para el teclado
export const keyboardUtils = {
  // Mostrar teclado
  show: async () => {
    const { Keyboard } = await loadCapacitorPlugins();
    return await Keyboard.show();
  },
  
  // Ocultar teclado
  hide: async () => {
    const { Keyboard } = await loadCapacitorPlugins();
    return await Keyboard.hide();
  },
  
  // Configurar teclado
  setAccessoryBarVisible: async (isVisible) => {
    const { Keyboard } = await loadCapacitorPlugins();
    return await Keyboard.setAccessoryBarVisible({ isVisible });
  }
};

// Utilidades para el estado de la red
export const networkUtils = {
  // Obtener estado de la red
  getStatus: async () => {
    const { Network } = await loadCapacitorPlugins();
    return await Network.getStatus();
  },
  
  // Agregar listener de cambios de red
  addListener: async (callback) => {
    const { Network } = await loadCapacitorPlugins();
    return await Network.addListener('networkStatusChange', callback);
  }
};

// Utilidades para el almacenamiento
export const storageUtils = {
  // Obtener valor
  get: async (key) => {
    const { Storage } = await loadCapacitorPlugins();
    const result = await Storage.get({ key });
    return result.value;
  },
  
  // Establecer valor
  set: async (key, value) => {
    const { Storage } = await loadCapacitorPlugins();
    return await Storage.set({ key, value });
  },
  
  // Eliminar valor
  remove: async (key) => {
    const { Storage } = await loadCapacitorPlugins();
    return await Storage.remove({ key });
  },
  
  // Limpiar todo
  clear: async () => {
    const { Storage } = await loadCapacitorPlugins();
    return await Storage.clear();
  },
  
  // Obtener todas las claves
  keys: async () => {
    const { Storage } = await loadCapacitorPlugins();
    const result = await Storage.keys();
    return result.keys;
  }
};

// Utilidades para el navegador
export const browserUtils = {
  // Abrir URL
  open: async (url, options = {}) => {
    const { Browser } = await loadCapacitorPlugins();
    const defaultOptions = {
      url: url,
      windowName: '_blank',
      presentationStyle: 'popover',
      ...options
    };
    return await Browser.open(defaultOptions);
  },
  
  // Cerrar navegador
  close: async () => {
    const { Browser } = await loadCapacitorPlugins();
    return await Browser.close();
  }
};

// Utilidades para compartir
export const shareUtils = {
  // Compartir contenido
  share: async (options) => {
    const { Share } = await loadCapacitorPlugins();
    return await Share.share(options);
  }
};

// Utilidades para haptics
export const hapticsUtils = {
  // Vibración corta
  impact: async (style = 'medium') => {
    const { Haptics } = await loadCapacitorPlugins();
    return await Haptics.impact({ style });
  },
  
  // Vibración larga
  vibrate: async (duration = 300) => {
    const { Haptics } = await loadCapacitorPlugins();
    return await Haptics.vibrate({ duration });
  }
};

// Utilidades para geolocalización
export const geolocationUtils = {
  // Obtener posición actual
  getCurrentPosition: async (options = {}) => {
    const { Geolocation } = await loadCapacitorPlugins();
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
      ...options
    };
    return await Geolocation.getCurrentPosition(defaultOptions);
  },
  
  // Agregar listener de posición
  addWatcher: async (options, callback) => {
    const { Geolocation } = await loadCapacitorPlugins();
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
      ...options
    };
    return await Geolocation.addWatcher(defaultOptions, callback);
  }
};

// Utilidades para el lector de pantalla
export const screenReaderUtils = {
  // Habilitar lector de pantalla
  speak: async (options) => {
    const { ScreenReader } = await loadCapacitorPlugins();
    return await ScreenReader.speak(options);
  }
};

// Utilidades para notificaciones push
export const pushNotificationUtils = {
  // Registrar para notificaciones push
  register: async () => {
    const { PushNotifications } = await loadCapacitorPlugins();
    return await PushNotifications.register();
  },
  
  // Agregar listener de registro
  addListener: async (eventName, callback) => {
    const { PushNotifications } = await loadCapacitorPlugins();
    return await PushNotifications.addListener(eventName, callback);
  }
};

// Exportar todas las utilidades
export default {
  // Core
  loadCapacitorCore,
  loadCapacitorPlugins,
  getCapacitorConfig,
  
  // Detección de plataforma
  isCapacitorAvailable,
  isAndroid,
  isIOS,
  isWeb,
  
  // Utilidades específicas
  app: appUtils,
  camera: cameraUtils,
  filesystem: filesystemUtils,
  notification: notificationUtils,
  device: deviceUtils,
  keyboard: keyboardUtils,
  network: networkUtils,
  storage: storageUtils,
  browser: browserUtils,
  share: shareUtils,
  haptics: hapticsUtils,
  geolocation: geolocationUtils,
  screenReader: screenReaderUtils,
  pushNotification: pushNotificationUtils
};
