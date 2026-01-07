/**
 * OwnerUserCreateDialog - Crear usuario usando el modelo owner-centric Core
 * 
 * Este componente usa ÚNICAMENTE servicios del Core (src/core).
 * NO usa código legacy.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { auth } from '../../../firebaseControlFile';
import { toast } from 'react-toastify';
import { createUser } from '../../../core/services/ownerUserService';

const OwnerUserCreateDialog = ({ open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);

  // Obtener ownerId del usuario autenticado
  // En el modelo owner-centric, el admin es su propio owner
  const ownerId = user?.uid;

  // Resetear formulario al cerrar
  React.useEffect(() => {
    if (!open) {
      setFormData({
        nombre: '',
        email: '',
        password: ''
      });
      setError(null);
    }
  }, [open]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!ownerId) {
      setError('No se pudo identificar el owner');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Crear usuario en Firebase Auth usando el backend (requiere Admin SDK)
      const backendUrl =
        import.meta.env.VITE_CONTROLFILE_BACKEND_URL ||
        'https://controlfile.onrender.com';
      const endpoint = `${backendUrl}/api/admin/create-user`;

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No hay sesión activa');
      }

      const token = await currentUser.getIdToken(true);

      // Payload normalizado igual que userService.createUser
      const payload = {
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        role: 'operario',
        appId: 'auditoria',
        clienteAdminId: null,
        permisos: {},
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const newUserId = result.uid;

      // 2. Crear usuario en el Core (modelo owner-centric)
      await createUser(ownerId, {
        id: newUserId,
        role: 'operario',
        empresasAsignadas: [],
        activo: true,
        appId: 'auditoria'
      });

      toast.success('Usuario creado exitosamente');
      
      // Cerrar diálogo antes de llamar onSuccess para evitar errores visuales falsos
      onClose();
      
      // Llamar onSuccess después de cerrar (puede hacer refresh que falle por permisos)
      // Envolver en try-catch silencioso para no mostrar errores de refresh secundarios
      if (onSuccess) {
        try {
          await onSuccess();
        } catch (refreshError) {
          // No mostrar errores de refresh secundarios (permission-denied esperado)
          const isPermissionDenied = 
            refreshError.code === 'permission-denied' ||
            refreshError.message?.includes('permission-denied') ||
            refreshError.message?.includes('Missing or insufficient permissions');
          
          if (isPermissionDenied) {
            console.debug('[OwnerUserCreateDialog] Permission denied en refresh (esperado, usuario creado correctamente)');
          } else {
            console.warn('[OwnerUserCreateDialog] Error en refresh después de crear usuario:', refreshError);
          }
        }
      }
    } catch (err) {
      console.error('[OwnerUserCreateDialog] Error al crear usuario:', err);
      
      // Solo mostrar errores del create, no de refresh secundarios
      let errorMessage = 'Error al crear usuario';
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Crear Usuario Operario
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Nombre"
            value={formData.nombre}
            onChange={handleChange('nombre')}
            fullWidth
            required
            disabled={loading}
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            fullWidth
            required
            disabled={loading}
          />

          <TextField
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            fullWidth
            required
            disabled={loading}
            helperText="Mínimo 6 caracteres"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !ownerId}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Creando...' : 'Crear Usuario'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OwnerUserCreateDialog;
