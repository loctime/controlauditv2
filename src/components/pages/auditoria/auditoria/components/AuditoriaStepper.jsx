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
  Alert
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

  return (
    <Box>
      {/* Stepper vertical */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
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
                      }}>
                        {pasoCompleto(index) ? <CheckCircleIcon color="success" /> : step.icon}
                      </Box>
                    )}
                    onClick={() => handleStepClick(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {step.label}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, minHeight: '600px' }}>
            {steps[activeStep]?.content}
            
            <Box display="flex" gap={2} mt={4}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleAnterior}
                disabled={activeStep === 0}
              >
                Anterior
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSiguiente}
                disabled={!pasoCompleto(activeStep) || activeStep === steps.length - 1}
              >
                Siguiente
              </Button>
            </Box>

            {navegacionError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {navegacionError}
              </Alert>
            )}
            
            {/* Errores */}
            {errores.length > 0 && (
              <Fade in={true} timeout={600}>
                <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                  {errores.map((error, index) => (
                    <Typography key={index} variant="body2">
                      {error}
                    </Typography>
                  ))}
                </Alert>
              </Fade>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuditoriaStepper; 