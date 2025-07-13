import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  useTheme,
  alpha,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Help as HelpIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import Firma from './Firma';

const ResumenAuditoriaModal = ({ 
  open, 
  onClose, 
  empresa, 
  sucursal, 
  formulario, 
  respuestas, 
  secciones, 
  encargado,
  fecha = new Date().toLocaleDateString('es-ES'),
  // Props para la firma
  onSaveFirmaResponsable,
  firmaResponsable
}) => {
  const theme = useTheme();

  // Función para obtener el icono según la calificación
  const getCalificacionIcon = (calificacion) => {
    switch (calificacion) {
      case 'Conforme':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'No conforme':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'Necesita mejora':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'No aplica':
        return <HelpIcon color="disabled" fontSize="small" />;
      default:
        return null;
    }
  };

  // Función para obtener el color del chip según la calificación
  const getCalificacionColor = (calificacion) => {
    switch (calificacion) {
      case 'Conforme':
        return 'success';
      case 'No conforme':
        return 'error';
      case 'Necesita mejora':
        return 'warning';
      case 'No aplica':
        return 'default';
      default:
        return 'default';
    }
  };

  // Calcular estadísticas
  const estadisticas = {
    Conforme: respuestas?.flat().filter(res => res === "Conforme").length || 0,
    "No conforme": respuestas?.flat().filter(res => res === "No conforme").length || 0,
    "Necesita mejora": respuestas?.flat().filter(res => res === "Necesita mejora").length || 0,
    "No aplica": respuestas?.flat().filter(res => res === "No aplica").length || 0,
  };

  const totalPreguntas = respuestas?.flat().length || 0;
  const preguntasContestadas = respuestas?.flat().filter(res => res !== '').length || 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '95vh',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <VisibilityIcon color="primary" />
          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
            Resumen Completo de la Auditoría
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Columna izquierda - Resumen */}
          <Grid item xs={12} lg={8}>
            {/* Información General */}
            <Card sx={{ mb: 3, border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Información General
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <BusinessIcon color="primary" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Empresa:</strong> {empresa?.nombre || 'No especificada'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocationIcon color="primary" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Ubicación:</strong> {sucursal || 'Casa Central'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AssignmentIcon color="primary" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Formulario:</strong> {formulario?.nombre || 'No especificado'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CalendarIcon color="primary" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Fecha:</strong> {fecha}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Encargado */}
                {encargado && (
                  <Box mt={2} p={2} bgcolor={alpha(theme.palette.info.main, 0.1)} borderRadius={1}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <PersonIcon color="info" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Encargado asignado:</strong>
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {encargado.displayName ? encargado.displayName.charAt(0).toUpperCase() : encargado.email.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2">
                            {encargado.displayName || 'Sin nombre'} ({encargado.email})
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Estadísticas */}
            <Card sx={{ mb: 3, border: `2px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'success.main', fontWeight: 600 }}>
                  Estadísticas de la Auditoría
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                        {estadisticas.Conforme}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Conforme
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                        {estadisticas["No conforme"]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No Conforme
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                        {estadisticas["Necesita mejora"]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Necesita Mejora
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        {estadisticas["No aplica"]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No Aplica
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box mt={2} p={2} bgcolor={alpha(theme.palette.info.main, 0.1)} borderRadius={1}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Progreso:</strong> {preguntasContestadas} de {totalPreguntas} preguntas respondidas
                    ({Math.round((preguntasContestadas / totalPreguntas) * 100)}%)
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Detalle de Preguntas */}
            <Card sx={{ border: `2px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'info.main', fontWeight: 600 }}>
                  Detalle de Preguntas y Respuestas
                </Typography>
                
                {secciones && secciones.length > 0 ? (
                  <List>
                    {secciones.map((seccion, seccionIndex) => (
                      <Box key={seccionIndex} mb={3}>
                        <Typography variant="h6" sx={{ 
                          color: 'primary.main', 
                          fontWeight: 600, 
                          mb: 2,
                          pb: 1,
                          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}>
                          {seccion.nombre}
                        </Typography>
                        
                        {seccion.preguntas.map((pregunta, preguntaIndex) => {
                          const respuesta = respuestas?.[seccionIndex]?.[preguntaIndex] || '';
                          return (
                            <ListItem key={preguntaIndex} sx={{ 
                              flexDirection: 'column', 
                              alignItems: 'flex-start',
                              p: 2,
                              mb: 1,
                              bgcolor: alpha(theme.palette.grey[50], 0.5),
                              borderRadius: 1,
                              border: `1px solid ${alpha(theme.palette.grey[300], 0.5)}`
                            }}>
                              <ListItemText
                                primary={
                                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                    {pregunta}
                                  </Typography>
                                }
                                secondary={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {respuesta ? (
                                      <>
                                        {getCalificacionIcon(respuesta)}
                                        <Chip
                                          label={respuesta}
                                          color={getCalificacionColor(respuesta)}
                                          size="small"
                                          variant="outlined"
                                        />
                                      </>
                                    ) : (
                                      <Chip
                                        label="Sin responder"
                                        color="default"
                                        size="small"
                                        variant="outlined"
                                      />
                                    )}
                                  </Box>
                                }
                              />
                            </ListItem>
                          );
                        })}
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Box textAlign="center" py={3}>
                    <Typography variant="body2" color="text.secondary">
                      No hay preguntas disponibles para mostrar
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Columna derecha - Firma */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ 
              border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              position: 'sticky',
              top: 16
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'warning.main', fontWeight: 600 }}>
                  <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Firma del Responsable (Opcional)
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Después de revisar el resumen completo, puede firmar aquí para confirmar la auditoría. Esta firma es opcional.
                </Typography>

                {firmaResponsable && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    ✅ Firma del responsable completada
                  </Alert>
                )}

                <Firma 
                  title="Firma del Responsable de la Empresa (Opcional)" 
                  setFirmaURL={onSaveFirmaResponsable}
                  firmaExistente={firmaResponsable}
                />

                {firmaResponsable && (
                  <Box mt={2} p={2} bgcolor={alpha(theme.palette.success.main, 0.1)} borderRadius={1}>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                      ✅ Firma del responsable guardada. Puede cerrar este resumen y continuar.
                    </Typography>
                  </Box>
                )}

                {!firmaResponsable && (
                  <Box mt={2} p={2} bgcolor={alpha(theme.palette.info.main, 0.1)} borderRadius={1}>
                    <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
                      ℹ️ La firma del responsable es opcional. Puede continuar sin firmar.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          {firmaResponsable ? 'Cerrar Resumen' : 'Cerrar sin Firmar (Opcional)'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResumenAuditoriaModal; 