# 🔑 Solución para Keystore de Debug - Android

## ❌ **Problema**
```
Execution failed for task ':app:validateSigningDebug'.
> Keystore file '/home/runner/.android/debug.keystore' not found for signing config 'debug'.
```

## ✅ **Solución**

### **1. Generar Keystore Automáticamente**

#### **Windows:**
```bash
cd android
generate-debug-keystore.bat
```

#### **Linux/Mac:**
```bash
cd android
chmod +x generate-debug-keystore.sh
./generate-debug-keystore.sh
```

### **2. Build con Keystore Automático**

#### **Windows:**
```bash
cd android
build-with-keystore.bat
```

#### **Linux/Mac:**
```bash
cd android
chmod +x build-with-keystore.sh
./build-with-keystore.sh
```

### **3. Comando Manual (Alternativo)**

Si los scripts no funcionan, ejecuta manualmente:

```bash
keytool -genkey -v \
  -keystore ~/.android/debug.keystore \
  -storepass android \
  -alias androiddebugkey \
  -keypass android \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Android Debug,O=Android,C=US"
```

## 🔧 **¿Qué hacen los scripts?**

### **generate-debug-keystore.bat/sh**
- ✅ Verifica si existe el directorio `~/.android`
- ✅ Crea el directorio si no existe
- ✅ Verifica si existe el keystore de debug
- ✅ Genera el keystore con parámetros estándar de Android
- ✅ Usa las credenciales por defecto: `android/android`

### **build-with-keystore.bat/sh**
- ✅ Ejecuta `generate-debug-keystore` primero
- ✅ Ejecuta `gradlew assembleDebug`
- ✅ Muestra la ubicación del APK generado

## 📁 **Ubicación del Keystore**

- **Windows:** `%USERPROFILE%\.android\debug.keystore`
- **Linux/Mac:** `~/.android/debug.keystore`

## 🔍 **Verificar Keystore**

```bash
keytool -list -v -keystore ~/.android/debug.keystore -storepass android
```

## 🚀 **Flujo Recomendado**

1. **Primera vez:**
   ```bash
   cd android
   generate-debug-keystore.bat  # o .sh en Linux/Mac
   ```

2. **Builds posteriores:**
   ```bash
   cd android
   build-with-keystore.bat  # o .sh en Linux/Mac
   ```

3. **O usar npm:**
   ```bash
   npm run fer  # Incluye sync y build
   ```

## ⚠️ **Notas Importantes**

- El keystore de debug es **solo para desarrollo**
- **NO usar** para releases de producción
- Las credenciales son estándar: `android/android`
- El keystore se genera una sola vez
- Funciona en CI/CD y entornos locales

## 🆘 **Solución de Problemas**

### **Error: "keytool not found"**
- Instalar Java JDK
- Asegurar que `JAVA_HOME` esté configurado
- Verificar que `keytool` esté en el PATH

### **Error: "Permission denied"**
- En Linux/Mac: `chmod +x *.sh`
- En Windows: Ejecutar como administrador si es necesario

### **Error: "Keystore was tampered with"**
- Eliminar el keystore existente
- Regenerar con el script

```bash
rm ~/.android/debug.keystore
./generate-debug-keystore.sh  # o .bat en Windows
```
