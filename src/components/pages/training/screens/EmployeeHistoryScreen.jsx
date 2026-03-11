import logger from '@/utils/logger';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { employeeTrainingRecordService } from '../../../../services/training';
export default function EmployeeHistoryScreen() {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [employeeId, setEmployeeId] = useState('');

  const findEmployee = async () => {
    if (!ownerId || !employeeId) return;
    setLoading(true);
    setError('');

    try {
      const data = await employeeTrainingRecordService.listByEmployee(ownerId, employeeId);
      setRecords(data);
    } catch (err) {
      logger.error('[EmployeeHistoryScreen] load error', err);
      setError(err.message || 'No se pudo cargar el historial de capacitacion del empleado.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      findEmployee();
    }
  }, [ownerId]);

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de owner disponible para historial de empleados.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Historial de capacitacion por empleado</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ID de empleado"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="emp_44"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="contained" sx={{ height: '100%' }} onClick={findEmployee} disabled={loading || !employeeId}>
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Registros</Typography>
        {loading ? <CircularProgress /> : records.length === 0 ? (
          <Alert severity="info">No se encontraron registros para este empleado.</Alert>
        ) : (
          <Stack spacing={1.5}>
            {records.map((record) => (
              <Paper key={record.id} variant="outlined" sx={{ p: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }}>{record.trainingTypeId}</Typography>
                <Typography variant="body2" color="text.secondary">Estado: {record.complianceStatus} | Ultimo resultado: {record.lastResult}</Typography>
                <Typography variant="body2" color="text.secondary">Vigencia: {String(record.validFrom || '-')} a {String(record.validUntil || '-')}</Typography>
                <Typography variant="body2">Cantidad historica: {record.historyCount || 0}</Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

