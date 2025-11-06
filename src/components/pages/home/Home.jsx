import React, { useEffect, useState, useRef } from 'react';
import './Home.css';
import { Typography, Button, Grid, List, ListItem, ListItemIcon, ListItemText, Divider, useTheme, Box, LinearProgress, Alert } from '@mui/material';
import { toast } from 'react-toastify';
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

  // Ejecutar precarga automática en Chrome PWA (una sola vez por sesión)
  useEffect(() => {
    // Verificar si ya se precargó en esta sesión
    const hasPreloadedThisSession = sessionStorage.getItem('chrome_preload_done') === 'true';
    
    // Verificar si el cache está actualizado (menos de 1 hora)
    const cacheTimestamp = localStorage.getItem('chrome_preload_timestamp');
    const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
    const cacheIsFresh = cacheAge < 60 * 60 * 1000; // 1 hora
    
    if (shouldPreload && !isPreloading && !hasPreloadedThisSession && isPWAStandalone && userProfile && userEmpresas?.length > 0) {
      // Si el cache es muy antiguo (más de 24 horas), permitir precarga nuevamente
      const shouldPreloadAgain = cacheAge > 24 * 60 * 60 * 1000; // 24 horas
      
      if (!cacheIsFresh || shouldPreloadAgain) {
        console.log('🚀 [Chrome PWA] Detectado - Ejecutando precarga automática en 3 segundos...');
        
        const preloadTimer = setTimeout(() => {
          console.log('🔄 [Chrome PWA] Iniciando precarga de páginas para cachear correctamente...');
          startPreload().then(() => {
            // Marcar como precargado en esta sesión
            sessionStorage.setItem('chrome_preload_done', 'true');
            // Guardar timestamp del cache
            localStorage.setItem('chrome_preload_timestamp', Date.now().toString());
          });
        }, 3000);
        
        return () => clearTimeout(preloadTimer);
      } else {
        console.log('ℹ️ [Chrome PWA] Cache reciente, saltando precarga automática');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPreload, isPWAStandalone, userProfile, userEmpresas?.length]);

  return (
    <div className="home-main-container">
      <div className="home-card">
        {/* Indicador de datos cargados para modo offline - SOLO EN PWA - PRIMERO */}
        {userProfile && isPWAStandalone && (() => {
          const isEdge = navigator.userAgent.includes('Edg');
          const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
          
          return (
            <Box sx={{ mb: 2 }}>
              <Alert 
                severity={Object.values(datosCargados).every(Boolean) ? "success" : "info"}
                sx={{ mb: 1, py: 0.5 }}
                dense
              >
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                  📊 {datosCargados.empresas ? '✅' : '❌'} 📋 {datosCargados.formularios ? '✅' : '❌'}
                </Typography>
              </Alert>
              
              {errorCarga && (
                <Alert severity="warning" sx={{ mb: 1, py: 0.5 }} dense>
                  <Typography variant="caption">{errorCarga}</Typography>
                  <Button 
                    size="small" 
                    onClick={() => window.location.reload()} 
                    sx={{ ml: 1, minWidth: 'auto', px: 1 }}
                  >
                    Recargar
                  </Button>
                </Alert>
              )}
              
              {/* Botones según navegador */}
              <Box sx={{ textAlign: 'center', mb: 1 }}>
                {/* Chrome: solo Precargar Páginas */}
                {isChrome && shouldPreload && !isPreloading && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={async () => {
                      sessionStorage.removeItem('chrome_preload_done');
                      await startPreload();
                      
                      if (userProfile && userEmpresas?.length > 0) {
                        try {
                          const { saveCompleteUserCache } = await import('../../../services/completeOfflineCache');
                          
                          const completeProfile = {
                            ...userProfile,
                            clienteAdminId: userProfile.clienteAdminId || userProfile.uid,
                            email: userProfile.email,
                            displayName: userProfile.displayName || userProfile.email,
                            role: userProfile.role || 'operario'
                          };
                          
                          await saveCompleteUserCache(
                            completeProfile,
                            userEmpresas || [],
                            userSucursales || [],
                            userFormularios || []
                          );
                          
                          localStorage.setItem('chrome_preload_timestamp', Date.now().toString());
                          toast.success(`✅ Cache guardado: ${userEmpresas.length} empresas, ${userSucursales?.length || 0} sucursales, ${userFormularios?.length || 0} formularios`, {
                            autoClose: 5000,
                            position: 'top-center'
                          });
                        } catch (error) {
                          console.error('❌ [Home Chrome] Error guardando cache:', error);
                          toast.error(`❌ Error guardando cache: ${error.message}`, {
                            autoClose: 7000,
                            position: 'top-center'
                          });
                        }
                      } else {
                        console.warn('⚠️ [Home Chrome] No hay datos para guardar en cache');
                        toast.warning('⚠️ No hay datos disponibles para guardar en cache. Asegúrate de estar conectado.', {
                          autoClose: 5000,
                          position: 'top-center'
                        });
                      }
                    }}
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                      '&:hover': { background: 'linear-gradient(90deg, #1565c0, #1976d2)' },
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1.5
                    }}
                  >
                    ⚡ Precargar
                  </Button>
                )}
                
                {/* Edge: solo Recargar Datos */}
                {isEdge && (
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
                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5 }}
                  >
                    {cargandoDatosOffline ? 'Cargando...' : '🔄 Recargar'}
                  </Button>
                )}
              </Box>
            </Box>
          );
        })()}

        {/* Título Control-Audit - más grande y notable */}
        <Typography 
          variant="h2" 
          component="h1" 
          align="center" 
          gutterBottom 
          sx={{
            fontWeight: 800,
            fontSize: { xs: '3.5rem', sm: '4rem', md: '4.5rem' },
            background: isDark 
              ? 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 3,
            mt: 2,
            textShadow: isDark ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
            letterSpacing: '0.02em'
          }}
        >
          Control-Audit
        </Typography>

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

        <Divider sx={{ mb: 3, mt: 4 }} />
        
        <div className="home-contact">
          Contacto: <a href="mailto:licvidalfernando@gmail.com" style={{ color: "#1976d2", textDecoration: "none" }}>licvidalfernando@gmail.com</a>
        </div>
      </div>
    </div>
  );
};

export default Home;
