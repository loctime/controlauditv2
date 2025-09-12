// Optimización de importaciones de Capacitor - MODO WEB
// Versión simplificada para desarrollo web sin Capacitor

// Función para cargar Capacitor Core de forma lazy
export const loadCapacitorCore = async () => {
  // Mock para desarrollo web
  return {
    isNativePlatform: () => false,
    getPlatform: () => 'web'
  };
};

// Función para cargar Capacitor Android de forma lazy (deshabilitado)
export const loadCapacitorAndroid = async () => {
  console.warn('Capacitor Android deshabilitado para desarrollo web');
  return null;
};

// Función para cargar Capacitor iOS de forma lazy (deshabilitado)
export const loadCapacitorIOS = async () => {
  console.warn('Capacitor iOS deshabilitado para desarrollo web');
  return null;
};

// Función para cargar plugins de Capacitor de forma lazy (MODO WEB)
export const loadCapacitorPlugins = async () => {
  console.warn('Capacitor plugins deshabilitados para desarrollo web');
  
  // Retornar mocks para todos los plugins
  return {
    App: {
      getInfo: () => Promise.resolve({ name: 'Web App', version: '1.0.0' }),
      getState: () => Promise.resolve({ isActive: true }),
      addListener: () => ({ remove: () => {} }),
      exitApp: () => Promise.resolve(),
      minimizeApp: () => Promise.resolve()
    },
    Browser: {
      open: () => Promise.resolve(),
      close: () => Promise.resolve()
    },
    Camera: {
      getPhoto: () => Promise.resolve({ webPath: 'mock-image.jpg' }),
      checkPermissions: () => Promise.resolve({ camera: 'granted', photos: 'granted' }),
      requestPermissions: () => Promise.resolve({ camera: 'granted', photos: 'granted' })
    },
    Device: {
      getInfo: () => Promise.resolve({ platform: 'web', model: 'Web Browser' }),
      getBatteryInfo: () => Promise.resolve({ batteryLevel: 1, isCharging: false }),
      getLanguageCode: () => Promise.resolve({ value: 'es' }),
      getLanguageTag: () => Promise.resolve({ value: 'es-ES' })
    },
    Filesystem: {
      readFile: () => Promise.resolve({ data: 'mock-data' }),
      writeFile: () => Promise.resolve({ uri: 'mock-uri' }),
      deleteFile: () => Promise.resolve(),
      mkdir: () => Promise.resolve(),
      readdir: () => Promise.resolve({ files: [] }),
      rmdir: () => Promise.resolve(),
      stat: () => Promise.resolve({ type: 'file', size: 0 }),
      copy: () => Promise.resolve(),
      rename: () => Promise.resolve()
    },
    Geolocation: {
      getCurrentPosition: () => Promise.resolve({ coords: { latitude: 0, longitude: 0 } }),
      watchPosition: () => Promise.resolve({ callbackId: 'mock-id' }),
      checkPermissions: () => Promise.resolve({ location: 'granted' }),
      requestPermissions: () => Promise.resolve({ location: 'granted' })
    },
    Haptics: {
      vibrate: () => Promise.resolve(),
      impact: () => Promise.resolve(),
      notification: () => Promise.resolve(),
      selection: () => Promise.resolve()
    },
    Keyboard: {
      show: () => Promise.resolve(),
      hide: () => Promise.resolve(),
      setStyle: () => Promise.resolve(),
      setResizeMode: () => Promise.resolve(),
      addListener: () => ({ remove: () => {} })
    },
    LocalNotifications: {
      schedule: () => Promise.resolve(),
      cancel: () => Promise.resolve(),
      getPending: () => Promise.resolve({ notifications: [] }),
      checkPermissions: () => Promise.resolve({ display: 'granted' }),
      requestPermissions: () => Promise.resolve({ display: 'granted' })
    },
    Network: {
      getStatus: () => Promise.resolve({ connected: true, connectionType: 'wifi' }),
      addListener: () => ({ remove: () => {} })
    },
    PushNotifications: {
      register: () => Promise.resolve(),
      unregister: () => Promise.resolve(),
      getDeliveredNotifications: () => Promise.resolve({ notifications: [] }),
      removeAllDeliveredNotifications: () => Promise.resolve(),
      addListener: () => ({ remove: () => {} })
    },
    ScreenReader: {
      isEnabled: () => Promise.resolve({ value: false }),
      speak: () => Promise.resolve()
    },
    Share: {
      share: () => Promise.resolve()
    },
    SplashScreen: {
      show: () => Promise.resolve(),
      hide: () => Promise.resolve()
    },
    StatusBar: {
      show: () => Promise.resolve(),
      hide: () => Promise.resolve(),
      setStyle: () => Promise.resolve(),
      setBackgroundColor: () => Promise.resolve()
    },
    Preferences: {
      get: () => Promise.resolve({ value: null }),
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
      clear: () => Promise.resolve(),
      keys: () => Promise.resolve({ keys: [] })
    },
    Toast: {
      show: () => Promise.resolve()
    }
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
        useDialog: true
      },
      StatusBar: {
        style: 'dark',
        backgroundColor: '#ffffff',
        overlaysWebView: true
      }
    },
    ...options
  };
  
  return { Capacitor, config: defaultConfig };
};

// Utilidades para Capacitor
export const capacitorUtils = {
  // Verificar si está en plataforma nativa
  isNative: async () => {
    const Capacitor = await loadCapacitorCore();
    return Capacitor.isNativePlatform();
  },
  
  // Verificar plataforma
  getPlatform: async () => {
    const Capacitor = await loadCapacitorCore();
    return Capacitor.getPlatform();
  },
  
  // Verificar si es Android
  isAndroid: async () => {
    const platform = await capacitorUtils.getPlatform();
    return platform === 'android';
  },
  
  // Verificar si es iOS
  isIOS: async () => {
    const platform = await capacitorUtils.getPlatform();
    return platform === 'ios';
  },
  
  // Verificar si es web
  isWeb: async () => {
    const platform = await capacitorUtils.getPlatform();
    return platform === 'web';
  },
  
  // Obtener información del dispositivo
  getDeviceInfo: async () => {
    const { Device } = await loadCapacitorPlugins();
    return await Device.getInfo();
  },
  
  // Obtener información de la batería
  getBatteryInfo: async () => {
    const { Device } = await loadCapacitorPlugins();
    return await Device.getBatteryInfo();
  },
  
  // Obtener información del idioma
  getLanguageCode: async () => {
    const { Device } = await loadCapacitorPlugins();
    return await Device.getLanguageCode();
  },
  
  // Obtener información del idioma
  getLanguageTag: async () => {
    const { Device } = await loadCapacitorPlugins();
    return await Device.getLanguageTag();
  }
};

// Utilidades para la aplicación
export const appUtils = {
  // Obtener información de la aplicación
  getAppInfo: async () => {
    const { App } = await loadCapacitorPlugins();
    return await App.getInfo();
  },
  
  // Obtener estado de la aplicación
  getAppState: async () => {
    const { App } = await loadCapacitorPlugins();
    return await App.getState();
  },
  
  // Escuchar cambios de estado de la aplicación
  addAppStateListener: async (callback) => {
    const { App } = await loadCapacitorPlugins();
    return await App.addListener('appStateChange', callback);
  },
  
  // Escuchar cambios de URL
  addUrlOpenListener: async (callback) => {
    const { App } = await loadCapacitorPlugins();
    return await App.addListener('appUrlOpen', callback);
  },
  
  // Escuchar cambios de restauración
  addRestoredListener: async (callback) => {
    const { App } = await loadCapacitorPlugins();
    return await App.addListener('appRestoredResult', callback);
  },
  
  // Salir de la aplicación
  exitApp: async () => {
    const { App } = await loadCapacitorPlugins();
    return await App.exitApp();
  },
  
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
  },
  
  // Obtener información del archivo
  stat: async (path) => {
    const { Filesystem } = await loadCapacitorPlugins();
    return await Filesystem.stat({ path });
  },
  
  // Copiar archivo
  copy: async (from, to) => {
    const { Filesystem } = await loadCapacitorPlugins();
    return await Filesystem.copy({ from, to });
  },
  
  // Renombrar archivo
  rename: async (from, to) => {
    const { Filesystem } = await loadCapacitorPlugins();
    return await Filesystem.rename({ from, to });
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
  
  // Observar cambios de posición
  watchPosition: async (callback, options = {}) => {
    const { Geolocation } = await loadCapacitorPlugins();
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
      ...options
    };
    return await Geolocation.watchPosition(defaultOptions, callback);
  },
  
  // Verificar permisos de geolocalización
  checkPermissions: async () => {
    const { Geolocation } = await loadCapacitorPlugins();
    return await Geolocation.checkPermissions();
  },
  
  // Solicitar permisos de geolocalización
  requestPermissions: async () => {
    const { Geolocation } = await loadCapacitorPlugins();
    return await Geolocation.requestPermissions();
  }
};

// Utilidades para notificaciones
export const notificationUtils = {
  // Mostrar notificación local
  schedule: async (notifications) => {
    const { LocalNotifications } = await loadCapacitorPlugins();
    return await LocalNotifications.schedule({ notifications });
  },
  
  // Cancelar notificaciones
  cancel: async (notifications) => {
    const { LocalNotifications } = await loadCapacitorPlugins();
    return await LocalNotifications.cancel({ notifications });
  },
  
  // Obtener notificaciones programadas
  getPending: async () => {
    const { LocalNotifications } = await loadCapacitorPlugins();
    return await LocalNotifications.getPending();
  },
  
  // Verificar permisos de notificaciones
  checkPermissions: async () => {
    const { LocalNotifications } = await loadCapacitorPlugins();
    return await LocalNotifications.checkPermissions();
  },
  
  // Solicitar permisos de notificaciones
  requestPermissions: async () => {
    const { LocalNotifications } = await loadCapacitorPlugins();
    return await LocalNotifications.requestPermissions();
  }
};

// Utilidades para almacenamiento
export const storageUtils = {
  // Obtener valor
  get: async (key) => {
    const { Preferences } = await loadCapacitorPlugins();
    const result = await Preferences.get({ key });
    return result.value;
  },
  
  // Establecer valor
  set: async (key, value) => {
    const { Preferences } = await loadCapacitorPlugins();
    return await Preferences.set({ key, value });
  },
  
  // Eliminar valor
  remove: async (key) => {
    const { Preferences } = await loadCapacitorPlugins();
    return await Preferences.remove({ key });
  },
  
  // Limpiar almacenamiento
  clear: async () => {
    const { Preferences } = await loadCapacitorPlugins();
    return await Preferences.clear();
  },
  
  // Obtener claves
  keys: async () => {
    const { Preferences } = await loadCapacitorPlugins();
    const result = await Preferences.keys();
    return result.keys;
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
  
  // Establecer estilo del teclado
  setStyle: async (style) => {
    const { Keyboard } = await loadCapacitorPlugins();
    return await Keyboard.setStyle({ style });
  },
  
  // Establecer resize del teclado
  setResizeMode: async (mode) => {
    const { Keyboard } = await loadCapacitorPlugins();
    return await Keyboard.setResizeMode({ mode });
  },
  
  // Escuchar eventos del teclado
  addListener: async (eventName, callback) => {
    const { Keyboard } = await loadCapacitorPlugins();
    return await Keyboard.addListener(eventName, callback);
  }
};

// Utilidades para la barra de estado
export const statusBarUtils = {
  // Mostrar barra de estado
  show: async () => {
    const { StatusBar } = await loadCapacitorPlugins();
    return await StatusBar.show();
  },
  
  // Ocultar barra de estado
  hide: async () => {
    const { StatusBar } = await loadCapacitorPlugins();
    return await StatusBar.hide();
  },
  
  // Establecer estilo de la barra de estado
  setStyle: async (style) => {
    const { StatusBar } = await loadCapacitorPlugins();
    return await StatusBar.setStyle({ style });
  },
  
  // Establecer color de fondo de la barra de estado
  setBackgroundColor: async (color) => {
    const { StatusBar } = await loadCapacitorPlugins();
    return await StatusBar.setBackgroundColor({ color });
  }
};

// Utilidades para la pantalla de splash
export const splashScreenUtils = {
  // Mostrar pantalla de splash
  show: async (options = {}) => {
    const { SplashScreen } = await loadCapacitorPlugins();
    return await SplashScreen.show(options);
  },
  
  // Ocultar pantalla de splash
  hide: async (options = {}) => {
    const { SplashScreen } = await loadCapacitorPlugins();
    return await SplashScreen.hide(options);
  }
};

// Hook personalizado para Capacitor
export const useCapacitor = () => {
  const isNative = async () => {
    return await capacitorUtils.isNative();
  };
  
  const getPlatform = async () => {
    return await capacitorUtils.getPlatform();
  };
  
  const isAndroid = async () => {
    return await capacitorUtils.isAndroid();
  };
  
  const isIOS = async () => {
    return await capacitorUtils.isIOS();
  };
  
  const isWeb = async () => {
    return await capacitorUtils.isWeb();
  };
  
  const getDeviceInfo = async () => {
    return await capacitorUtils.getDeviceInfo();
  };
  
  return {
    isNative,
    getPlatform,
    isAndroid,
    isIOS,
    isWeb,
    getDeviceInfo,
    app: appUtils,
    camera: cameraUtils,
    filesystem: filesystemUtils,
    geolocation: geolocationUtils,
    notifications: notificationUtils,
    storage: storageUtils,
    keyboard: keyboardUtils,
    statusBar: statusBarUtils,
    splashScreen: splashScreenUtils
  };
};
