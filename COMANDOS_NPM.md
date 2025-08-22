# 📱 Comandos NPM - ControlAudit

## 🚀 **Comandos Principales**

### **`npm run dev`** - Desarrollo Completo
```bash
npm run dev
```
**¿Qué hace?**
- ✅ Levanta servidor web local (Vite)
- ✅ Levanta backend local
- ✅ Build de la aplicación web
- ✅ Sync con Capacitor
- ✅ Levanta Android (emulador/dispositivo)

**Cuándo usar:** Para desarrollo local completo

---

### **`npm run die`** - Release Completo
```bash
npm run die "Mi cambio"
npm run die "Nueva funcionalidad"
npm run die "Cualquier mensaje"
```
**¿Qué hace?**
- ✅ Hace commit de cambios
- ✅ Actualiza versión en package.json
- ✅ Build de la aplicación web
- ✅ Sync con Capacitor
- ✅ Crea tag automáticamente
- ✅ Sube a GitHub
- ✅ Dispara GitHub Actions
- ✅ Genera APK automáticamente
- ✅ Crea Release en GitHub

**Cuándo usar:** Para hacer releases y generar APK

---

## 🔧 **Comandos de Desarrollo**

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | **Web + backend + Android** (desarrollo completo) |
| `npm run dev:web` | Solo desarrollo web (sin backend ni Android) |
| `npm run dev:staging` | Desarrollo web en modo staging |
| `npm run dev:production` | Desarrollo web en modo production |
| `npm run backend:dev` | Solo backend local |
| `npm run backend:start` | Backend en modo producción |

---

## 📱 **Comandos de Android**

| Comando | Descripción |
|---------|-------------|
| `npm run fer` | **Build + sync + clean + APK Android** (recomendado) |
| `npm run android:build` | Build + sync + clean + APK Android |
| `npm run android:clean` | Solo clean de Android |
| `npm run android:dev` | Build + sync + run Android |
| `npm run cap:sync` | Solo sync con Capacitor |
| `npm run cap:build` | Build + sync |
| `npm run cap:open:android` | Abre Android Studio |
| `npm run cap:run:android` | Ejecuta en Android |
| `npm run build:full` | Build + sync completo |

### **🔧 Scripts de Keystore (Nuevos)**
| Comando | Descripción |
|---------|-------------|
| `cd android && .\generate-debug-keystore.bat` | Genera keystore de debug (Windows CMD) |
| `cd android && .\generate-debug-keystore.ps1` | Genera keystore de debug (Windows PowerShell) |
| `cd android && ./generate-debug-keystore.sh` | Genera keystore de debug (Linux/Mac) |
| `cd android && .\build-with-keystore.bat` | Build con keystore automático (Windows CMD) |
| `cd android && .\build-with-keystore.ps1` | Build con keystore automático (Windows PowerShell) |
| `cd android && ./build-with-keystore.sh` | Build con keystore automático (Linux/Mac) |

---

## 🏗️ **Comandos de Build**

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Build de producción |
| `npm run build:staging` | Build en modo staging |
| `npm run build:production` | Build en modo production |
| `npm run preview` | Preview del build |
| `npm run analyze` | Análisis del bundle |
| `npm run clean` | Limpia archivos temporales |
| `npm run optimize` | Clean + build optimizado |

---

## 🚀 **Comandos de Deploy**

| Comando | Descripción |
|---------|-------------|
| `npm run deploy:staging` | Deploy a Vercel (staging) |
| `npm run deploy:production` | Deploy a Vercel (production) |

---

## ⚙️ **Comandos de Configuración**

| Comando | Descripción |
|---------|-------------|
| `npm run setup:dev` | Configura entorno de desarrollo |
| `npm run setup:staging` | Configura entorno de staging |
| `npm run setup:production` | Configura entorno de producción |
| `npm run lint` | Ejecuta linter |

---

## 📋 **Flujo de Trabajo Recomendado**

### **1. Desarrollo Diario:**
```bash
npm run dev
# Trabajas en tu código...
# Web, backend y Android funcionando simultáneamente
```

### **2. Hacer Release:**
```bash
npm run die "Nueva funcionalidad"
# Todo automático: commit, build, tag, push, APK
```

### **3. Solo Android:**
```bash
npm run fer
# Build + sync + clean + APK Android (recomendado)
```

**¿Qué hace `npm run fer`?**
1. **Build React:** Compila el código JavaScript/React
2. **Clean Android:** Limpia archivos temporales de Android
3. **Sync Capacitor:** Copia archivos web a Android
4. **Fix Java:** Corrige versiones de Java
5. **Generate APK:** Crea la APK final lista para instalar

**Resultado:** APK lista en `android/app/build/outputs/apk/debug/app-debug.apk`

### **4. Solo Web:**
```bash
npm run dev:web
# Solo desarrollo web
```

---

## 🎯 **Comandos Más Usados**

| Uso | Comando |
|-----|---------|
| **Desarrollo completo** | `npm run dev` |
| **Release completo** | `npm run die "mensaje"` |
| **Solo Android** | `npm run fer` |
| **Solo Web** | `npm run dev:web` |
| **Build completo** | `npm run build:full` |

---

## 📱 **Versiones**

| Ejemplo | Descripción |
|---------|-------------|
| v1.0.0 → v1.0.1 | Incremento automático (patch) |
| v1.0.1 → v1.0.2 | Incremento automático (patch) |
| v1.0.2 → v1.0.3 | Incremento automático (patch) |

---

## 🔗 **Enlaces Útiles**

- **GitHub Actions:** `https://github.com/[usuario]/controlauditv2/actions`
- **Releases:** `https://github.com/[usuario]/controlauditv2/releases`
- **APK:** Se genera automáticamente en cada release
