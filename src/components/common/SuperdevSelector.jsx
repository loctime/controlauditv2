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
import { Person, Home } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const SuperdevSelector = () => {
  const { user, selectedOwnerId, setSelectedOwnerId } = useAuth();
  const [open, setOpen] = useState(false);

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

  // Lista estática de owners para impersonación (sin backend)
 const staticOwners = [
  {
    uid: 'rixIn0BwiVPHB4SgR0K0SlnpSLC2',
    email: 'superdev',
    displayName: 'Mi Cuenta'
  },
  {
    uid: 'hTD8FYeueHhuXxGCjxD0DcYmkRG2',
    email: 'ssanabria.sh@gmail.com',
    displayName: 'Sanabria – Auditoría'
  }
];

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
    if (ownerId === user.uid) {
      toast.success('Volviendo a mi cuenta', {
        autoClose: 3000,
      });
    } else {
      toast.success(`Owner seleccionado: ${ownerEmail}`, {
        autoClose: 3000,
      });
    }

    // Cerrar modal
    setOpen(false);
  };


  return (
    <>
      {/* Botón/Chip en navbar */}
      <Chip
        icon={selectedOwnerId ? <Home /> : <Person />}
        label={selectedOwnerId ? "Mi Cuenta" : "Selector Owner"}
        onClick={handleOpen}
        color={selectedOwnerId ? "secondary" : "primary"}
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
            {staticOwners.map((owner) => (
              <ListItem key={owner.uid} disablePadding>
                <ListItemButton
                  onClick={() => handleSelectOwner(owner.uid, owner.email)}
                  selected={selectedOwnerId === owner.uid}
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
