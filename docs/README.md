# 📚 Índice de Documentación - ControlAudit v2

Este directorio contiene toda la documentación técnica del proyecto organizada por categorías.

---

## 🗂️ **Estructura de Documentación**

### **📖 Documentación Principal (Raíz)**
- **[../README.md](../README.md)** - Documentación principal del proyecto (empezar aquí)
- **[../DOCUMENTACION_CONSOLIDADA.md](../DOCUMENTACION_CONSOLIDADA.md)** - Documentación técnica completa y detallada

---

## 📁 **Documentación por Categorías**

### **🔧 Guías de Configuración** (`guias/`)

Guías paso a paso para configurar y desplegar el sistema:

- **[CONFIGURAR_FIRESTORE.md](./guias/CONFIGURAR_FIRESTORE.md)** - Configuración de Firestore
- **[CAPACITOR_SETUP.md](./guias/CAPACITOR_SETUP.md)** - Configuración de app móvil con Capacitor
- **[COMANDOS_NPM.md](./guias/COMANDOS_NPM.md)** - Comandos NPM disponibles
- **[GUIA_DESPLIEGUE_VERCEL.md](./guias/GUIA_DESPLIEGUE_VERCEL.md)** - Despliegue en Vercel paso a paso

---

### **🔗 Integraciones** (`integraciones/`)

Documentación sobre integraciones con servicios externos:

- **[CONTROLFILE_INTEGRATION.md](./integraciones/CONTROLFILE_INTEGRATION.md)** - Guía completa de integración con ControlFile
- **[CONTROLFILE_SETUP.md](./integraciones/CONTROLFILE_SETUP.md)** - Guía rápida de configuración ControlFile

---

### **🏗️ Arquitectura y Estructura** (`arquitectura/`)

Documentación técnica sobre la arquitectura del sistema:

- **[ARQUITECTURA_HIBRIDA.md](./arquitectura/ARQUITECTURA_HIBRIDA.md)** - Arquitectura híbrida de datos (listeners + cache)
- **[FIRESTORE_STRUCTURE.md](./arquitectura/FIRESTORE_STRUCTURE.md)** - Estructura de colecciones de Firestore
- **[INDICES_FIRESTORE.md](./arquitectura/INDICES_FIRESTORE.md)** - Índices necesarios en Firebase
- **[README_COMPONENTES_REUTILIZABLES.md](./arquitectura/README_COMPONENTES_REUTILIZABLES.md)** - Componentes y hooks reutilizables

---

### **⚙️ Implementaciones** (`implementaciones/`)

Documentación sobre implementaciones específicas:

- **[IMPLEMENTACION_OFFLINE_FINAL.md](./implementaciones/IMPLEMENTACION_OFFLINE_FINAL.md)** - Implementación completa del sistema offline
- **[PWA_OFFLINE_SOLUCION_FINAL.md](./implementaciones/PWA_OFFLINE_SOLUCION_FINAL.md)** - Solución final PWA offline
- **[MEJORES_PRACTICAS_PWA_OFFLINE.md](./implementaciones/MEJORES_PRACTICAS_PWA_OFFLINE.md)** - Mejores prácticas para PWA offline

---

### **👥 Guías de Usuario** (`guias-usuario/`)

Documentación para usuarios finales del sistema:

- **[GUIA_USUARIO_SISTEMA.md](./guias-usuario/GUIA_USUARIO_SISTEMA.md)** - Guía de uso del sistema para usuarios finales
- **[INSTRUCCIONES_PRUEBA.md](./guias-usuario/INSTRUCCIONES_PRUEBA.md)** - Instrucciones para pruebas del sistema

---

### **📋 Archivos Históricos** (`archivos-historicos/`)

Documentación histórica y resúmenes de sesiones pasadas:

- **[README.md](./archivos-historicos/README.md)** - Índice de archivos históricos
- **[RESUMEN_CAMBIOS_HISTORICOS.md](./archivos-historicos/RESUMEN_CAMBIOS_HISTORICOS.md)** - ⭐ **RECOMENDADO** - Resumen consolidado de todos los cambios históricos
- **[SESION_REFACTOR_COMPLETA.md](./archivos-historicos/SESION_REFACTOR_COMPLETA.md)** - Resumen de sesión de refactorización (detalle)
- **[RESUMEN_IMPLEMENTACION.md](./archivos-historicos/RESUMEN_IMPLEMENTACION.md)** - Resumen de implementación de empleados/capacitaciones (detalle)
- **[RESUMEN_CAMBIOS_PWA.md](./archivos-historicos/RESUMEN_CAMBIOS_PWA.md)** - Resumen de cambios PWA (detalle)
- **[TABLA_SUCURSALES_NUEVA.md](./archivos-historicos/TABLA_SUCURSALES_NUEVA.md)** - Cambios en tabla de sucursales (detalle)

---

### **🔍 Documentación de Funcionalidades** (`funcionalidades/`)

Documentación de funcionalidades específicas:

- **[NUEVO_GRAFICO_TORTA.md](./funcionalidades/NUEVO_GRAFICO_TORTA.md)** - Nuevo gráfico de torta
- **[SISTEMA_ACCIDENTES_INCIDENTES.md](./funcionalidades/SISTEMA_ACCIDENTES_INCIDENTES.md)** - Sistema de accidentes e incidentes

---

### **🛠️ Soluciones y Troubleshooting** (`soluciones/`)

Soluciones a problemas comunes:

- **[reportes/SOLUCION_GRAFICOS_PDF.md](./soluciones/reportes/SOLUCION_GRAFICOS_PDF.md)** - Solución de gráficos en PDF
- **[reportes/SOLUCION_PDF_MOVIL.md](./soluciones/reportes/SOLUCION_PDF_MOVIL.md)** - Solución de PDF en móvil

---

### **📱 Documentación por Módulo**

#### **Dashboard de Seguridad**
- **[../src/components/dashboard-seguridad/README.md](../src/components/dashboard-seguridad/README.md)** - Documentación del dashboard de seguridad
- **[../src/components/dashboard-seguridad/DASHBOARD_V2.md](../src/components/dashboard-seguridad/DASHBOARD_V2.md)** - Cambios y mejoras del dashboard v2
- **[../src/components/dashboard-seguridad/DATOS_REALES.md](../src/components/dashboard-seguridad/DATOS_REALES.md)** - Implementación de datos reales

#### **Sistema de Auditorías**
- **[../src/components/pages/auditoria/auditoria/README_NAVEGACION_GUARDADA.md](../src/components/pages/auditoria/auditoria/README_NAVEGACION_GUARDADA.md)** - Sistema de navegación guardada y autoguardado

#### **ControlFile**
- **[../controlfile/api-externa/README.md](../controlfile/api-externa/README.md)** - API externa de ControlFile
- **[../controlfile/app-firestore-separado/README.md](../controlfile/app-firestore-separado/README.md)** - App Firestore separado

---

## 🎯 **Por Dónde Empezar**

### **Para Nuevos Desarrolladores**
1. Leer **[README.md](../README.md)** - Visión general del proyecto
2. Revisar **[DOCUMENTACION_CONSOLIDADA.md](../DOCUMENTACION_CONSOLIDADA.md)** - Documentación técnica completa
3. Configurar entorno con **[guias/CONFIGURAR_FIRESTORE.md](./guias/CONFIGURAR_FIRESTORE.md)**
4. Revisar **[arquitectura/README_COMPONENTES_REUTILIZABLES.md](./arquitectura/README_COMPONENTES_REUTILIZABLES.md)** - Componentes disponibles

### **Para Usuarios Finales**
1. Leer **[guias-usuario/GUIA_USUARIO_SISTEMA.md](./guias-usuario/GUIA_USUARIO_SISTEMA.md)** - Guía de uso completa

### **Para Despliegue**
1. Revisar **[guias/GUIA_DESPLIEGUE_VERCEL.md](./guias/GUIA_DESPLIEGUE_VERCEL.md)**
2. Configurar variables de entorno
3. Revisar **[arquitectura/INDICES_FIRESTORE.md](./arquitectura/INDICES_FIRESTORE.md)** - Crear índices necesarios

### **Para Integraciones**
1. Revisar **[integraciones/CONTROLFILE_INTEGRATION.md](./integraciones/CONTROLFILE_INTEGRATION.md)** - Integración con ControlFile

---

## 📌 **Notas Importantes**

- **Última actualización**: 2024
- **Versión del sistema**: 2.0.0
- **Estado**: Producción ✅

---

## 🔄 **Mantenimiento de Documentación**

### **Principios**
- ✅ **Un solo lugar**: Toda la documentación técnica en `DOCUMENTACION_CONSOLIDADA.md`
- ✅ **Sin duplicados**: Evitar crear múltiples archivos para el mismo tema
- ✅ **Actualización**: Modificar archivos existentes en lugar de crear nuevos
- ✅ **Organización**: Mantener archivos organizados por categorías en `docs/`
- ✅ **Histórico consolidado**: Usar `RESUMEN_CAMBIOS_HISTORICOS.md` como referencia principal

### **Cuándo Crear Documentación**
- ✅ Sistemas importantes: Nuevas funcionalidades críticas
- ✅ Arquitectura: Cambios en la estructura del sistema
- ✅ Seguridad: Implementaciones de seguridad relevantes
- ✅ Integración: Nuevos servicios o APIs externas

### **Cuándo NO Crear Documentación**
- ❌ Correcciones menores: Bugs simples o ajustes de UI
- ❌ Funcionalidades pequeñas: Mejoras menores sin impacto arquitectural
- ❌ Duplicados: Información que ya existe en otro lugar

### **Dónde Colocar Documentación**
- **Raíz**: Solo `README.md` y `DOCUMENTACION_CONSOLIDADA.md`
- **docs/guias/**: Guías de configuración y despliegue
- **docs/integraciones/**: Documentación de integraciones
- **docs/arquitectura/**: Documentación técnica de arquitectura
- **docs/implementaciones/**: Documentación de implementaciones específicas
- **docs/guias-usuario/**: Guías para usuarios finales
- **docs/archivos-historicos/**: Documentación histórica
- **docs/funcionalidades/**: Documentación de funcionalidades específicas
- **docs/soluciones/**: Soluciones a problemas comunes

---

**¿Necesitas ayuda?** Revisa la documentación correspondiente o consulta el código fuente con comentarios detallados.
