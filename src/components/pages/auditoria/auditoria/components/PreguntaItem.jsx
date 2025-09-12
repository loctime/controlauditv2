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
  procesandoImagen
}) => {
  const theme = useTheme();

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
            disabled={procesandoImagen[`${seccionIndex}-${preguntaIndex}`]}
            sx={{ 
              minWidth: isMobile ? 80 : 120,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              py: isMobile ? 0.5 : 1,
              px: isMobile ? 1 : 2
            }}
          >
            {procesandoImagen[`${seccionIndex}-${preguntaIndex}`] ? 'Procesando...' : 'Camara'}
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
        
        {imagenes && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {Array.isArray(imagenes) 
              ? imagenes.map((imagen, imgIndex) => (
                  <Box key={imgIndex} sx={{ position: 'relative' }}>
                    <img
                      src={URL.createObjectURL(imagen)}
                      alt={`Imagen ${imgIndex + 1} de la pregunta ${preguntaIndex}`}
                      style={{ 
                        maxWidth: isMobile ? '60px' : '80px', 
                        maxHeight: isMobile ? '60px' : '80px', 
                        borderRadius: 8, 
                        border: '1px solid #eee',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        window.open(URL.createObjectURL(imagen), '_blank');
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
                          onDeleteImage(seccionIndex, preguntaIndex, imgIndex);
                        }
                      }}
                    >
                      ×
                    </Button>
                  </Box>
                ))
              : (
                  <Box sx={{ position: 'relative' }}>
                    <img
                      src={URL.createObjectURL(imagenes)}
                      alt={`Imagen de la pregunta ${preguntaIndex}`}
                      style={{ 
                        maxWidth: isMobile ? '80px' : '100px', 
                        maxHeight: isMobile ? '80px' : '100px', 
                        borderRadius: 8, 
                        border: '1px solid #eee' 
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
                )
            }
            {Array.isArray(imagenes) && imagenes.length > 1 && (
              <Chip
                label={`${imagenes.length} fotos`}
                size="small"
                color="primary"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PreguntaItem; 