import React from 'react';
import {
  Box, Typography, ListItem, ListItemAvatar, Avatar, ListItemText, Alert,
  Accordion, AccordionSummary, AccordionDetails, Chip, Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  useTheme, useMediaQuery, alpha, Card, CardContent, IconButton
} from '@mui/material';
import { Draw as DrawIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import ShareIcon from '@mui/icons-material/Share';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { usePermissions } from '../admin/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';

const PerfilFormularios = ({ formularios, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Log de depuración
  console.debug('[PerfilFormularios] formularios:', formularios);
  const [openShareId, setOpenShareId] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [copying, setCopying] = useState(false);
  const { canCompartirFormularios } = usePermissions();
  const navigate = useNavigate();

  const handleCompartir = async (form) => {
    if (!canCompartirFormularios) return;
    let publicSharedId = form.publicSharedId;
    if (!form.esPublico || !form.publicSharedId) {
      publicSharedId = uuidv4();
      await updateDoc(doc(db, 'formularios', form.id), {
        esPublico: true,
        publicSharedId
      });
      console.debug('[CompartirFormulario] Formulario actualizado como público:', form.id, publicSharedId);
    }
    const url = `${window.location.origin}/formularios/public/${publicSharedId}`;
    setShareLink(url);
    setOpenShareId(form.id);
  };

  const handleCopy = async () => {
    setCopying(true);
    await navigator.clipboard.writeText(shareLink);
    setTimeout(() => setCopying(false), 1000);
  };

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
            📋 Mis Formularios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formularios.length} formulario(s) registrado(s)
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            console.log('[PerfilFormularios] Navegando a /editar');
            navigate('/editar');
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
          🔧 Gestionar Formularios
        </Button>
      </Box>
      
      {/* Contenido de formularios */}
      {loading ? (
        <Box sx={{
          bgcolor: alpha(theme.palette.info.main, 0.05),
          borderRadius: 2,
          p: isSmallMobile ? 3 : 4,
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          textAlign: 'center'
        }}>
          <Typography variant="body1" color="info.main">
            Cargando formularios...
          </Typography>
        </Box>
      ) : formularios.length === 0 ? (
        <Box sx={{
          bgcolor: alpha(theme.palette.warning.main, 0.05),
          borderRadius: 2,
          p: isSmallMobile ? 3 : 4,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
          textAlign: 'center'
        }}>
          <DrawIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" color="warning.main" sx={{ mb: 1 }}>
            No tienes formularios registrados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comienza creando tu primer formulario para realizar auditorías
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isSmallMobile ? 2 : 3 
        }}>
          {formularios.map((form) => (
            <Card key={form.id} sx={{
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
                {/* Header del formulario */}
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
                      sx={{ 
                        width: isSmallMobile ? 60 : 80, 
                        height: isSmallMobile ? 60 : 80,
                        bgcolor: 'primary.main'
                      }}
                    >
                      <DrawIcon fontSize="large" />
                    </Avatar>
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1,
                    textAlign: isMobile ? 'center' : 'left',
                    minWidth: 0
                  }}>
                    <Typography 
                      variant={isSmallMobile ? "h6" : "h5"} 
                      sx={{ 
                        fontWeight: 600, 
                        color: 'primary.main',
                        mb: 1,
                        wordBreak: 'break-word'
                      }}
                    >
                      {form.nombre}
                    </Typography>
                    
                    {form.descripcion && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          mb: 2,
                          wordBreak: 'break-word',
                          textAlign: isMobile ? 'center' : 'left'
                        }}
                      >
                        {form.descripcion}
                      </Typography>
                    )}
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: isSmallMobile ? 1 : 2,
                      alignItems: isMobile ? 'center' : 'flex-start'
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Secciones:</strong> {Array.isArray(form.secciones) ? form.secciones.length : 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Preguntas:</strong> {Array.isArray(form.secciones) ? form.secciones.reduce((acc, s) => acc + (Array.isArray(s.preguntas) ? s.preguntas.length : 0), 0) : 0}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 1,
                    alignItems: isMobile ? 'center' : 'flex-end'
                  }}>
                    {form.esPublico && (
                      <Chip 
                        label="Público" 
                        size={isSmallMobile ? "small" : "medium"}
                        color="success" 
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    {Array.isArray(form.compartidoCon) && form.compartidoCon.length > 0 && (
                      <Chip 
                        label="Compartido" 
                        size={isSmallMobile ? "small" : "medium"}
                        color="info" 
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>
                </Box>
                
                {/* Acciones del formulario */}
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
                    🔗 Acciones
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isSmallMobile ? 1 : 2,
                    justifyContent: isMobile ? 'center' : 'flex-start'
                  }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size={isSmallMobile ? "small" : "medium"}
                      onClick={() => handleCompartir(form)}
                      disabled={!canCompartirFormularios}
                      sx={{ 
                        minWidth: isMobile ? '100%' : 'auto',
                        py: isSmallMobile ? 1 : 1.5
                      }}
                    >
                      📤 Compartir
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="secondary"
                      size={isSmallMobile ? "small" : "medium"}
                      onClick={() => navigate(`/editar/${form.id}`)}
                      sx={{ 
                        minWidth: isMobile ? '100%' : 'auto',
                        py: isSmallMobile ? 1 : 1.5
                      }}
                    >
                      ✏️ Editar
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      {/* Diálogo para compartir */}
      <Dialog open={openShareId !== null} onClose={() => setOpenShareId(null)}>
        <DialogTitle>Compartir Formulario</DialogTitle>
        <DialogContent>
          <Typography>
            ¡Listo! Comparte este link con otros administradores:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <TextField
              value={shareLink}
              fullWidth
              InputProps={{ readOnly: true }}
              size="small"
            />
            <Button
              onClick={handleCopy}
              startIcon={<ContentCopyIcon />}
              sx={{ ml: 1 }}
              disabled={copying}
            >
              {copying ? 'Copiado!' : 'Copiar'}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Cualquier administrador podrá ver y copiar este formulario a su sistema.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShareId(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerfilFormularios;
