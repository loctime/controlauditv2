import React, { useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const EmpresasDebug = () => {
  const { 
    userProfile, 
    userEmpresas, 
    loadingEmpresas, 
    recargarEmpresas,
    role 
  } = useAuth();

  useEffect(() => {
    console.log('[EmpresasDebug] Estado actual:', {
      userProfile: userProfile ? 'Cargado' : 'No cargado',
      userEmpresas: userEmpresas?.length || 0,
      loadingEmpresas,
      role
    });
  }, [userProfile, userEmpresas, loadingEmpresas, role]);

  const handleRecargar = () => {
    console.log('[EmpresasDebug] Recargando empresas manualmente...');
    recargarEmpresas();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Debug de Empresas
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Estado del Usuario
          </Typography>
          <Typography variant="body2">
            <strong>UID:</strong> {userProfile?.uid || 'No disponible'}
          </Typography>
          <Typography variant="body2">
            <strong>Rol:</strong> {role || 'No disponible'}
          </Typography>
          <Typography variant="body2">
            <strong>Cliente Admin ID:</strong> {userProfile?.clienteAdminId || 'No disponible'}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Estado de Empresas
          </Typography>
          <Typography variant="body2">
            <strong>Cargando:</strong> {loadingEmpresas ? 'Sí' : 'No'}
          </Typography>
          <Typography variant="body2">
            <strong>Cantidad de empresas:</strong> {userEmpresas?.length || 0}
          </Typography>
          <Typography variant="body2">
            <strong>Empresas disponibles:</strong> {userEmpresas ? 'Sí' : 'No'}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lista de Empresas
          </Typography>
          {loadingEmpresas ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography>Cargando empresas...</Typography>
            </Box>
          ) : userEmpresas && userEmpresas.length > 0 ? (
            <Box>
              {userEmpresas.map((empresa, index) => (
                <Typography key={empresa.id} variant="body2" sx={{ mb: 1 }}>
                  {index + 1}. {empresa.nombre} (ID: {empresa.id})
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay empresas disponibles
            </Typography>
          )}
        </CardContent>
      </Card>

      <Button 
        variant="contained" 
        onClick={handleRecargar}
        disabled={loadingEmpresas}
        sx={{ mr: 2 }}
      >
        {loadingEmpresas ? 'Recargando...' : 'Recargar Empresas'}
      </Button>
    </Box>
  );
};

export default EmpresasDebug;
