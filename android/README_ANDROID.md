# 📱 Configuración Android - ControlAudit

## 🔐 Configuración de Firma

### Debug (Desarrollo)
- ✅ **Automático**: Usa el debug.keystore global de Android
- ✅ **Ubicación**: `~/.android/debug.keystore` (Windows: `%USERPROFILE%\.android\debug.keystore`)
- ✅ **No requiere configuración**: Funciona automáticamente

### Release (Producción)
- 🔧 **Requiere configuración**: Necesitas generar un keystore específico
- 🔧 **Ubicación**: `android/keystore/controlaudit-release.jks`

## 🚀 Generar Keystore de Release

### Opción 1: Script Automático
```bash
cd android
chmod +x generate-release-keystore.sh
./generate-release-keystore.sh
```

### Opción 2: Manual
```bash
cd android
mkdir keystore
keytool -genkey -v \
  -keystore keystore/controlaudit-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias controlaudit_key \
  -storetype JKS
```

## ⚙️ Configurar Propiedades

Edita `android/gradle.properties` y descomenta estas líneas:

```properties
MYAPP_UPLOAD_STORE_FILE=keystore/controlaudit-release.jks
MYAPP_UPLOAD_STORE_PASSWORD=tu_password_del_keystore
MYAPP_UPLOAD_KEY_ALIAS=controlaudit_key
MYAPP_UPLOAD_KEY_PASSWORD=tu_password_de_la_clave
```

## 📦 Build de APKs

### Debug APK
```bash
npm run fer
# O manualmente:
cd android
./gradlew assembleDebug
```

### Release APK
```bash
cd android
./gradlew assembleRelease
```

## 🔍 Verificar Configuración

### Debug
```bash
cd android
./gradlew signingReport
```

### Release (solo si configuraste las propiedades)
```bash
cd android
./gradlew signingReport
```

## 📱 Sincronización con Android Studio

1. **Hacer cambios en el código:**
   ```bash
   npm run fer
   ```

2. **Abrir Android Studio:**
   ```bash
   npm run cap:open:android
   ```

3. **Ejecutar en dispositivo/emulador:**
   - Presiona ▶️ en Android Studio
   - O usa: `npm run android:dev`

## ⚠️ Importante

- **Nunca subas el keystore al repositorio**
- **Guarda el keystore en un lugar seguro**
- **Recuerda las contraseñas**
- **El mismo keystore es necesario para actualizar la app en Google Play**

## 🛠️ Troubleshooting

### Error: "Keystore not found"
- Verifica que el debug.keystore existe en `~/.android/`
- Si no existe, Android Studio lo creará automáticamente

### Error: "Release signing config not found"
- Las propiedades de release están comentadas en `gradle.properties`
- Solo necesitas configurarlas para builds de release

### Error: "Permission denied" en script
```bash
chmod +x android/generate-release-keystore.sh
```
