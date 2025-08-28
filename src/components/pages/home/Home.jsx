import React from 'react';
import './Home.css';
import { Typography, Button, Grid, List, ListItem, ListItemIcon, ListItemText, Divider, useTheme, Box, useMediaQuery } from '@mui/material';
import { Link } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BusinessIcon from '@mui/icons-material/Business';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SmartAPKDownload from '../../common/SmartAPKDownload.jsx';
import SafeAreaContainer from '../../common/SafeAreaContainer';
import SafeAreaTest from '../../common/SafeAreaTest';

const features = [
  { icon: <CheckCircleIcon color="success" />, text: 'Gestión completa de formularios' },
  { icon: <DescriptionIcon color="primary" />, text: 'Generación automática de informes en PDF' },
  { icon: <AddCircleOutlineIcon color="secondary" />, text: 'Agregar, editar y eliminar secciones y preguntas' },
  { icon: <BusinessIcon color="info" />, text: 'Administración de establecimientos y sucursales' },
];

const steps = [
  { icon: <FormatListBulletedOutlinedIcon color="primary" />, text: 'Crea y gestiona formularios personalizados.' },
  { icon: <BusinessIcon color="secondary" />, text: 'Administra establecimientos y sucursales.' },
  { icon: <PictureAsPdfIcon color="success" />, text: 'Genera reportes detallados en PDF.' },
  { icon: <AssessmentIcon color="action" />, text: 'Visualiza estadísticas y resultados.' },
];

const Home = () => {
  // Debug log para renderizado
  console.debug('[Home] Renderizando página principal');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // 900px y superior
  const [showSafeAreaTest, setShowSafeAreaTest] = React.useState(false);

  // Si se debe mostrar la prueba de safe areas
  if (showSafeAreaTest) {
    return <SafeAreaTest onBack={() => setShowSafeAreaTest(false)} />;
  }

  return (
    <Box 
      className="page-container home-main-container"
      sx={{
        background: 'linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: isDesktop ? '40px 20px' : 0,
        width: '100%',
        maxWidth: isDesktop ? '1200px' : '100%',
        margin: isDesktop ? '0 auto' : 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <Box 
        className="content-container home-card"
        sx={{
          background: '#fff',
          borderRadius: isDesktop ? '20px' : '32px',
          boxShadow: isDesktop 
            ? '0 12px 40px rgba(0,0,0,0.1)' 
            : '0 8px 32px 0 rgba(60,60,120,0.15)',
          padding: isDesktop ? '40px 60px' : '48px 48px 32px 48px',
          maxWidth: isDesktop ? '900px' : '100%',
          width: '100%',
          textAlign: 'center',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          align="center" 
          gutterBottom 
          fontWeight={700} 
          sx={{ 
            mb: isDesktop ? 2 : 2, 
            mt: isDesktop ? 0 : 1,
            fontSize: isDesktop ? '2.5rem' : 'inherit',
            lineHeight: isDesktop ? '1.2' : 'inherit'
          }}
        >
          ¡Bienvenido a <span style={{ color: theme.palette.primary.light }}>Tu Control de Auditoría</span>
        </Typography>
        <Typography 
          variant="h6" 
          align="center" 
          gutterBottom 
          sx={{ 
            opacity: 0.85, 
            mb: isDesktop ? 4 : 3,
            fontSize: isDesktop ? '1.2rem' : 'inherit'
          }}
        >
          Plataforma web para gestión completa de auditorías y formularios.
        </Typography>

        <Divider sx={{ my: isDesktop ? 3 : 2, bgcolor: isDark ? '#333' : '#ddd', width: '100%' }} />

        <Grid 
          container 
          spacing={isDesktop ? 5 : 2} 
          sx={{ 
            width: '100%', 
            maxWidth: '100%', 
            margin: 0, 
            padding: 0,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            flexWrap: 'nowrap',
            gap: { xs: 1, md: 5 },
            alignItems: 'stretch',
            mt: isDesktop ? 5 : 4,
            mb: isDesktop ? 5 : 4
          }}
        >
          <Grid 
            item 
            xs={12} 
            md={6}
            sx={{
              flex: { md: '1 1 50%' },
              maxWidth: { md: '50%' },
              minWidth: { md: '50%' },
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              fontWeight={600} 
              align="center"
              sx={{
                fontSize: isDesktop ? '1.4rem' : 'inherit',
                mb: isDesktop ? 2 : 1
              }}
            >
              Características
            </Typography>
            <List sx={{ 
              paddingLeft: 0, 
              paddingRight: 0, 
              margin: 0, 
              width: '100%',
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {features.map((f, i) => (
                <ListItem 
                  key={i} 
                  sx={{ 
                    paddingLeft: 0, 
                    paddingRight: 0, 
                    justifyContent: isDesktop ? 'flex-start' : 'center', 
                    width: '100%',
                    textAlign: isDesktop ? 'left' : 'center',
                    py: isDesktop ? 1 : 0.5
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: isDesktop ? 36 : 32,
                    mr: isDesktop ? 1.5 : 0
                  }}>
                    {f.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={f.text} 
                    sx={{ 
                      textAlign: isDesktop ? 'left' : 'center', 
                      width: '100%',
                      '& .MuiListItemText-primary': {
                        fontSize: isDesktop ? '1rem' : 'inherit',
                        lineHeight: isDesktop ? '1.4' : 'inherit'
                      }
                    }} 
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid 
            item 
            xs={12} 
            md={6}
            sx={{
              flex: { md: '1 1 50%' },
              maxWidth: { md: '50%' },
              minWidth: { md: '50%' },
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              fontWeight={600} 
              align="center"
              sx={{
                fontSize: isDesktop ? '1.4rem' : 'inherit',
                mb: isDesktop ? 2 : 1
              }}
            >
              Funcionalidades Web
            </Typography>
            <List sx={{ 
              paddingLeft: 0, 
              paddingRight: 0, 
              margin: 0, 
              width: '100%',
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {steps.map((s, i) => (
                <ListItem 
                  key={i} 
                  sx={{ 
                    paddingLeft: 0, 
                    paddingRight: 0, 
                    justifyContent: isDesktop ? 'flex-start' : 'center', 
                    width: '100%',
                    textAlign: isDesktop ? 'left' : 'center',
                    py: isDesktop ? 1 : 0.5
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: isDesktop ? 36 : 32,
                    mr: isDesktop ? 1.5 : 0
                  }}>
                    {s.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={s.text} 
                    sx={{ 
                      textAlign: isDesktop ? 'left' : 'center', 
                      width: '100%',
                      '& .MuiListItemText-primary': {
                        fontSize: isDesktop ? '1rem' : 'inherit',
                        lineHeight: isDesktop ? '1.4' : 'inherit'
                      }
                    }} 
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>

        <Box sx={{ 
          textAlign: 'center', 
          marginTop: isDesktop ? 4 : 6, 
          width: '100%', 
          maxWidth: '100%' 
        }}>
          {/* Botones para funcionalidades web */}
          <Grid 
            container 
            spacing={2} 
            sx={{ 
              justifyContent: 'center',
              mb: 3
            }}
          >
            <Grid item>
              <Button
                component={Link}
                to="/editar"
                variant="contained"
                size="large"
                startIcon={<FormatListBulletedOutlinedIcon />}
                sx={{
                  background: isDark
                    ? 'linear-gradient(90deg, #222 0%, #666 100%)'
                    : 'linear-gradient(90deg, #90caf9 0%, #1976d2 100%)',
                  color: isDark ? '#fff' : '#222',
                  fontWeight: 700,
                  px: isDesktop ? 4 : 3,
                  py: isDesktop ? 1.5 : 1,
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  fontSize: isDesktop ? '1rem' : 'inherit',
                  minHeight: isDesktop ? 48 : 'auto',
                  '&:hover': {
                    background: isDark
                      ? 'linear-gradient(90deg, #333 0%, #888 100%)'
                      : 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
                  },
                  transition: 'background 0.3s, color 0.3s',
                }}
              >
                Formularios
              </Button>
            </Grid>
            <Grid item>
              <Button
                component={Link}
                to="/establecimiento"
                variant="contained"
                size="large"
                startIcon={<BusinessIcon />}
                sx={{
                  background: isDark
                    ? 'linear-gradient(90deg, #222 0%, #666 100%)'
                    : 'linear-gradient(90deg, #4caf50 0%, #2e7d32 100%)',
                  color: isDark ? '#fff' : '#222',
                  fontWeight: 700,
                  px: isDesktop ? 4 : 3,
                  py: isDesktop ? 1.5 : 1,
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  fontSize: isDesktop ? '1rem' : 'inherit',
                  minHeight: isDesktop ? 48 : 'auto',
                  '&:hover': {
                    background: isDark
                      ? 'linear-gradient(90deg, #333 0%, #888 100%)'
                      : 'linear-gradient(90deg, #2e7d32 0%, #1b5e20 100%)',
                  },
                  transition: 'background 0.3s, color 0.3s',
                }}
              >
                Establecimientos
              </Button>
            </Grid>
            <Grid item>
              <Button
                component={Link}
                to="/reporte"
                variant="contained"
                size="large"
                startIcon={<PictureAsPdfIcon />}
                sx={{
                  background: isDark
                    ? 'linear-gradient(90deg, #222 0%, #666 100%)'
                    : 'linear-gradient(90deg, #ff9800 0%, #f57c00 100%)',
                  color: isDark ? '#fff' : '#222',
                  fontWeight: 700,
                  px: isDesktop ? 4 : 3,
                  py: isDesktop ? 1.5 : 1,
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  fontSize: isDesktop ? '1rem' : 'inherit',
                  minHeight: isDesktop ? 48 : 'auto',
                  '&:hover': {
                    background: isDark
                      ? 'linear-gradient(90deg, #333 0%, #888 100%)'
                      : 'linear-gradient(90deg, #f57c00 0%, #ef6c00 100%)',
                  },
                  transition: 'background 0.3s, color 0.3s',
                }}
              >
                Reportes
              </Button>
            </Grid>
          </Grid>
          
          {/* Botón de prueba de safe areas */}
          <Button
            variant="outlined"
            size="medium"
            onClick={() => setShowSafeAreaTest(true)}
            sx={{
              borderColor: isDark ? '#666' : '#1976d2',
              color: isDark ? '#fff' : '#1976d2',
              fontSize: isDesktop ? '1rem' : 'inherit',
              minHeight: isDesktop ? 40 : 'auto',
              '&:hover': {
                borderColor: isDark ? '#888' : '#1565c0',
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(25,118,210,0.1)',
              },
              mt: 1
            }}
          >
            🧪 PROBAR SAFE AREAS
          </Button>
          
          {/* Sección de descarga de APK */}
          <Box 
            mt={isDesktop ? 4 : 3} 
            p={isDesktop ? 3 : 2} 
            sx={{ 
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderRadius: isDesktop ? 2 : 2,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              width: '100%'
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              fontWeight={600}
              sx={{
                fontSize: isDesktop ? '1.3rem' : 'inherit'
              }}
            >
              📱 Aplicación Móvil
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              mb={2}
              sx={{
                fontSize: isDesktop ? '1rem' : 'inherit'
              }}
            >
              Descarga nuestra aplicación móvil para realizar auditorías desde tu dispositivo Android
            </Typography>
            <SmartAPKDownload variant="outlined" size="large" showInfo={true} />
          </Box>
        </Box>
        <Divider sx={{ mb: 2, mt: isDesktop ? 4 : 3, width: '100%' }} />
        <Box 
          className="home-contact"
          sx={{
            fontSize: isDesktop ? '0.9rem' : '15px'
          }}
        >
          Contacto: <a href="mailto:licvidalfernando@gmail.com" style={{ color: "#1976d2", textDecoration: "none" }}>licvidalfernando@gmail.com</a>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
