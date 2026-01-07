// src/components/pages/capacitaciones/components/RegistrarAsistenciaInlineV2.jsx
/**
 * Formulario inline para registrar asistencia usando EventRegistryInline base
 * 
 * Esta es la versión migrada que usa el núcleo reutilizable.
 * Mantiene compatibilidad con la API del componente original.
 */

import React, { useState, useEffect } from 'react';
import { query, where, getDocs } from 'firebase/firestore';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';
import EventRegistryInline from '../../../shared/event-registry/EventRegistryInline';
import { registrosAsistenciaServiceAdapter } from '../../../../services/adapters/registrosAsistenciaServiceAdapter';
import { capacitacionService } from '../../../../services/capacitacionService';

/**
 * Componente para registrar asistencia (versión migrada)
 */
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
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(!capacitacionProp);

  useEffect(() => {
    if (userProfile?.ownerId && capacitacionId && !capacitacionProp) {
      loadCapacitacion();
    }
  }, [capacitacionId, userProfile?.ownerId]);

  const loadCapacitacion = async () => {
    if (!userProfile?.ownerId) return;

    setLoading(true);
    try {
      const capacitacionData = await capacitacionService.getCapacitacionById(
        userProfile.ownerId,
        capacitacionId,
        false
      );
      setCapacitacion(capacitacionData);
    } catch (error) {
      console.error('Error cargando capacitación:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar empleados de la sucursal de la capacitación
  useEffect(() => {
    if (capacitacion && capacitacion.sucursalId && userProfile?.ownerId) {
      loadEmpleados();
    }
  }, [capacitacion?.sucursalId, userProfile?.ownerId]);

  const loadEmpleados = async () => {
    if (!userProfile?.ownerId) return;
    try {
      const ownerId = userProfile.ownerId;
      const empleadosRef = collection(dbAudit, ...firestoreRoutesCore.empleados(ownerId));
      const q = query(
        empleadosRef,
        where('sucursalId', '==', capacitacion.sucursalId),
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
      entityId={capacitacionId}
      entityType="capacitacion"
      userId={userId}
      entity={capacitacion}
      registryService={registrosAsistenciaServiceAdapter}
      personasConfig={{
        collectionName: 'empleados',
        filterBy: (capacitacion) => ({
          sucursalId: capacitacion?.sucursalId,
          estado: 'activo'
        }),
        normalize: (selectedIds) => {
          // Mantener como strings para compatibilidad con el servicio actual
          return selectedIds;
        },
        fieldName: 'empleadoIds'
      }}
      evidenciasConfig={{
        folderName: 'Capacitaciones',
        maxSize: 10 * 1024 * 1024, // 10MB
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
          label: 'Evidencias Fotográficas'
        }
      ]}
      onSaved={onSaved}
      onCancel={onCancel}
      compact={compact}
    />
  );
};

export default RegistrarAsistenciaInlineV2;
