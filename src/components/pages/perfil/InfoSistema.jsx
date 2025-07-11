import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Chip,
  Grid
} from "@mui/material";
import {
  Security as SecurityIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Share as ShareIcon,
  Group as GroupIcon,
  Info as InfoIcon,
  Person as PersonIcon
} from "@mui/icons-material";

const InfoSistema = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sistema de Permisos y Colaboración
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1">
          Este sistema implementa un control de acceso basado en usuarios para garantizar que cada usuario solo pueda ver y gestionar sus propios recursos, con opciones de colaboración.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Control de Empresas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Control de Empresas</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Propiedad Exclusiva"
                    secondary="Cada empresa tiene un propietario único que la creó"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Visibilidad Limitada"
                    secondary="Solo puedes ver las empresas que has creado"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <GroupIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Compartir con Socios"
                    secondary="Los socios pueden ver tus empresas y tú las suyas"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Control de Auditorías */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Control de Auditorías</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Auditorías Propias"
                    secondary="Solo puedes ver las auditorías que has realizado"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ShareIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Compartir Auditorías"
                    secondary="Puedes compartir auditorías específicas con otros usuarios"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <GroupIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Auditorías de Socios"
                    secondary="Puedes ver auditorías de tus socios"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sistema de Socios */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Sistema de Socios</Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                El sistema de socios permite una colaboración completa entre usuarios:
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ShareIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Compartir Empresas"
                    secondary="Los socios pueden ver y gestionar las mismas empresas"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AssessmentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Compartir Auditorías"
                    secondary="Los socios pueden ver todas las auditorías realizadas"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Acceso Completo"
                    secondary="Los socios tienen acceso completo a todos los recursos compartidos"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Funcionalidades del Perfil */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Funcionalidades del Perfil</Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                En tu perfil puedes gestionar todos los aspectos de tu cuenta:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip label="Ver Mis Empresas" color="primary" />
                <Chip label="Ver Mis Auditorías" color="primary" />
                <Chip label="Gestionar Socios" color="primary" />
                <Chip label="Auditorías Compartidas" color="primary" />
                <Chip label="Compartir Auditorías" color="primary" />
                <Chip label="Configurar Permisos" color="primary" />
              </Box>
              
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Acceso:</strong> Ve a "Mi Perfil" en el menú principal para acceder a todas estas funcionalidades.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Beneficios del Sistema */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Beneficios del Sistema
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Seguridad"
                    secondary="Cada usuario solo ve sus propios datos, garantizando la privacidad"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ShareIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Colaboración"
                    secondary="Sistema flexible para compartir recursos específicos o establecer sociedades"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <GroupIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Trabajo en Equipo"
                    secondary="Los socios pueden trabajar juntos en las mismas empresas y auditorías"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Control Granular"
                    secondary="Puedes decidir exactamente qué compartir y con quién"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InfoSistema; 