import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  CircularProgress,
  Typography,
  Box,
  Chip
} from '@mui/material';
import Swal from 'sweetalert2';
import { getUsers, assignEmpresasToUser } from '../../../core/services/ownerUserService';
import { getUserDisplayName } from '../../../utils/userDisplayNames';

/**
 * Modal para gestionar la asignación de operarios a una empresa
 * 
 * Responsabilidad ÚNICA: Asignar/desasignar operarios a una empresa específica
 */
const EmpresaOperariosDialog = ({
  open,
  handleClose,
  empresaId,
  empresaNombre,
  ownerId
}) => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosAsignados, setUsuariosAsignados] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar usuarios del owner al abrir el modal
  useEffect(() => {
    if (open && ownerId) {
      loadUsuarios();
    }
  }, [open, ownerId]);

  // Cargar usuarios asignados a la empresa
  useEffect(() => {
    if (open && ownerId && usuarios.length > 0) {
      loadUsuariosAsignados();
    }
  }, [open, ownerId, usuarios]);

  const loadUsuarios = async () => {
    if (!ownerId) return;
    
    console.log('[EmpresaOperariosDialog][loadUsuarios] Evento: Cargar usuarios del owner');
    console.log('[EmpresaOperariosDialog][loadUsuarios] Parámetros:', { ownerId, empresaId, empresaNombre });
    
    setLoading(true);
    try {
      const users = await getUsers(ownerId);
      console.log('[EmpresaOperariosDialog][loadUsuarios] ✅ Success - Usuarios obtenidos:', users.length);
      // Filtrar solo operarios (excluir admins)
      const operarios = users.filter(user => user.role === 'operario' && user.activo);
      console.log('[EmpresaOperariosDialog][loadUsuarios] Operarios filtrados:', operarios.length);
      setUsuarios(operarios);
    } catch (error) {
      console.group('[Firestore ERROR]');
      console.error('code:', error.code);
      console.error('message:', error.message);
      console.error('stack:', error.stack);
      console.groupEnd();
      
      console.error('[EmpresaOperariosDialog][loadUsuarios] ❌ ERROR');
      console.error('[EmpresaOperariosDialog][loadUsuarios] Parámetros:', { ownerId, empresaId });
      console.error('[EmpresaOperariosDialog][loadUsuarios] Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los usuarios'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsuariosAsignados = () => {
    const asignados = new Set();
    usuarios.forEach(user => {
      if (user.empresasAsignadas && user.empresasAsignadas.includes(empresaId)) {
        asignados.add(user.id);
      }
    });
    setUsuariosAsignados(asignados);
  };

  const handleToggleUsuario = (userId) => {
    const nuevosAsignados = new Set(usuariosAsignados);
    if (nuevosAsignados.has(userId)) {
      nuevosAsignados.delete(userId);
    } else {
      nuevosAsignados.add(userId);
    }
    setUsuariosAsignados(nuevosAsignados);
  };

  const handleSave = async () => {
    console.log('[EmpresaOperariosDialog][handleSave] Evento: Guardar asignaciones de operarios');
    console.log('[EmpresaOperariosDialog][handleSave] Parámetros:', { ownerId, empresaId, empresaNombre });
    console.log('[EmpresaOperariosDialog][handleSave] Usuarios a asignar:', Array.from(usuariosAsignados));
    
    if (!ownerId || !empresaId) {
      console.warn('[EmpresaOperariosDialog][handleSave] ⚠️ Faltan datos requeridos');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Faltan datos requeridos'
      });
      return;
    }

    setSaving(true);
    try {
      // Actualizar asignaciones para cada usuario
      const promises = usuarios.map(async (user) => {
        const debeEstarAsignado = usuariosAsignados.has(user.id);
        const estaAsignado = user.empresasAsignadas?.includes(empresaId) || false;

        if (debeEstarAsignado !== estaAsignado) {
          // Actualizar lista de empresas asignadas del usuario
          const nuevasEmpresas = debeEstarAsignado
            ? [...(user.empresasAsignadas || []), empresaId]
            : (user.empresasAsignadas || []).filter(id => id !== empresaId);

          console.log('[EmpresaOperariosDialog][handleSave] Actualizando usuario:', {
            userId: user.id,
            debeEstarAsignado,
            estaAsignado,
            nuevasEmpresas
          });

          await assignEmpresasToUser(ownerId, user.id, nuevasEmpresas);
          console.log('[EmpresaOperariosDialog][handleSave] ✅ Usuario actualizado:', user.id);
        }
      });

      await Promise.all(promises);

      console.log('[EmpresaOperariosDialog][handleSave] ✅ Success - Todas las asignaciones guardadas');

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `${getUserDisplayName('default')}s asignados correctamente`
      });

      handleClose();
    } catch (error) {
      console.group('[Firestore ERROR]');
      console.error('code:', error.code);
      console.error('message:', error.message);
      console.error('stack:', error.stack);
      console.groupEnd();
      
      console.error('[EmpresaOperariosDialog][handleSave] ❌ ERROR');
      console.error('[EmpresaOperariosDialog][handleSave] Parámetros:', { ownerId, empresaId });
      console.error('[EmpresaOperariosDialog][handleSave] Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al asignar los operarios'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Gestionar {getUserDisplayName('default')}s - {empresaNombre}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : usuarios.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
            No hay {getUserDisplayName('default').toLowerCase()}s disponibles. Crea {getUserDisplayName('default').toLowerCase()}s desde la sección de usuarios.
          </Typography>
        ) : (
          <List>
            {usuarios.map((user) => (
              <ListItem key={user.id} button onClick={() => handleToggleUsuario(user.id)}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1">
                    {user.email || user.displayName || `Usuario ${user.id}`}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip 
                      label={user.role} 
                      size="small" 
                      color={user.role === 'operario' ? 'primary' : 'default'}
                    />
                    {usuariosAsignados.has(user.id) && (
                      <Chip 
                        label="Asignado" 
                        size="small" 
                        color="success"
                      />
                    )}
                  </Box>
                </Box>
                <ListItemSecondaryAction>
                  <Checkbox
                    edge="end"
                    checked={usuariosAsignados.has(user.id)}
                    onChange={() => handleToggleUsuario(user.id)}
                    inputProps={{ 'aria-labelledby': `checkbox-${user.id}` }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined" disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={saving || loading}
        >
          {saving ? <CircularProgress size={20} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmpresaOperariosDialog;
