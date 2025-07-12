// Componente optimizado para manejo de imágenes en auditorías
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  useTheme,
  alpha,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ImageIcon from '@mui/icons-material/Image';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import CloseIcon from '@mui/icons-material/Close';

const ImagenesTable = ({ secciones, respuestas, comentarios, imagenes }) => {
  const theme = useTheme();
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [dialogAbierto, setDialogAbierto] = useState(false);

  // Función para abrir imagen en modal
  const abrirImagen = (imagen) => {
    setImagenSeleccionada(imagen);
    setDialogAbierto(true);
  };

  // Función para cerrar modal
  const cerrarImagen = () => {
    setDialogAbierto(false);
    setImagenSeleccionada(null);
  };

  // Función para renderizar imagen
  const renderizarImagen = (imagen, seccionIndex, preguntaIndex) => {
    if (!imagen) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <ImageNotSupportedIcon color="disabled" fontSize="small" />
          <Typography variant="body2" color="textSecondary">
            Sin imagen
          </Typography>
        </Box>
      );
    }

    // Si es un archivo File
    if (imagen instanceof File) {
      const url = URL.createObjectURL(imagen);
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <img
            src={url}
            alt={`Imagen ${seccionIndex}-${preguntaIndex}`}
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'cover',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => abrirImagen({ url, nombre: imagen.name, tipo: 'file' })}
          />
          <IconButton
            size="small"
            onClick={() => abrirImagen({ url, nombre: imagen.name, tipo: 'file' })}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    }

    // Si es un objeto con URL (desde Firebase Storage)
    if (imagen.url) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <img
            src={imagen.url}
            alt={`Imagen ${seccionIndex}-${preguntaIndex}`}
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'cover',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => abrirImagen({ url: imagen.url, nombre: imagen.nombre, tipo: 'url' })}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <IconButton
            size="small"
            onClick={() => abrirImagen({ url: imagen.url, nombre: imagen.nombre, tipo: 'url' })}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    }

    // Si es una URL directa
    if (typeof imagen === 'string' && imagen.startsWith('http')) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <img
            src={imagen}
            alt={`Imagen ${seccionIndex}-${preguntaIndex}`}
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'cover',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => abrirImagen({ url: imagen, nombre: 'Imagen', tipo: 'url' })}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <IconButton
            size="small"
            onClick={() => abrirImagen({ url: imagen, nombre: 'Imagen', tipo: 'url' })}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    }

    return (
      <Box display="flex" alignItems="center" gap={1}>
        <ImageNotSupportedIcon color="disabled" fontSize="small" />
        <Typography variant="body2" color="textSecondary">
          Formato no soportado
        </Typography>
      </Box>
    );
  };

  // Contar imágenes totales
  const contarImagenes = () => {
    let total = 0;
    imagenes?.forEach(seccion => {
      seccion?.forEach(imagen => {
        if (imagen) total++;
      });
    });
    return total;
  };

  const totalImagenes = contarImagenes();

  if (!secciones || secciones.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" color="textSecondary" align="center">
            No hay secciones disponibles
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        elevation={2}
        sx={{ 
          mt: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.02)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <ImageIcon color="primary" />
            <Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
              📸 Imágenes de la Auditoría
            </Typography>
            <Chip 
              label={`${totalImagenes} imágenes`}
              color="primary"
              variant="outlined"
            />
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Sección</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Pregunta</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Respuesta</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Comentario</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Imagen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {secciones.map((seccion, seccionIndex) =>
                  seccion.preguntas?.map((pregunta, preguntaIndex) => {
                    const respuesta = respuestas?.[seccionIndex]?.[preguntaIndex] || '';
                    const comentario = comentarios?.[seccionIndex]?.[preguntaIndex] || '';
                    const imagen = imagenes?.[seccionIndex]?.[preguntaIndex];

                    return (
                      <TableRow key={`${seccionIndex}-${preguntaIndex}`}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {seccion.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {pregunta}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={respuesta || 'Sin responder'}
                            color={
                              respuesta === 'Conforme' ? 'success' :
                              respuesta === 'No conforme' ? 'error' :
                              respuesta === 'Necesita mejora' ? 'warning' :
                              respuesta === 'No aplica' ? 'default' : 'default'
                            }
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {comentario || 'Sin comentario'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {renderizarImagen(imagen, seccionIndex, preguntaIndex)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal para ver imagen completa */}
      <Dialog
        open={dialogAbierto}
        onClose={cerrarImagen}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {imagenSeleccionada?.nombre || 'Imagen'}
            </Typography>
            <IconButton onClick={cerrarImagen}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {imagenSeleccionada && (
            <Box display="flex" justifyContent="center">
              <img
                src={imagenSeleccionada.url}
                alt={imagenSeleccionada.nombre}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImagenesTable;