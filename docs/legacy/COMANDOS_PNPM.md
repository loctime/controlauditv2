# 📱 Comandos PNPM - ControlAudit

## 🚀 **Comandos Principales**

### **`pnpm run dev`** - Desarrollo Completo
```bash
pnpm run dev
```
**¿Qué hace?**
- ✅ Levanta servidor web local (Vite)
- ✅ Levanta backend local

**Cuándo usar:** Para desarrollo local completo

---

### **`pnpm run die`** - Release Completo
```bash
pnpm run die "Mi cambio"
pnpm run die "Nueva funcionalidad"
pnpm run die "Cualquier mensaje"
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
| `pnpm run dev` | **Web + backend** (desarrollo completo) |
| `pnpm run dev:web` | Solo desarrollo web (sin backend) |
| `pnpm run dev:staging` | Desarrollo web en modo staging |
| `pnpm run dev:production` | Desarrollo web en modo production |
| `pnpm run backend:dev` | Solo backend local |
| `pnpm run backend:start` | Backend en modo producción |

---

## 🏗️ **Comandos de Build**

| Comando | Descripción |
|---------|-------------|
| `pnpm run build` | Build de producción |
| `pnpm run build:staging` | Build en modo staging |
| `pnpm run build:production` | Build en modo production |
| `pnpm run preview` | Preview del build |
| `pnpm run analyze` | Análisis del bundle |
| `pnpm run clean` | Limpia archivos temporales |
| `pnpm run optimize` | Clean + build optimizado |

---

## 🚀 **Comandos de Deploy**

| Comando | Descripción |
|---------|-------------|
| `pnpm run deploy:staging` | Deploy a Vercel (staging) |
| `pnpm run deploy:production` | Deploy a Vercel (production) |

---

## ⚙️ **Comandos de Configuración**

| Comando | Descripción |
|---------|-------------|
| `pnpm run setup:dev` | Configura entorno de desarrollo |
| `pnpm run setup:staging` | Configura entorno de staging |
| `pnpm run setup:production` | Configura entorno de producción |
| `pnpm run lint` | Ejecuta linter |
| `pnpm run reinstall` | Reinstala todas las dependencias |

---

## 📋 **Flujo de Trabajo Recomendado**

### **1. Desarrollo Diario:**
```bash
pnpm run dev
# Trabajas en tu código...
# Web y backend funcionando simultáneamente
```

### **2. Hacer Release:**
```bash
pnpm run die "Nueva funcionalidad"
# Todo automático: commit, build, tag, push, APK
```

### **3. Solo Web:**
```bash
pnpm run dev:web
# Solo desarrollo web
```

---

## 🎯 **Comandos Más Usados**

| Uso | Comando |
|-----|---------|
| **Desarrollo completo** | `pnpm run dev` |
| **Release completo** | `pnpm run die "mensaje"` |
| **Solo Web** | `pnpm run dev:web` |
| **Build producción** | `pnpm run build` |

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
