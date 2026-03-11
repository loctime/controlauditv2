import logger from '@/utils/logger';
import { useState, useEffect } from 'react';
import EventRegistryInline from '../../../shared/event-registry/EventRegistryInline';
import { registrosAsistenciaServiceAdapter } from '../../../../services/adapters/registrosAsistenciaServiceAdapter';
import { capacitacionService } from '../../../../services/capacitacionService';
import { useAuth } from '../../../../components/context/AuthContext';

const RegistrarAsistenciaInlineV2 = ({
  capacitacionId,
  capacitacion: capacitacionProp,
  userId,
  onSaved,
  onCancel,
  compact = false
}) => {
  const { userProfile } = useAuth();
  const [capacitacion, setCapacitacion] = useState(capacitacionProp || null);
  const [loading, setLoading] = useState(!capacitacionProp);

  useEffect(() => {
    if (!userProfile?.ownerId || !capacitacionId || capacitacionProp) {
      setCapacitacion(capacitacionProp || null);
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadCapacitacion = async () => {
      setLoading(true);
      try {
        const capacitacionData = await capacitacionService.getCapacitacionById(
          userProfile.ownerId,
          capacitacionId,
          false
        );
        if (mounted) {
          setCapacitacion(capacitacionData);
        }
      } catch (error) {
        logger.error('Error cargando capacitacion:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCapacitacion();
    return () => {
      mounted = false;
    };
  }, [capacitacionId, capacitacionProp, userProfile?.ownerId]);

  if (loading) {
    return null;
  }

  return (
    <EventRegistryInline
      entityId={capacitacionId}
      entityType="capacitacion"
      userId={userId}
      entity={capacitacion}
      registryService={registrosAsistenciaServiceAdapter}
      personasConfig={{
        collectionName: 'empleados',
        filterBy: (capacitacionEntity) => ({
          sucursalId: capacitacionEntity?.sucursalId,
          estado: 'activo'
        }),
        normalize: (selectedIds) => selectedIds,
        fieldName: 'empleadoIds'
      }}
      evidenciasConfig={{
        folderName: 'Capacitaciones',
        maxCount: 20
      }}
      fields={[
        {
          id: 'personas',
          type: 'personas',
          label: 'Empleados Asistentes',
          required: true
        },
        {
          id: 'evidencias',
          type: 'evidencias',
          label: 'Evidencias Fotograficas'
        }
      ]}
      onSaved={onSaved}
      onCancel={onCancel}
      compact={compact}
    />
  );
};

export default RegistrarAsistenciaInlineV2;
