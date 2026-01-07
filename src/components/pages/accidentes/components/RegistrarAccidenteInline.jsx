// src/components/pages/accidentes/components/RegistrarAccidenteInline.jsx
/**
 * Formulario inline para registrar seguimiento de accidente
 * Usa EventRegistryInline base con configuración específica de accidentes
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { query, where, getDocs, collection } from 'firebase/firestore';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';
import EventRegistryInline from '../../../shared/event-registry/EventRegistryInline';
import { registrosAccidenteService } from '../../../../services/registrosAccidenteService';
import { obtenerAccidentePorId } from '../../../../services/accidenteService';
import { useAuth } from '@/components/context/AuthContext';

/**
 * Componente para registrar seguimiento de accidente
 */
const RegistrarAccidenteInline = ({
  accidenteId,
  accidente: accidenteProp,
  userId,
  onSaved,
  onCancel,
  compact = false
}) => {
  const { userProfile } = useAuth();
  const [accidente, setAccidente] = useState(accidenteProp || null);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(!accidenteProp);

  useEffect(() => {
    if (userId && accidenteId && !accidenteProp) {
      loadAccidente();
    }
  }, [accidenteId, userId]);

  const loadAccidente = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const userProfile = { uid: userId };
      const accidenteData = await obtenerAccidentePorId(accidenteId, userProfile);
      setAccidente(accidenteData);
    } catch (error) {
      console.error('Error cargando accidente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar empleados de la sucursal del accidente
  useEffect(() => {
    if (accidente && accidente.sucursalId && userProfile?.ownerId) {
      loadEmpleados();
    }
  }, [accidente?.sucursalId, userProfile?.ownerId]);

  const loadEmpleados = async () => {
    try {
      if (!userProfile?.ownerId) {
        console.error('Error: ownerId no disponible');
        return;
      }
      const ownerId = userProfile.ownerId;
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
      console.error('Error cargando empleados:', error);
    }
  };

  if (loading) {
    return null; // EventRegistryInline manejará el loading
  }

  return (
    <EventRegistryInline
      entityId={accidenteId}
      entityType="accidente"
      userId={userId}
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
              conReposo: false // Se puede configurar después si es necesario
            };
          });
        },
        fieldName: 'empleadosInvolucrados'
      }}
      evidenciasConfig={{
        folderName: 'Accidentes',
        maxSize: 10 * 1024 * 1024, // 10MB
        maxCount: 20
      }}
      fields={[
        {
          id: 'descripcion',
          type: 'text',
          label: 'Descripción del Seguimiento',
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
          label: 'Evidencias Fotográficas'
        }
      ]}
      onSaved={onSaved}
      onCancel={onCancel}
      compact={compact}
    />
  );
};

export default RegistrarAccidenteInline;
