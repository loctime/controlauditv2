// src/router/ProtectedUsers.js
import { useAuth } from "../components/context/AuthContext";
import { Outlet, Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography, Alert, Button } from "@mui/material";

const ProtectedUsers = () => {
  const { isLogged, loading, bloqueado, motivoBloqueo, userProfile, logoutContext, role, permisos } = useAuth();
  
  // Debug: mostrar información del usuario
  console.log('ProtectedUsers - isLogged:', isLogged, 'loading:', loading, 'bloqueado:', bloqueado, 'role:', role, 'permisos:', permisos);

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

  // Si está bloqueado por lógica general
  if (bloqueado) {
    // Si el motivo de bloqueo es por suscripción vencida o inactiva, mostrar el cartel amable con botón
    if (motivoBloqueo && (motivoBloqueo.toLowerCase().includes('vencida') || motivoBloqueo.toLowerCase().includes('inactiva'))) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          sx={{ p: 4 }}
        >
          <Alert severity="warning" sx={{ mb: 2, fontSize: '1.2rem', maxWidth: 500, textAlign: 'center' }}>
            <strong>¡Atención!</strong><br />
            Tu sistema se encuentra impago.<br />
            Por favor, comunícate con nuestro equipo para regularizar tu situación.<br />
            Mientras tanto, el acceso está restringido.
          </Alert>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ mb: 2, minWidth: 200 }}
            onClick={() => {
              logoutContext();
              window.location.href = '/login';
            }}
          >
            Cerrar sesión
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            ¿Tienes dudas? <a href="mailto:soporte@tusistema.com" style={{ color: '#1976d2', textDecoration: 'underline' }}>Contáctanos</a> y te ayudamos a resolverlo.
          </Typography>
        </Box>
      );
    }
    // Para otros bloqueos, mostrar mensaje genérico
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

  // Si el usuario está vencido, solo cartel y cerrar sesión
  if (userProfile && userProfile.estadoPago === 'vencido') {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ p: 4 }}
      >
        <Alert severity="warning" sx={{ mb: 2, fontSize: '1.2rem', maxWidth: 500, textAlign: 'center' }}>
          <strong>¡Atención!</strong><br />
          Tu sistema se encuentra impago.<br />
          Por favor, comunícate con nuestro equipo para regularizar tu situación.<br />
          Mientras tanto, el acceso está restringido.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ mb: 2, minWidth: 200 }}
          onClick={() => {
            logoutContext();
            window.location.href = '/login';
          }}
        >
          Cerrar sesión
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          ¿Tienes dudas? <a href="mailto:soporte@tusistema.com" style={{ color: '#1976d2', textDecoration: 'underline' }}>Contáctanos</a> y te ayudamos a resolverlo.
        </Typography>
      </Box>
    );
  }

  // Si está pendiente, banner pero navegación normal
  if (userProfile && userProfile.estadoPago === 'pendiente') {
    return (
      <>
        <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
          <Alert severity="info" sx={{ justifyContent: 'center', fontSize: '1.1rem' }}>
            Tu sistema está pendiente de pago. Por favor, regulariza tu situación para evitar la suspensión del servicio.
          </Alert>
        </Box>
        <Outlet />
      </>
    );
  }

  // Si está al día o no tiene estado de pago, navegación normal
  return isLogged ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedUsers;
