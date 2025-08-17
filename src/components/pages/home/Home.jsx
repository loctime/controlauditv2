import React from 'react';
import './Home.css';
import { Typography, Button, Grid, List, ListItem, ListItemIcon, ListItemText, Divider, useTheme, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DownloadAPK from '../../common/DownloadAPK';
import SafeAreaContainer from '../../common/SafeAreaContainer';
import SafeAreaTest from '../../common/SafeAreaTest';

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
  const [showSafeAreaTest, setShowSafeAreaTest] = React.useState(false);

  // Si se debe mostrar la prueba de safe areas
  if (showSafeAreaTest) {
    return <SafeAreaTest onBack={() => setShowSafeAreaTest(false)} />;
  }

  return (
    <Box 
      className="page-container"
      sx={{
        background: 'linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 0,
        width: '100vw',
        margin: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <Box className="content-container">
      <Typography variant="h3" component="h1" align="center" gutterBottom fontWeight={700} sx={{ mb: 2, mt: 1 }}>
        ¡Bienvenido a <span style={{ color: theme.palette.primary.light }}>Tu Control de Auditoría</span>
      </Typography>
      <Typography variant="h6" align="center" gutterBottom sx={{ opacity: 0.85, mb: 4 }}>
        Optimiza tus auditorías con nuestra plataforma profesional.
      </Typography>

      <Divider sx={{ my: 3, bgcolor: isDark ? '#333' : '#ddd', width: '100%' }} />

      <Grid container spacing={1} sx={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom fontWeight={600} align="center">
            Características
          </Typography>
          <List sx={{ paddingLeft: 0, paddingRight: 0, margin: 0, width: '100%' }}>
            {features.map((f, i) => (
              <ListItem key={i} sx={{ paddingLeft: 0, paddingRight: 0, justifyContent: 'center', width: '100%' }}>
                <ListItemIcon sx={{ minWidth: 32 }}>{f.icon}</ListItemIcon>
                <ListItemText primary={f.text} sx={{ textAlign: 'center', width: '100%' }} />
              </ListItem>
            ))}
          </List>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom fontWeight={600} align="center">
            Cómo Funciona
          </Typography>
          <List sx={{ paddingLeft: 0, paddingRight: 0, margin: 0, width: '100%' }}>
            {steps.map((s, i) => (
              <ListItem key={i} sx={{ paddingLeft: 0, paddingRight: 0, justifyContent: 'center', width: '100%' }}>
                <ListItemIcon sx={{ minWidth: 32 }}>{s.icon}</ListItemIcon>
                <ListItemText primary={s.text} sx={{ textAlign: 'center', width: '100%' }} />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>

      <Box sx={{ textAlign: 'center', marginTop: 32, width: '100%', maxWidth: '100%' }}>
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
            mb: 2
          }}
        >
          Comenzar
        </Button>
        
        {/* Botón de prueba de safe areas */}
        <Button
          variant="outlined"
          size="medium"
          onClick={() => setShowSafeAreaTest(true)}
          sx={{
            borderColor: isDark ? '#666' : '#1976d2',
            color: isDark ? '#fff' : '#1976d2',
            '&:hover': {
              borderColor: isDark ? '#888' : '#1565c0',
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(25,118,210,0.1)',
            },
            mt: 1
          }}
        >
          🧪 Probar Safe Areas
        </Button>
        
        {/* Sección de descarga de APK */}
        <Box mt={4} p={3} sx={{ 
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          borderRadius: 2,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          width: '100%'
        }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            📱 Aplicación Móvil
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Descarga nuestra aplicación móvil para realizar auditorías desde tu dispositivo Android
          </Typography>
          <DownloadAPK variant="outlined" size="large" showInfo={true} />
        </Box>
      </Box>
      <Divider sx={{ mb: 2, mt: 4, width: '100%' }} />
      <Box className="home-contact">
        Contacto: <a href="mailto:licvidalfernando@gmail.com" style={{ color: "#1976d2", textDecoration: "none" }}>licvidalfernando@gmail.com</a>
      </Box>
      </Box>
    </Box>
  );
};

export default Home;
