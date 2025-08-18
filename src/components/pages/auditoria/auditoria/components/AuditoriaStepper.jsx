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
  useMediaQuery,
  Divider
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
  const isTablet = useMediaQuery('(max-width:1024px)');
  const isLargeScreen = useMediaQuery('(min-width:1200px)');

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

  // Componente para la barra lateral de progreso en desktop
  const DesktopSidebar = () => (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 1.5, 
        borderRadius: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.primary.main, 0.01)})`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        height: 'fit-content',
        position: 'sticky',
        top: 20,
        // Optimizar ancho para diferentes tamaños de pantalla
        width: isLargeScreen ? '200px' : isTablet ? '180px' : '160px',
        minWidth: '160px'
      }}
    >
      {/* Header de la barra lateral */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ 
          fontWeight: 600, 
          mb: 0.5,
          color: 'primary.main',
          fontSize: '0.85rem'
        }}>
          Progreso de la Auditoría
        </Typography>
        
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <LinearProgress 
            variant="determinate" 
            value={((activeStep + 1) / steps.length) * 100}
            sx={{ 
              flexGrow: 1,
              height: 4, 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }
            }} 
          />
          <Chip 
            label={`${Math.round(((activeStep + 1) / steps.length) * 100)}%`}
            color="primary"
            size="small"
            variant="filled"
            sx={{ fontWeight: 600, minWidth: '40px', height: '20px', fontSize: '0.7rem' }}
          />
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          Paso {activeStep + 1} de {steps.length}: {steps[activeStep]?.label}
        </Typography>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {/* Stepper vertical compacto */}
      <Stepper orientation="vertical" activeStep={activeStep} sx={{ 
        '& .MuiStepConnector-root': { ml: 0.8 },
        '& .MuiStepLabel-root': { py: 0.1 }
      }}>
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
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: pasoCompleto(index)
                    ? alpha(theme.palette.success.main, 0.1)
                    : getStepStatus(index) === 'active'
                    ? alpha(theme.palette.primary.main, 0.1)
                    : alpha(theme.palette.text.disabled, 0.1),
                  border: `1.5px solid ${
                    pasoCompleto(index)
                      ? theme.palette.success.main
                      : getStepStatus(index) === 'active'
                      ? theme.palette.primary.main
                      : alpha(theme.palette.text.disabled, 0.3)
                  }`
                }}>
                  {pasoCompleto(index) ? 
                    <CheckCircleIcon color="success" sx={{ fontSize: '1rem' }} /> : 
                    step.icon
                  }
                </Box>
              )}
              onClick={() => handleStepClick(index)}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  '& .MuiStepLabel-labelContainer': {
                    '& .MuiTypography-root': {
                      color: 'primary.main'
                    }
                  }
                }
              }}
            >
              <Box sx={{ ml: 0.1 }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.75rem',
                  color: pasoCompleto(index)
                    ? 'success.main'
                    : getStepStatus(index) === 'active'
                    ? 'primary.main'
                    : 'text.primary',
                  mb: 0.05,
                  lineHeight: 1.2
                }}>
                  {step.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  fontSize: '0.65rem',
                  lineHeight: 1.2
                }}>
                  {step.description}
                </Typography>
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Paper>
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
        // Layout desktop optimizado: barra lateral más eficiente + contenido principal
        <Grid container spacing={2}>
          {/* Barra lateral de progreso - más compacta */}
          <Grid item xs={12} sm={2} md={2} lg={1.5} xl={1.2}>
            <DesktopSidebar />
          </Grid>
          
          {/* Contenido principal - aprovecha mejor el espacio */}
          <Grid item xs={12} sm={10} md={10} lg={10.5} xl={10.8}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2.5, 
                borderRadius: 2, 
                minHeight: '400px',
                background: 'white',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              {/* Header del contenido */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 0.5,
                  color: 'text.primary',
                  fontSize: '1.1rem'
                }}>
                  {steps[activeStep]?.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {steps[activeStep]?.description}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Contenido del paso actual */}
              <Box sx={{ mb: 2.5 }}>
                {steps[activeStep]?.content}
              </Box>
              
              {/* Botones de navegación */}
              <Box display="flex" gap={1.5} justifyContent="space-between" alignItems="center">
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleAnterior}
                  disabled={activeStep === 0}
                  size="small"
                  sx={{ 
                    px: 2, 
                    py: 1, 
                    borderRadius: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.85rem'
                  }}
                >
                  ← Anterior
                </Button>

                <Box display="flex" alignItems="center" gap={1.5}>
                  {navegacionError && (
                    <Alert severity="error" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                      {navegacionError}
                    </Alert>
                  )}
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSiguiente}
                    disabled={!pasoCompleto(activeStep) || activeStep === steps.length - 1}
                    size="small"
                    sx={{ 
                      px: 2, 
                      py: 1, 
                      borderRadius: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '0.85rem',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    }}
                  >
                    Siguiente →
                  </Button>
                </Box>
              </Box>
              
              {/* Errores */}
              {errores.length > 0 && (
                <Fade in={true} timeout={600}>
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 1.5, fontSize: '0.75rem', py: 0.5 }}>
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