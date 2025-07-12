// src/components/pages/admin/components/ProximasAuditorias.jsx
import React from "react";
import { 
  Typography, 
  Box, 
  Paper, 
  List,
  ListItem,
  ListItemText,
  Chip
} from "@mui/material";
import { Schedule } from "@mui/icons-material";

const ProximasAuditorias = ({ auditoriasPendientes }) => {
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Schedule color="primary" />
        Próximas Auditorías
      </Typography>
      {auditoriasPendientes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No hay auditorías pendientes
        </Typography>
      ) : (
        <List dense>
          {auditoriasPendientes
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .slice(0, 5)
            .map((auditoria) => (
              <ListItem key={auditoria.id} divider sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {auditoria.empresa}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(auditoria.fecha).toLocaleDateString()} • {auditoria.hora}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {auditoria.formulario}
                      </Typography>
                      {auditoria.sucursal && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          📍 {auditoria.sucursal}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Chip 
                  label="Pendiente" 
                  size="small" 
                  color="warning" 
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              </ListItem>
            ))}
        </List>
      )}
    </Paper>
  );
};

export default ProximasAuditorias; 