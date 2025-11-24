// src/components/pages/admin/components/TargetsManager/TargetsManager.jsx
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
  Grid
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Visibility
} from "@mui/icons-material";
import { targetsService } from "../../../../../services/targetsService";
import { useAuth } from "../../../../context/AuthContext";
import { useGlobalSelection } from "../../../../../hooks/useGlobalSelection";
import CreateTargetDialog from "./CreateTargetDialog";
import TargetsDashboard from "./TargetsDashboard";
import { toast } from 'react-toastify';

const TargetsManager = () => {
  const { userProfile } = useAuth();
  const { selectedEmpresa, selectedSucursal } = useGlobalSelection();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [targetToEdit, setTargetToEdit] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'dashboard'

  useEffect(() => {
    cargarTargets();
  }, [userProfile, selectedEmpresa, selectedSucursal]);

  const cargarTargets = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      const filters = {
        activo: undefined // Cargar todos, activos e inactivos
      };

      if (selectedEmpresa && selectedEmpresa !== 'todas') {
        filters.empresaId = selectedEmpresa;
      }
      if (selectedSucursal && selectedSucursal !== 'todas') {
        filters.sucursalId = selectedSucursal;
      }

      const targetsData = await targetsService.getTargets(
        userProfile.clienteAdminId || userProfile.uid,
        filters
      );
      setTargets(targetsData);
    } catch (error) {
      console.error('Error cargando targets:', error);
      toast.error('Error al cargar los targets');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (target = null) => {
    setTargetToEdit(target);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTargetToEdit(null);
  };

  const handleSave = () => {
    cargarTargets();
  };

  const handleDelete = async (targetId) => {
    if (window.confirm('¿Estás seguro de eliminar este target?')) {
      try {
        await targetsService.deleteTarget(targetId);
        cargarTargets();
      } catch (error) {
        console.error('Error eliminando target:', error);
      }
    }
  };

  const handleToggle = async (targetId, activo) => {
    try {
      await targetsService.toggleTarget(targetId, !activo);
      cargarTargets();
    } catch (error) {
      console.error('Error cambiando estado del target:', error);
    }
  };

  const getPeriodoLabel = (periodo, mes) => {
    const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    if (periodo === 'semanal') return 'Semanal';
    if (periodo === 'mensual' && mes) return `Mensual - ${meses[mes]}`;
    if (periodo === 'mensual') return 'Mensual';
    if (periodo === 'anual') return 'Anual';
    return periodo;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Cargando targets...</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Gestión de Targets</Typography>
          <Box display="flex" gap={1}>
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('list')}
            >
              Lista
            </Button>
            <Button
              variant={viewMode === 'dashboard' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<Visibility />}
              onClick={() => setViewMode('dashboard')}
            >
              Dashboard
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Nuevo Target
            </Button>
          </Box>
        </Box>
      </Paper>

      {viewMode === 'dashboard' ? (
        <TargetsDashboard targets={targets} auditoriasCompletadas={[]} />
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empresa</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell>Período</TableCell>
                <TableCell align="center">Target</TableCell>
                <TableCell align="center">Año</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {targets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No hay targets configurados. Crea uno nuevo para comenzar.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                targets.map((target) => (
                  <TableRow key={target.id}>
                    <TableCell>{target.empresaNombre}</TableCell>
                    <TableCell>{target.sucursalNombre || 'Todas'}</TableCell>
                    <TableCell>{getPeriodoLabel(target.periodo, target.mes)}</TableCell>
                    <TableCell align="center">
                      <Chip label={target.cantidad} color="primary" size="small" />
                    </TableCell>
                    <TableCell align="center">{target.año}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={target.activo ? 'Activo' : 'Inactivo'}
                        color={target.activo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title={target.activo ? 'Desactivar' : 'Activar'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggle(target.id, target.activo)}
                            color={target.activo ? 'success' : 'default'}
                          >
                            {target.activo ? <CheckCircle /> : <Cancel />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(target)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(target.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CreateTargetDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSave={handleSave}
        targetToEdit={targetToEdit}
      />
    </Box>
  );
};

export default TargetsManager;
