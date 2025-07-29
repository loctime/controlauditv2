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
  Avatar,
  useTheme,
  useMediaQuery,
  alpha
} from "@mui/material";
import { Schedule, Person, PersonOff } from "@mui/icons-material";

const ProximasAuditorias = ({ auditoriasPendientes }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'));

  const mobileBoxStyle = {
    mb: isMobile ? 1.5 : 3,
    p: isMobile ? 2 : 3,
    borderRadius: 2,
    bgcolor: 'background.paper',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    minHeight: isMobile ? '100px' : '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  // Debug: Mostrar todos los IDs de auditorías pendientes
  console.debug("[ProximasAuditorias] IDs de auditoriasPendientes:", auditoriasPendientes.map(a => a.id));
  
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
    <Box sx={{
      ...mobileBoxStyle,
      backgroundColor: '#f8f9fa',
      mb: isMobile ? 2 : 3
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? 1 : 2,
        mb: isMobile ? 1.5 : 2
      }}>
        <Box sx={{ 
          p: isMobile ? 1 : 1.5, 
          borderRadius: '50%', 
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Schedule 
            color="primary" 
            sx={{ fontSize: isMobile ? 20 : 24 }} 
          />
        </Box>
        <Typography 
          variant={isMobile ? "body1" : "h6"} 
          sx={{ fontWeight: 600, color: 'text.primary' }}
        >
          Próximas Auditorías
        </Typography>
      </Box>
      
      {auditoriasPendientes.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: isMobile ? 2 : 3,
          color: 'text.secondary'
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
          >
            No hay auditorías pendientes
          </Typography>
        </Box>
      ) : (
        <List dense sx={{ p: 0 }}>
          {auditoriasPendientes
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .slice(0, 5)
            .map((auditoria, idx) => {
              // Debug: Log de cada auditoría renderizada
              console.debug(`[ProximasAuditorias] Renderizando auditoría`, { idx, id: auditoria.id, empresa: auditoria.empresa });
              return (
                <Box 
                  key={`${auditoria.id}-${idx}`} 
                  sx={{
                    p: isMobile ? 1.5 : 2,
                    mb: isMobile ? 1 : 1.5,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: isMobile ? 1 : 2,
                    mb: isMobile ? 0.5 : 1
                  }}>
                    <Typography 
                      variant={isMobile ? "body2" : "subtitle2"} 
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        flex: 1,
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                      }}
                    >
                      {auditoria.empresa}
                    </Typography>
                    <Chip 
                      label="Pendiente" 
                      size={isMobile ? "small" : "medium"}
                      color="warning" 
                      variant="outlined"
                      sx={{ 
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        fontWeight: 500
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: isMobile ? 0.5 : 1
                  }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      📅 {new Date(auditoria.fecha).toLocaleDateString()} • {auditoria.hora}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                      }}
                    >
                      📋 {auditoria.formulario}
                    </Typography>
                    
                    {auditoria.sucursal && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                        }}
                      >
                        📍 {auditoria.sucursal}
                      </Typography>
                    )}
                    
                    {/* Información del encargado */}
                    <Box sx={{ 
                      mt: isMobile ? 0.5 : 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: isMobile ? 0.5 : 1 
                    }}>
                      {auditoria.encargado ? (
                        <>
                          <Avatar 
                            sx={{ 
                              width: isMobile ? 20 : 24, 
                              height: isMobile ? 20 : 24, 
                              fontSize: isMobile ? '0.6rem' : '0.75rem',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main
                            }}
                          >
                            {getInicialUsuario(auditoria.encargado)}
                          </Avatar>
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.3,
                              fontSize: isMobile ? '0.7rem' : '0.75rem'
                            }}
                          >
                            <Person sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }} />
                            {getNombreUsuario(auditoria.encargado)}
                            {getEmailUsuario(auditoria.encargado) && (
                              <span style={{ 
                                fontSize: isMobile ? '0.65rem' : '0.7rem', 
                                opacity: 0.7 
                              }}>
                                {' '}({getEmailUsuario(auditoria.encargado)})
                              </span>
                            )}
                          </Typography>
                        </>
                      ) : (
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.3,
                            fontSize: isMobile ? '0.7rem' : '0.75rem'
                          }}
                        >
                          <PersonOff sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }} />
                          Sin encargado
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
        </List>
      )}
    </Box>
  );
};

export default ProximasAuditorias; 