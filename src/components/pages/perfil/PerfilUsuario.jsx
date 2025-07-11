import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tab,
  Tabs,
  Paper
} from "@mui/material";
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';
import InfoSistema from "./InfoSistema";

const PerfilUsuario = () => {
  const {
    userProfile,
    userEmpresas,
    userAuditorias,
    socios,
    auditoriasCompartidas,
    agregarSocio,
    compartirAuditoria,
    updateUserProfile
  } = useAuth();

  const [tabValue, setTabValue] = useState(0);
  const [emailSocio, setEmailSocio] = useState("");
  const [emailCompartir, setEmailCompartir] = useState("");
  const [auditoriaSeleccionada, setAuditoriaSeleccionada] = useState("");
  const [openDialogSocio, setOpenDialogSocio] = useState(false);
  const [openDialogCompartir, setOpenDialogCompartir] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAgregarSocio = async () => {
    if (!emailSocio.trim()) {
      Swal.fire('Error', 'Por favor ingresa un email válido', 'error');
      return;
    }

    setLoading(true);
    try {
      await agregarSocio(emailSocio);
      setEmailSocio("");
      setOpenDialogSocio(false);
      Swal.fire('Éxito', 'Socio agregado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompartirAuditoria = async () => {
    if (!emailCompartir.trim() || !auditoriaSeleccionada) {
      Swal.fire('Error', 'Por favor completa todos los campos', 'error');
      return;
    }

    setLoading(true);
    try {
      await compartirAuditoria(auditoriaSeleccionada, emailCompartir);
      setEmailCompartir("");
      setAuditoriaSeleccionada("");
      setOpenDialogCompartir(false);
      Swal.fire('Éxito', 'Auditoría compartida correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updates) => {
    try {
      await updateUserProfile(updates);
      Swal.fire('Éxito', 'Perfil actualizado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', 'Error al actualizar el perfil', 'error');
    }
  };

  if (!userProfile) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando perfil...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Mi Perfil
      </Typography>

      <Grid container spacing={3}>
        {/* Información del Usuario */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Typography variant="h6">
                  {userProfile.displayName}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <EmailIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                {userProfile.email}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Miembro desde: {new Date(userProfile.createdAt?.seconds * 1000).toLocaleDateString()}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Permisos:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {userProfile.permisos?.puedeCrearEmpresas && (
                    <Chip label="Crear Empresas" size="small" color="primary" />
                  )}
                  {userProfile.permisos?.puedeCompartirAuditorias && (
                    <Chip label="Compartir Auditorías" size="small" color="primary" />
                  )}
                  {userProfile.permisos?.puedeAgregarSocios && (
                    <Chip label="Agregar Socios" size="small" color="primary" />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contenido Principal */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%' }}>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Mis Empresas" icon={<BusinessIcon />} />
              <Tab label="Mis Auditorías" icon={<AssessmentIcon />} />
              <Tab label="Mis Socios" icon={<PersonIcon />} />
              <Tab label="Auditorías Compartidas" icon={<ShareIcon />} />
              <Tab label="Info del Sistema" icon={<InfoIcon />} />
            </Tabs>

            {/* Tab: Mis Empresas */}
            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Mis Empresas</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userEmpresas.length} empresa(s)
                  </Typography>
                </Box>
                
                {userEmpresas.length === 0 ? (
                  <Alert severity="info">
                    No tienes empresas registradas. Crea tu primera empresa para comenzar.
                  </Alert>
                ) : (
                  <List>
                    {userEmpresas.map((empresa) => (
                      <ListItem key={empresa.id} divider>
                        <ListItemAvatar>
                          <Avatar>
                            <BusinessIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={empresa.nombre}
                          secondary={`${empresa.direccion} • ${empresa.telefono}`}
                        />
                        <Chip label="Propietario" size="small" color="primary" />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Tab: Mis Auditorías */}
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Mis Auditorías</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userAuditorias.length} auditoría(s)
                  </Typography>
                </Box>
                
                {userAuditorias.length === 0 ? (
                  <Alert severity="info">
                    No tienes auditorías realizadas. Realiza tu primera auditoría.
                  </Alert>
                ) : (
                  <List>
                    {userAuditorias.map((auditoria) => (
                      <ListItem key={auditoria.id} divider>
                        <ListItemAvatar>
                          <Avatar>
                            <AssessmentIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={auditoria.nombreArchivo || 'Auditoría sin nombre'}
                          secondary={`${auditoria.empresa?.nombre || 'Empresa'} • ${new Date(auditoria.fechaGuardado?.seconds * 1000).toLocaleDateString()}`}
                        />
                        <IconButton
                          onClick={() => {
                            setAuditoriaSeleccionada(auditoria.id);
                            setOpenDialogCompartir(true);
                          }}
                          color="primary"
                        >
                          <ShareIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Tab: Mis Socios */}
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Mis Socios</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialogSocio(true)}
                  >
                    Agregar Socio
                  </Button>
                </Box>
                
                {socios.length === 0 ? (
                  <Alert severity="info">
                    No tienes socios agregados. Agrega socios para compartir empresas y auditorías.
                  </Alert>
                ) : (
                  <List>
                    {socios.map((socio) => (
                      <ListItem key={socio.id} divider>
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={socio.displayName}
                          secondary={socio.email}
                        />
                        <Chip label="Socio" size="small" color="secondary" />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Tab: Auditorías Compartidas */}
            {tabValue === 3 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Auditorías Compartidas Conmigo</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {auditoriasCompartidas.length} auditoría(s)
                  </Typography>
                </Box>
                
                {auditoriasCompartidas.length === 0 ? (
                  <Alert severity="info">
                    No tienes auditorías compartidas contigo.
                  </Alert>
                ) : (
                  <List>
                    {auditoriasCompartidas.map((auditoria) => (
                      <ListItem key={auditoria.id} divider>
                        <ListItemAvatar>
                          <Avatar>
                            <AssessmentIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={auditoria.nombreArchivo || 'Auditoría sin nombre'}
                          secondary={`${auditoria.empresa?.nombre || 'Empresa'} • Compartida por ${auditoria.usuario} • ${new Date(auditoria.fechaGuardado?.seconds * 1000).toLocaleDateString()}`}
                        />
                        <Chip label="Compartida" size="small" color="success" />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Tab: Info del Sistema */}
            {tabValue === 4 && (
              <Box sx={{ p: 3 }}>
                <InfoSistema />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog para agregar socio */}
      <Dialog open={openDialogSocio} onClose={() => setOpenDialogSocio(false)}>
        <DialogTitle>Agregar Socio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email del socio"
            type="email"
            fullWidth
            variant="outlined"
            value={emailSocio}
            onChange={(e) => setEmailSocio(e.target.value)}
            placeholder="usuario@ejemplo.com"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Los socios podrán ver tus empresas y auditorías, y tú podrás ver las suyas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogSocio(false)}>Cancelar</Button>
          <Button 
            onClick={handleAgregarSocio} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Agregando...' : 'Agregar Socio'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para compartir auditoría */}
      <Dialog open={openDialogCompartir} onClose={() => setOpenDialogCompartir(false)}>
        <DialogTitle>Compartir Auditoría</DialogTitle>
        <DialogContent>
          <TextField
            select
            margin="dense"
            label="Seleccionar Auditoría"
            fullWidth
            variant="outlined"
            value={auditoriaSeleccionada}
            onChange={(e) => setAuditoriaSeleccionada(e.target.value)}
            sx={{ mb: 2 }}
          >
            {userAuditorias.map((auditoria) => (
              <option key={auditoria.id} value={auditoria.id}>
                {auditoria.nombreArchivo || 'Auditoría sin nombre'}
              </option>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Email del usuario"
            type="email"
            fullWidth
            variant="outlined"
            value={emailCompartir}
            onChange={(e) => setEmailCompartir(e.target.value)}
            placeholder="usuario@ejemplo.com"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            El usuario podrá ver y copiar esta auditoría.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogCompartir(false)}>Cancelar</Button>
          <Button 
            onClick={handleCompartirAuditoria} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Compartiendo...' : 'Compartir Auditoría'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerfilUsuario; 