# Event Registry - Framework Interno

Framework reutilizable para gestión de eventos con registros asociados.

## Componentes Base

### 1. `createBaseRegistryService`
Factory para crear servicios de registros genéricos.

### 2. `EventDetailPanel`
Panel de detalles genérico con tabs configurables.

### 3. `EventRegistryInline`
Formulario inline para registrar eventos.

## Ejemplo de Uso Mínimo

```javascript
// 1. Crear servicio de registros
import { createBaseRegistryService } from '@/services/base/baseRegistryService';

const registrosAccidenteService = createBaseRegistryService({
  collectionName: 'registrosAccidente',
  entityIdField: 'accidenteId',
  personasField: 'empleadosInvolucrados',
  evidenciasField: 'imagenes',
  validatePersonas: (personas) => {
    if (!personas || personas.length === 0) {
      throw new Error('Debe haber al menos un empleado involucrado');
    }
  },
  normalizePersonas: (personas) => {
    // Normalizar a formato: [{ empleadoId, empleadoNombre, conReposo }]
    return personas.map(p => ({
      empleadoId: typeof p === 'string' ? p : p.id,
      empleadoNombre: p.nombre || p.id,
      conReposo: p.conReposo || false
    }));
  },
  validateEvidencias: (evidencias) => {
    // Sanitizar evidencias
    return evidencias.map(ev => ({
      id: ev.fileId || ev.id,
      shareToken: ev.shareToken,
      nombre: ev.nombre || 'evidencia',
      createdAt: ev.createdAt
    }));
  }
});

// 2. Usar en componente
import EventDetailPanel from '@/components/shared/event-registry/EventDetailPanel';
import EventRegistryInline from '@/components/shared/event-registry/EventRegistryInline';

function AccidentesPage() {
  const [selectedAccidenteId, setSelectedAccidenteId] = useState(null);
  const [panelMode, setPanelMode] = useState('view');

  return (
    <>
      {/* Tu tabla de accidentes aquí */}
      
      <EventDetailPanel
        open={!!selectedAccidenteId}
        onClose={() => setSelectedAccidenteId(null)}
        entityId={selectedAccidenteId}
        initialMode={panelMode}
        userId={userProfile.uid}
        entityService={accidenteService} // { getById: (userId, id) => Promise }
        registryService={registrosAccidenteService}
        renderHeader={(accidente) => (
          <Typography variant="h5">{accidente.descripcion}</Typography>
        )}
        renderActions={(accidente) => (
          <Button onClick={() => setPanelMode('registrar')}>
            Registrar Accidente
          </Button>
        )}
        renderRegistryForm={(props) => (
          <EventRegistryInline
            {...props}
            entityType="accidente"
            registryService={registrosAccidenteService}
            personasConfig={{
              collectionName: 'empleados',
              filterBy: (accidente) => ({
                sucursalId: accidente.sucursalId,
                estado: 'activo'
              }),
              normalize: (selectedIds) => {
                // Convertir IDs a formato esperado
                return selectedIds.map(id => ({
                  empleadoId: id,
                  empleadoNombre: personas.find(p => p.id === id)?.nombre || id,
                  conReposo: false // Se puede configurar después
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
                id: 'descripcion',
                type: 'text',
                label: 'Descripción del Accidente',
                required: true,
                multiline: true,
                rows: 4
              },
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
    </>
  );
}
```

## Contratos

Ver documentación en cada archivo para detalles de props y métodos.
