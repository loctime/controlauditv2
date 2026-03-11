import logger from '@/utils/logger';
// src/components/pages/accidentes/components/RegistrarAccidenteInline.jsx
/**
 * Formulario inline para registrar seguimiento de accidente
 * Usa EventRegistryInline base con configuraciÃƒÂ³n especÃƒÂ­fica de accidentes
 */

import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { query, where, getDocs, collection } from 'firebase/firestore';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';
import EventRegistryInline from '../../../shared/event-registry/EventRegistryInline';
import { registrosAccidenteService } from '../../../../services/registrosAccidenteService';
import { obtenerAccidentePorId } from '../../../../services/accidenteService';
import { useAuth } from '@/components/context/AuthContext';
import { MAX_FILE_SIZE } from '@/services/fileValidationPolicy';
/**
 * Componente para registrar seguimiento de accidente
 */
const RegistrarAccidenteInline = ({
  accidenteId,
  accidente: accidenteProp,
  userId,
  ownerId,
  onSaved,
  onCancel,
  compact = false
}) => {
  const { userProfile } = useAuth();
  const tenantOwnerId = ownerId || userProfile?.ownerId || null;
  const [accidente, setAccidente] = useState(accidenteProp || null);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(!accidenteProp);

  useEffect(() => {
    if (tenantOwnerId && accidenteId && !accidenteProp) {
      loadAccidente();
    }
  }, [accidenteId, tenantOwnerId]);

  const loadAccidente = async () => {
    if (!tenantOwnerId) return;

    setLoading(true);
    try {
      const accidenteData = await obtenerAccidentePorId({ ownerId: tenantOwnerId, accidenteId });
      setAccidente(accidenteData);
    } catch (error) {
      logger.error('Error cargando accidente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar empleados de la sucursal del accidente
  useEffect(() => {
    if (accidente && accidente.sucursalId && tenantOwnerId) {
      loadEmpleados();
    }
  }, [accidente?.sucursalId, tenantOwnerId]);

  const loadEmpleados = async () => {
    try {
      const ownerId = tenantOwnerId;
      const empleadosRef = collection(dbAudit, ...firestoreRoutesCore.empleados(ownerId));
      const q = query(
        empleadosRef,
        where('sucursalId', '==', accidente.sucursalId),
        where('estado', '==', 'activo')
      );
      
      const snapshot = await getDocs(q);
      const empleadosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPersonas(empleadosData);
    } catch (error) {
      logger.error('Error cargando empleados:', error);
    }
  };

  if (loading) {
    return null; // EventRegistryInline manejarÃƒÂ¡ el loading
  }

  return (
    <EventRegistryInline
      entityId={accidenteId}
      entityType="accidente"
      userId={userId}
      ownerId={tenantOwnerId}
      actorId={userId}
      entity={accidente}
      registryService={registrosAccidenteService}
      personasConfig={{
        collectionName: 'empleados',
        filterBy: (accidente) => ({
          sucursalId: accidente?.sucursalId,
          estado: 'activo'
        }),
        normalize: (selectedIds) => {
          // Convertir IDs seleccionados a formato esperado por el servicio
          return selectedIds.map(id => {
            const persona = personas.find(p => p.id === id);
            return {
              id: id,
              empleadoId: id,
              empleadoNombre: persona?.nombre || id,
              conReposo: false // Se puede configurar despuÃƒÂ©s si es necesario
            };
          });
        },
        fieldName: 'empleadosInvolucrados'
      }}
      evidenciasConfig={{
        folderName: 'Accidentes',
        maxSize: MAX_FILE_SIZE,
        maxCount: 20
      }}
      fields={[
        {
          id: 'descripcion',
          type: 'text',
          label: 'DescripciÃƒÂ³n del Seguimiento',
          required: true,
          multiline: true,
          rows: 4
        },
        {
          id: 'personas',
          type: 'personas',
          label: 'Empleados Involucrados',
          required: true,
          renderItem: (persona) => (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {persona.nombre || persona.id}
              </Typography>
              {persona.cargo && (
                <Typography variant="caption" color="text.secondary">
                  {persona.cargo} - {persona.area}
                </Typography>
              )}
            </Box>
          )
        },
        {
          id: 'evidencias',
          type: 'evidencias',
          label: 'Evidencias FotogrÃƒÂ¡ficas'
        }
      ]}
      onSaved={onSaved}
      onCancel={onCancel}
      compact={compact}
    />
  );
};

export default RegistrarAccidenteInline;



