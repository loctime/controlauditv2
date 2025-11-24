// src/components/pages/admin/components/RecurringScheduler/RecurringScheduler.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  Grid,
  Card,
  CardContent
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  PlayArrow,
  Pause,
  Schedule
} from "@mui/icons-material";
import { recurringService } from "../../../../../services/recurringService";
import { useAuth } from "../../../../context/AuthContext";
import { useGlobalSelection } from "../../../../../hooks/useGlobalSelection";
import CreateRecurringDialog from "./CreateRecurringDialog";
import { toast } from 'react-toastify';

const RecurringScheduler = ({ empresas, sucursales, formularios }) => {
  const { userProfile } = useAuth();
  const { selectedEmpresa, selectedSucursal } = useGlobalSelection();
  const [recurrings, setRecurrings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState(null);

  useEffect(() => {
    cargarRecurrings();
  }, [userProfile, selectedEmpresa, selectedSucursal]);

  const cargarRecurrings = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      const filters = {
        activa: undefined // Cargar todas
      };

      if (selectedEmpresa && selectedEmpresa !== 'todas') {
        filters.empresaId = selectedEmpresa;
      }
      if (selectedSucursal && selectedSucursal !== 'todas') {
        filters.sucursalId = selectedSucursal;
      }

      const recurringsData = await recurringService.getRecurrings(
        userProfile.clienteAdminId || userProfile.uid,
        filters
      );
      setRecurrings(recurringsData);
    } catch (error) {
      console.error('Error cargando programaciones recurrentes:', error);
      toast.error('Error al cargar las programaciones recurrentes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (recurring = null) => {
    setRecurringToEdit(recurring);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setRecurringToEdit(null);
  };

  const handleSave = () => {
    cargarRecurrings();
  };

  const handleDelete = async (recurringId) => {
    if (window.confirm('¿Estás seguro de eliminar esta programación recurrente?')) {
      try {
        await recurringService.deleteRecurring(recurringId);
        cargarRecurrings();
      } catch (error) {
        console.error('Error eliminando programación recurrente:', error);
      }
    }
  };

  const handleToggle = async (recurringId, activa) => {
    try {
      await recurringService.toggleRecurring(recurringId, !activa);
      cargarRecurrings();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const proximasFechas = useMemo(() => {
    return recurrings.map(recurring => {
      const fechas = recurringService.calcularProximasFechas(recurring, 5);
      return {
        ...recurring,
        proximasFechas: fechas
      };
    });
  }, [recurrings]);

  const getFrecuenciaLabel = (frecuencia) => {
    if (frecuencia.tipo === 'semanal') {
      const dias = frecuencia.diasSemana || [];
      const diasLabels = {
        1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom'
      };
      const diasStr = dias.map(d => diasLabels[d] || d).join(', ');
      return `Cada ${frecuencia.intervalo || 1} semana(s) - ${diasStr}`;
    }
    if (frecuencia.tipo === 'mensual') {
      return `Mensual - Día ${frecuencia.diaMes}`;
    }
    return frecuencia.tipo;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Cargando programaciones recurrentes...</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Programaciones Recurrentes</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Programación
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        {proximasFechas.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay programaciones recurrentes configuradas. Crea una nueva para comenzar.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          proximasFechas.map((recurring) => (
            <Grid item xs={12} md={6} lg={4} key={recurring.id}>
              <Card elevation={2}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box>
                      <Typography variant="h6" component="div" gutterBottom>
                        {recurring.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {recurring.empresaNombre}
                        {recurring.sucursalNombre && ` - ${recurring.sucursalNombre}`}
                      </Typography>
                    </Box>
                    <Chip
                      label={recurring.activa ? 'Activa' : 'Inactiva'}
                      color={recurring.activa ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Formulario:</strong> {recurring.formularioNombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Frecuencia:</strong> {getFrecuenciaLabel(recurring.frecuencia)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Hora:</strong> {recurring.hora}
                    </Typography>
                  </Box>

                  {recurring.proximasFechas && recurring.proximasFechas.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Próximas fechas:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {recurring.proximasFechas.slice(0, 3).map((fecha, idx) => (
                          <Chip
                            key={idx}
                            label={fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            size="small"
                            icon={<Schedule />}
                          />
                        ))}
                        {recurring.proximasFechas.length > 3 && (
                          <Chip
                            label={`+${recurring.proximasFechas.length - 3} más`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  <Box display="flex" justifyContent="flex-end" gap={0.5} mt={2}>
                    <Tooltip title={recurring.activa ? 'Desactivar' : 'Activar'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggle(recurring.id, recurring.activa)}
                        color={recurring.activa ? 'success' : 'default'}
                      >
                        {recurring.activa ? <Pause /> : <PlayArrow />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(recurring)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(recurring.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <CreateRecurringDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSave={handleSave}
        recurringToEdit={recurringToEdit}
        empresas={empresas}
        sucursales={sucursales}
        formularios={formularios}
      />
    </Box>
  );
};

export default RecurringScheduler;
