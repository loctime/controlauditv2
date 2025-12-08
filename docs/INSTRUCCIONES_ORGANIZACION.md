# 📋 Instrucciones para Organizar Documentación

## 🎯 **Objetivo**

Mover todos los archivos `.md` de la raíz del proyecto (excepto `README.md` y `DOCUMENTACION_CONSOLIDADA.md`) a sus carpetas correspondientes en `docs/`.

---

## 🚀 **Método 1: Usar el Script PowerShell (Recomendado)**

### **Ejecutar el Script:**

```powershell
# Desde la raíz del proyecto
.\mover-docs.ps1
```

Si el script no existe, créalo con este contenido:

```powershell
# mover-docs.ps1
$archivos = @{
    "CONFIGURAR_FIRESTORE.md" = "docs\guias"
    "CAPACITOR_SETUP.md" = "docs\guias"
    "COMANDOS_NPM.md" = "docs\guias"
    "GUIA_DESPLIEGUE_VERCEL.md" = "docs\guias"
    "CONTROLFILE_INTEGRATION.md" = "docs\integraciones"
    "CONTROLFILE_SETUP.md" = "docs\integraciones"
    "ARQUITECTURA_HIBRIDA.md" = "docs\arquitectura"
    "FIRESTORE_STRUCTURE.md" = "docs\arquitectura"
    "INDICES_FIRESTORE.md" = "docs\arquitectura"
    "README_COMPONENTES_REUTILIZABLES.md" = "docs\arquitectura"
    "IMPLEMENTACION_OFFLINE_FINAL.md" = "docs\implementaciones"
    "PWA_OFFLINE_SOLUCION_FINAL.md" = "docs\implementaciones"
    "MEJORES_PRACTICAS_PWA_OFFLINE.md" = "docs\implementaciones"
    "GUIA_USUARIO_SISTEMA.md" = "docs\guias-usuario"
    "INSTRUCCIONES_PRUEBA.md" = "docs\guias-usuario"
    "SESION_REFACTOR_COMPLETA.md" = "docs\archivos-historicos"
    "RESUMEN_IMPLEMENTACION.md" = "docs\archivos-historicos"
    "RESUMEN_CAMBIOS_PWA.md" = "docs\archivos-historicos"
    "TABLA_SUCURSALES_NUEVA.md" = "docs\archivos-historicos"
}

foreach ($archivo in $archivos.Keys) {
    if (Test-Path $archivo) {
        $destino = Join-Path $archivos[$archivo] $archivo
        Copy-Item $archivo $destino -Force
        Remove-Item $archivo -Force
        Write-Host "Movido: $archivo"
    }
}
```

---

## 🖱️ **Método 2: Mover Manualmente**

### **Paso 1: Crear Carpetas (si no existen)**

```powershell
New-Item -ItemType Directory -Force -Path "docs\guias", "docs\integraciones", "docs\arquitectura", "docs\implementaciones", "docs\guias-usuario", "docs\archivos-historicos"
```

### **Paso 2: Mover Archivos**

Arrastra y suelta los archivos desde la raíz a sus carpetas correspondientes:

#### **A `docs/guias/`:**
- `CONFIGURAR_FIRESTORE.md`
- `CAPACITOR_SETUP.md`
- `COMANDOS_NPM.md`
- `GUIA_DESPLIEGUE_VERCEL.md`

#### **A `docs/integraciones/`:**
- `CONTROLFILE_INTEGRATION.md`
- `CONTROLFILE_SETUP.md`

#### **A `docs/arquitectura/`:**
- `ARQUITECTURA_HIBRIDA.md`
- `FIRESTORE_STRUCTURE.md`
- `INDICES_FIRESTORE.md`
- `README_COMPONENTES_REUTILIZABLES.md`

#### **A `docs/implementaciones/`:**
- `IMPLEMENTACION_OFFLINE_FINAL.md`
- `PWA_OFFLINE_SOLUCION_FINAL.md`
- `MEJORES_PRACTICAS_PWA_OFFLINE.md`

#### **A `docs/guias-usuario/`:**
- `GUIA_USUARIO_SISTEMA.md`
- `INSTRUCCIONES_PRUEBA.md`

#### **A `docs/archivos-historicos/`:**
- `SESION_REFACTOR_COMPLETA.md`
- `RESUMEN_IMPLEMENTACION.md`
- `RESUMEN_CAMBIOS_PWA.md`
- `TABLA_SUCURSALES_NUEVA.md`

---

## ✅ **Verificación Final**

Después de mover los archivos, en la raíz solo deben quedar:

- ✅ `README.md`
- ✅ `DOCUMENTACION_CONSOLIDADA.md`

---

## 📚 **Estructura Final Esperada**

```
controlauditv2/
├── README.md                    # ✅ Permanece
├── DOCUMENTACION_CONSOLIDADA.md # ✅ Permanece
└── docs/
    ├── README.md
    ├── guias/
    │   ├── CONFIGURAR_FIRESTORE.md
    │   ├── CAPACITOR_SETUP.md
    │   ├── COMANDOS_NPM.md
    │   └── GUIA_DESPLIEGUE_VERCEL.md
    ├── integraciones/
    │   ├── CONTROLFILE_INTEGRATION.md
    │   └── CONTROLFILE_SETUP.md
    ├── arquitectura/
    │   ├── ARQUITECTURA_HIBRIDA.md
    │   ├── FIRESTORE_STRUCTURE.md
    │   ├── INDICES_FIRESTORE.md
    │   └── README_COMPONENTES_REUTILIZABLES.md
    ├── implementaciones/
    │   ├── IMPLEMENTACION_OFFLINE_FINAL.md
    │   ├── PWA_OFFLINE_SOLUCION_FINAL.md
    │   └── MEJORES_PRACTICAS_PWA_OFFLINE.md
    ├── guias-usuario/
    │   ├── GUIA_USUARIO_SISTEMA.md
    │   └── INSTRUCCIONES_PRUEBA.md
    └── archivos-historicos/
        ├── README.md
        ├── RESUMEN_CAMBIOS_HISTORICOS.md
        ├── SESION_REFACTOR_COMPLETA.md
        ├── RESUMEN_IMPLEMENTACION.md
        ├── RESUMEN_CAMBIOS_PWA.md
        └── TABLA_SUCURSALES_NUEVA.md
```

---

## 🎉 **Beneficios**

- ✅ Raíz del proyecto más limpia
- ✅ Documentación organizada por categorías
- ✅ Fácil de encontrar información
- ✅ Mejor mantenimiento
- ✅ Sin duplicados ni contradicciones

---

**¡Listo para organizar!** 🚀
