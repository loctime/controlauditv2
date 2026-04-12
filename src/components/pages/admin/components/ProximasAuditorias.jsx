import logger from '@/utils/logger';
// src/components/pages/admin/components/ProximasAuditorias.jsx
import React from "react";
import { 
  Typography, 
  Box, 
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

  const mobileBoxStyle = {
    mb: isMobile ? 1.5 : 3,
    p: isMobile ? 2.5 : 3,
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

  logger.debug("[ProximasAuditorias] IDs de auditoriasPendientes:", auditoriasPendientes.map(a => a.id));
  
  const getNombreUsuario = (encargado) => {
    if (!encargado) return null;
    return typeof encargado === 'object' ? encargado.displayName || encargado.email : encargado;
  };

  const getEmailUsuario = (encargado) => {
    if (!encargado) return null;
    return typeof encargado === 'object' ? encargado.email : null;
  };

  const getInicialUsuario = (encargado) => {
    if (!encargado) return '';
    const nombre = getNombreUsuario(encargado);
    return nombre ? nombre.charAt(0).toUpperCase() : '';
  };

  return (
    <Box sx={{
      ...mobileBoxStyle,
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8f9fa',
      mb: isMobile ? 2 : 3
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? 1.5 : 2,
        mb: isMobile ? 2 : 2.5
      }}>
        <Box sx={{ 
          p: isMobile ? 1.2 : 1.5, 
          borderRadius: '50%', 
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Schedule 
            color="primary" 
            sx={{ fontSize: isMobile ? 22 : 26 }} 
          />
        </Box>
        <Typography 
          variant={isMobile ? "h6" : "h6"} 
          sx={{ 
            fontWeight: 700, 
            color: 'text.primary',
            fontSize: isMobile ? '1.05rem' : '1.25rem'
          }}
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
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: isMobile ? '0.95rem' : '1rem' }}
          >
            No hay auditorías pendientes
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          p: 0
        }}>
          {auditoriasPendientes
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .slice(0, 5)
            .map((auditoria, idx) => {
              logger.debug(`[ProximasAuditorias] Renderizando auditoría`, { idx, id: auditoria.id, empresa: auditoria.empresa });
              return (
                <Box 
                  key={`${auditoria.id}-${idx}`} 
                  sx={{
                    p: isMobile ? 2 : 2.5,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  {/* Fila superior: empresa + badge */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    mb: 1.5
                  }}>
                    <Typography 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: isMobile ? '1rem' : '1.05rem',
                        flex: 1,
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        color: 'text.primary'
                      }}
                    >
                      {auditoria.empresa}
                    </Typography>
                    <Chip 
                      label="Pendiente" 
                      size="small"
                      color="warning" 
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        height: 26,
                        px: 0.5
                      }}
                    />
                  </Box>
                  
                  {/* Detalles */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 0.8
                  }}>
                    {/* Fecha */}
                    <Typography 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: isMobile ? '0.9rem' : '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontWeight: 500
                      }}
                    >
                      📅 {new Date(auditoria.fecha).toLocaleDateString()} • {auditoria.hora}
                    </Typography>
                    
                    {/* Formulario */}
                    <Typography 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: isMobile ? '0.9rem' : '0.95rem',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                      }}
                    >
                      📋 {auditoria.formulario}
                    </Typography>
                    
                    {/* Sucursal */}
                    {auditoria.sucursal && (
                      <Typography 
                        color="text.secondary" 
                        sx={{ 
                          fontSize: isMobile ? '0.9rem' : '0.95rem',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                        }}
                      >
                        📍 {auditoria.sucursal}
                      </Typography>
                    )}
                    
                    {/* Encargado */}
                    <Box sx={{ 
                      mt: 0.5, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1
                    }}>
                      {auditoria.encargado ? (
                        <>
                          <Avatar 
                            sx={{ 
                              width: isMobile ? 24 : 28, 
                              height: isMobile ? 24 : 28, 
                              fontSize: isMobile ? '0.75rem' : '0.8rem',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main
                            }}
                          >
                            {getInicialUsuario(auditoria.encargado)}
                          </Avatar>
                          <Typography 
                            color="text.secondary" 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5,
                              fontSize: isMobile ? '0.85rem' : '0.9rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Person sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }} />
                            {getNombreUsuario(auditoria.encargado)}
                            {getEmailUsuario(auditoria.encargado) && (
                              <span style={{ 
                                fontSize: isMobile ? '0.8rem' : '0.85rem', 
                                opacity: 0.65,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '150px'
                              }}>
                                ({getEmailUsuario(auditoria.encargado)})
                              </span>
                            )}
                          </Typography>
                        </>
                      ) : (
                        <Typography 
                          color="text.secondary" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            fontSize: isMobile ? '0.85rem' : '0.9rem'
                          }}
                        >
                          <PersonOff sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }} />
                          Sin encargado
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
        </Box>
      )}
    </Box>
  );
};

export default ProximasAuditorias;