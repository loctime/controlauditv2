// src/router/ProtectedUsers.js
import { useContext } from "react";
import { AuthContext } from "../components/context/AuthContext";
import { Outlet, Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";

const ProtectedUsers = () => {
  const { isLogged, loading } = useContext(AuthContext);

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

  return isLogged ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedUsers;
