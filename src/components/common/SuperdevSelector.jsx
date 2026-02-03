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
import { impersonateOwner, signInWithImpersonationToken } from '../../services/superdevService';

const SuperdevSelector = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

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

  const handleSelectOwner = async (ownerId, ownerEmail) => {
    console.log('[SuperdevSelector] Iniciando impersonación para ownerId:', ownerId);
    
    // Si es el mismo usuario, no hacer nada
    if (ownerId === user.uid) {
      toast.info('Ya estás en tu cuenta', {
        autoClose: 3000,
      });
      setOpen(false);
      return;
    }

    setIsImpersonating(true);
    
    try {
      // 1. Obtener custom token del backend
      toast.info('Generando token de impersonación...', {
        autoClose: 2000,
      });
      
      const customToken = await impersonateOwner(ownerId);
      
      // 2. Autenticar con el custom token
      toast.info('Iniciando sesión como usuario seleccionado...', {
        autoClose: 2000,
      });
      
      await signInWithImpersonationToken(customToken);
      
      // 3. Éxito - recargar la app para que tome el nuevo usuario
      toast.success(`Sesión iniciada como: ${ownerEmail}`, {
        autoClose: 3000,
      });
      
      // Cerrar modal antes de recargar
      setOpen(false);
      
      // Recargar la página para que la app tome el nuevo contexto de autenticación
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('[SuperdevSelector] Error en impersonación:', error);
      
      // Manejar diferentes tipos de error
      let errorMessage = 'Error al impersonar usuario';
      
      if (error.message.includes('PERMISSION_DENIED')) {
        errorMessage = 'No tienes permisos para impersonar a este usuario';
      } else if (error.message.includes('USER_NOT_FOUND')) {
        errorMessage = 'Usuario no encontrado';
      } else if (error.message.includes('INVALID_TOKEN')) {
        errorMessage = 'Token de autenticación inválido';
      } else if (error.message.includes('NETWORK_ERROR')) {
        errorMessage = 'Error de conexión con el backend';
      }
      
      toast.error(`${errorMessage}: ${error.message}`, {
        autoClose: 5000,
      });
      
      setIsImpersonating(false);
    }
  };


  return (
    <>
      {/* Botón/Chip en navbar */}
      <Chip
        icon={<Person />}
        label="Entrar como Owner"
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
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Selecciona un owner para impersonar. Iniciarás sesión realmente como ese usuario.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Para volver a tu cuenta, cierra sesión y autentícate nuevamente.
            </Typography>
          </Alert>
          <Divider sx={{ my: 2 }} />
          
          {isImpersonating ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography variant="body2">Impersonando usuario...</Typography>
            </Box>
          ) : (
            <List>
              {staticOwners.map((owner) => (
                <ListItem key={owner.uid} disablePadding>
                  <ListItemButton
                    onClick={() => handleSelectOwner(owner.uid, owner.email)}
                    disabled={isImpersonating}
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
