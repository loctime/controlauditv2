// Optimización de importaciones de Capacitor
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar Capacitor Core de forma lazy
export const loadCapacitorCore = async () => {
  const { Capacitor } = await import('@capacitor/core');
  return Capacitor;
};

// Función para cargar Capacitor Android de forma lazy
export const loadCapacitorAndroid = async () => {
  const { Capacitor } = await import('@capacitor/android');
  return Capacitor;
};

// Función para cargar Capacitor iOS de forma lazy
export const loadCapacitorIOS = async () => {
  const { Capacitor } = await import('@capacitor/ios');
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
  
  // Limpiar almacenamiento
  clear: async () => {
    const { Storage } = await loadCapacitorPlugins();
    return await Storage.clear();
  },
  
  // Obtener claves
  keys: async () => {
    const { Storage } = await loadCapacitorPlugins();
    const result = await Storage.keys();
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
