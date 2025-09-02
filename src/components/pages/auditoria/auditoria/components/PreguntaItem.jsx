import React from "react";
import { 
  Box, 
  Typography, 
  Button, 
  Stack, 
  Chip, 
  useTheme, 
  useMediaQuery 
} from "@mui/material";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import UploadIcon from '@mui/icons-material/Upload';
import CommentIcon from '@mui/icons-material/Comment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { 
  respuestasPosibles, 
  obtenerColorRespuesta, 
  obtenerIconoRespuesta, 
  preguntaContestada 
} from '../utils/respuestaUtils.jsx';
import ImagenAuditoria from './ImagenAuditoria';

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
  procesandoImagen,
  // ✅ NUEVAS PROPS para manejo de imágenes
  onDeleteImagen,
  onDownloadImagen
}) => {
  const theme = useTheme();

  // ✅ FUNCIÓN para eliminar imagen
  const handleDeleteImagen = (imagen, seccionIdx, preguntaIdx) => {
    if (onDeleteImagen) {
      onDeleteImagen(imagen, seccionIdx, preguntaIdx);
    }
  };

  // ✅ FUNCIÓN para descargar imagen
  const handleDownloadImagen = (imagen, seccionIdx, preguntaIdx) => {
    if (onDownloadImagen) {
      onDownloadImagen(imagen, seccionIdx, preguntaIdx);
    }
  };

  // ✅ FUNCIÓN para renderizar imágenes con el nuevo componente
  const renderImagenes = () => {
    if (!imagenes || imagenes.length === 0) {
      return null;
    }

    // Si es un array de imágenes
    if (Array.isArray(imagenes)) {
      return (
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap',
          mt: isMobile ? 1 : 1.5
        }}>
          {imagenes.map((imagen, imgIndex) => (
            <ImagenAuditoria
              key={imgIndex}
              imagen={imagen}
              seccionIndex={seccionIndex}
              preguntaIndex={preguntaIndex}
              onDelete={handleDeleteImagen}
              onDownload={handleDownloadImagen}
              showMetadata={!isMobile} // Solo mostrar metadatos en desktop
            />
          ))}
        </Box>
      );
    }

    // Si es una sola imagen
    return (
      <Box sx={{ mt: isMobile ? 1 : 1.5 }}>
        <ImagenAuditoria
          imagen={imagenes}
          seccionIndex={seccionIndex}
          preguntaIndex={preguntaIndex}
          onDelete={handleDeleteImagen}
          onDownload={handleDownloadImagen}
          showMetadata={!isMobile}
        />
      </Box>
    );
  };

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
                <Chip
                  key={respuestaSeleccionada}
                  label={respuestaSeleccionada}
                  icon={obtenerIconoRespuesta(respuestaSeleccionada)}
                  color={obtenerColorRespuesta(respuestaSeleccionada).color}
                  variant="filled"
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => onRespuestaChange(seccionIndex, preguntaIndex, '')}
                />
              );
            }
            
            // Si no hay respuesta seleccionada, mostrar todas las opciones
            return respuestasPosibles.map((opcion) => (
              <Chip
                key={opcion}
                label={opcion}
                icon={obtenerIconoRespuesta(opcion)}
                color={obtenerColorRespuesta(opcion).color}
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: obtenerColorRespuesta(opcion).backgroundColor,
                    color: obtenerColorRespuesta(opcion).color === 'default' ? 'white' : 'white'
                  }
                }}
                onClick={() => onRespuestaChange(seccionIndex, preguntaIndex, opcion)}
              />
            ));
          })()}
        </Stack>
        
        {/* Botones de comentario y cámara */}
        <Stack 
          direction="row" 
          spacing={isMobile ? 0.5 : 1}
          sx={{ gap: isMobile ? 0.5 : 1 }}
        >
          <Button
            variant="outlined"
            component="span"
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
          
          <Button
            variant="outlined"
            component="span"
            startIcon={<CameraAltIcon />}
            onClick={() => onOpenCameraDialog(seccionIndex, preguntaIndex)}
            disabled={procesandoImagen[`${seccionIndex}-${preguntaIndex}`]}
            sx={{ 
              minWidth: isMobile ? 80 : 120,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              py: isMobile ? 0.5 : 1,
              px: isMobile ? 1 : 2
            }}
          >
            {procesandoImagen[`${seccionIndex}-${preguntaIndex}`] ? 'Procesando...' : 'Cámara'}
          </Button>
          
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
              disabled={procesandoImagen[`${seccionIndex}-${preguntaIndex}`]}
            >
              {procesandoImagen[`${seccionIndex}-${preguntaIndex}`] ? 'Procesando...' : 'Subir'}
            </Button>
          </label>
        </Stack>
      </Stack>
      
      {/* Comentario */}
      {comentario && (
        <Box 
          mt={isMobile ? 1.5 : 2} 
          p={isMobile ? 1 : 1.5}
          bgcolor="grey.50"
          borderRadius={1}
          border="1px solid"
          borderColor="grey.200"
        >
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontStyle: 'italic',
              fontSize: isMobile ? '0.75rem' : '0.875rem'
            }}
          >
            {comentario}
          </Typography>
        </Box>
      )}
      
      {/* ✅ NUEVO: Imágenes usando el componente ImagenAuditoria */}
      {renderImagenes()}
    </Box>
  );
};

export default PreguntaItem; 