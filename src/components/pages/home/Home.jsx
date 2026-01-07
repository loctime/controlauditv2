import React, { useEffect, useState, useRef } from 'react';
import './Home.css';
import { Typography, Button, Grid, List, ListItem, ListItemIcon, ListItemText, Divider, useTheme, Box, LinearProgress, Alert } from '@mui/material';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '@/components/context/AuthContext';
import { useChromePreload } from '@/hooks/useChromePreload';
import { shouldEnableOffline } from '../../../utils/pwaDetection';

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
  const navigate = useNavigate();
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
    getUserSucursales,
    getUserFormularios,
    authReady
  } = useAuth();

  // Hook para precarga automática en PWA Chrome
  const { shouldPreload, isPreloading, startPreload } = useChromePreload();

  // Forzar carga de datos SOLO en PWA y SOLO una vez por día
  useEffect(() => {
    const cargarDatosOffline = async () => {
      // Solo cargar en PWA standalone
      if (!isPWAStandalone) {
        return;
      }

      // Solo ejecutar una vez por sesión
      if (hasCargadoDatos.current) {
        return;
      }

      if (!userProfile) {
        return;
      }

      // CRÍTICO: Esperar hasta que authReady sea true antes de ejecutar queries
      if (!authReady) {
        return;
      }

      // Verificar si ya se ejecutó automáticamente hoy (una vez por día)
      const lastAutoLoad = localStorage.getItem('edge_auto_reload_timestamp');
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
      
      if (lastAutoLoad) {
        const timeSinceLastLoad = now - parseInt(lastAutoLoad);
        if (timeSinceLastLoad < oneDayInMs) {
          return;
        }
      }

      hasCargadoDatos.current = true;
      setCargandoDatosOffline(true);
      
      // Marcar que se ejecutó automáticamente hoy
      localStorage.setItem('edge_auto_reload_timestamp', now.toString());
      setErrorCarga(null);
      
      try {
        // Detectar si es Edge
        const isEdge = navigator.userAgent.includes('Edg');
        
        // Cargar todos los datos necesarios para TODAS las páginas
        // NOTA: Las empresas se cargan automáticamente con useEmpresasQuery en AuthContext
        // Solo cargar sucursales y formularios aquí
        const promesas = [
          getUserSucursales(),
          getUserFormularios()
        ];

        const resultados = await Promise.allSettled(promesas);
        
        // Capturar los valores retornados directamente (no depender del estado)
        // Las empresas se cargan automáticamente con useEmpresasQuery en AuthContext
        const sucursalesCargadas = resultados[0]?.status === 'fulfilled' ? resultados[0].value : [];
        const formulariosCargados = resultados[1]?.status === 'fulfilled' ? resultados[1].value : [];
        
        setDatosCargados({
          empresas: (userEmpresas?.length || 0) > 0, // Usar userEmpresas del contexto
          sucursales: (sucursalesCargadas?.length || 0) > 0,
          formularios: (formulariosCargados?.length || 0) > 0
        });
        
        // CRÍTICO para Edge PWA: Navegar a /auditoria para inicializar IndexedDB y hooks necesarios
        // Esto asegura que Edge PWA funcione offline después
        // El componente Auditoria ejecuta useAuditoriaData que inicializa todo lo necesario
        if (isEdge) {
          // Guardar la ruta actual para volver después
          const returnPath = window.location.pathname;
          
          // Navegar a /auditoria para que se monte el componente y ejecute los hooks
          navigate('/auditoria');
          
          // Esperar un momento para que el componente se monte y ejecute los hooks
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Volver a Home después de inicializar
          navigate(returnPath);
        }
        
      } catch (error) {
        console.error('Error cargando datos offline:', error);
        setErrorCarga('Error cargando datos para modo offline');
      } finally {
        setCargandoDatosOffline(false);
      }
    };

    // Esperar hasta que authReady sea true antes de ejecutar
    // Esto previene queries prematuras que causan errores de permisos
    if (!authReady) {
      return;
    }
    
    // Solo ejecutar cuando authReady sea true
    // Esto previene queries prematuras que causan errores de permisos
    if (!authReady) {
      return;
    }
    
    // Esperar un poco para que el contexto se inicialize completamente
    const timer = setTimeout(cargarDatosOffline, 500);
    return () => clearTimeout(timer);
  }, [isPWAStandalone, userProfile, authReady, userEmpresas, getUserSucursales, getUserFormularios, navigate]);

  // Actualizar indicador cuando cambien los datos (desde listeners u otros lugares)
  useEffect(() => {
    if (userProfile && isPWAStandalone) {
      setDatosCargados({
        empresas: (userEmpresas?.length || 0) > 0,
        sucursales: (userSucursales?.length || 0) > 0,
        formularios: (userFormularios?.length || 0) > 0
      });
    }
  }, [userProfile, userEmpresas?.length, userSucursales?.length, userFormularios?.length, isPWAStandalone]);

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
                      
                      // Solo guardar cache si estamos en móvil (modo offline habilitado)
                      if (shouldEnableOffline() && userProfile && userEmpresas?.length > 0) {
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
                      } else if (!shouldEnableOffline()) {
                        console.log('💻 Desktop: Precarga completada (cache offline no necesario)');
                        toast.success('✅ Precarga completada', {
                          autoClose: 3000,
                          position: 'top-center'
                        });
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
                
                {/* .Edge: solo Recargar Datos */}
                {isEdge && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      setCargandoDatosOffline(true);
                      setErrorCarga(null);
                      try {
                        // Primero cargar datos desde la red (si hay conexión)
                        // NOTA: Las empresas se cargan automáticamente con useEmpresasQuery en AuthContext
                        // Solo cargar sucursales y formularios aquí
                        const [sucursalesCargadas, formulariosCargados] = await Promise.all([
                          getUserSucursales(),
                          getUserFormularios()
                        ]);
                        const empresasCargadas = userEmpresas || []; // Usar empresas del contexto
                        
                        // CRÍTICO: Navegar a /auditoria para inicializar IndexedDB y hooks necesarios
                        // Esto asegura que Edge PWA funcione offline después
                        // El componente Auditoria ejecuta useAuditoriaData que inicializa todo lo necesario
                        const returnPath = window.location.pathname;
                        
                        // Navegar a /auditoria para que se monte el componente y ejecute los hooks
                        navigate('/auditoria');
                        
                        // Esperar un momento para que el componente se monte y ejecute los hooks
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        // Volver a Home después de inicializar
                        navigate(returnPath);
                        
                        // Usar los valores retornados directamente (no depender del estado que puede no estar actualizado)
                        setDatosCargados({
                          empresas: (empresasCargadas?.length || 0) > 0,
                          sucursales: (sucursalesCargadas?.length || 0) > 0,
                          formularios: (formulariosCargados?.length || 0) > 0
                        });
                        
                        toast.success('✅ Datos recargados e inicializados correctamente', {
                          autoClose: 3000,
                          position: 'top-center'
                        });
                      } catch (error) {
                        console.error('Error al recargar datos:', error);
                        setErrorCarga('Error al recargar datos');
                        toast.error('❌ Error al recargar datos', {
                          autoClose: 3000,
                          position: 'top-center'
                        });
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
          component="h1" 
          align="center" 
          gutterBottom 
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            background: isDark 
              ? 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 1.5,
            mt: 2,
            textShadow: isDark ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
            letterSpacing: '0.01em',
            '&.MuiTypography-root': {
              fontSize: { xs: '1.75rem !important', sm: '2rem !important', md: '2.25rem !important' }
            }
          }}
        >
          Control-Audit
        </Typography>

        <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 16 }}>
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
        <Typography variant="h2" component="h2" align="center" gutterBottom sx={{ opacity: 0.85, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Optimiza tus auditorías con nuestra plataforma profesional.
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h4" gutterBottom fontWeight={600}>
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
            <Typography variant="h4" component="h4" gutterBottom fontWeight={600}>
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
          Contacto: <a href="mailto:licvidalfernando@gmail.com" style={{ color: "#1565c0", textDecoration: "underline", fontWeight: 500 }}>licvidalfernando@gmail.com</a>
        </div>
      </div>
    </div>
  );
};

export default Home;
