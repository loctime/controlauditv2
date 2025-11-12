import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemAvatar, Avatar, ListItemText, Chip, Alert, CircularProgress, Button,
  useTheme, useMediaQuery, alpha, Card, CardContent, IconButton, Tooltip
} from '@mui/material';
import { Business as BusinessIcon, ExpandMore as ExpandMoreIcon, Store as StoreIcon, LocationOn, Phone, Person } from '@mui/icons-material';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useNavigate } from 'react-router-dom';

// Componente para mostrar sucursales de una empresa
const SucursalesEmpresa = ({ empresaId }) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!empresaId) return;
    setLoading(true);
    const q = query(collection(db, 'sucursales'), where('empresaId', '==', empresaId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSucursales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      console.debug(`[SucursalesEmpresa] ${snapshot.docs.length} sucursales para empresa ${empresaId}`);
    });
    return () => unsubscribe();
  }, [empresaId]);

  if (loading) return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <CircularProgress size={20} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Cargando sucursales...
      </Typography>
    </Box>
  );
  
  if (sucursales.length === 0) return (
    <Box sx={{ 
      textAlign: 'center', 
      py: 2,
      color: 'text.secondary'
    }}>
      <StoreIcon sx={{ fontSize: 24, mb: 1 }} />
      <Typography variant="body2">
        Sin sucursales registradas
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 1 
    }}>
      {sucursales.map(sucursal => (
        <Box key={sucursal.id} sx={{
          display: 'flex',
          alignItems: 'center',
          gap: isSmallMobile ? 1 : 2,
          p: isSmallMobile ? 1.5 : 2,
          bgcolor: alpha(theme.palette.background.paper, 0.5),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderColor: alpha(theme.palette.primary.main, 0.3),
            transition: 'all 0.2s ease'
          },
          transition: 'all 0.2s ease'
        }}>
          <Avatar sx={{ 
            width: isSmallMobile ? 32 : 40, 
            height: isSmallMobile ? 32 : 40,
            bgcolor: 'secondary.main'
          }}>
            <StoreIcon fontSize="small" />
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              {sucursal.nombre}
            </Typography>
            {sucursal.direccion && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5 
                }}
              >
                <LocationOn sx={{ fontSize: 12 }} />
                {sucursal.direccion}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const PerfilEmpresas = ({ empresas, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Log de depuración
  console.debug('[PerfilEmpresas] empresas:', empresas);
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      p: isSmallMobile ? 1 : 3,
      bgcolor: 'background.paper',
      borderRadius: 3,
      border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
    }}>
      {/* Header con título y botón de gestión */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: isSmallMobile ? 3 : 4,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isSmallMobile ? 2 : 3
      }}>
        <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
          <Typography 
            variant={isSmallMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              mb: 1
            }}
          >
            🏢 Mis Empresas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {empresas.length} empresa(s) registrada(s)
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            console.log('[PerfilEmpresas] Navegando a /establecimiento');
            navigate('/establecimiento');
          }}
          sx={{ 
            py: isSmallMobile ? 1.5 : 2,
            px: isSmallMobile ? 3 : 4,
            fontSize: isSmallMobile ? '0.875rem' : '1rem',
            fontWeight: 600,
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            },
            transition: 'all 0.2s ease'
          }}
        >
          🔧 Gestionar Empresas
        </Button>
      </Box>
      
      {/* Contenido de empresas */}
      {loading ? (
        <Box sx={{
          bgcolor: alpha(theme.palette.info.main, 0.05),
          borderRadius: 2,
          p: isSmallMobile ? 3 : 4,
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          textAlign: 'center'
        }}>
          <CircularProgress size={24} sx={{ mb: 2 }} />
          <Typography variant="body1" color="info.main">
            Cargando empresas...
          </Typography>
        </Box>
      ) : empresas.length === 0 ? (
        <Box sx={{
          bgcolor: alpha(theme.palette.warning.main, 0.05),
          borderRadius: 2,
          p: isSmallMobile ? 3 : 4,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
          textAlign: 'center'
        }}>
          <BusinessIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" color="warning.main" sx={{ mb: 1 }}>
            No tienes empresas registradas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comienza creando tu primera empresa para gestionar auditorías
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isSmallMobile ? 2 : 3 
        }}>
          {empresas.map((empresa) => (
            <Card key={empresa.id} sx={{
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease'
              },
              transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: isSmallMobile ? 2 : 4 }}>
                {/* Header de la empresa */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'center' : 'flex-start',
                  gap: isSmallMobile ? 2 : 3,
                  mb: isSmallMobile ? 2 : 3
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    mb: isMobile ? 2 : 0
                  }}>
                    <Avatar 
                      src={empresa.logo || undefined}
                      alt={empresa.logo ? `Logo de ${empresa.nombre}` : undefined}
                      sx={{ 
                        width: isSmallMobile ? 60 : 80, 
                        height: isSmallMobile ? 60 : 80,
                        bgcolor: 'primary.main'
                      }}
                    >
                      {!empresa.logo && <BusinessIcon fontSize="large" />}
                    </Avatar>
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1,
                    textAlign: isMobile ? 'center' : 'left',
                    minWidth: 0 // Evita que el contenido se desborde
                  }}>
                    <Typography 
                      variant={isSmallMobile ? "h6" : "h5"} 
                      sx={{ 
                        fontWeight: 600, 
                        color: 'primary.main',
                        mb: 1,
                        wordBreak: 'break-word' // Permite que el texto se rompa en palabras largas
                      }}
                    >
                      {empresa.nombre}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: isSmallMobile ? 1 : 2,
                      alignItems: isMobile ? 'center' : 'flex-start'
                    }}>
                      {empresa.direccion && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          flexWrap: 'wrap',
                          justifyContent: isMobile ? 'center' : 'flex-start'
                        }}>
                          <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              wordBreak: 'break-word',
                              textAlign: isMobile ? 'center' : 'left'
                            }}
                          >
                            {empresa.direccion}
                          </Typography>
                        </Box>
                      )}
                      
                      {empresa.telefono && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          justifyContent: isMobile ? 'center' : 'flex-start'
                        }}>
                          <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              wordBreak: 'break-word',
                              textAlign: isMobile ? 'center' : 'left'
                            }}
                          >
                            {empresa.telefono}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    mt: isMobile ? 2 : 0
                  }}>
                    <Chip 
                      label="Propietario" 
                      size={isSmallMobile ? "small" : "medium"}
                      color="primary" 
                      sx={{ 
                        fontWeight: 600,
                        '& .MuiChip-label': {
                          px: isSmallMobile ? 1 : 1.5
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                {/* Sucursales */}
                <Box sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.03),
                  borderRadius: 2,
                  p: isSmallMobile ? 2 : 3,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`
                }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 2, 
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    🏪 Sucursales
                  </Typography>
                  <SucursalesEmpresa empresaId={empresa.id} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PerfilEmpresas;
