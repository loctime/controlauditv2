// src/pages/Dashboard.jsx
import React from "react";
import { Typography, Box } from "@mui/material";

function Dashboard() {
  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4">Bienvenido al Dashboard</Typography>
      <Typography variant="body1" sx={{ marginTop: 2 }}>
        Aquí puedes navegar y acceder a todas las funcionalidades de la aplicación.
      </Typography>
    </Box>
  );
}

export default Dashboard;
