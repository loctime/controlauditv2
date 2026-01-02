// src/components/shared/event-registry/example-usage.js
/**
 * EJEMPLO MÍNIMO DE USO DEL NÚCLEO REUTILIZABLE
 * 
 * Este archivo muestra cómo usar el framework base sin implementar
 * un módulo completo. Es solo para validar el patrón.
 * 
 * NO usar en producción - solo referencia
 */

import { createBaseRegistryService } from '@/services/base/baseRegistryService';
import EventDetailPanel from './EventDetailPanel';
import EventRegistryInline from './EventRegistryInline';

/**
 * EJEMPLO 1: Crear servicio de registros para Accidentes
 */
export const ejemploRegistrosAccidenteService = createBaseRegistryService({
  collectionName: 'registrosAccidente',
  entityIdField: 'accidenteId',
  personasField: 'empleadosInvolucrados',
  evidenciasField: 'imagenes',
  
  validatePersonas: (personas) => {
    if (!personas || (Array.isArray(personas) && personas.length === 0)) {
      throw new Error('Debe haber al menos un empleado involucrado');
    }
  },
  
  normalizePersonas: (personas) => {
    // Normalizar IDs a formato: [{ empleadoId, empleadoNombre, conReposo }]
    return personas.map(p => {
      if (typeof p === 'string') {
        return {
          empleadoId: p,
          empleadoNombre: p,
          conReposo: false
        };
      }
      return {
        empleadoId: p.id || p.empleadoId,
        empleadoNombre: p.nombre || p.empleadoNombre || p.id,
        conReposo: p.conReposo || false,
        fechaInicioReposo: p.fechaInicioReposo || null
      };
    });
  },
  
  validateEvidencias: (evidencias) => {
    // Sanitizar evidencias (mismo patrón que registrosAsistencia)
    const camposPermitidos = ['id', 'fileId', 'shareToken', 'nombre', 'createdAt'];
    return evidencias.map(ev => {
      const evidenciaSanitizada = {};
      camposPermitidos.forEach(campo => {
        if (ev[campo] !== undefined) {
          evidenciaSanitizada[campo] = ev[campo];
        }
      });
      if (!evidenciaSanitizada.id && evidenciaSanitizada.fileId) {
        evidenciaSanitizada.id = evidenciaSanitizada.fileId;
      }
      return evidenciaSanitizada;
    });
  }
});

/**
 * EJEMPLO 2: Componente de ejemplo usando el panel
 * 
 * Este componente muestra cómo integrar EventDetailPanel
 * en una página de accidentes (sin implementar completamente)
 */
export function EjemploAccidenteDetailPanel({ accidenteId, userId, onClose }) {
  // Servicio de entidad (debe tener método getById)
  const accidenteService = {
    async getById(userId, id) {
      // Implementación específica del servicio de accidentes
      // Retorna: { id, descripcion, fechaHora, estado, ... }
      return {};
    }
  };

  return (
    <EventDetailPanel
      open={!!accidenteId}
      onClose={onClose}
      entityId={accidenteId}
      initialMode="view"
      userId={userId}
      entityService={accidenteService}
      registryService={ejemploRegistrosAccidenteService}
      renderHeader={(accidente) => (
        <>
          <Typography variant="h5">
            {accidente.descripcion || 'Accidente'}
          </Typography>
          <Chip label={accidente.estado} size="small" />
        </>
      )}
      renderActions={(accidente) => (
        <Button onClick={() => {/* cambiar a modo registrar */}}>
          Registrar Accidente
        </Button>
      )}
      renderRegistryForm={(props) => (
        <EventRegistryInline
          {...props}
          entityType="accidente"
          registryService={ejemploRegistrosAccidenteService}
          personasConfig={{
            collectionName: 'empleados',
            filterBy: (accidente) => ({
              sucursalId: accidente.sucursalId,
              estado: 'activo'
            }),
            normalize: (selectedIds) => {
              return selectedIds.map(id => ({
                empleadoId: id,
                empleadoNombre: id, // En producción, resolver desde empleadosService
                conReposo: false
              }));
            }
          }}
          evidenciasConfig={{
            folderName: 'Accidentes',
            maxSize: 10 * 1024 * 1024,
            maxCount: 20
          }}
          fields={[
            {
              id: 'personas',
              type: 'personas',
              label: 'Empleados Involucrados',
              required: true
            },
            {
              id: 'evidencias',
              type: 'evidencias',
              label: 'Evidencias Fotográficas'
            }
          ]}
        />
      )}
    />
  );
}

/**
 * VALIDACIÓN DEL PATRÓN:
 * 
 * ✅ createBaseRegistryService crea servicios configurables
 * ✅ EventDetailPanel maneja modo view/registrar
 * ✅ EventRegistryInline acepta configuración flexible
 * ✅ Tabs por defecto funcionan con cualquier servicio
 * ✅ RefreshKey permite refrescar sin reload
 * ✅ No depende de Capacitaciones
 * ✅ Puede usarse para Accidentes, Salud Ocupacional, etc.
 */
