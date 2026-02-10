import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/components/context/AuthContext';
import { auditoriaManualService } from '../../../../services/auditoriaManualService';
import Swal from 'sweetalert2';

/**
 * Formulario para crear/editar auditoría manual
 */
export default function AuditoriaManualForm({ 
  open, 
  onClose, 
  onSave, 
  auditoria = null 
}) {
  const { userProfile, userEmpresas, userSucursales } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    empresaId: '',
    sucursalId: '',
    fecha: new Date().toISOString().split('T')[0],
    auditor: '',
    observaciones: ''
  });

  // Sucursales filtradas por empresa seleccionada
  const sucursalesFiltradas = formData.empresaId
    ? (userSucursales || []).filter(s => s.empresaId === formData.empresaId)
    : [];

  useEffect(() => {
    if (open) {
      if (auditoria) {
        // Modo edición
        setFormData({
          nombre: auditoria.nombre || '',
          empresaId: auditoria.empresaId || '',
          sucursalId: auditoria.sucursalId || '',
          fecha: auditoria.fecha?.toDate 
            ? auditoria.fecha.toDate().toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          auditor: auditoria.auditor || '',
          observaciones: auditoria.observaciones || ''
        });
      } else {
        // Modo creación
        setFormData({
          nombre: '',
          empresaId: userEmpresas?.length === 1 ? userEmpresas[0].id : '',
          sucursalId: '',
          fecha: new Date().toISOString().split('T')[0],
          auditor: userProfile?.displayName || '',
          observaciones: ''
        });
      }
      setError(null);
    }
  }, [open, auditoria, userEmpresas, userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Si cambia la empresa, limpiar sucursal
      if (name === 'empresaId') {
        newData.sucursalId = '';
      }
      return newData;
    });
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.empresaId) {
      setError('La empresa es requerida');
      return false;
    }
    if (!formData.fecha) {
      setError('La fecha es requerida');
      return false;
    }
    if (!formData.auditor.trim()) {
      setError('El auditor es requerido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!userProfile?.uid || !userProfile?.ownerId) {
      setError('Usuario no autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = {
        nombre: formData.nombre.trim(),
        empresaId: formData.empresaId,
        sucursalId: formData.sucursalId || null,
        fecha: formData.fecha,
        auditor: formData.auditor.trim(),
        observaciones: formData.observaciones.trim() || ''
      };

      if (auditoria) {
        // Actualizar
        await auditoriaManualService.actualizarAuditoriaManual(
          userProfile.ownerId,
          auditoria.id,
          data,
          userProfile
        );
        Swal.fire({
          icon: 'success',
          title: 'Auditoría actualizada',
          text: 'La auditoría manual se ha actualizado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Crear
        await auditoriaManualService.crearAuditoriaManual(
          userProfile.ownerId,
          data,
          userProfile
        );
        Swal.fire({
          icon: 'success',
          title: 'Auditoría creada',
          text: 'La auditoría manual se ha creado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error al guardar auditoría:', err);
      setError(err.message || 'Error al guardar la auditoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={window.innerWidth < 600}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {auditoria ? 'Editar Auditoría Manual' : 'Nueva Auditoría Manual'}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Nombre de la Auditoría"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                disabled={loading || (auditoria?.estado === 'cerrada')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Empresa"
                name="empresaId"
                value={formData.empresaId}
                onChange={handleChange}
                disabled={loading || (auditoria?.estado === 'cerrada')}
              >
                {(userEmpresas || []).map((empresa) => (
                  <MenuItem key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Sucursal (Opcional)"
                name="sucursalId"
                value={formData.sucursalId}
                onChange={handleChange}
                disabled={loading || !formData.empresaId || (auditoria?.estado === 'cerrada')}
              >
                <MenuItem value="">
                  <em>Ninguna</em>
                </MenuItem>
                {sucursalesFiltradas.map((sucursal) => (
                  <MenuItem key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                disabled={loading || (auditoria?.estado === 'cerrada')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Auditor"
                name="auditor"
                value={formData.auditor}
                onChange={handleChange}
                disabled={loading || (auditoria?.estado === 'cerrada')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                disabled={loading || (auditoria?.estado === 'cerrada')}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || (auditoria?.estado === 'cerrada')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : (auditoria ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
