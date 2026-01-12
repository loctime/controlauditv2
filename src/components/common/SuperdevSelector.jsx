// src/components/common/SuperdevSelector.jsx
// Selector de owners para usuarios con permisos superdev

import React, { useState, useEffect } from 'react';
import {
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Typography,
  Box,
  Alert,
  Divider
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { impersonateOwner, signInWithImpersonationToken, listOwners } from '../../services/superdevService';
import { toast } from 'react-toastify';

const SuperdevSelector = () => {
  const { user, userContext } = useAuth();
  const [open, setOpen] = useState(false);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  // Verificar si el usuario tiene permisos superdev desde el contexto
  const hasSuperdev = userContext?.superdev === true;

  // Cargar owners al abrir el modal
  useEffect(() => {
    if (open && hasSuperdev) {
      loadOwners();
    }
  }, [open, hasSuperdev]);

  const loadOwners = async () => {
    setLoading(true);
    try {
      const ownersList = await listOwners();
      setOwners(ownersList);
    } catch (error) {
      console.error('[SuperdevSelector] Error al cargar owners:', error);
      toast.error('Error al cargar lista de owners');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleImpersonate = async (ownerId: string, ownerEmail: string) => {
    if (impersonating) return;

    setImpersonating(true);
    try {
      // 1. Obtener custom token del backend
      const customToken = await impersonateOwner(ownerId);

      // 2. Autenticarse con el custom token
      await signInWithImpersonationToken(customToken);

      // 3. Mostrar mensaje de éxito
      toast.success(`Impersonando a: ${ownerEmail}`, {
        autoClose: 3000,
      });

      // 4. Cerrar modal
      setOpen(false);

      // 5. Recargar página para refrescar contexto
      // El AuthContext detectará el cambio automáticamente
      window.location.reload();
    } catch (error: any) {
      console.error('[SuperdevSelector] Error al impersonar:', error);
      const errorMessage = error.message || 'Error al impersonar owner';
      toast.error(errorMessage, {
        autoClose: 5000,
      });
    } finally {
      setImpersonating(false);
    }
  };

  // No mostrar si no tiene permisos superdev
  if (!hasSuperdev) {
    return null;
  }

  return (
    <>
      {/* Botón/Chip en navbar */}
      <Chip
        icon={<Person />}
        label="Modo Superdev"
        onClick={handleOpen}
        color="primary"
        variant="outlined"
        sx={{
          cursor: 'pointer',
          color: '#ffffff',
          borderColor: '#ffffff',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)',
          },
        }}
      />

      {/* Modal de selección */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person />
            <Typography variant="h6">Seleccionar Owner para Impersonar</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : owners.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                No hay owners disponibles o el endpoint de listado no está disponible aún.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontSize: '0.875rem' }}>
                El backend debe implementar el endpoint <code>/api/superdev/list-owners</code> para listar owners disponibles.
              </Typography>
            </Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Selecciona un owner para impersonar. Al hacer logout, volverás a tu sesión original.
                </Typography>
              </Alert>
              <Divider sx={{ my: 2 }} />
              <List>
                {owners.map((owner) => (
                  <ListItem key={owner.ownerId} disablePadding>
                    <ListItemButton
                      onClick={() => handleImpersonate(owner.ownerId, owner.email)}
                      disabled={impersonating}
                    >
                      <ListItemText
                        primary={owner.displayName || owner.email}
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {owner.email}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              ID: {owner.ownerId}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={impersonating}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SuperdevSelector;
