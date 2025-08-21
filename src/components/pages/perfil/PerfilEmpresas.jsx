import React, { useState, useEffect } from 'react';
import {
  Typography, Chip, CircularProgress, Button,
  useTheme, useMediaQuery, alpha
} from '@mui/material';
import { Business as BusinessIcon, Store as StoreIcon, LocationOn, Phone } from '@mui/icons-material';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useNavigate } from 'react-router-dom';

// Componente simple para mostrar sucursales en 2 columnas
const SucursalesList = ({ empresaId }) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    if (!empresaId) return;
    
    const q = query(collection(db, 'sucursales'), where('empresaId', '==', empresaId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSucursales(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [empresaId]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        padding: '8px 0',
        fontSize: '0.75rem',
        color: theme.palette.text.secondary
      }}>
        <CircularProgress size={16} />
        <span>Cargando sucursales...</span>
      </div>
    );
  }

  if (sucursales.length === 0) {
    return (
      <div style={{ 
        fontSize: '0.75rem',
        color: theme.palette.text.secondary,
        fontStyle: 'italic',
        padding: '8px 0'
      }}>
        Sin sucursales registradas
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(2, 1fr)', 
      gap: '6px',
      maxHeight: '120px',
      overflowY: 'auto'
    }}>
      {sucursales.map(sucursal => (
        <div key={sucursal.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 8px',
          backgroundColor: alpha(theme.palette.background.paper, 0.5),
          borderRadius: '6px',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          fontSize: '0.7rem',
          minHeight: '32px'
        }}>
          <StoreIcon style={{ fontSize: 12, color: theme.palette.secondary.main, flexShrink: 0 }} />
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2px',
            minWidth: 0,
            flex: 1
          }}>
            <span style={{ 
              fontWeight: 500, 
              color: theme.palette.text.primary,
              fontSize: '0.7rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {sucursal.nombre}
            </span>
            {sucursal.direccion && (
              <span style={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.65rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {sucursal.direccion}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const PerfilEmpresas = ({ empresas, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

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
          Cargando empresas...
        </Typography>
      </div>
    );
  }

  if (!empresas || empresas.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '64px 16px',
        gap: '24px'
      }}>
        <BusinessIcon style={{ fontSize: 64, color: theme.palette.text.secondary }} />
        <Typography variant="h5" color="text.secondary" style={{ textAlign: 'center' }}>
          No tienes empresas registradas
        </Typography>
        <Typography variant="body1" color="text.secondary" style={{ textAlign: 'center', maxWidth: 400 }}>
          Comienza creando tu primera empresa para gestionar auditorías
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/establecimiento')}
          style={{ marginTop: '16px' }}
        >
          🏢 Crear Primera Empresa
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
            🏢 Mis Empresas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {empresas.length} empresa(s) registrada(s)
          </Typography>
        </div>
        
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/establecimiento')}
          style={{ 
            padding: '12px 24px',
            fontWeight: 600,
            borderRadius: '8px'
          }}
        >
          🔧 Gestionar Empresas
        </Button>
      </div>

      {/* Lista de empresas */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px' 
      }}>
        {empresas.map((empresa) => (
          <div key={empresa.id} style={{
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
              {/* Estructura usando tabla CSS con 3 columnas - más espacio para sucursales */}
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse'
              }}>
                <tbody>
                  <tr>
                    {/* Logo */}
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
                        {empresa.logo ? (
                          <img 
                            src={empresa.logo} 
                            alt={`Logo ${empresa.nombre}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              borderRadius: '6px'
                            }}
                          />
                        ) : (
                          <BusinessIcon style={{ fontSize: 28, color: theme.palette.primary.main }} />
                        )}
                      </div>
                    </td>
                    
                    {/* Información principal */}
                    <td style={{ 
                      verticalAlign: 'top',
                      paddingRight: '24px',
                      width: '35%'
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
                          {empresa.nombre}
                        </Typography>
                        
                        <Chip 
                          label={empresa.activa ? "Activa" : "Inactiva"} 
                          size="small"
                          color={empresa.activa ? "success" : "default"} 
                          variant="outlined"
                          style={{ fontWeight: 500 }}
                        />
                      </div>

                      {/* Información adicional */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        {empresa.direccion && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <LocationOn style={{ fontSize: 16, color: theme.palette.text.secondary }} />
                            <Typography variant="body2" color="text.secondary">
                              {empresa.direccion}
                            </Typography>
                          </div>
                        )}
                        
                        {empresa.telefono && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone style={{ fontSize: 16, color: theme.palette.text.secondary }} />
                            <Typography variant="body2" color="text.secondary">
                              {empresa.telefono}
                            </Typography>
                          </div>
                        )}
                        
                        <Typography variant="caption" color="text.secondary" style={{ marginTop: '4px' }}>
                          📅 Creada: {empresa.createdAt ? new Date(empresa.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </div>
                    </td>
                    
                    {/* Sucursales - más espacio */}
                    <td style={{ 
                      verticalAlign: 'top',
                      width: '55%'
                    }}>
                      <Typography variant="subtitle2" style={{ 
                        fontWeight: 600, 
                        marginBottom: '8px',
                        color: theme.palette.text.primary
                      }}>
                        📍 Sucursales
                      </Typography>
                      <SucursalesList empresaId={empresa.id} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerfilEmpresas;
