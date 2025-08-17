import React from "react";
import { 
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Grid,
  Button,
  Alert,
  useMediaQuery
} from "@mui/material";
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Fade, Zoom } from "@mui/material";
import SeleccionEmpresa from "../SeleccionEmpresa";
import SeleccionSucursal from "../SeleccionSucursal";
import SeleccionFormulario from "../SeleccionFormulario";
import PreguntasYSeccion from "../PreguntasYSeccion";
import FirmaSection from "../../reporte/FirmaSection";
import BotonGenerarReporte from "../../reporte/ReporteImprimir";

const AuditoriaStepper = ({
  activeStep,
  setActiveStep,
  steps,
  pasoCompleto,
  getStepStatus,
  handleStepClick,
  handleAnterior,
  handleSiguiente,
  navegacionError,
  errores,
  // Props para los componentes
  empresas,
  empresaSeleccionada,
  handleEmpresaChange,
  sucursales,
  sucursalSeleccionada,
  handleSucursalChange,
  bloquearDatosAgenda,
  setOpenAlertaEdicion,
  formularios,
  formularioSeleccionadoId,
  handleSeleccionarFormulario,
  secciones,
  handleGuardarRespuestas,
  handleGuardarComentario,
  handleGuardarImagenes,
  respuestas,
  comentarios,
  imagenes,
  todasLasPreguntasContestadas,
  handleSaveFirmaAuditor,
  handleSaveFirmaResponsable,
  firmaAuditor,
  firmaResponsable,
  firmasCompletadas,
  handleGuardar,
  deshabilitado,
  onFinalizar,
  location,
  obtenerTipoUbicacion,
  theme
}) => {
  const isMobile = useMediaQuery('(max-width:768px)');

  // Componente para el header móvil compacto
  const MobileHeader = () => (
    <Box sx={{ 
      mb: 0.5, 
      p: 1, 
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.03)})`,
      borderRadius: 1,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
    }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.25}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.75rem' }}>
          Paso {activeStep + 1} de {steps.length}
        </Typography>
        <Chip 
          label={`${Math.round(((activeStep + 1) / steps.length) * 100)}%`}
          color="primary"
          size="small"
          variant="filled"
          sx={{ height: '16px', fontSize: '0.6rem' }}
        />
      </Box>
      
      <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.7rem' }}>
        {steps[activeStep]?.label}
      </Typography>
      
      <LinearProgress 
        variant="determinate" 
        value={((activeStep + 1) / steps.length) * 100}
        sx={{ 
          mt: 0.25,
          height: 2, 
          borderRadius: 1,
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
          '& .MuiLinearProgress-bar': {
            borderRadius: 1,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
          }
        }} 
      />
    </Box>
  );

  return (
    <Box className="form-container">
      {isMobile ? (
        // Layout móvil: header compacto + contenido
        <Box>
          <MobileHeader />
          <Paper elevation={2} sx={{ p: 1.5, borderRadius: 2, minHeight: '300px' }}>
            {steps[activeStep]?.content}
            
            <Box display="flex" gap={0.5} mt={1}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleAnterior}
                disabled={activeStep === 0}
                size="small"
                sx={{ px: 0.5, py: 0.25, fontSize: '0.7rem' }}
              >
                Anterior
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSiguiente}
                disabled={!pasoCompleto(activeStep) || activeStep === steps.length - 1}
                size="small"
                sx={{ px: 0.5, py: 0.25, fontSize: '0.7rem' }}
              >
                Siguiente
              </Button>
            </Box>

            {navegacionError && (
              <Alert severity="error" sx={{ mt: 1, fontSize: '0.7rem' }}>
                {navegacionError}
              </Alert>
            )}
            
            {/* Errores */}
            {errores.length > 0 && (
              <Fade in={true} timeout={600}>
                <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1, fontSize: '0.7rem' }}>
                  {errores.map((error, index) => (
                    <Typography key={index} variant="caption">
                      {error}
                    </Typography>
                  ))}
                </Alert>
              </Fade>
            )}
          </Paper>
        </Box>
      ) : (
        // Layout desktop: stepper compacto
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 600, fontSize: '0.9rem' }}>
                Progreso de la Auditoría
              </Typography>
              <Stepper orientation="vertical" activeStep={activeStep}>
                {steps.map((step, index) => (
                  <Step key={step.label} completed={pasoCompleto(index)}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box sx={{
                          color: pasoCompleto(index)
                            ? 'success.main'
                            : getStepStatus(index) === 'active'
                            ? 'primary.main'
                            : 'text.disabled',
                          fontSize: '1rem'
                        }}>
                          {pasoCompleto(index) ? <CheckCircleIcon color="success" sx={{ fontSize: '1.2rem' }} /> : step.icon}
                        </Box>
                      )}
                      onClick={() => handleStepClick(index)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {step.label}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                        {step.description}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2, minHeight: '400px' }}>
              {steps[activeStep]?.content}
              
              <Box display="flex" gap={1} mt={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleAnterior}
                  disabled={activeStep === 0}
                  size="small"
                  sx={{ fontSize: '0.8rem' }}
                >
                  Anterior
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSiguiente}
                  disabled={!pasoCompleto(activeStep) || activeStep === steps.length - 1}
                  size="small"
                  sx={{ fontSize: '0.8rem' }}
                >
                  Siguiente
                </Button>
              </Box>

              {navegacionError && (
                <Alert severity="error" sx={{ mt: 1, fontSize: '0.8rem' }}>
                  {navegacionError}
                </Alert>
              )}
              
              {/* Errores */}
              {errores.length > 0 && (
                <Fade in={true} timeout={600}>
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 1, fontSize: '0.8rem' }}>
                    {errores.map((error, index) => (
                      <Typography key={index} variant="caption">
                        {error}
                      </Typography>
                    ))}
                  </Alert>
                </Fade>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AuditoriaStepper; 