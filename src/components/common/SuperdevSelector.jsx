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
import { listOwners } from '../../services/superdevService';
import { toast } from 'react-toastify';

const SuperdevSelector = () => {
  const { user, selectedOwnerId, setSelectedOwnerId } = useAuth();
  const [open, setOpen] = useState(false);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debug: log para verificar el UID del usuario
  console.log('[SuperdevSelector] user.uid:', user?.uid);
  console.log('[SuperdevSelector] expected UID:', 'rixIn0BwiVPHB4SgR0K0SlnpSLC2');

  // Verificar si el usuario es tu UID específico - usar auth.user.uid directamente
  const isSpecificUser = user?.uid === 'rixIn0BwiVPHB4SgR0K0SlnpSLC2';
  
  console.log('[SuperdevSelector] isSpecificUser:', isSpecificUser);

  // No mostrar si no es tu UID específico
  if (!isSpecificUser) {
    console.log('[SuperdevSelector] Componente oculto - UID no coincide');
    return null;
  }

  console.log('[SuperdevSelector] Componente visible para UID específico');


  // Cargar owners al abrir el modal
  useEffect(() => {
    if (open && isSpecificUser) {
      loadOwners();
    }
  }, [open, isSpecificUser]);

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

  const handleSelectOwner = (ownerId, ownerEmail) => {
    console.log('[SuperdevSelector] seleccionando ownerId:', ownerId);
    
    // Guardar el ownerId seleccionado en el estado global
    setSelectedOwnerId(ownerId);
    
    // Mostrar mensaje de éxito
    toast.success(`Owner seleccionado: ${ownerEmail}`, {
      autoClose: 3000,
    });

    // Cerrar modal
    setOpen(false);
  };


  return (
    <>
      {/* Botón/Chip en navbar */}
      <Chip
        icon={<Person />}
        label="Selector Owner"
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
            <Typography variant="h6">Seleccionar Owner</Typography>
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
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Selecciona un owner para ver sus datos. La app usará automáticamente el owner seleccionado.
                </Typography>
                {selectedOwnerId && (
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                    Owner actual: {selectedOwnerId}
                  </Typography>
                )}
              </Alert>
              <Divider sx={{ my: 2 }} />
              <List>
                {owners.map((owner) => (
                  <ListItem key={owner.uid} disablePadding>
                    <ListItemButton
                      onClick={() => handleSelectOwner(owner.uid, owner.email)}
                    >
                      <ListItemText
                        primary={owner.displayName || owner.email}
                        secondary={
                          owner.displayName && owner.email !== owner.displayName ? (
                            <Typography variant="caption" color="text.secondary">
                              {owner.email}
                            </Typography>
                          ) : null
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
          <Button onClick={handleClose}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SuperdevSelector;
