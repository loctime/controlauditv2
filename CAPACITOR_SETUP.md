# 📱 Configuración de Capacitor - Control de Auditorías

## ✅ Estado Actual

Tu aplicación web React ya está configurada con Capacitor y lista para convertirse en una app móvil nativa.

## 🚀 Comandos Disponibles

### **Desarrollo y Build**
```bash
# Construir la aplicación web
npm run build

# Construir y sincronizar con Capacitor
npm run cap:build

# Sincronizar cambios con plataformas nativas
npm run cap:sync
```

### **Plataformas Móviles**
```bash
# Abrir proyecto Android en Android Studio
npm run cap:open:android

# Abrir proyecto iOS en Xcode (solo macOS)
npm run cap:open:ios

# Ejecutar en dispositivo/emulador Android
npm run cap:run:android

# Ejecutar en dispositivo/emulador iOS (solo macOS)
npm run cap:run:ios
```

## 📋 Requisitos del Sistema

### **Para Android:**
- ✅ Android Studio instalado
- ✅ Android SDK configurado
- ✅ Variables de entorno ANDROID_HOME y ANDROID_SDK_ROOT
- ✅ Dispositivo Android o emulador

### **Para iOS (solo macOS):**
- ✅ Xcode instalado
- ✅ CocoaPods instalado
- ✅ Dispositivo iOS o simulador

## 🔧 Configuración Inicial

### **1. Verificar instalación de Android Studio**
```bash
# Verificar que Android Studio esté instalado
# Abrir Android Studio y configurar SDK
```

### **2. Configurar variables de entorno (Windows)**
```powershell
# Agregar al PATH del sistema:
# C:\Users\[Usuario]\AppData\Local\Android\Sdk\platform-tools
# C:\Users\[Usuario]\AppData\Local\Android\Sdk\tools
```

### **3. Verificar dispositivos conectados**
```bash
adb devices
```

## 📱 Flujo de Desarrollo

### **1. Desarrollo Web**
```bash
# Desarrollar normalmente con Vite
npm run dev
```

### **2. Construir para móvil**
```bash
# Construir la aplicación
npm run build

# Sincronizar con Capacitor
npm run cap:sync
```

### **3. Probar en móvil**
```bash
# Abrir en Android Studio
npm run cap:open:android

# O ejecutar directamente
npm run cap:run:android
```

## 🔌 Plugins Capacitor Útiles

### **Plugins ya incluidos:**
- ✅ **@capacitor/core** - Funcionalidad básica
- ✅ **@capacitor/android** - Plataforma Android
- ✅ **@capacitor/ios** - Plataforma iOS

### **Plugins recomendados para tu app:**
```bash
# Cámara para fotos de auditoría
npm install @capacitor/camera

# Geolocalización
npm install @capacitor/geolocation

# Almacenamiento local
npm install @capacitor/preferences

# Notificaciones push
npm install @capacitor/push-notifications

# Estado de la red
npm install @capacitor/network

# Barra de estado
npm install @capacitor/status-bar

# Pantalla de splash
npm install @capacitor/splash-screen
```

## 🎨 Personalización

### **Configuración de Splash Screen**
El splash screen está configurado en `capacitor.config.ts`:
- Color de fondo: #1976d2 (azul Material-UI)
- Duración: 3 segundos
- Spinner: habilitado

### **Configuración de Status Bar**
- Estilo: dark (texto claro sobre fondo oscuro)

## 🚨 Posibles Problemas y Soluciones

### **1. Error de permisos Android**
```xml
<!-- Agregar en android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### **2. Problemas de red en Android**
```typescript
// En capacitor.config.ts
server: {
  androidScheme: 'https',
  cleartext: true
}
```

### **3. Iconos de la aplicación**
Reemplazar `android/app/src/main/res/mipmap-*` con tus iconos personalizados.

## 📊 Optimizaciones Recomendadas

### **1. Reducir tamaño del bundle**
```javascript
// En vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        mui: ['@mui/material', '@mui/icons-material'],
        router: ['react-router-dom'],
        charts: ['chart.js', 'react-chartjs-2'],
        pdf: ['@react-pdf/renderer', 'jspdf']
      }
    }
  }
}
```

### **2. Lazy loading de componentes**
```javascript
// Cargar componentes pesados solo cuando se necesiten
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

## 🎯 Próximos Pasos

1. **Instalar plugins adicionales** según las necesidades de tu app
2. **Configurar iconos personalizados** para la aplicación
3. **Probar en dispositivos reales** para verificar funcionalidad
4. **Optimizar rendimiento** para dispositivos móviles
5. **Configurar notificaciones push** si es necesario

## 📞 Soporte

- 📖 [Documentación oficial de Capacitor](https://capacitorjs.com/docs)
- 🐛 [Issues en GitHub](https://github.com/ionic-team/capacitor/issues)
- 💬 [Comunidad Discord](https://discord.gg/capacitor)

---

**¡Tu aplicación está lista para convertirse en una app móvil nativa!** 🎉
