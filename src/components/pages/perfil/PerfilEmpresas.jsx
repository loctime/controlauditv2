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
import './PerfilEmpresas.css';

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
       gap: 0.5 
     }}>
             {sucursales.map(sucursal => (
         <Box key={sucursal.id} sx={{
           display: 'flex',
           alignItems: 'center',
           gap: 0.75,
           p: isSmallMobile ? 1 : 1.25,
           bgcolor: alpha(theme.palette.background.paper, 0.9),
           borderRadius: 1.5,
           border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
           boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
           '&:hover': {
             bgcolor: alpha(theme.palette.primary.main, 0.03),
             borderColor: alpha(theme.palette.primary.main, 0.2),
             transform: 'translateY(-1px)',
             boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
             transition: 'all 0.2s ease'
           },
           transition: 'all 0.2s ease'
         }}>
           <Avatar sx={{ 
             width: isSmallMobile ? 24 : 28, 
             height: isSmallMobile ? 24 : 28,
             bgcolor: 'secondary.main',
             border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
             boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
           }}>
             <StoreIcon sx={{ fontSize: isSmallMobile ? 14 : 16 }} />
           </Avatar>
           
           <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
             <Typography 
               className="sucursal-nombre"
               variant="body2" 
               sx={{ 
                 fontWeight: 600,
                 color: 'text.primary',
                 wordBreak: 'break-word',
                 whiteSpace: 'normal',
                 overflowWrap: 'break-word',
                 lineHeight: 1.2,
                 mb: 0.25,
                 fontSize: isSmallMobile ? '0.8rem' : '0.85rem'
               }}
             >
               {sucursal.nombre}
             </Typography>
             {sucursal.direccion && (
               <Box sx={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: 0.25
               }}>
                 <LocationOn sx={{ fontSize: 12, color: 'text.secondary', flexShrink: 0 }} />
                 <Typography 
                   className="sucursal-direccion"
                   variant="caption" 
                   color="text.secondary"
                   sx={{ 
                     wordBreak: 'break-word',
                     whiteSpace: 'normal',
                     overflowWrap: 'break-word',
                     lineHeight: 1.2,
                     fontWeight: 500,
                     fontSize: '0.7rem'
                   }}
                 >
                   {sucursal.direccion}
                 </Typography>
               </Box>
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
    <Box className="perfil-empresas-container" sx={{ 
      p: isSmallMobile ? 1 : 2,
      bgcolor: 'background.paper',
      borderRadius: 0,
      border: 'none',
      boxShadow: 'none',
      width: '100%'
    }}>
      {/* Header con título y botón de gestión */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: isSmallMobile ? 2.5 : 3,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isSmallMobile ? 1.5 : 2
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
        <Card sx={{
          bgcolor: 'background.paper',
          borderRadius: 4,
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.primary.main})`,
          }
        }}>
          <CardContent sx={{
            p: isSmallMobile ? 4 : 6,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.05)})`
          }}>
            <CircularProgress size={32} sx={{ mb: 3, color: 'info.main' }} />
            <Typography variant="h6" color="info.main" sx={{ mb: 1, fontWeight: 600 }}>
              Cargando empresas...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Obteniendo información de tus empresas
            </Typography>
          </CardContent>
        </Card>
      ) : empresas.length === 0 ? (
        <Card sx={{
          bgcolor: 'background.paper',
          borderRadius: 4,
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.orange.main})`,
          }
        }}>
          <CardContent sx={{
            p: isSmallMobile ? 4 : 6,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)}, ${alpha(theme.palette.orange.main, 0.05)})`
          }}>
            <Box sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem auto'
            }}>
              <BusinessIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            </Box>
            <Typography variant="h5" color="warning.main" sx={{ mb: 2, fontWeight: 700 }}>
              No tienes empresas registradas
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, margin: '0 auto' }}>
              Comienza creando tu primera empresa para gestionar auditorías y organizar tu negocio
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/establecimiento')}
              sx={{
                py: 1.5,
                px: 3,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
              }}
            >
              🏢 Crear Primera Empresa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isSmallMobile ? 1.5 : 2 
        }}>
          {empresas.map((empresa) => (
            <Card key={empresa.id} sx={{
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease'
              },
              transition: 'all 0.2s ease'
            }}>
              <CardContent sx={{ p: 0 }}>
                {/* Layout principal: Empresa a la izquierda, Sucursales a la derecha */}
                <Box sx={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  minHeight: 120
                }}>
                                     {/* Lado izquierdo: Logo y nombre de empresa */}
                   <Box sx={{
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     p: isSmallMobile ? 1.5 : 2,
                     minWidth: isMobile ? 'auto' : 120,
                     maxWidth: isMobile ? 'auto' : 120,
                     bgcolor: alpha(theme.palette.primary.main, 0.05),
                     borderRight: isMobile ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                     borderBottom: isMobile ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none'
                   }}>
                                         {/* Logo/Avatar */}
                     <Avatar 
                       src={empresa.logo || undefined}
                       sx={{ 
                         width: isSmallMobile ? 35 : 45, 
                         height: isSmallMobile ? 35 : 45,
                         bgcolor: 'primary.main',
                         border: `2px solid ${theme.palette.background.paper}`,
                         boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                         mb: 0.75
                       }}
                     >
                       {!empresa.logo && <BusinessIcon sx={{ fontSize: isSmallMobile ? 18 : 22 }} />}
                     </Avatar>
                    
                                         {/* Nombre de la empresa */}
                     <Typography 
                       className="empresa-nombre"
                       variant={isSmallMobile ? "body1" : "h6"} 
                       sx={{ 
                         fontWeight: 600, 
                         color: 'primary.main',
                         textAlign: 'center',
                         wordBreak: 'break-word',
                         whiteSpace: 'normal',
                         overflowWrap: 'break-word',
                         lineHeight: 1.2,
                         mb: 0.5,
                         fontSize: isSmallMobile ? '0.9rem' : '1rem'
                       }}
                     >
                       {empresa.nombre}
                     </Typography>
                    
                    {/* Chip de propietario */}
                    <Chip 
                      label="Propietario" 
                      size="small"
                      color="primary" 
                      variant="outlined"
                      sx={{ 
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                  </Box>
                  
                  {/* Lado derecho: Sucursales */}
                  <Box sx={{
                    flex: 1,
                    p: isSmallMobile ? 2 : 3,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Título de sucursales */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                      justifyContent: isMobile ? 'center' : 'flex-start'
                    }}>
                      <StoreIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: 'text.primary',
                          fontSize: '1rem'
                        }}
                      >
                        Sucursales
                      </Typography>
                    </Box>
                    
                    {/* Lista de sucursales */}
                    <SucursalesEmpresa empresaId={empresa.id} />
                  </Box>
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
