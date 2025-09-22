import React, { useEffect, useState } from 'react';
import './Home.css';
import { Typography, Button, Grid, List, ListItem, ListItemIcon, ListItemText, Divider, useTheme, Box, LinearProgress, Alert } from '@mui/material';
import { Link } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../../context/AuthContext';
import { useChromePreload } from '@/hooks/useChromePreload';

const features = [
  { icon: <CheckCircleIcon color="success" />, text: 'Gestión completa de formularios' },
  { icon: <DescriptionIcon color="primary" />, text: 'Generación automática de informes en PDF' },
  { icon: <AddCircleOutlineIcon color="secondary" />, text: 'Agregar, editar y eliminar secciones y preguntas' },
];

const steps = [
  { icon: <DescriptionIcon color="primary" />, text: 'Selecciona un formulario para comenzar una auditoría.' },
  { icon: <AddCircleOutlineIcon color="secondary" />, text: 'Agrega secciones y preguntas según tus necesidades.' },
  { icon: <CheckCircleIcon color="success" />, text: 'Completa el formulario y guarda tus respuestas.' },
  { icon: <AssessmentIcon color="action" />, text: 'Genera un informe detallado y visualiza los resultados.' },
];

const Home = () => {
  // Debug log para renderizado
  console.debug('[Home] Renderizando página principal');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // E.stados para carga de datos offline
  const [cargandoDatosOffline, setCargandoDatosOffline] = useState(true);
  const [datosCargados, setDatosCargados] = useState({
    empresas: false,
    sucursales: false,
    formularios: false
  });
  const [errorCarga, setErrorCarga] = useState(null);
  
  const { 
    userProfile, 
    userEmpresas, 
    userSucursales, 
    userFormularios,
    loadingEmpresas,
    loadingSucursales,
    loadingFormularios,
    getUserEmpresas,
    getUserSucursales,
    getUserFormularios
  } = useAuth();

  // Hook para precarga automática en Chrome
  const { isChrome, isPreloading, startPreload } = useChromePreload();

  // Forzar carga de todos los datos necesarios para modo offline
  useEffect(() => {
    const cargarDatosOffline = async () => {
      if (!userProfile) {
        setCargandoDatosOffline(false);
        return;
      }

      console.log('🚀 [Home] Iniciando carga forzada de datos para modo offline...');
      setErrorCarga(null);
      
      try {
        // Cargar todos los datos necesarios para TODAS las páginas
        console.log('🔄 [Home] Cargando datos para todas las páginas...');
        const promesas = [
          getUserEmpresas(),
          getUserSucursales(),
          getUserFormularios()
        ];
        
        // Esperar a que todas las promesas se resuelvan
        console.log('⏳ [Home] Esperando a que se carguen todos los datos...');

        const resultados = await Promise.allSettled(promesas);
        
        console.log('📊 [Home] Resultados de carga:', {
          empresas: resultados[0]?.status,
          sucursales: resultados[1]?.status,
          formularios: resultados[2]?.status
        });
        
        console.log('✅ [Home] Datos cargados:', {
          empresas: userEmpresas?.length || 0,
          sucursales: userSucursales?.length || 0,
          formularios: userFormularios?.length || 0
        });
        
        // Verificar si realmente se cargaron los datos
        if ((userEmpresas?.length || 0) === 0) {
          console.warn('⚠️ [Home] No se cargaron empresas');
        }
        if ((userSucursales?.length || 0) === 0) {
          console.warn('⚠️ [Home] No se cargaron sucursales');
        }
        if ((userFormularios?.length || 0) === 0) {
          console.warn('⚠️ [Home] No se cargaron formularios');
        }

        setDatosCargados({
          empresas: (userEmpresas?.length || 0) > 0,
          sucursales: (userSucursales?.length || 0) > 0,
          formularios: (userFormularios?.length || 0) > 0
        });
        
        // Si es Chrome y los datos se cargaron correctamente, iniciar precarga automática
        if (isChrome && Object.values(datosCargados).every(Boolean)) {
          console.log('🚀 [Home] Datos cargados, iniciando precarga automática para Chrome...');
          // Esperar un poco más para que la UI se estabilice
          setTimeout(() => {
            startPreload();
          }, 3000);
        }
        
      } catch (error) {
        console.error('❌ [Home] Error cargando datos offline:', error);
        setErrorCarga('Error cargando datos para modo offline');
      } finally {
        setCargandoDatosOffline(false);
      }
    };

    // Esperar un poco para que el contexto se inicialice
    const timer = setTimeout(cargarDatosOffline, 2000);
    return () => clearTimeout(timer);
  }, [userProfile, getUserEmpresas, getUserSucursales, getUserFormularios]);

  // Mostrar loading mientras se cargan los datos
  if (cargandoDatosOffline && userProfile) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Preparando datos para modo offline...
        </Typography>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body2" align="center" color="text.secondary">
          Cargando empresas, sucursales y formularios...
        </Typography>
      </Box>
    );
  }

  return (
    <div className="home-main-container">
      <div className="home-card">
        <Typography variant="h3" component="h1" align="center" gutterBottom fontWeight={700}>
          Bienvenido a <span style={{ color: theme.palette.primary.light }}>Control-Audit</span>
        </Typography>
        <Typography variant="h6" align="center" gutterBottom sx={{ opacity: 0.85 }}>
          Optimiza tus auditorías con nuestra plataforma profesional.
        </Typography>

        {/* Indicador de datos cargados para modo offline */}
        {userProfile && (
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity={Object.values(datosCargados).every(Boolean) ? "success" : "info"}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                <strong>Estado de datos offline:</strong>
                <br />
                📊 Empresas: {datosCargados.empresas ? `✅ ${userEmpresas?.length || 0} cargadas` : "❌ No cargadas"}
                <br />
                🏢 Sucursales: {datosCargados.sucursales ? `✅ ${userSucursales?.length || 0} cargadas` : "❌ No cargadas"}
                <br />
                📋 Formularios: {datosCargados.formularios ? `✅ ${userFormularios?.length || 0} cargados` : "❌ No cargados"}
                {isChrome && (
                  <>
                    <br />
                    🌐 Navegador: Chrome detectado
                    <br />
                    {isPreloading ? (
                      <>⚡ Precargando páginas para optimización...</>
                    ) : (
                      <>✅ Precarga automática disponible</>
                    )}
                  </>
                )}
              </Typography>
            </Alert>
            
            {errorCarga && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {errorCarga}
                <Button 
                  size="small" 
                  onClick={() => window.location.reload()} 
                  sx={{ ml: 2 }}
                >
                  Recargar página
                </Button>
              </Alert>
            )}
            
            {/* Botones para recarga de datos y precarga */}
            {userProfile && (
              <Box sx={{ textAlign: 'center', mb: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={async () => {
                    setCargandoDatosOffline(true);
                    setErrorCarga(null);
                    try {
                      await Promise.all([
                        getUserEmpresas(),
                        getUserSucursales(),
                        getUserFormularios()
                      ]);
                      setDatosCargados({
                        empresas: (userEmpresas?.length || 0) > 0,
                        sucursales: (userSucursales?.length || 0) > 0,
                        formularios: (userFormularios?.length || 0) > 0
                      });
                    } catch (error) {
                      setErrorCarga('Error al recargar datos');
                    } finally {
                      setCargandoDatosOffline(false);
                    }
                  }}
                  disabled={cargandoDatosOffline}
                >
                  {cargandoDatosOffline ? 'Cargando...' : '🔄 Recargar Datos'}
                </Button>
                
                {isChrome && !isPreloading && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={startPreload}
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                      '&:hover': { background: 'linear-gradient(90deg, #1565c0, #1976d2)' }
                    }}
                  >
                    ⚡ Precargar Páginas
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 16 }}>
          <Button
            component={Link}
            to="/auditoria"
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              background: isDark
                ? 'linear-gradient(90deg, #222 0%, #666 100%)'
                : 'linear-gradient(90deg, #90caf9 0%, #1976d2 100%)',
              color: isDark ? '#fff' : '#222',
              fontWeight: 700,
              px: 5,
              py: 1.5,
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                background: isDark
                  ? 'linear-gradient(90deg, #333 0%, #888 100%)'
                  : 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
              },
              transition: 'background 0.3s, color 0.3s',
            }}
          >
            Comenzar
          </Button>
        </div>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Características
            </Typography>
            <List>
              {features.map((f, i) => (
                <ListItem key={i}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{f.icon}</ListItemIcon>
                  <ListItemText primary={f.text} />
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Cómo Funciona
            </Typography>
            <List>
              {steps.map((s, i) => (
                <ListItem key={i}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{s.icon}</ListItemIcon>
                  <ListItemText primary={s.text} />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2, mt: 4 }} />
        <div className="home-contact">
          Contacto: <a href="mailto:licvidalfernando@gmail.com" style={{ color: "#1976d2", textDecoration: "none" }}>licvidalfernando@gmail.com</a>
        </div>
      </div>
    </div>
  );
};

export default Home;
