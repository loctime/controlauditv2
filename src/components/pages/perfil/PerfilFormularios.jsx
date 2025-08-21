import React, { useState } from 'react';
import {
  Typography, Chip, CircularProgress, Button,
  useTheme, useMediaQuery, alpha
} from '@mui/material';
import { Draw as DrawIcon, Share as ShareIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import { usePermissions } from '../admin/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const PerfilFormularios = ({ formularios, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [openShareId, setOpenShareId] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [copying, setCopying] = useState(false);
  const { canCompartirFormularios } = usePermissions();

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

  // Calcular estadísticas del formulario
  const getFormularioStats = (form) => {
    const secciones = Array.isArray(form.secciones) ? form.secciones.length : 0;
    const preguntas = Array.isArray(form.secciones) 
      ? form.secciones.reduce((acc, s) => acc + (Array.isArray(s.preguntas) ? s.preguntas.length : 0), 0) 
      : 0;
    return { secciones, preguntas };
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '64px 16px',
        gap: '16px'
      }}>
        <CircularProgress size={48} />
        <Typography variant="h6" color="primary.main">
          Cargando formularios...
        </Typography>
      </div>
    );
  }

  if (!formularios || formularios.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '64px 16px',
        gap: '24px'
      }}>
        <DrawIcon style={{ fontSize: 64, color: theme.palette.text.secondary }} />
        <Typography variant="h5" color="text.secondary" style={{ textAlign: 'center' }}>
          No tienes formularios registrados
        </Typography>
        <Typography variant="body1" color="text.secondary" style={{ textAlign: 'center', maxWidth: 400 }}>
          Comienza creando tu primer formulario para realizar auditorías
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/editar')}
          style={{ marginTop: '16px' }}
        >
          📋 Crear Primer Formulario
        </Button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '16px'
      }}>
        <div>
          <Typography variant="h4" style={{ 
            fontWeight: 700, 
            color: theme.palette.primary.main, 
            marginBottom: '8px' 
          }}>
            📋 Mis Formularios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {formularios.length} formulario(s) registrado(s)
          </Typography>
        </div>
        
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/editar')}
          style={{ 
            padding: '12px 24px',
            fontWeight: 600,
            borderRadius: '8px'
          }}
        >
          🔧 Gestionar Formularios
        </Button>
        
      </div>

      {/* Lista de formularios */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px' 
      }}>
        {formularios.map((form) => {
          const stats = getFormularioStats(form);
          return (
            <div key={form.id} style={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: 'none',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              e.target.style.transform = 'translateY(0)';
            }}>
              <div style={{ padding: '24px' }}>
                {/* Estructura usando tabla CSS con 3 columnas */}
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse'
                }}>
                  <tbody>
                    <tr>
                      {/* Icono del formulario */}
                      <td style={{ 
                        width: '60px', 
                        verticalAlign: 'top',
                        paddingRight: '16px'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}>
                          <DrawIcon style={{ fontSize: 28, color: theme.palette.primary.main }} />
                        </div>
                      </td>
                      
                      {/* Información principal */}
                      <td style={{ 
                        verticalAlign: 'top',
                        paddingRight: '24px',
                        width: '50%'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <Typography variant="h6" style={{ 
                            fontWeight: 600, 
                            color: theme.palette.primary.main,
                            flex: 1,
                            minWidth: 0
                          }}>
                            {form.nombre}
                          </Typography>
                        </div>

                        {/* Estadísticas */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          marginBottom: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              fontSize: '0.75rem',
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              📊 Secciones: {stats.secciones}
                            </span>
                            <span style={{ 
                              fontSize: '0.75rem',
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              ❓ Preguntas: {stats.preguntas}
                            </span>
                          </div>
                        </div>

                        {/* Chips de estado */}
                        <div style={{
                          display: 'flex',
                          gap: '4px',
                          flexWrap: 'wrap'
                        }}>
                          {form.formularioOriginalId && (
                            <Chip 
                              label="Copia" 
                              size="small"
                              color="warning" 
                              style={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                            />
                          )}
                          {form.esPublico && (
                            <Chip 
                              label="Público" 
                              size="small"
                              color="success" 
                              style={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                            />
                          )}
                          {Array.isArray(form.compartidoCon) && form.compartidoCon.length > 0 && (
                            <Chip 
                              label="Compartido" 
                              size="small"
                              color="info" 
                              style={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                            />
                          )}
                        </div>
                      </td>
                      
                      {/* Acciones */}
                      <td style={{ 
                        verticalAlign: 'top',
                        width: '40%'
                      }}>
                        <Typography variant="subtitle2" style={{ 
                          fontWeight: 600, 
                          marginBottom: '8px',
                          color: theme.palette.text.primary
                        }}>
                          🔧 Acciones
                        </Typography>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleCompartir(form)}
                            disabled={!canCompartirFormularios || form.formularioOriginalId}
                            style={{ 
                              padding: '4px 8px',
                              fontSize: '0.7rem',
                              minWidth: 'auto',
                              justifyContent: 'flex-start'
                            }}
                            startIcon={<ShareIcon style={{ fontSize: 14 }} />}
                          >
                            Compartir
                          </Button>
                          
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={() => navigate(`/editar/${form.id}`)}
                            style={{ 
                              padding: '4px 8px',
                              fontSize: '0.7rem',
                              minWidth: 'auto',
                              justifyContent: 'flex-start'
                            }}
                            startIcon={<EditIcon style={{ fontSize: 14 }} />}
                          >
                            Editar
                          </Button>
                          
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleEliminarFormulario(form)}
                            style={{ 
                              padding: '4px 8px',
                              fontSize: '0.7rem',
                              minWidth: 'auto',
                              justifyContent: 'flex-start'
                            }}
                            startIcon={<DeleteIcon style={{ fontSize: 14 }} />}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Diálogo para compartir */}
      {openShareId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <Typography variant="h6" style={{ marginBottom: '16px', fontWeight: 600 }}>
              Compartir Formulario
            </Typography>
            <Typography style={{ marginBottom: '16px' }}>
              ¡Listo! Comparte este link con otros administradores:
            </Typography>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '16px'
            }}>
              <input
                value={shareLink}
                readOnly
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: theme.palette.background.default
                }}
              />
              <Button
                onClick={handleCopy}
                variant="contained"
                color="primary"
                size="small"
                disabled={copying}
                style={{ padding: '8px 16px' }}
              >
                {copying ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
            <Typography variant="body2" color="text.secondary" style={{ marginBottom: '16px' }}>
              Cualquier administrador podrá ver y copiar este formulario a su sistema.
            </Typography>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => setOpenShareId(null)}
                variant="outlined"
                color="primary"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilFormularios;
