import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { empleadoService } from '../../../../services/empleadoService';
import { employeeTrainingRecordService } from '../../../../services/training';
import PeopleTrainingHistoryView from '../components/people/PeopleTrainingHistoryView';

export default function PeopleScreen() {
  const { userProfile, userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const loadEmployees = async () => {
      if (!ownerId) return;
      setLoadingEmployees(true);
      setError('');
      try {
        const sucursalIds = userSucursales.map((sucursal) => sucursal.id);
        const list = await empleadoService.getEmpleadosBySucursales(ownerId, sucursalIds);
        setEmployees(list);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los empleados.');
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [ownerId, userSucursales]);

  useEffect(() => {
    const loadRecords = async () => {
      if (!ownerId || !selectedEmployee?.id) {
        setRecords([]);
        return;
      }
      setLoadingRecords(true);
      setError('');
      try {
        const history = await employeeTrainingRecordService.listByEmployee(ownerId, selectedEmployee.id);
        setRecords(history);
      } catch (err) {
        setError(err.message || 'No se pudo cargar el historial del empleado.');
      } finally {
        setLoadingRecords(false);
      }
    };

    loadRecords();
  }, [ownerId, selectedEmployee]);

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de owner disponible para historial por persona.</Alert>;
  }

  if (loadingEmployees) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loadingRecords && <Alert severity="info" sx={{ mb: 2 }}>Cargando historial del empleado...</Alert>}
      <PeopleTrainingHistoryView
        employees={employees}
        loadingEmployees={loadingEmployees}
        selectedEmployee={selectedEmployee}
        onSelectEmployee={setSelectedEmployee}
        records={records}
      />
    </Box>
  );
}

