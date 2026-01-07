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

    // Timeout de seguridad: máximo 30 segundos
    const timeoutId = setTimeout(() => {
      console.error('[OwnerUserCreateDialog] ⚠️ TIMEOUT: El proceso tardó más de 30 segundos');
      setLoading(false);
      setError('El proceso está tardando demasiado. Por favor, intenta nuevamente.');
      toast.error('Timeout: El proceso está tardando demasiado');
    }, 30000);

    try {
      console.log('[OwnerUserCreateDialog] ===== INICIO CREACIÓN USUARIO =====');
      console.log('[OwnerUserCreateDialog] Datos:', {
        email: formData.email,
        ownerId,
        userUid: user?.uid,
        userProfileOwnerId: userProfile?.ownerId
      });

      // 1. Verificar sesión activa
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No hay sesión activa');
      }

      // CRÍTICO: El servicio createUser requiere que ownerId === currentUser.uid
      // Usar el uid del usuario autenticado directamente
      const effectiveOwnerId = currentUser.uid;
      console.log('[OwnerUserCreateDialog] Usando effectiveOwnerId:', effectiveOwnerId);

      // 2. Obtener token
      console.log('[OwnerUserCreateDialog] [PASO 1] Obteniendo token de autenticación...');
      const token = await currentUser.getIdToken(true);
      console.log('[OwnerUserCreateDialog] [PASO 1] ✅ Token obtenido correctamente');

      // 3. Preparar payload para backend
      const backendUrl =
        import.meta.env.VITE_CONTROLFILE_BACKEND_URL ||
        'https://controlfile.onrender.com';
      const endpoint = `${backendUrl}/api/admin/create-user`;

      const payload = {
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        role: 'operario',
        appId: 'auditoria',
        clienteAdminId: null,
        permisos: {},
      };

      // 4. Llamar al backend para crear usuario en Firebase Auth
      console.log('[OwnerUserCreateDialog] [PASO 2] Enviando request al backend...', { endpoint });
      
      // Timeout de 40 segundos para el fetch (Render.com puede tener cold starts)
      const fetchTimeout = 40000;
      const controller = new AbortController();
      const fetchStartTime = Date.now();
      const timeoutId = setTimeout(() => {
        const elapsed = Date.now() - fetchStartTime;
        console.error('[OwnerUserCreateDialog] [PASO 2] ⚠️ TIMEOUT después de', elapsed, 'ms');
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
        clearTimeout(timeoutId);
        const elapsed = Date.now() - fetchStartTime;
        console.log('[OwnerUserCreateDialog] [PASO 2] ✅ Respuesta recibida en', elapsed, 'ms');
      } catch (fetchError) {
        clearTimeout(timeoutId);
        const elapsed = Date.now() - fetchStartTime;
        console.error('[OwnerUserCreateDialog] [PASO 2] ❌ Error en fetch después de', elapsed, 'ms:', fetchError);
        if (fetchError.name === 'AbortError') {
          throw new Error(`El servidor no respondió después de ${Math.round(fetchTimeout/1000)} segundos. El backend puede estar iniciando (cold start). Por favor, intenta nuevamente.`);
        }
        throw fetchError;
      }

      console.log('[OwnerUserCreateDialog] [PASO 2] Respuesta del backend recibida:', {
        status: response.status,
        ok: response.ok
      });

      // 5. Si el backend responde error, cortar el flujo inmediatamente
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
        console.error('[OwnerUserCreateDialog] [PASO 2] ❌ Error del backend:', errorMessage);
        throw new Error(errorMessage);
      }

      // 6. Obtener resultado del backend
      const result = await response.json();
      const newUserId = result.uid;
      console.log('[OwnerUserCreateDialog] [PASO 2] ✅ Usuario creado en Firebase Auth:', { newUserId });

      // 7. Crear usuario en el Core (modelo owner-centric)
      // CRÍTICO: Usar effectiveOwnerId (currentUser.uid) que es lo que requiere el servicio
      console.log('[OwnerUserCreateDialog] [PASO 3] Creando usuario en Core...', { 
        effectiveOwnerId, 
        newUserId,
        role: 'operario'
      });
      
      try {
        await createUser(effectiveOwnerId, {
          id: newUserId,
          role: 'operario',
          empresasAsignadas: [],
          activo: true,
          appId: 'auditoria'
        });
        console.log('[OwnerUserCreateDialog] [PASO 3] ✅ Usuario creado en Core exitosamente');
      } catch (createUserError) {
        console.error('[OwnerUserCreateDialog] [PASO 3] ❌ Error en createUser:', createUserError);
        throw createUserError;
      }

      // 8. Mostrar éxito
      toast.success('Usuario creado exitosamente');
      console.log('[OwnerUserCreateDialog] ===== CREACIÓN EXITOSA =====');
      
      // 9. Cerrar diálogo antes de llamar onSuccess
      onClose();
      
      // 10. Llamar onSuccess después de cerrar (puede hacer refresh que falle por permisos)
      if (onSuccess) {
        console.log('[OwnerUserCreateDialog] [PASO 4] Ejecutando onSuccess...');
        try {
          await onSuccess();
          console.log('[OwnerUserCreateDialog] [PASO 4] ✅ onSuccess ejecutado correctamente');
        } catch (refreshError) {
          // No mostrar errores de refresh secundarios (permission-denied esperado)
          const isPermissionDenied = 
            refreshError.code === 'permission-denied' ||
            refreshError.message?.includes('permission-denied') ||
            refreshError.message?.includes('Missing or insufficient permissions');
          
          if (isPermissionDenied) {
            console.debug('[OwnerUserCreateDialog] [PASO 4] Permission denied en refresh (esperado, usuario creado correctamente)');
          } else {
            console.warn('[OwnerUserCreateDialog] [PASO 4] ⚠️ Error en refresh después de crear usuario:', refreshError);
          }
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
      clearTimeout(timeoutId);
      console.log('[OwnerUserCreateDialog] ===== FINALIZANDO PROCESO =====');
      console.log('[OwnerUserCreateDialog] Deshabilitando loading...');
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
