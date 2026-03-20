# 🔗 Conexión ControlAudit con CONTROLFILE - Firestore Rules

> ⭐ **ARCHIVO FUENTE:** `rules/audit.rules` es el archivo que se usa para desplegar las reglas en CONTROLFILE.
> 
> Este archivo se copia a CONTROLFILE como `firestore-rules/controllaudit.rules` y se incluye en el despliegue final.

## 📋 Resumen

ControlAudit v2 está integrado con **CONTROLFILE** como repositorio maestro para gestionar y desplegar las reglas de Firestore. 

**Archivo fuente:** `rules/audit.rules` (este archivo se copia a CONTROLFILE para despliegue)

Este proyecto mantiene sus reglas locales para desarrollo, pero el despliegue final se realiza desde CONTROLFILE.

## 🏗️ Arquitectura de Reglas

### Estructura del Proyecto ControlAudit

```
controlauditv2/
├── rules/                          # 📁 Reglas modulares
│   ├── audit.rules                 # ✅ Reglas específicas de ControlAudit
│   ├── base.rules                  # ⚠️ Debe ser idéntico al de CONTROLFILE
│   ├── build.js                    # Script para testing local
│   └── README.md                   # Documentación de arquitectura
│
├── firestore.rules                 # ⚠️ Generado localmente (solo testing)
└── firebase.json                   # Configuración local
```

### Estructura en CONTROLFILE (Repositorio Maestro)

```
repo-controlfile/
├── firestore-rules/                # 📁 Todas las reglas de todas las apps
│   ├── base.rules                  # Helpers compartidos
│   ├── controlFile.rules          # Reglas de CONTROLFILE
│   ├── controllaudit.rules         # ✅ Copia de rules/audit.rules desde ControlAudit
│   ├── controlStore.rules         # Reglas de CONTROL-STORE
│   ├── controlBio.rules           # Reglas de CONTROLBIO
│   ├── build.js                    # Script que combina TODAS las apps
│   │                                # (incluye 'controllaudit.rules' en el array)
│   └── README.md                   # Documentación completa
│
├── firestore.rules                 # ✅ GENERADO (combina todas las apps)
└── firebase.json                   # Configuración maestro
```

**⚠️ IMPORTANTE:** 
- Archivo fuente en ControlAudit: `rules/audit.rules`
- Archivo en CONTROLFILE: `firestore-rules/controllaudit.rules`
- El nombre `controllaudit.rules` es el que espera el `build.js` de CONTROLFILE

## 🔄 Flujo de Trabajo

### 1. Desarrollo Local (ControlAudit)

En este proyecto, puedes desarrollar y probar reglas localmente:

```bash
# Generar firestore.rules localmente (solo para testing)
npm run build:rules  # Si existe el script

# Probar con Firebase Emulator (opcional)
firebase emulators:start --only firestore
```

⚠️ **IMPORTANTE**: Este proyecto **NO despliega** reglas directamente. Solo CONTROLFILE despliega al Firestore compartido.

### 2. Actualizar Reglas en CONTROLFILE

Cuando necesites actualizar las reglas de ControlAudit:

**Paso 1: Editar reglas en ControlAudit**
```bash
# Editar el archivo de reglas
code rules/audit.rules
```

**Paso 2: Copiar a CONTROLFILE**
```bash
# Copiar el archivo a CONTROLFILE
# Desde ControlAudit:
# ⚠️ IMPORTANTE: El archivo se copia con el nombre 'controllaudit.rules' en CONTROLFILE
cp rules/audit.rules /ruta/a/repo-controlfile/firestore-rules/controllaudit.rules
```

**Nota:** El archivo `rules/audit.rules` se copia a CONTROLFILE como `controllaudit.rules` (nombre que espera el build.js de CONTROLFILE).

**Paso 3: Desplegar desde CONTROLFILE**
```bash
cd /ruta/a/repo-controlfile
npm run build:rules              # Regenera firestore.rules con TODAS las apps
firebase deploy --only firestore:rules  # Despliega al Firestore compartido
```

## 📝 Reglas Actuales de ControlAudit

### Estructura de Rutas

Las reglas de ControlAudit están definidas en `rules/audit.rules`:

```javascript
// Perfil de usuario (SIEMPRE primero)
match /apps/auditoria/users/{userId} {
  allow read, write: if request.auth != null
    && request.auth.uid == userId;
}

// Datos de la app (empresas, auditorías, formularios, etc)
match /apps/auditoria/{document=**} {
  allow read, write: if request.auth != null;
}
```

### Cambios Recientes (2024)

**Migración de rutas de usuarios:**
- ❌ **Antes**: `/usuarios/{userId}` (ruta antigua)
- ✅ **Ahora**: `/apps/auditoria/users/{userId}` (ruta nueva)

**Impacto en otras reglas:**
Las reglas en `firestore.rules` (raíz) que referencian usuarios también fueron actualizadas:
- `empresas/{empresaId}` ahora busca perfiles en `/apps/auditoria/users/`
- Otras colecciones que dependen de usuarios también deben actualizarse

## 🔐 Reglas de Permisos

### Perfil de Usuario

```javascript
match /apps/auditoria/users/{userId} {
  allow read, write: if request.auth != null
    && request.auth.uid == userId;
}
```

**Permisos:**
- ✅ Usuario autenticado puede leer/escribir su propio perfil
- ✅ El `userId` del documento debe coincidir con `request.auth.uid`
- ❌ No puede acceder a perfiles de otros usuarios

### Datos de la Aplicación

```javascript
match /apps/auditoria/{document=**} {
  allow read, write: if request.auth != null;
}
```

**Permisos:**
- ✅ Usuario autenticado puede leer/escribir cualquier documento bajo `/apps/auditoria/`
- ⚠️ Esto incluye: empresas, auditorías, formularios, sucursales, etc.

## ⚠️ Reglas Importantes

### 1. Solo CONTROLFILE Despliega

- ✅ Este proyecto puede generar `firestore.rules` localmente para testing
- ❌ **NUNCA** ejecutar `firebase deploy --only firestore:rules` desde este proyecto
- ✅ Solo CONTROLFILE despliega las reglas al Firestore compartido

### 2. Sincronización de `base.rules`

- ⚠️ `base.rules` debe ser **IDÉNTICO** en todos los repositorios
- Si CONTROLFILE actualiza `base.rules`, copiar manualmente a este proyecto
- Ubicación: `rules/base.rules` (si existe)

### 3. Orden de Reglas

Las reglas se evalúan en orden:
1. Reglas más específicas primero (`/apps/auditoria/users/{userId}`)
2. Reglas más generales después (`/apps/auditoria/{document=**}`)
3. Deny por defecto al final

## 🔍 Verificación

### Verificar Reglas Desplegadas

```bash
# Desde CONTROLFILE
cd /ruta/a/repo-controlfile
firebase firestore:rules:get
```

### Verificar Reglas Locales

```bash
# Desde ControlAudit
cat firestore.rules | grep -A 5 "auditoria"
```

### Logs de Consola

Al acceder a Firestore, verifica en la consola del navegador:
- ✅ No deberían aparecer errores de permisos
- ✅ Las operaciones deberían completarse correctamente

## 🐛 Troubleshooting

### Error: "Missing or insufficient permissions"

**Causa común**: Las reglas en CONTROLFILE no están actualizadas.

**Solución**:
1. Verificar que `rules/audit.rules` tenga los cambios necesarios
2. Copiar a CONTROLFILE: `firestore-rules/controllaudit.rules`
3. Regenerar y desplegar desde CONTROLFILE

### Error: "User profile not found"

**Causa común**: La ruta del perfil de usuario cambió.

**Solución**:
- Verificar que el código use `/apps/auditoria/users/{uid}`
- Verificar que las reglas permitan acceso a esta ruta
- Verificar que el perfil exista en Firestore

### Reglas no se aplican después del despliegue

**Solución**:
1. Esperar 1-2 minutos (propagación de Firestore)
2. Cerrar sesión y volver a iniciar
3. Limpiar cache del navegador
4. Verificar que el despliegue fue exitoso: `firebase deploy --only firestore:rules`

## 📚 Archivos Clave

### En ControlAudit
- **`rules/audit.rules`** ⭐ - **Archivo fuente** que se despliega en CONTROLFILE
- `firestore.rules` - Generado localmente (solo testing)
- `rules/README.md` - Documentación de arquitectura

### En CONTROLFILE
- **`firestore-rules/controllaudit.rules`** ⭐ - Copia de `rules/audit.rules` desde ControlAudit
- `firestore-rules/build.js` - Script que combina todas las apps (incluye `'controllaudit.rules'`)
- `firestore.rules` - Archivo final generado y desplegado

**Flujo:**
```
ControlAudit/rules/audit.rules 
    ↓ (copiar)
CONTROLFILE/firestore-rules/controllaudit.rules
    ↓ (build.js combina)
CONTROLFILE/firestore.rules
    ↓ (desplegar)
Firestore (producción)
```

## 🔄 Checklist para Actualizar Reglas

- [ ] Editar `rules/audit.rules` en ControlAudit (archivo fuente)
- [ ] Probar localmente (opcional, con emulator)
- [ ] Copiar `rules/audit.rules` → CONTROLFILE: `firestore-rules/controllaudit.rules`
  - ⚠️ **Nombre importante**: Debe llamarse `controllaudit.rules` (no `audit.rules`)
- [ ] Verificar que CONTROLFILE `build.js` incluye `'controllaudit.rules'` en el array
- [ ] Desde CONTROLFILE: `npm run build:rules`
- [ ] Verificar que `firestore.rules` generado incluye los cambios de ControlAudit
- [ ] Desde CONTROLFILE: `firebase deploy --only firestore:rules`
- [ ] Verificar despliegue exitoso
- [ ] Probar en producción después de 1-2 minutos

## 📝 Notas Importantes

1. **Rutas de Usuarios**: Siempre usar `/apps/auditoria/users/{uid}` para perfiles de usuario
2. **Consistencia**: Las reglas en `firestore.rules` (raíz) deben estar sincronizadas con `rules/audit.rules`
3. **Despliegue**: Solo CONTROLFILE despliega, este proyecto solo desarrolla
4. **Testing**: Se puede probar localmente, pero el despliegue siempre desde CONTROLFILE

## 🎯 Próximos Pasos

- [ ] Migrar todas las referencias de `/usuarios/` a `/apps/auditoria/users/` en `firestore.rules`
- [ ] Sincronizar `base.rules` con CONTROLFILE si existe
- [ ] Documentar proceso de migración completo
- [ ] Crear script de sincronización automática (opcional)

