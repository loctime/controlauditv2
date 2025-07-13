// src/router/ProtectedUsers.js
import { useContext } from "react";
import { AuthContext } from "../components/context/AuthContext";
import { Outlet, Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";

const ProtectedUsers = () => {
  const { isLogged, loading, bloqueado, motivoBloqueo } = useContext(AuthContext);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando...
        </Typography>
      </Box>
    );
  }

  if (bloqueado) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ p: 4 }}
      >
        <Alert severity="error" sx={{ mb: 2, fontSize: '1.2rem' }}>
          {motivoBloqueo || 'Acceso bloqueado por el administrador.'}
        </Alert>
      </Box>
    );
  }

  return isLogged ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedUsers;
