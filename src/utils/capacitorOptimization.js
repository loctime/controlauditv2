// Optimización de importaciones de Capacitor - Versión Web
// Este archivo proporciona stubs para funcionalidades de Capacitor en web

// Función para cargar Capacitor Core de forma lazy (stub para web)
export const loadCapacitorCore = async () => {
  // En web, retornamos un stub
  return {
    isNative: false,
    getPlatform: () => 'web',
    isPluginAvailable: () => false
  };
};

// Función para cargar plugins de Capacitor de forma lazy (stub para web)
export const loadCapacitorPlugins = async () => {
  // En web, retornamos stubs para todos los plugins
  return {
    App: {
      minimizeApp: async () => console.log('App.minimizeApp not available in web'),
      exitApp: async () => console.log('App.exitApp not available in web')
    },
    Browser: {
      open: async () => console.log('Browser.open not available in web'),
      close: async () => console.log('Browser.close not available in web')
    },
    Camera: {
      getPhoto: async () => {
        console.log('Camera.getPhoto not available in web');
        throw new Error('Camera not available in web');
      },
      checkPermissions: async () => ({ camera: 'denied' }),
      requestPermissions: async () => ({ camera: 'denied' })
    },
    Device: {
      getInfo: async () => ({ platform: 'web' }),
      getLanguageCode: async () => 'es'
    },
    Filesystem: {
      readFile: async () => {
        console.log('Filesystem.readFile not available in web');
        throw new Error('Filesystem not available in web');
      },
      writeFile: async () => {
        console.log('Filesystem.writeFile not available in web');
        throw new Error('Filesystem not available in web');
      },
      deleteFile: async () => {
        console.log('Filesystem.deleteFile not available in web');
        throw new Error('Filesystem not available in web');
      },
      mkdir: async () => {
        console.log('Filesystem.mkdir not available in web');
        throw new Error('Filesystem not available in web');
      },
      readdir: async () => {
        console.log('Filesystem.readdir not available in web');
        throw new Error('Filesystem not available in web');
      },
      rmdir: async () => {
        console.log('Filesystem.rmdir not available in web');
        throw new Error('Filesystem not available in web');
      }
    },
    Geolocation: {
      getCurrentPosition: async () => {
        console.log('Geolocation.getCurrentPosition not available in web');
        throw new Error('Geolocation not available in web');
      },
      addWatcher: async () => {
        console.log('Geolocation.addWatcher not available in web');
        throw new Error('Geolocation not available in web');
      }
    },
    Haptics: {
      impact: async () => console.log('Haptics.impact not available in web'),
      vibrate: async () => console.log('Haptics.vibrate not available in web')
    },
    Keyboard: {
      show: async () => console.log('Keyboard.show not available in web'),
      hide: async () => console.log('Keyboard.hide not available in web'),
      setAccessoryBarVisible: async () => console.log('Keyboard.setAccessoryBarVisible not available in web')
    },
    LocalNotifications: {
      schedule: async () => {
        console.log('LocalNotifications.schedule not available in web');
        throw new Error('LocalNotifications not available in web');
      }
    },
    Network: {
      getStatus: async () => ({ connected: true, connectionType: 'wifi' }),
      addListener: async () => console.log('Network.addListener not available in web')
    },
    PushNotifications: {
      register: async () => {
        console.log('PushNotifications.register not available in web');
        throw new Error('PushNotifications not available in web');
      },
      addListener: async () => console.log('PushNotifications.addListener not available in web')
    },
    ScreenReader: {
      speak: async () => console.log('ScreenReader.speak not available in web')
    },
    Share: {
      share: async () => {
        console.log('Share.share not available in web');
        throw new Error('Share not available in web');
      }
    },
    SplashScreen: {
      show: async () => console.log('SplashScreen.show not available in web'),
      hide: async () => console.log('SplashScreen.hide not available in web')
    },
    StatusBar: {
      setStyle: async () => console.log('StatusBar.setStyle not available in web'),
      setBackgroundColor: async () => console.log('StatusBar.setBackgroundColor not available in web')
    },
    Storage: {
      get: async () => ({ value: null }),
      set: async () => console.log('Storage.set not available in web'),
      remove: async () => console.log('Storage.remove not available in web'),
      clear: async () => console.log('Storage.clear not available in web'),
      keys: async () => ({ keys: [] })
    },
    Toast: {
      show: async () => console.log('Toast.show not available in web')
    }
  };
};

// Configuración optimizada para Capacitor (stub para web)
export const getCapacitorConfig = async (options = {}) => {
  return {
    plugins: {
      SplashScreen: {
        launchShowDuration: 3000,
        backgroundColor: '#ffffffff',
        showSpinner: true,
        spinnerColor: '#999999',
        splashFullScreen: true,
        splashImmersive: true
      },
      StatusBar: {
        style: 'light',
        backgroundColor: '#1976d2',
        overlaysWebView: true
      }
    },
    ...options
  };
};

// Verificar si estamos en un entorno Capacitor
export const isCapacitorAvailable = () => {
  return false; // En web siempre es false
};

// Verificar si estamos en Android
export const isAndroid = () => {
  return false; // En web siempre es false
};

// Verificar si estamos en iOS
export const isIOS = () => {
  return false; // En web siempre es false
};

// Verificar si estamos en web
export const isWeb = () => {
  return true; // En web siempre es true
};

// Utilidades para la aplicación (stubs)
export const appUtils = {
  minimizeApp: async () => {
    console.log('App.minimizeApp not available in web');
  }
};

// Utilidades para la cámara (stubs)
export const cameraUtils = {
  takePicture: async () => {
    console.log('Camera.takePicture not available in web');
    throw new Error('Camera not available in web');
  },
  pickImage: async () => {
    console.log('Camera.pickImage not available in web');
    throw new Error('Camera not available in web');
  },
  checkPermissions: async () => ({ camera: 'denied' }),
  requestPermissions: async () => ({ camera: 'denied' })
};

// Utilidades para archivos (stubs)
export const filesystemUtils = {
  readFile: async () => {
    console.log('Filesystem.readFile not available in web');
    throw new Error('Filesystem not available in web');
  },
  writeFile: async () => {
    console.log('Filesystem.writeFile not available in web');
    throw new Error('Filesystem not available in web');
  },
  deleteFile: async () => {
    console.log('Filesystem.deleteFile not available in web');
    throw new Error('Filesystem not available in web');
  },
  mkdir: async () => {
    console.log('Filesystem.mkdir not available in web');
    throw new Error('Filesystem not available in web');
  },
  readdir: async () => {
    console.log('Filesystem.readdir not available in web');
    throw new Error('Filesystem not available in web');
  },
  rmdir: async () => {
    console.log('Filesystem.rmdir not available in web');
    throw new Error('Filesystem not available in web');
  }
};

// Utilidades para notificaciones (stubs)
export const notificationUtils = {
  showToast: async () => {
    console.log('Toast.show not available in web');
  },
  scheduleNotification: async () => {
    console.log('LocalNotifications.schedule not available in web');
    throw new Error('LocalNotifications not available in web');
  }
};

// Utilidades para el dispositivo (stubs)
export const deviceUtils = {
  getInfo: async () => ({ platform: 'web' }),
  getLanguageCode: async () => 'es'
};

// Utilidades para el teclado (stubs)
export const keyboardUtils = {
  show: async () => console.log('Keyboard.show not available in web'),
  hide: async () => console.log('Keyboard.hide not available in web'),
  setAccessoryBarVisible: async () => console.log('Keyboard.setAccessoryBarVisible not available in web')
};

// Utilidades para el estado de la red (stubs)
export const networkUtils = {
  getStatus: async () => ({ connected: true, connectionType: 'wifi' }),
  addListener: async () => console.log('Network.addListener not available in web')
};

// Utilidades para el almacenamiento (stubs)
export const storageUtils = {
  get: async () => null,
  set: async () => console.log('Storage.set not available in web'),
  remove: async () => console.log('Storage.remove not available in web'),
  clear: async () => console.log('Storage.clear not available in web'),
  keys: async () => []
};

// Utilidades para el navegador (stubs)
export const browserUtils = {
  open: async () => {
    console.log('Browser.open not available in web');
    throw new Error('Browser not available in web');
  },
  close: async () => console.log('Browser.close not available in web')
};

// Utilidades para compartir (stubs)
export const shareUtils = {
  share: async () => {
    console.log('Share.share not available in web');
    throw new Error('Share not available in web');
  }
};

// Utilidades para haptics (stubs)
export const hapticsUtils = {
  impact: async () => console.log('Haptics.impact not available in web'),
  vibrate: async () => console.log('Haptics.vibrate not available in web')
};

// Utilidades para geolocalización (stubs)
export const geolocationUtils = {
  getCurrentPosition: async () => {
    console.log('Geolocation.getCurrentPosition not available in web');
    throw new Error('Geolocation not available in web');
  },
  addWatcher: async () => {
    console.log('Geolocation.addWatcher not available in web');
    throw new Error('Geolocation not available in web');
  }
};

// Utilidades para el lector de pantalla (stubs)
export const screenReaderUtils = {
  speak: async () => console.log('ScreenReader.speak not available in web')
};

// Utilidades para notificaciones push (stubs)
export const pushNotificationUtils = {
  register: async () => {
    console.log('PushNotifications.register not available in web');
    throw new Error('PushNotifications not available in web');
  },
  addListener: async () => console.log('PushNotifications.addListener not available in web')
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
