// src/components/pages/admin/components/ProximasAuditorias.jsx
import React from "react";
import { 
  Typography, 
  Box, 
  Paper, 
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar
} from "@mui/material";
import { Schedule, Person, PersonOff } from "@mui/icons-material";

const ProximasAuditorias = ({ auditoriasPendientes }) => {
  // Función para obtener el nombre del usuario
  const getNombreUsuario = (encargado) => {
    if (!encargado) return null;
    return typeof encargado === 'object' ? encargado.displayName || encargado.email : encargado;
  };

  // Función para obtener el email del usuario
  const getEmailUsuario = (encargado) => {
    if (!encargado) return null;
    return typeof encargado === 'object' ? encargado.email : null;
  };

  // Función para obtener la inicial del usuario
  const getInicialUsuario = (encargado) => {
    if (!encargado) return '';
    const nombre = getNombreUsuario(encargado);
    return nombre ? nombre.charAt(0).toUpperCase() : '';
  };

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
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {auditoria.empresa}
                      </Typography>
                      <Chip 
                        label="Pendiente" 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
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
                      
                      {/* Información del encargado */}
                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {auditoria.encargado ? (
                          <>
                            <Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem' }}>
                              {getInicialUsuario(auditoria.encargado)}
                            </Avatar>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                              <Person sx={{ fontSize: '0.7rem' }} />
                              {getNombreUsuario(auditoria.encargado)}
                              {getEmailUsuario(auditoria.encargado) && (
                                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                                  {' '}({getEmailUsuario(auditoria.encargado)})
                                </span>
                              )}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                            <PersonOff sx={{ fontSize: '0.7rem' }} />
                            Sin encargado
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
        </List>
      )}
    </Paper>
  );
};

export default ProximasAuditorias; 