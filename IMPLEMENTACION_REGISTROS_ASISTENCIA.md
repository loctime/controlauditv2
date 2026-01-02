# Implementación: Registros de Asistencia

## ✅ Completado

### 1. Estructura de Datos + Índices
- ✅ Documentación completa en `REGISTROS_ASISTENCIA_ESTRUCTURA.md`
- ✅ Índices agregados a `firestore.indexes.json`
- ✅ Modelo de datos definido con `registrosAsistencia` como fuente de verdad

### 2. Script de Migración
- ✅ Script creado: `scripts/migrate-registros-asistencia.js`
- ✅ Migra `capacitacion.registroAsistencia` existente a nueva colección
- ✅ Detecta registros ya migrados para evitar duplicados

### 3. Servicios Nuevos
- ✅ `registrosAsistenciaService.js` creado con métodos completos:
  - `crearRegistro()` - Crear nuevo registro
  - `getRegistrosByCapacitacion()` - Obtener registros de una capacitación
  - `getRegistrosByEmpleado()` - Obtener registros de un empleado
  - `getEmpleadosUnicosByCapacitacion()` - Calcular empleados únicos
  - `getImagenesByCapacitacion()` - Obtener todas las imágenes
  - `getImagenesByEmpleado()` - Obtener imágenes de un empleado específico
  - `updateRegistro()` - Actualizar registro
  - `deleteRegistro()` - Eliminar registro

### 4. Actualización de Servicios Existentes
- ✅ `capacitacionService.js` actualizado:
  - Método `registrarAsistencia()` ahora usa `registrosAsistenciaService`
  - Nuevo método `getEmpleadosByCapacitacion()` calcula dinámicamente
  - Nuevo método `getRegistrosAsistencia()` para obtener registros
  - Compatibilidad legacy mantenida con `capacitacion.empleados` (solo lectura)

### 5. Actualización UI
- ✅ `RegistrarAsistencia.jsx` actualizado:
  - Carga empleados desde `registrosAsistencia` (nuevo)
  - Mantiene compatibilidad con datos legacy
  - Guarda usando `registrosAsistenciaService.crearRegistro()`
  - Carga imágenes desde todos los registros

## ⚠️ Conflictos Potenciales con Datos Actuales

### 1. Datos Existentes
- **Problema**: Las capacitaciones existentes tienen `registroAsistencia` dentro del documento
- **Solución**: Ejecutar script de migración antes de usar el nuevo sistema
- **Impacto**: Sin migración, los datos antiguos no se verán en la nueva UI

### 2. Campo `capacitacion.empleados`
- **Problema**: Código legacy puede esperar que `capacitacion.empleados` esté actualizado
- **Solución**: 
  - Se mantiene para lectura legacy
  - Los nuevos registros NO actualizan este campo
  - Se calcula dinámicamente cuando se necesita
- **Impacto**: Código que lee `capacitacion.empleados` seguirá funcionando, pero puede estar desactualizado

### 3. Queries Existentes
- **Problema**: Queries que filtran por `capacitacion.empleados` pueden no funcionar correctamente
- **Solución**: Actualizar queries para usar `registrosAsistenciaService.getEmpleadosByCapacitacion()`
- **Impacto**: Bajo, solo afecta queries específicas

## 📋 Próximos Pasos

### Antes de Usar en Producción:

1. **Ejecutar Migración:**
   ```bash
   node scripts/migrate-registros-asistencia.js [userId]
   ```

2. **Verificar Índices:**
   - Los índices se crearán automáticamente cuando se ejecuten las queries
   - O crear manualmente en Firebase Console

3. **Actualizar Componentes UI:**
   - Crear `CapacitacionesTable.jsx` (tabla principal)
   - Crear `CapacitacionDetailPanel.jsx` (panel de detalle)
   - Crear `AsistenciaEmpleadosList.jsx` (lista de empleados)
   - Crear `ImagenesGaleria.jsx` (galería con descarga)
   - Crear `CapacitacionActions.jsx` (acciones según estado)

4. **Testing:**
   - Probar creación de nuevos registros
   - Verificar carga de datos legacy
   - Probar cálculo dinámico de empleados
   - Verificar asociación de imágenes con empleados

## 🔄 Compatibilidad Legacy

- ✅ `capacitacion.empleados` se mantiene para lectura
- ✅ `capacitacion.registroAsistencia` se mantiene para lectura
- ✅ Nuevos registros se guardan en `registrosAsistencia`
- ✅ Cálculo dinámico de empleados desde registros
- ⚠️ Código que escribe en `capacitacion.empleados` debe actualizarse

## 📝 Notas Importantes

1. **Single Source of Truth**: `registrosAsistencia` es ahora la única fuente de verdad para empleados e imágenes
2. **Múltiples Registros**: Una capacitación puede tener múltiples registros de asistencia
3. **Asociación Empleado-Imagen**: Cada imagen está asociada a los empleados del registro donde se subió
4. **Auditoría**: Cada registro tiene timestamp y usuario que lo creó
