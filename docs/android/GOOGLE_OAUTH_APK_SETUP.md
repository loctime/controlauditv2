# Configuración de Google OAuth para APK de ControlAudit

## Problema Identificado

Al intentar iniciar sesión con Google en la APK, aparecen dos errores principales:

1. **Error nativo**: "Cannot read properties of null (reading 'initialize')"
2. **Redirección a localhost**: La autenticación redirige a localhost en lugar de procesarse correctamente

## Solución Implementada

### 1. Configuración de Firebase

La APK usa la configuración específica de Android definida en `src/config/firebaseAPK.js`:

```javascript
export const FIREBASE_APK_CONFIG = {
  apiKey: 'AIzaSyB_hwQZapca3Y2cBP5rkmdoJy3tAdNB9Ro',
  authDomain: 'controlstorage-eb796.firebaseapp.com',
  projectId: 'controlstorage-eb796',
  storageBucket: 'controlstorage-eb796.firebasestorage.app',
  messagingSenderId: '909876364192',
  
  // ✅ APP_ID específico para Android
  appId: '1:909876364192:android:0b45053d7f5667fda79ac5',
  
  oauth: {
    scheme: 'com.controlaudit.app',
    clientId: '909876364192-0b45053d7f5667fda79ac5.apps.googleusercontent.com'
  }
};
```

### 2. Configuración de Capacitor

En `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.controlaudit.app',
  scheme: 'com.controlaudit.app',
  
  plugins: {
    OAuth2Client: {
      clientId: '909876364192-0b45053d7f5667fda79ac5.apps.googleusercontent.com',
      redirectUri: 'com.controlaudit.app://',
      responseType: 'code',
      scope: 'openid email profile'
    }
  },
  
  android: {
    intentFilters: [
      {
        action: 'android.intent.action.VIEW',
        categories: ['android.intent.category.DEFAULT', 'android.intent.category.BROWSABLE'],
        data: {
          scheme: 'com.controlaudit.app'
        }
      }
    ]
  }
};
```

### 3. AndroidManifest.xml

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.controlaudit.app" />
</intent-filter>
```

## Configuración en Firebase Console

### 1. URLs Autorizadas

En Firebase Console > Authentication > Settings > Authorized domains, asegúrate de tener:

- `controlstorage-eb796.firebaseapp.com`
- `localhost` (para desarrollo)

### 2. OAuth 2.0 Client IDs

En Google Cloud Console > APIs & Services > Credentials, verifica que el OAuth 2.0 Client ID tenga:

- **Authorized redirect URIs**:
  - `https://controlstorage-eb796.firebaseapp.com/__/auth/handler`
  - `com.controlaudit.app://`

### 3. SHA-1 Fingerprint

Asegúrate de que el SHA-1 de tu keystore esté registrado en Firebase Console > Project Settings > Your apps > Android app.

## Flujo de Autenticación en APK

1. **Usuario toca "Continuar con Google"**
2. **APK detecta que está en Capacitor**
3. **Usa `signInWithGoogleAPK()` específico para APK**
4. **Firebase redirige al navegador web**
5. **Usuario se autentica en Google**
6. **Google redirige de vuelta a la app usando `com.controlaudit.app://`**
7. **APK procesa el resultado con `handleGoogleRedirectResultAPK()`**
8. **Usuario es autenticado automáticamente**

## Manejo de Errores

### Error "Cannot read properties of null (reading 'initialize')"

Este error indica que Firebase no se inicializó correctamente. La solución implementada:

1. **Verificación de configuración**: `validateAPKConfig()` verifica que todas las claves estén presentes
2. **Configuración específica para APK**: Usa `FIREBASE_APK_CONFIG` en lugar de la configuración web
3. **Manejo de errores mejorado**: Captura y maneja errores específicos de la APK

### Redirección a localhost

Este problema se resuelve:

1. **NO configurar redirect_uri personalizado**: Firebase usa automáticamente las URLs autorizadas
2. **Scheme correcto**: `com.controlaudit.app://` está configurado en Capacitor y AndroidManifest
3. **Intent filters**: Android sabe cómo manejar el redirect de vuelta a la app

## Verificación

Para verificar que la configuración funciona:

1. **Logs de consola**: Busca mensajes que empiecen con "📱"
2. **Configuración válida**: `validateAPKConfig()` debe retornar `true`
3. **Flujo de autenticación**: Debe redirigir a Google y volver a la app

## Troubleshooting

### Si sigue apareciendo el error nativo:

1. Verifica que `google-services.json` esté en `android/app/`
2. Asegúrate de que el SHA-1 esté registrado en Firebase
3. Limpia y reconstruye la APK: `npm run build && npx cap sync android`

### Si sigue redirigiendo a localhost:

1. Verifica las URLs autorizadas en Firebase Console
2. Asegúrate de que el OAuth 2.0 Client ID tenga el redirect URI correcto
3. Verifica que el scheme `com.controlaudit.app://` esté configurado en todos los lugares

## Archivos Modificados

- `src/firebaseConfig.js` - Configuración principal de Firebase
- `src/config/firebaseAPK.js` - Configuración específica para APK
- `src/utils/googleAuthAPK.js` - Utilidades de autenticación para APK
- `src/components/pages/login/Login.jsx` - Manejo de login en APK
- `src/components/context/AuthContext.jsx` - Manejo de redirects en APK
- `capacitor.config.ts` - Configuración de Capacitor
- `android/app/src/main/AndroidManifest.xml` - Intent filters para OAuth
