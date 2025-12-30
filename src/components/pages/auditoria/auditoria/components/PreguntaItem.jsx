import React, { useState, useRef, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Button, 
  Stack, 
  Chip, 
  useTheme, 
  useMediaQuery,
  Collapse,
  Checkbox,
  FormControlLabel,
  TextField
} from "@mui/material";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import UploadIcon from '@mui/icons-material/Upload';
import CommentIcon from '@mui/icons-material/Comment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { 
  respuestasPosibles, 
  obtenerColorRespuesta, 
  obtenerIconoRespuesta, 
  preguntaContestada 
} from '../utils/respuestaUtils.jsx';
// Imports eliminados: uploadEvidence, ensureTaskbarFolder, ensureSubFolder, useAuth
// Ya no se suben archivos aquí, solo se seleccionan

const PreguntaItem = ({
  seccionIndex,
  preguntaIndex,
  pregunta,
  respuesta,
  comentario,
  imagenes,
  isMobile,
  mobileBoxStyle,
  onRespuestaChange,
  onOpenModal,
  onOpenCameraDialog,
  onDeleteImage,
  procesandoImagen,
  clasificacion,
  onClasificacionChange,
  accionRequerida,
  onAccionRequeridaChange,
  auditId,
  companyId,
  onImageUploaded
}) => {
  const theme = useTheme();
  const [expandedAccion, setExpandedAccion] = useState(false);
  const fileInputRef = useRef(null);
  
  // Inicializar estado local de acción requerida
  const accionData = accionRequerida || {
    requiereAccion: false,
    accionTexto: '',
    fechaVencimiento: null
  };

  // Handler para seleccionar imagen (SIN subir)
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ✅ PROTECCIÓN IDEMPOTENTE: Si ya hay imagen con fileId, no hacer nada
    if (imagenes && typeof imagenes === 'object' && imagenes.fileId) {
      console.log('✅ [PreguntaItem] Imagen ya subida, ignorando:', imagenes.fileId);
      return;
    }

    // ✅ SOLO guardar File en estado local y notificar al padre
    // NO subir archivos aquí - se subirán al guardar el reporte
    console.log('📸 [PreguntaItem] Imagen seleccionada (pendiente de subir):', file.name);
    if (onImageUploaded) {
      onImageUploaded(seccionIndex, preguntaIndex, file);
    }

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isProcesando = procesandoImagen?.[`${seccionIndex}-${preguntaIndex}`] || false;

  // Obtener URL de imagen usando share token (persistente)
  const getImageUrl = (imageData) => {
    if (!imageData) return null;
    
    // Si es un File, crear URL local (solo para preview antes de subir)
    if (imageData instanceof File) {
      return URL.createObjectURL(imageData);
    }
    
    // ✅ PRIORIDAD 1: Usar shareToken para URL persistente
    if (imageData.shareToken) {
      return `https://files.controldoc.app/api/shares/${imageData.shareToken}/image`;
    }
    
    // ⚠️ COMPATIBILIDAD: Si hay URL guardada (datos antiguos)
    if (imageData.fileURL || imageData.url) {
      return imageData.fileURL || imageData.url;
    }
    
    // ⚠️ COMPATIBILIDAD: Si solo hay fileId (sin shareToken), intentar construir share
    // Nota: Esto es para datos antiguos. Los nuevos siempre deben tener shareToken
    if (imageData.fileId && !imageData.shareToken) {
      console.warn('[PreguntaItem] Imagen sin shareToken, usando fileId:', imageData.fileId);
      // Para datos antiguos, podríamos intentar obtener shareToken desde Firestore
      // Por ahora, retornamos null para forzar migración
      return null;
    }
    
    // Fallback: si es string directo (compatibilidad con URLs antiguas)
    if (typeof imageData === 'string') {
      return imageData;
    }
    
    return null;
  };

  // Estado para URL de imagen resuelta
  const resolvedImageUrl = getImageUrl(imagenes);

  return (
    <Box 
      sx={{
        ...mobileBoxStyle,
        border: preguntaContestada([respuesta], 0, 0) 
          ? `2px solid ${obtenerColorRespuesta(respuesta).backgroundColor}` 
          : '2px solid #2196f3',
        backgroundColor: preguntaContestada([respuesta], 0, 0) 
          ? `${obtenerColorRespuesta(respuesta).backgroundColor}15` 
          : '#e3f2fd',
        p: isMobile ? 2 : 3,
        mb: isMobile ? 2 : 3
      }}
      id={`pregunta-${seccionIndex}-${preguntaIndex}`}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? 1 : 2, 
        mb: isMobile ? 1.5 : 2 
      }}>
        <Typography 
          variant={isMobile ? "body1" : "subtitle1"} 
          sx={{ 
            fontWeight: 500, 
            flex: 1,
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        >
          {pregunta}
        </Typography>
        {preguntaContestada([respuesta], 0, 0) ? (
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Contestada" 
            color="success" 
            size={isMobile ? "small" : "medium"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          />
        ) : (
          <Chip 
            icon={<WarningIcon />} 
            label="Sin contestar" 
            color="warning" 
            size={isMobile ? "small" : "medium"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          />
        )}
      </Box>
      
      <Stack direction="column" spacing={isMobile ? 1 : 1.5}>
        <Stack 
          direction="row" 
          spacing={isMobile ? 0.5 : 1} 
          flexWrap="wrap"
          sx={{ gap: isMobile ? 0.5 : 1 }}
        >
          {(() => {
            const respuestaSeleccionada = respuesta;
            
            // Si hay una respuesta seleccionada, solo mostrar esa
            if (respuestaSeleccionada && respuestaSeleccionada.trim() !== '') {
              return (
                <Button
                  key={respuestaSeleccionada}
                  variant="contained"
                  startIcon={obtenerIconoRespuesta(respuestaSeleccionada)}
                  onClick={() => onRespuestaChange(seccionIndex, preguntaIndex, respuestaSeleccionada)}
                  sx={{ 
                    minWidth: isMobile ? 80 : 120,
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    py: isMobile ? 0.5 : 1,
                    px: isMobile ? 1 : 2,
                    ...obtenerColorRespuesta(respuestaSeleccionada),
                    animation: 'fadeIn 0.3s ease-in',
                    '@keyframes fadeIn': {
                      from: { opacity: 0, transform: 'scale(0.9)' },
                      to: { opacity: 1, transform: 'scale(1)' }
                    }
                  }}
                >
                  {respuestaSeleccionada}
                </Button>
              );
            }
            
            // Si no hay respuesta seleccionada, mostrar todas las opciones
            return respuestasPosibles.map((respuestaOption, index) => (
              <Button
                key={index}
                variant="outlined"
                startIcon={obtenerIconoRespuesta(respuestaOption)}
                onClick={() => onRespuestaChange(seccionIndex, preguntaIndex, respuestaOption)}
                sx={{ 
                  minWidth: isMobile ? 80 : 120,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  py: isMobile ? 0.5 : 1,
                  px: isMobile ? 1 : 2,
                  borderColor: obtenerColorRespuesta(respuestaOption).backgroundColor,
                  color: obtenerColorRespuesta(respuestaOption).backgroundColor,
                  '&:hover': {
                    backgroundColor: obtenerColorRespuesta(respuestaOption).backgroundColor,
                    color: 'white',
                    borderColor: obtenerColorRespuesta(respuestaOption).backgroundColor,
                  }
                }}
              >
                {respuestaOption}
              </Button>
            ));
          })()}
        </Stack>
        
        {/* Botones de clasificación Condición y Actitud */}
        <Stack 
          direction="row" 
          spacing={isMobile ? 0.5 : 1}
          sx={{ gap: isMobile ? 0.5 : 1 }}
        >
          <Button
            variant={clasificacion?.condicion ? "contained" : "outlined"}
            startIcon={<BuildIcon />}
            onClick={() => {
              console.log('🔍 [PreguntaItem] Click en botón Condición:', { seccionIndex, preguntaIndex, clasificacion, onClasificacionChange: !!onClasificacionChange });
              if (onClasificacionChange) {
                const nuevaClasificacion = {
                  condicion: !clasificacion?.condicion,
                  actitud: clasificacion?.actitud || false
                };
                console.log('🔍 [PreguntaItem] Llamando onClasificacionChange con:', nuevaClasificacion);
                onClasificacionChange(seccionIndex, preguntaIndex, nuevaClasificacion);
              } else {
                console.error('🔍 [PreguntaItem] onClasificacionChange NO está definido!');
              }
            }}
            sx={{ 
              minWidth: isMobile ? 80 : 120,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              py: isMobile ? 0.5 : 1,
              px: isMobile ? 1 : 2,
              backgroundColor: clasificacion?.condicion ? theme.palette.info.main : 'transparent',
              color: clasificacion?.condicion ? 'white' : theme.palette.info.main,
              borderColor: theme.palette.info.main,
              '&:hover': {
                backgroundColor: clasificacion?.condicion ? theme.palette.info.dark : theme.palette.info.light,
                color: 'white',
                borderColor: theme.palette.info.main,
              }
            }}
          >
            Condición
          </Button>
          
          <Button
            variant={clasificacion?.actitud ? "contained" : "outlined"}
            startIcon={<PeopleIcon />}
            onClick={() => {
              console.log('🔍 [PreguntaItem] Click en botón Actitud:', { seccionIndex, preguntaIndex, clasificacion, onClasificacionChange: !!onClasificacionChange });
              if (onClasificacionChange) {
                const nuevaClasificacion = {
                  condicion: clasificacion?.condicion || false,
                  actitud: !clasificacion?.actitud
                };
                console.log('🔍 [PreguntaItem] Llamando onClasificacionChange con:', nuevaClasificacion);
                onClasificacionChange(seccionIndex, preguntaIndex, nuevaClasificacion);
              } else {
                console.error('🔍 [PreguntaItem] onClasificacionChange NO está definido!');
              }
            }}
            sx={{ 
              minWidth: isMobile ? 80 : 120,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              py: isMobile ? 0.5 : 1,
              px: isMobile ? 1 : 2,
              backgroundColor: clasificacion?.actitud ? theme.palette.secondary.main : 'transparent',
              color: clasificacion?.actitud ? 'white' : theme.palette.secondary.main,
              borderColor: theme.palette.secondary.main,
              '&:hover': {
                backgroundColor: clasificacion?.actitud ? theme.palette.secondary.dark : theme.palette.secondary.light,
                color: 'white',
                borderColor: theme.palette.secondary.main,
              }
            }}
          >
            Actitud
          </Button>
        </Stack>
        
        <Button
          variant="outlined"
          startIcon={<CommentIcon />}
          onClick={() => onOpenModal(seccionIndex, preguntaIndex)}
          sx={{ 
            minWidth: isMobile ? 80 : 120,
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            py: isMobile ? 0.5 : 1,
            px: isMobile ? 1 : 2
          }}
        >
          Comentario
        </Button>
        
        <Stack 
          direction="row" 
          spacing={isMobile ? 0.5 : 1}
          sx={{ gap: isMobile ? 0.5 : 1 }}
        >
          <Button
            variant="outlined"
            component="span"
            startIcon={<CameraAltIcon />}
            onClick={() => onOpenCameraDialog(seccionIndex, preguntaIndex)}
            disabled={isProcesando}
            sx={{ 
              minWidth: isMobile ? 80 : 120,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              py: isMobile ? 0.5 : 1,
              px: isMobile ? 1 : 2
            }}
          >
            {isProcesando ? 'Procesando...' : 'Camara'}
          </Button>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <label htmlFor={`upload-gallery-${seccionIndex}-${preguntaIndex}`}>
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                sx={{ 
                  minWidth: isMobile ? 80 : 120,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  py: isMobile ? 0.5 : 1,
                  px: isMobile ? 1 : 2
                }}
                disabled={isProcesando}
              >
                {isProcesando ? 'Procesando...' : 'Subir'}
              </Button>
            </label>
          </Box>
          <input
            id={`upload-gallery-${seccionIndex}-${preguntaIndex}`}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </Stack>
      </Stack>
      
      {/* Comentario y foto debajo, bien separados */}
      <Box 
        mt={isMobile ? 1.5 : 2} 
        display="flex" 
        alignItems="center" 
        gap={isMobile ? 2 : 3} 
        flexWrap="wrap"
      >
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            fontStyle: 'italic',
            fontSize: isMobile ? '0.75rem' : '0.875rem'
          }}
        >
          {comentario ? `Comentario: ${comentario}` : "Sin comentario"}
        </Typography>
        
        {imagenes && resolvedImageUrl && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <img
                src={resolvedImageUrl}
                alt={`Imagen de la pregunta ${preguntaIndex}`}
                style={{ 
                  maxWidth: isMobile ? '80px' : '100px', 
                  maxHeight: isMobile ? '80px' : '100px', 
                  borderRadius: 8, 
                  border: '1px solid #eee',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  // Abrir imagen en nueva pestaña usando share token (URL persistente)
                  const url = getImageUrl(imagenes);
                  if (url) {
                    window.open(url, '_blank');
                  }
                }}
                onError={(e) => {
                  // Si falla la carga, puede ser un problema de CORS o archivo eliminado
                  console.error('[PreguntaItem] Error al cargar imagen:', e);
                }}
              />
              <Button
                size="small"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  minWidth: 'auto',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#f44336',
                  color: 'white',
                  fontSize: '12px',
                  padding: 0,
                  '&:hover': {
                    backgroundColor: '#d32f2f'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Función para eliminar imagen
                  if (typeof onDeleteImage === 'function') {
                    onDeleteImage(seccionIndex, preguntaIndex, 0);
                  }
                }}
              >
                ×
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Sección de Acción Requerida */}
      <Box mt={isMobile ? 1.5 : 2}>
        <FormControlLabel
          control={
            <Checkbox
              checked={accionData.requiereAccion || false}
              onChange={(e) => {
                const nuevaAccion = {
                  ...accionData,
                  requiereAccion: e.target.checked
                };
                if (!e.target.checked) {
                  // Si se desmarca, limpiar datos
                  nuevaAccion.accionTexto = '';
                  nuevaAccion.fechaVencimiento = null;
                  setExpandedAccion(false);
                } else {
                  setExpandedAccion(true);
                }
                if (onAccionRequeridaChange) {
                  onAccionRequeridaChange(seccionIndex, preguntaIndex, nuevaAccion);
                }
              }}
              size={isMobile ? "small" : "medium"}
            />
          }
          label={
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                fontWeight: 500
              }}
            >
              Acción requerida
            </Typography>
          }
        />
        
        <Collapse in={expandedAccion || (accionData.requiereAccion && accionData.accionTexto)}>
          <Box 
            sx={{ 
              mt: 1, 
              p: 2, 
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Stack spacing={2}>
              <TextField
                label="Descripción de la acción requerida"
                multiline
                rows={2}
                value={accionData.accionTexto || ''}
                onChange={(e) => {
                  const nuevaAccion = {
                    ...accionData,
                    accionTexto: e.target.value
                  };
                  if (onAccionRequeridaChange) {
                    onAccionRequeridaChange(seccionIndex, preguntaIndex, nuevaAccion);
                  }
                }}
                size="small"
                fullWidth
                required={accionData.requiereAccion}
                error={accionData.requiereAccion && !accionData.accionTexto}
                helperText={
                  accionData.requiereAccion && !accionData.accionTexto
                    ? 'La descripción es requerida'
                    : ''
                }
              />
              
              <DatePicker
                label="Fecha de vencimiento (opcional)"
                value={accionData.fechaVencimiento ? dayjs(accionData.fechaVencimiento) : null}
                onChange={(value) => {
                  const nuevaAccion = {
                    ...accionData,
                    fechaVencimiento: value ? value.toDate() : null
                  };
                  if (onAccionRequeridaChange) {
                    onAccionRequeridaChange(seccionIndex, preguntaIndex, nuevaAccion);
                  }
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true
                  }
                }}
                minDate={dayjs()}
              />
            </Stack>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default PreguntaItem; 