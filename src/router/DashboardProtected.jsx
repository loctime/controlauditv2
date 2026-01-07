// src/router/DashboardProtected.jsx
import { useAuth } from '@/components/context/AuthContext';
import { Navigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const DashboardProtected = ({ children }) => {
  const { userProfile, role, permisos } = useAuth();
  const navigate = useNavigate();

  // Debug: mostrar información del rol
  console.log('DashboardProtected - role:', role, 'userProfile:', userProfile, 'permisos:', permisos);

  // Verificar si el usuario puede acceder al dashboard
  const canAccessDashboard = () => {
    // Solo supermax puede acceder al dashboard
    return role === 'supermax';
  };

  if (!canAccessDashboard()) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ p: 4 }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Acceso Denegado
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          No tienes permisos para acceder al Panel de Control.
          <br />
          Solo los Super Administradores pueden acceder a esta sección.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Volver al Inicio
        </Button>
      </Box>
    );
  }

  return children;
};

export default DashboardProtected; 