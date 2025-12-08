# 📁 Organización de Documentación

## ✅ **Estado Actual**

La documentación ha sido organizada en carpetas por categorías para facilitar la navegación y el mantenimiento.

## 📂 **Estructura de Carpetas**

```
docs/
├── README.md                          # Índice principal de documentación
├── guias/                             # Guías de configuración
│   ├── CONFIGURAR_FIRESTORE.md       ✅ Movido
│   ├── CAPACITOR_SETUP.md
│   ├── COMANDOS_NPM.md
│   └── GUIA_DESPLIEGUE_VERCEL.md
├── integraciones/                     # Integraciones externas
│   ├── CONTROLFILE_INTEGRATION.md
│   └── CONTROLFILE_SETUP.md
├── arquitectura/                      # Arquitectura y estructura
│   ├── ARQUITECTURA_HIBRIDA.md
│   ├── FIRESTORE_STRUCTURE.md
│   ├── INDICES_FIRESTORE.md
│   └── README_COMPONENTES_REUTILIZABLES.md
├── implementaciones/                  # Implementaciones específicas
│   ├── IMPLEMENTACION_OFFLINE_FINAL.md
│   ├── PWA_OFFLINE_SOLUCION_FINAL.md
│   └── MEJORES_PRACTICAS_PWA_OFFLINE.md
├── guias-usuario/                     # Guías para usuarios finales
│   ├── GUIA_USUARIO_SISTEMA.md
│   └── INSTRUCCIONES_PRUEBA.md
├── archivos-historicos/               # Documentación histórica
│   ├── SESION_REFACTOR_COMPLETA.md
│   ├── RESUMEN_IMPLEMENTACION.md
│   ├── RESUMEN_CAMBIOS_PWA.md
│   └── TABLA_SUCURSALES_NUEVA.md
├── funcionalidades/                   # Funcionalidades específicas
│   ├── NUEVO_GRAFICO_TORTA.md
│   └── SISTEMA_ACCIDENTES_INCIDENTES.md
└── soluciones/                        # Soluciones a problemas
    └── reportes/
        ├── SOLUCION_GRAFICOS_PDF.md
        └── SOLUCION_PDF_MOVIL.md
```

## 📋 **Archivos en la Raíz (Solo estos deben quedarse)**

- ✅ `README.md` - Documentación principal
- ✅ `DOCUMENTACION_CONSOLIDADA.md` - Documentación técnica completa

## 🔄 **Para Completar la Organización**

Si aún hay archivos .md en la raíz (excepto README.md y DOCUMENTACION_CONSOLIDADA.md), ejecuta:

```powershell
# En PowerShell desde la raíz del proyecto
.\mover-docs.ps1
```

O mueve manualmente según el mapeo anterior.

## 📝 **Notas**

- Todos los enlaces en README.md y docs/README.md han sido actualizados
- La estructura facilita encontrar documentación por categoría
- Los archivos históricos están separados para mantener la raíz limpia
