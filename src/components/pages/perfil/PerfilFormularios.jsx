import React from 'react';
import {
  Box, Typography, ListItem, ListItemAvatar, Avatar, ListItemText, Alert,
  Accordion, AccordionSummary, AccordionDetails, Chip, Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  useTheme, useMediaQuery, alpha, Card, CardContent, IconButton, Grid
} from '@mui/material';
import './PerfilFormularios.css';
import { Draw as DrawIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import ShareIcon from '@mui/icons-material/Share';
import { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { usePermissions } from '../admin/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const PerfilFormularios = ({ formularios, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Log de depuración
  console.debug('[PerfilFormularios] formularios:', formularios);
  const [openShareId, setOpenShareId] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [copying, setCopying] = useState(false);
  const { canCompartirFormularios } = usePermissions();
  const navigate = useNavigate();

  const handleCompartir = async (form) => {
    if (!canCompartirFormularios) return;
    
    // Verificar si el formulario es propio (no copiado)
    if (form.formularioOriginalId) {
      console.warn('[PerfilFormularios] No se puede compartir un formulario copiado:', form.id);
      return;
    }
    
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

  const handleEliminarFormulario = async (form) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el formulario "${form.nombre}"? ¡Esta acción no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'formularios', form.id));
        Swal.fire('Eliminado', 'El formulario ha sido eliminado exitosamente.', 'success');
        // Recargar la página para actualizar la lista
        window.location.reload();
      } catch (error) {
        console.error('Error al eliminar formulario:', error);
        Swal.fire('Error', 'No se pudo eliminar el formulario.', 'error');
      }
    }
  };

  return (
    <Box className="perfil-formularios-container" sx={{ 
      p: isSmallMobile ? 1 : (isLargeScreen ? 1 : 2),
      bgcolor: 'background.paper',
      borderRadius: 0,
      border: 'none',
      boxShadow: 'none',
      width: '100%',
      maxWidth: '100%'
    }}>
      {/* Header con título y botón de gestión */}
      <Box className="formularios-header" sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: isSmallMobile ? 2 : 3,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isSmallMobile ? 2 : 3
      }}>
        <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
          <Typography 
            className="formularios-titulo"
            variant={isSmallMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              mb: 1,
              whiteSpace: 'normal',
              wordBreak: 'normal',
              overflowWrap: 'break-word'
            }}
          >
            📋 Mis Formularios
          </Typography>
          <Typography className="formularios-subtitulo" variant="body2" color="text.secondary">
            {formularios.length} formulario(s) registrado(s)
          </Typography>
        </Box>
        
        <Button
          className="formularios-boton"
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
        <Box className="formularios-carga" sx={{
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
        <Box className="formularios-vacio" sx={{
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
        <Grid container spacing={isLargeScreen ? 2 : 1.5}>
          {formularios.map((form) => (
            <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={form.id}>
              <Card className="formulario-card" sx={{
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                height: 'auto',
                display: 'flex',
                flexDirection: 'row',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  transition: 'all 0.3s ease'
                },
                transition: 'all 0.3s ease'
              }}>
                <CardContent className="formulario-card-content" sx={{ 
                  p: isSmallMobile ? 2 : 2.5,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  gap: 2
                }}>
                  {/* Avatar del formulario */}
                  <Avatar 
                    className="formulario-avatar"
                    sx={{ 
                      width: isSmallMobile ? 50 : 56, 
                      height: isSmallMobile ? 50 : 56,
                      bgcolor: 'primary.main',
                      flexShrink: 0
                    }}
                  >
                    <DrawIcon fontSize="medium" />
                  </Avatar>
                  
                  {/* Información del formulario */}
                  <Box className="formulario-info" sx={{ 
                    flex: 1,
                    minWidth: 0
                  }}>
                    <Typography 
                      className="formulario-nombre"
                      variant={isSmallMobile ? "h6" : "h6"} 
                      sx={{ 
                        fontWeight: 600, 
                        color: 'primary.main',
                        mb: 0.5,
                        whiteSpace: 'normal',
                        wordBreak: 'normal',
                        overflowWrap: 'break-word',
                        lineHeight: 1.2
                      }}
                    >
                      {form.nombre}
                    </Typography>
                    
                    <Box className="formulario-stats" sx={{ 
                      display: 'flex', 
                      flexDirection: 'row',
                      gap: 2,
                      alignItems: 'center',
                      mb: 1
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        <strong>Secciones:</strong> {Array.isArray(form.secciones) ? form.secciones.length : 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        <strong>Preguntas:</strong> {Array.isArray(form.secciones) ? form.secciones.reduce((acc, s) => acc + (Array.isArray(s.preguntas) ? s.preguntas.length : 0), 0) : 0}
                      </Typography>
                    </Box>
                    
                    <Box className="formulario-chips" sx={{ 
                      display: 'flex', 
                      flexDirection: 'row',
                      gap: 0.5,
                      flexWrap: 'wrap'
                    }}>
                      {form.formularioOriginalId && (
                        <Chip 
                          label="Copia" 
                          size="small"
                          color="warning" 
                          sx={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                        />
                      )}
                      {form.esPublico && (
                        <Chip 
                          label="Público" 
                          size="small"
                          color="success" 
                          sx={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                        />
                      )}
                      {Array.isArray(form.compartidoCon) && form.compartidoCon.length > 0 && (
                        <Chip 
                          label="Compartido" 
                          size="small"
                          color="info" 
                          sx={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  {/* Acciones del formulario */}
                  <Box className="formulario-actions" sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    flexShrink: 0
                  }}>
                    <Tooltip title={form.formularioOriginalId ? 'No puedes compartir un formulario copiado' : 'Compartir formulario'}>
                      <span>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => handleCompartir(form)}
                          disabled={!canCompartirFormularios || form.formularioOriginalId}
                          sx={{ 
                            py: 0.5,
                            px: 1,
                            fontSize: '0.7rem',
                            minWidth: 'auto'
                          }}
                        >
                          📤
                        </Button>
                      </span>
                    </Tooltip>
                    
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() => navigate(`/editar/${form.id}`)}
                      sx={{ 
                        py: 0.5,
                        px: 1,
                        fontSize: '0.7rem',
                        minWidth: 'auto'
                      }}
                    >
                      ✏️
                    </Button>
                    
                    <Tooltip title="Eliminar formulario">
                      <span>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleEliminarFormulario(form)}
                          sx={{ 
                            py: 0.5,
                            px: 1,
                            fontSize: '0.7rem',
                            minWidth: 'auto'
                          }}
                        >
                          🗑️
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
