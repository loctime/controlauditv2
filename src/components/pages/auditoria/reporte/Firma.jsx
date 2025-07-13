import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Clear, 
  Save, 
  Edit,
  CheckCircle,
  TouchApp
} from '@mui/icons-material';
import './Firma.css';

const Firma = ({ title, setFirmaURL, firmaExistente }) => {
  const theme = useTheme();
  const sigCanvas = useRef({});
  const [hasSignature, setHasSignature] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (firmaExistente) {
      setIsSaved(true);
      setHasSignature(true);
    }
  }, [firmaExistente]);

  const clearSignature = () => {
    sigCanvas.current.clear();
    setHasSignature(false);
    setIsSaved(false);
    setFirmaURL(null);
  };

  const saveSignature = () => {
    if (sigCanvas.current.isEmpty()) {
      alert('Por favor, proporcione una firma primero.');
      return;
    }
    
    // Obtener la URL de la imagen en base64 con mejor calidad
    const firmaDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png', 1.0);
    setFirmaURL(firmaDataUrl);
    setIsSaved(true);
  };

  const handleCanvasChange = () => {
    const isEmpty = sigCanvas.current.isEmpty();
    setHasSignature(!isEmpty);
    if (!isEmpty && isSaved) {
      setIsSaved(false);
    }
  };

  const handleEdit = () => {
    setIsSaved(false);
    setFirmaURL(null);
  };

  // Configuraciones optimizadas para móvil y desktop
  const canvasConfig = {
    width: isMobile ? 300 : 400,
    height: isMobile ? 120 : 100,
    className: 'sigCanvas',
    style: { 
      width: '100%', 
      height: isMobile ? '120px' : '100px',
      border: 'none',
      touchAction: 'none', // Mejora la respuesta táctil
      cursor: 'crosshair'
    }
  };

  // Configuraciones específicas para SignatureCanvas
  const signatureConfig = {
    penColor: theme.palette.primary.main,
    backgroundColor: '#ffffff',
    dotSize: isMobile ? 2 : 1.5, // Puntos más grandes en móvil
    minWidth: isMobile ? 1.5 : 1, // Líneas más gruesas en móvil
    maxWidth: isMobile ? 3 : 2.5,
    throttle: 16, // 60fps para mejor fluidez
    velocityFilterWeight: 0.7, // Mejor suavizado
    onEnd: handleCanvasChange
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ 
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 2
      }}>
        {isSaved ? <CheckCircle color="success" /> : <Edit color="primary" />}
        {title}
      </Typography>

      {firmaExistente && isSaved ? (
        <Box sx={{ textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Firma guardada correctamente
          </Alert>
          <Box sx={{ 
            border: '2px solid', 
            borderColor: 'success.main', 
            borderRadius: 1,
            p: 2,
            mb: 2
          }}>
            <img 
              src={firmaExistente} 
              alt="Firma guardada" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100px',
                objectFit: 'contain'
              }} 
            />
          </Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Edit />}
            onClick={handleEdit}
            size="small"
          >
            Editar Firma
          </Button>
        </Box>
      ) : (
        <Box>
          {/* Indicador móvil */}
          {isMobile && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <TouchApp />
                <Typography variant="body2">
                  Use su dedo para firmar en el área de abajo
                </Typography>
              </Box>
            </Alert>
          )}

          <Box sx={{ 
            border: '2px solid', 
            borderColor: hasSignature ? 'primary.main' : 'grey.300',
            borderRadius: 1,
            p: 1,
            mb: 2,
            backgroundColor: 'background.paper',
            position: 'relative',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
            }
          }}>
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={canvasConfig}
              {...signatureConfig}
            />
            
            {/* Indicador de área de firma */}
            {!hasSignature && (
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'text.disabled',
                pointerEvents: 'none',
                textAlign: 'center'
              }}>
                <Typography variant="body2" color="text.disabled">
                  {isMobile ? 'Toque aquí para firmar' : 'Haga clic aquí para firmar'}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Clear />}
              onClick={clearSignature}
              size={isMobile ? "medium" : "small"}
              disabled={!hasSignature}
              sx={{ minWidth: isMobile ? 120 : 'auto' }}
            >
              Limpiar
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={saveSignature}
              size={isMobile ? "medium" : "small"}
              disabled={!hasSignature}
              sx={{ minWidth: isMobile ? 120 : 'auto' }}
            >
              Guardar Firma
            </Button>
          </Box>

          {/* Consejos para mejor firma */}
          {!hasSignature && (
            <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                💡 <strong>Consejo:</strong> {isMobile 
                  ? 'Firme lentamente y con trazos firmes para mejor legibilidad'
                  : 'Use el mouse o trackpad con movimientos suaves'
                }
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

Firma.propTypes = {
  title: PropTypes.string.isRequired,
  setFirmaURL: PropTypes.func.isRequired,
  firmaExistente: PropTypes.string
};

export default Firma;
