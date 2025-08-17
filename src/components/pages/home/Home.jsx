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

  return (
    <div className="home-main-container">
      <div className="home-card">
        <Typography variant="h3" component="h1" align="center" gutterBottom fontWeight={700}>
          AABienvenido a <span style={{ color: theme.palette.primary.light }}>Tu Control de Auditoría</span>
        </Typography>
        <Typography variant="h6" align="center" gutterBottom sx={{ opacity: 0.85 }}>
          Optimiza tus auditorías con nuestra plataforma profesional.
        </Typography>

        <Divider sx={{ my: 3, bgcolor: isDark ? '#333' : '#ddd' }} />

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

        <div style={{ textAlign: 'center', marginTop: 32 }}>
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
          
          {/* Sección de descarga de APK */}
          <Box mt={4} p={3} sx={{ 
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: 2,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
          }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              📱 Aplicación Móvil
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Descarga nuestra aplicación móvil para realizar auditorías desde tu dispositivo Android
            </Typography>
            <DownloadAPK variant="outlined" size="large" showInfo={true} />
          </Box>
        </div>
        <Divider sx={{ mb: 2, mt: 4 }} />
        <div className="home-contact">
          Contacto: <a href="mailto:licvidalfernando@gmail.com" style={{ color: "#1976d2", textDecoration: "none" }}>licvidalfernando@gmail.com</a>
        </div>
      </div>
    </div>
  );
};

export default Home;
