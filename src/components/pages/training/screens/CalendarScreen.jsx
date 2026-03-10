import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { empleadoService } from '../../../../services/empleadoService';
import { trainingCatalogService, trainingSessionService } from '../../../../services/training';
import { getUsers } from '../../../../core/services/ownerUserService';
import TrainingCalendarView from '../components/calendar/TrainingCalendarView';

function personDisplayName(person) {
  if (!person) return '';
  if (person.displayName) return person.displayName;
  if (person.nombreCompleto) return person.nombreCompleto;
  if (person.apellido && person.nombre) return `${person.apellido}, ${person.nombre}`;
  return person.nombre || person.email || '';
}

export default function CalendarScreen() {
  const { userProfile, userSucursales = [], userEmpresas = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);

  const branchMap = useMemo(
    () => Object.fromEntries(userSucursales.map((branch) => [branch.id, branch])),
    [userSucursales]
  );

  const companyMap = useMemo(
    () => Object.fromEntries(userEmpresas.map((company) => [company.id, company])),
    [userEmpresas]
  );

  useEffect(() => {
    const load = async () => {
      if (!ownerId) return;
      setLoading(true);
      setError('');
      try {
        const branchIds = userSucursales.map((branch) => branch.id);
        const [result, catalogItems, usersList, employeesList] = await Promise.all([
          trainingSessionService.listSessions(ownerId),
          trainingCatalogService.listAll(ownerId),
          getUsers(ownerId).catch(() => []),
          branchIds.length > 0 ? empleadoService.getEmpleadosBySucursales(ownerId, branchIds).catch(() => []) : Promise.resolve([])
        ]);

        const catalogMap = Object.fromEntries((catalogItems || []).map((item) => [item.id, item]));
        const instructorMap = {
          ...Object.fromEntries((usersList || []).map((user) => [user.id, personDisplayName(user) || user.email || 'Sin dato'])),
          ...Object.fromEntries((employeesList || []).map((employee) => [employee.id, personDisplayName(employee) || employee.email || 'Sin dato']))
        };

        setSessions(
          (result || []).map((session) => {
            const branch = branchMap[session.branchId];
            return {
              ...session,
              trainingTypeName: catalogMap[session.trainingTypeId]?.name || 'Sin dato',
              branchName: branch?.nombre || 'Sin dato',
              companyName:
                companyMap[session.companyId]?.nombre ||
                branch?.empresaNombre ||
                'Sin dato',
              instructorName: instructorMap[session.instructorId] || 'Sin asignar'
            };
          })
        );
      } catch (err) {
        setError(err.message || 'No se pudo cargar el calendario de capacitacion.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ownerId, userSucursales, userEmpresas, branchMap, companyMap]);

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de owner disponible para el calendario.</Alert>;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TrainingCalendarView sessions={sessions} />
    </Box>
  );
}
