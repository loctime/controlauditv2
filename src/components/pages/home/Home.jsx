import React, { useEffect, useState, useRef } from 'react';
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
  
  // Detectar si es PWA standalone
  const isPWAStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  
  // E.stados para carga de datos offline
  const [cargandoDatosOffline, setCargandoDatosOffline] = useState(false);
  const [datosCargados, setDatosCargados] = useState({
    empresas: false,
    sucursales: false,
    formularios: false
  });
  const [errorCarga, setErrorCarga] = useState(null);
  const hasCargadoDatos = useRef(false);
  
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

  // Hook para precarga automática en PWA Chrome
  const { shouldPreload, isPreloading, startPreload } = useChromePreload();

  // Forzar carga de datos SOLO en PWA y SOLO una vez
  useEffect(() => {
    const cargarDatosOffline = async () => {
      // Solo cargar en PWA standalone
      if (!isPWAStandalone) {
        console.log('ℹ️ [Home] No es PWA standalone, saltando carga automática');
        return;
      }

      // Solo ejecutar una vez
      if (hasCargadoDatos.current) {
        console.log('ℹ️ [Home] Datos ya cargados previamente');
        return;
      }

      if (!userProfile) {
        return;
      }

      hasCargadoDatos.current = true;
      setCargandoDatosOffline(true);

      console.log('🚀 [Home PWA] Iniciando carga forzada de datos para modo offline...');
      setErrorCarga(null);
      
      try {
        // Cargar todos los datos necesarios para TODAS las páginas
        console.log('🔄 [Home PWA] Cargando datos para todas las páginas...');
        const promesas = [
          getUserEmpresas(),
          getUserSucursales(),
          getUserFormularios()
        ];
        
        // Esperar a que todas las promesas se resuelvan
        console.log('⏳ [Home PWA] Esperando a que se carguen todos los datos...');

        const resultados = await Promise.allSettled(promesas);
        
        console.log('📊 [Home PWA] Resultados de carga:', {
          empresas: resultados[0]?.status,
          sucursales: resultados[1]?.status,
          formularios: resultados[2]?.status
        });
        
        console.log('✅ [Home PWA] Datos cargados:', {
          empresas: userEmpresas?.length || 0,
          sucursales: userSucursales?.length || 0,
          formularios: userFormularios?.length || 0
        });
        
        setDatosCargados({
          empresas: (userEmpresas?.length || 0) > 0,
          sucursales: (userSucursales?.length || 0) > 0,
          formularios: (userFormularios?.length || 0) > 0
        });
        
      } catch (error) {
        console.error('❌ [Home PWA] Error cargando datos offline:', error);
        setErrorCarga('Error cargando datos para modo offline');
      } finally {
        setCargandoDatosOffline(false);
      }
    };

    // Esperar un poco para que el contexto se inicialice
    const timer = setTimeout(cargarDatosOffline, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]); // Solo depende de userProfile - ignoramos otras deps intencionalmente para evitar bucle

  return (
    <div className="home-main-container">
      <div className="home-card">
          <Typography variant="h1" component="h1" align="center" gutterBottom fontWeight={700}>
          <span style={{ color: theme.palette.primary.light }}>Control-Audit</span>
        </Typography>
        

        {/* Indicador de datos cargados para modo offline - SOLO EN PWA */}
        {userProfile && isPWAStandalone && (
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity={Object.values(datosCargados).every(Boolean) ? "success" : "info"}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                <strong>Estado offline PWA:</strong>
                <br />
                📊 Empresas: {datosCargados.empresas ? `✅` : "❌"}     📋 Formularios: {datosCargados.formularios ? `✅` : "❌"}
                {shouldPreload && (
                  <>
                    <br />
                    📱 PWA Chrome detectado
                    <br />
                    {isPreloading ? (
                      <>⚡ Precargando páginas para optimización...</>
                    ) : (
                      <>✅ Precarga disponible</>
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
            
            {/* Botones para recarga de datos y precarga - SOLO EN PWA */}
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
              
              {shouldPreload && !isPreloading && (
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
        <Typography variant="h6" align="center" gutterBottom sx={{ opacity: 0.85 }}>
          Optimiza tus auditorías con nuestra plataforma profesional.
        </Typography>
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
