import React from "react";
import { Container, Box, Typography } from "@mui/material";

export default function DashboardLoading() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px"
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              mx: "auto",
              mb: 2
            }}
          />
          <Typography variant="h6" color="text.secondary">
            Cargando datos del sistema...
          </Typography>
        </Box>
      </Box>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
}

