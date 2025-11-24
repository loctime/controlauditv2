// src/components/pages/admin/components/TargetsManager/CreateTargetDialog.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography
} from "@mui/material";
import { Add, CalendarToday } from "@mui/icons-material";
import { targetsService } from "../../../../../services/targetsService";
import { useAuth } from "../../../../context/AuthContext";
import { useGlobalSelection } from "../../../../../hooks/useGlobalSelection";
import { toast } from 'react-toastify';

const CreateTargetDialog = ({ open, onClose, onSave, targetToEdit = null }) => {
  const { userProfile } = useAuth();
  const { userEmpresas, sucursalesFiltradas, selectedEmpresa } = useGlobalSelection();
  
  const [form, setForm] = useState({
    empresaId: '',
    empresaNombre: '',
    sucursalId: '',
    sucursalNombre: '',
    periodo: 'mensual',
    cantidad: 0,
    año: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    activo: true
  });

  const [errors, setErrors] = useState({});

  // Cargar datos del target a editar
  useEffect(() => {
    if (targetToEdit && open) {
      setForm({
        empresaId: targetToEdit.empresaId || '',
        empresaNombre: targetToEdit.empresaNombre || '',
        sucursalId: targetToEdit.sucursalId || '',
        sucursalNombre: targetToEdit.sucursalNombre || '',
        periodo: targetToEdit.periodo || 'mensual',
        cantidad: targetToEdit.cantidad || 0,
        año: targetToEdit.año || new Date().getFullYear(),
        mes: targetToEdit.mes || new Date().getMonth() + 1,
        activo: targetToEdit.activo !== undefined ? targetToEdit.activo : true
      });
    } else if (open) {
      // Resetear formulario
      setForm({
        empresaId: selectedEmpresa && selectedEmpresa !== 'todas' ? selectedEmpresa : '',
        empresaNombre: '',
        sucursalId: '',
        sucursalNombre: '',
        periodo: 'mensual',
        cantidad: 0,
        año: new Date().getFullYear(),
        mes: new Date().getMonth() + 1,
        activo: true
      });
      setErrors({});
    }
  }, [targetToEdit, open, selectedEmpresa]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };

      // Actualizar nombre de empresa/sucursal cuando se selecciona
      if (name === 'empresaId') {
        const empresa = userEmpresas?.find(e => e.id === value);
        updated.empresaNombre = empresa?.nombre || '';
        // Resetear sucursal si cambia la empresa
        if (value !== prev.empresaId) {
          updated.sucursalId = '';
          updated.sucursalNombre = '';
        }
      }
      if (name === 'sucursalId') {
        const sucursal = sucursalesFiltradas?.find(s => s.id === value);
        updated.sucursalNombre = sucursal?.nombre || '';
      }

      return updated;
    });
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.empresaId) {
      newErrors.empresaId = 'Empresa es requerida';
    }
    if (form.periodo === 'mensual' && !form.mes) {
      newErrors.mes = 'Mes es requerido para período mensual';
    }
    if (form.cantidad <= 0) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    }
    if (form.año < new Date().getFullYear() - 1 || form.año > new Date().getFullYear() + 1) {
      newErrors.año = 'Año inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const targetData = {
        ...form,
        cantidad: Number(form.cantidad),
        año: Number(form.año),
        mes: form.periodo === 'mensual' ? Number(form.mes) : null,
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid
      };

      if (targetToEdit) {
        await targetsService.updateTarget(targetToEdit.id, targetData);
      } else {
        await targetsService.createTarget(targetData);
      }

      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      console.error('Error guardando target:', error);
    }
  };

  const generarOpcionesAños = () => {
    const añoActual = new Date().getFullYear();
    return [añoActual - 1, añoActual, añoActual + 1];
  };

  const generarOpcionesMeses = () => {
    return [
      { value: 1, label: 'Enero' },
      { value: 2, label: 'Febrero' },
      { value: 3, label: 'Marzo' },
      { value: 4, label: 'Abril' },
      { value: 5, label: 'Mayo' },
      { value: 6, label: 'Junio' },
      { value: 7, label: 'Julio' },
      { value: 8, label: 'Agosto' },
      { value: 9, label: 'Septiembre' },
      { value: 10, label: 'Octubre' },
      { value: 11, label: 'Noviembre' },
      { value: 12, label: 'Diciembre' }
    ];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Add color="primary" />
          {targetToEdit ? 'Editar Target' : 'Crear Nuevo Target'}
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.empresaId}>
                <InputLabel>Empresa</InputLabel>
                <Select
                  name="empresaId"
                  value={form.empresaId}
                  onChange={handleChange}
                  label="Empresa"
                >
                  {userEmpresas?.map(empresa => (
                    <MenuItem key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.empresaId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.empresaId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sucursal (Opcional)</InputLabel>
                <Select
                  name="sucursalId"
                  value={form.sucursalId}
                  onChange={handleChange}
                  label="Sucursal (Opcional)"
                  disabled={!form.empresaId}
                >
                  <MenuItem value="">Todas las sucursales</MenuItem>
                  {sucursalesFiltradas
                    ?.filter(suc => !form.empresaId || suc.empresaId === form.empresaId)
                    .map(sucursal => (
                      <MenuItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Período</InputLabel>
                <Select
                  name="periodo"
                  value={form.periodo}
                  onChange={handleChange}
                  label="Período"
                >
                  <MenuItem value="semanal">Semanal</MenuItem>
                  <MenuItem value="mensual">Mensual</MenuItem>
                  <MenuItem value="anual">Anual</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                name="cantidad"
                label="Cantidad de Auditorías"
                type="number"
                value={form.cantidad}
                onChange={handleChange}
                error={!!errors.cantidad}
                helperText={errors.cantidad}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                name="año"
                label="Año"
                type="number"
                value={form.año}
                onChange={handleChange}
                error={!!errors.año}
                helperText={errors.año}
                select
                SelectProps={{ native: true }}
              >
                {generarOpcionesAños().map(año => (
                  <option key={año} value={año}>{año}</option>
                ))}
              </TextField>
            </Grid>

            {form.periodo === 'mensual' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.mes}>
                  <InputLabel>Mes</InputLabel>
                  <Select
                    name="mes"
                    value={form.mes}
                    onChange={handleChange}
                    label="Mes"
                  >
                    {generarOpcionesMeses().map(mes => (
                      <MenuItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.mes && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.mes}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl>
                <Box display="flex" alignItems="center" gap={1}>
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm(prev => ({ ...prev, activo: e.target.checked }))}
                    id="activo-checkbox"
                  />
                  <label htmlFor="activo-checkbox">
                    <Typography variant="body2">Target activo</Typography>
                  </label>
                </Box>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">
            {targetToEdit ? 'Actualizar' : 'Crear'} Target
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateTargetDialog;
