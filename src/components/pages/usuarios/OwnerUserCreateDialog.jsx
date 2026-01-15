/**
 * OwnerUserCreateDialog - Crear usuario operario
 * 
 * Este componente llama al backend que maneja TODO el flujo:
 * - Validación de límites (usage.operarios < limits.maxOperarios)
 * - Creación en Firebase Auth
 * - Custom claims (appId, role, ownerId)
 * - Documento Firestore (owner-centric)
 * - Actualización de usage.operarios
 * 
 * El frontend NO crea documentos Firestore directamente.
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
import { getUserDisplayName } from '../../../utils/userDisplayNames';

const OwnerUserCreateDialog = ({ open, onClose, onSuccess }) => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);

  // Obtener ownerId: usar userProfile.ownerId si existe, sino user.uid como fallback
  // El servicio createUser requiere que ownerId === currentUser.uid
  const ownerId = userProfile?.ownerId || user?.uid;

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
      console.log('[OwnerUserCreateDialog] ===== INICIO CREACIÓN USUARIO =====');
      console.log('[OwnerUserCreateDialog] Datos:', {
        email: formData.email,
        nombre: formData.nombre
      });

      // 1. Verificar sesión activa
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No hay sesión activa');
      }

      // 2. Obtener token
      console.log('[OwnerUserCreateDialog] Obteniendo token de autenticación...');
      const token = await currentUser.getIdToken(true);
      console.log('[OwnerUserCreateDialog] ✅ Token obtenido correctamente');

      // 3. Preparar payload para backend de ControlAudit (NO ControlFile directamente)
      const endpoint = '/api/admin/create-user';

      const payload = {
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        role: 'operario',
        permisos: {}
      };

      // 4. Llamar al backend (ahora maneja TODO: validación límites, Auth, custom claims, Firestore, usage)
      console.log('[OwnerUserCreateDialog] Enviando request al backend...', { endpoint });
      
      // Timeout de 40 segundos para el fetch (Render.com puede tener cold starts)
      const fetchTimeout = 40000;
      const controller = new AbortController();
      const fetchStartTime = Date.now();
      const fetchTimeoutId = setTimeout(() => {
        const elapsed = Date.now() - fetchStartTime;
        console.error('[OwnerUserCreateDialog] ⚠️ TIMEOUT después de', elapsed, 'ms');
        controller.abort();
      }, fetchTimeout);

      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(fetchTimeoutId);
        const elapsed = Date.now() - fetchStartTime;
        console.log('[OwnerUserCreateDialog] ✅ Respuesta recibida en', elapsed, 'ms');
      } catch (fetchError) {
        clearTimeout(fetchTimeoutId);
        const elapsed = Date.now() - fetchStartTime;
        console.error('[OwnerUserCreateDialog] ❌ Error en fetch después de', elapsed, 'ms:', fetchError);
        if (fetchError.name === 'AbortError') {
          throw new Error(`El servidor no respondió después de ${Math.round(fetchTimeout/1000)} segundos. El backend puede estar iniciando (cold start). Por favor, intenta nuevamente.`);
        }
        throw fetchError;
      }

      console.log('[OwnerUserCreateDialog] Respuesta del backend recibida:', {
        status: response.status,
        ok: response.ok
      });

      // 5. Si el backend responde error, cortar el flujo inmediatamente
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`;
        console.error('[OwnerUserCreateDialog] ❌ Error del backend:', errorMessage);
        throw new Error(errorMessage);
      }

      // 6. Obtener resultado del backend
      const result = await response.json();
      console.log('[OwnerUserCreateDialog] ✅ Usuario creado exitosamente:', result);

      // El backend ahora maneja TODO:
      // - Validación de límites (usage.operarios < limits.maxOperarios)
      // - Creación en Firebase Auth
      // - Custom claims (appId, role, ownerId)
      // - Documento Firestore (apps/auditoria/owners/{ownerId}/usuarios/{uid})
      // - Actualización de usage.operarios (transacción atómica)

      // Mostrar éxito
      toast.success('Usuario creado exitosamente');
      console.log('[OwnerUserCreateDialog] ===== CREACIÓN EXITOSA =====');
      
      // Cerrar diálogo antes de llamar onSuccess
      onClose();
      
      // Llamar onSuccess para refrescar lista
      if (onSuccess) {
        console.log('[OwnerUserCreateDialog] Ejecutando onSuccess...');
        try {
          await onSuccess();
          console.log('[OwnerUserCreateDialog] ✅ onSuccess ejecutado correctamente');
        } catch (refreshError) {
          // No mostrar errores de refresh secundarios
          console.warn('[OwnerUserCreateDialog] ⚠️ Error en refresh después de crear usuario:', refreshError);
        }
      }
    } catch (err) {
      console.error('[OwnerUserCreateDialog] ===== ERROR EN CREACIÓN =====');
      console.error('[OwnerUserCreateDialog] Error completo:', err);
      console.error('[OwnerUserCreateDialog] Error message:', err.message);
      console.error('[OwnerUserCreateDialog] Error stack:', err.stack);
      
      let errorMessage = 'Error al crear usuario';
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      console.log('[OwnerUserCreateDialog] ===== FINALIZANDO PROCESO =====');
      console.log('[OwnerUserCreateDialog] Deshabilitando loading...');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Crear Usuario {getUserDisplayName('default')}
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
