import React from 'react';
import { Container, Typography, Button, Grid, Paper, Box, List, ListItem, ListItemIcon, ListItemText, Divider, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

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
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: theme.palette.background.default,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 0,
        transition: 'background 0.3s',
      }}
    >
      <Container maxWidth="sm" sx={{ p: 0 }}>
        <Paper
          elevation={6}
          sx={{
            borderRadius: 4,
            p: { xs: 3, md: 5 },
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.15)',
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            backdropFilter: isDark ? 'blur(2px)' : 'none',
            transition: 'background 0.3s, color 0.3s',
          }}
        >
          <Typography variant="h3" component="h1" align="center" gutterBottom fontWeight={700}>
            Bienvenido a <span style={{ color: theme.palette.primary.light }}>Auditoría Pro</span>
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

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              component={Link}
              to="/login"
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
          </Box>
        </Paper>
        <Box
          sx={{
            textAlign: 'center',
            mt: 3,
            color: theme.palette.text.secondary,
            fontSize: 14,
            letterSpacing: 1,
            userSelect: 'none',
            transition: 'color 0.3s',
          }}
        >
          <Divider sx={{ mb: 1, bgcolor: isDark ? '#222' : '#eee' }} />
          <Typography variant="body2">
            Contacto: <a href="mailto:licvidalfernando@gmail.com" style={{ color: theme.palette.primary.light, textDecoration: 'none' }}>licvidalfernando@gmail.com</a>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
