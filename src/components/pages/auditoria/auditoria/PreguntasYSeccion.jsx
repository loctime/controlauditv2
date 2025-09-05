  import React, { useState, useEffect } from "react";
  import { Button, Box, Typography, Stack, useTheme, useMediaQuery, Snackbar, Alert } from "@mui/material";
  import WarningIcon from '@mui/icons-material/Warning';
  import CheckCircleIcon from '@mui/icons-material/CheckCircle';

  // Importar componentes separados
  import CameraDialog from './components/CameraDialog';
  import CommentModal from './components/CommentModal';
  import PendingQuestionsModal from './components/PendingQuestionsModal';
  import PreguntaItem from './components/PreguntaItem';

  // Importar utilidades
  import { obtenerPreguntasNoContestadas } from './utils/respuestaUtils.jsx';
  import { comprimirImagen, validarArchivoImagen } from './utils/imageUtils';
  import { uploadFile } from '../../../../lib/controlfile-upload';
  import { auth } from '../../../../firebaseConfig';
  // useControlFile obsoleto - ahora se usa backend compartido

  const PreguntasYSeccion = ({ 
    secciones: seccionesObj = {}, 
    guardarRespuestas, 
    guardarComentario, 
    guardarImagenes,
    // Props para mantener respuestas existentes
    respuestasExistentes = [],
    comentariosExistentes = [],
    imagenesExistentes = []
  }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'));

    const mobileBoxStyle = {
      mb: isMobile ? 1.5 : 3,
      p: isMobile ? 2 : 3,
      borderRadius: 2,
      bgcolor: 'background.paper',
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      minHeight: isMobile ? '100px' : '120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    };

    const [respuestas, setRespuestas] = useState([]);
    const [comentarios, setComentarios] = useState([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [comentario, setComentario] = useState("");
    const [currentSeccionIndex, setCurrentSeccionIndex] = useState(null);
    const [currentPreguntaIndex, setCurrentPreguntaIndex] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [imagenes, setImagenes] = useState([]);
    const [procesandoImagen, setProcesandoImagen] = useState({});
    const [openCameraDialog, setOpenCameraDialog] = useState(false);
    const [currentImageSeccion, setCurrentImageSeccion] = useState(null);
    const [currentImagePregunta, setCurrentImagePregunta] = useState(null);
    const [openPreguntasNoContestadas, setOpenPreguntasNoContestadas] = useState(false);
    
    // Estado para notificaciones
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

    // Función para mostrar notificaciones
    const showNotification = (message, severity = 'info') => {
      setNotification({ open: true, message, severity });
    };

    // Función para cerrar notificaciones
    const closeNotification = () => {
      setNotification({ ...notification, open: false });
    };

    // Exponer la función globalmente para uso en otros componentes
    useEffect(() => {
      window.showNotification = showNotification;
      return () => {
        delete window.showNotification;
      };
    }, []);

    const secciones = Object.values(seccionesObj);

    useEffect(() => {
      if (!initialized && secciones.length > 0) {
        // Inicializar con respuestas existentes o vacías
        const newRespuestas = secciones.map((seccion, seccionIndex) => 
          Array(seccion.preguntas.length).fill('').map((_, preguntaIndex) => 
            respuestasExistentes[seccionIndex]?.[preguntaIndex] || ''
          )
        );
        setRespuestas(newRespuestas);

        // Inicializar con comentarios existentes o vacíos
        const newComentarios = secciones.map((seccion, seccionIndex) => 
          Array(seccion.preguntas.length).fill('').map((_, preguntaIndex) => 
            comentariosExistentes[seccionIndex]?.[preguntaIndex] || ''
          )
        );
        setComentarios(newComentarios);

        // Inicializar con imágenes existentes o null
        const newImagenes = secciones.map((seccion, seccionIndex) => 
          Array(seccion.preguntas.length).fill(null).map((_, preguntaIndex) => 
            imagenesExistentes[seccionIndex]?.[preguntaIndex] || null
          )
        );
        setImagenes(newImagenes);

        setInitialized(true);
      }
    }, [initialized, secciones, respuestasExistentes, comentariosExistentes, imagenesExistentes]);

    const handleRespuestaChange = (seccionIndex, preguntaIndex, value) => {
      const respuestaActual = respuestas[seccionIndex]?.[preguntaIndex];
      
      // Si la respuesta seleccionada es la misma que ya estaba seleccionada, la deseleccionamos
      if (respuestaActual === value) {
        const nuevasRespuestas = respuestas.map((resp, index) =>
          index === seccionIndex ? [...resp.slice(0, preguntaIndex), '', ...resp.slice(preguntaIndex + 1)] : resp
        );
        setRespuestas(nuevasRespuestas);
        guardarRespuestas(nuevasRespuestas);
      } else {
        // Si es una respuesta diferente, la seleccionamos
        const nuevasRespuestas = respuestas.map((resp, index) =>
          index === seccionIndex ? [...resp.slice(0, preguntaIndex), value, ...resp.slice(preguntaIndex + 1)] : resp
        );
        setRespuestas(nuevasRespuestas);
        guardarRespuestas(nuevasRespuestas);
      }
    };

    const handleComentarioChange = (event) => {
      setComentario(event.target.value);
    };

    const handleGuardarComentario = () => {
      if (currentSeccionIndex !== null && currentPreguntaIndex !== null) {
        const nuevosComentarios = comentarios.map((coment, index) =>
          index === currentSeccionIndex ? [...coment.slice(0, currentPreguntaIndex), comentario, ...coment.slice(currentPreguntaIndex + 1)] : coment
        );
        setComentarios(nuevosComentarios);
        guardarComentario(nuevosComentarios);
        setModalAbierto(false);
        setComentario("");
      }
    };

    const handleOpenModal = (seccionIndex, preguntaIndex) => {
      setCurrentSeccionIndex(seccionIndex);
      setCurrentPreguntaIndex(preguntaIndex);
      setComentario(comentarios[seccionIndex][preguntaIndex] || "");
      setModalAbierto(true);
    };

    const handleCloseModal = () => {
      setModalAbierto(false);
      setComentario("");
    };

    // ✅ INTEGRACIÓN OPTIMIZADA CON CONTROLFILE
    const controlFileAvailable = true;
    const controlFileUpload = async (file, options = {}) => {
      try {
        console.log('🚀 Iniciando subida a ControlFile:', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          options
        });

        const idToken = await auth.currentUser.getIdToken();
        
        // Usar la función optimizada de uploadFile
        const uploadResult = await uploadFile(file, idToken, options.parentId);
        
        if (uploadResult.success) {
          console.log('✅ Imagen subida exitosamente a ControlFile:', {
            fileId: uploadResult.fileId,
            url: uploadResult.url,
            size: file.size
          });
          
          return {
            success: true,
            fileId: uploadResult.fileId,
            downloadUrl: uploadResult.url || `https://files.controldoc.app/${uploadResult.fileId}`,
            bucketKey: uploadResult.uploadSessionId,
            etag: uploadResult.etag || 'uploaded',
            metadata: uploadResult.metadata
          };
        } else {
          throw new Error('Error en la subida de la imagen a ControlFile');
        }
      } catch (error) {
        console.error('❌ Error subiendo imagen a ControlFile:', error);
        
        // Reintentar una vez más si es un error de red
        if (error.name === 'TypeError' || error.message.includes('fetch')) {
          console.log('🔄 Reintentando subida a ControlFile...');
          try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
            const idToken = await auth.currentUser.getIdToken();
            const uploadResult = await uploadFile(file, idToken, options.parentId);
            
            if (uploadResult.success) {
              console.log('✅ Reintento exitoso a ControlFile:', uploadResult.fileId);
              return {
                success: true,
                fileId: uploadResult.fileId,
                downloadUrl: uploadResult.url || `https://files.controldoc.app/${uploadResult.fileId}`,
                bucketKey: uploadResult.uploadSessionId,
                etag: uploadResult.etag || 'uploaded',
                metadata: uploadResult.metadata
              };
            }
          } catch (retryError) {
            console.error('❌ Error en reintento a ControlFile:', retryError);
          }
        }
        
        throw error;
      }
    };

    const handleFileChange = async (seccionIndex, preguntaIndex, event) => {
      const file = event.target.files[0];
      
      if (!file) return;
      
      // Validar archivo
      const validacion = validarArchivoImagen(file);
      if (!validacion.valido) {
        alert(validacion.error);
        return;
      }
      
      // Mostrar indicador de procesamiento
      const key = `${seccionIndex}-${preguntaIndex}`;
      setProcesandoImagen(prev => ({ ...prev, [key]: true }));
      
      try {
        console.log(`🔄 Procesando imagen: ${(file.size/1024/1024).toFixed(2)}MB`);
        
        // Comprimir imagen antes de guardar
        const compressedFile = await comprimirImagen(file);
        console.log(`✅ Imagen comprimida: ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
        
        // ✅ INTEGRACIÓN CON CONTROLFILE OPTIMIZADA
        let controlFileData = null;
        let uploadSuccess = false;
        
        if (controlFileAvailable) {
          try {
            console.log('📤 Subiendo imagen a ControlFile...');
            
            const uploadResult = await controlFileUpload(compressedFile, {
              parentId: null // Se autocreará carpeta raíz "controlaudit"
            });
            
            controlFileData = {
              controlFileId: uploadResult.fileId,
              controlFileUrl: uploadResult.downloadUrl,
              bucketKey: uploadResult.bucketKey,
              etag: uploadResult.etag,
              metadata: uploadResult.metadata
            };
            
            uploadSuccess = true;
            console.log('✅ Imagen subida exitosamente a ControlFile:', {
              fileId: uploadResult.fileId,
              url: uploadResult.downloadUrl,
              size: compressedFile.size
            });
            
          } catch (controlFileError) {
            console.warn('⚠️ Error con ControlFile, usando modo local:', controlFileError.message);
            
            // Mostrar alerta al usuario sobre el fallo de ControlFile
            if (controlFileError.message.includes('network') || controlFileError.message.includes('fetch')) {
              showNotification('⚠️ No se pudo conectar con ControlFile. La imagen se guardará localmente.', 'warning');
            } else {
              showNotification('⚠️ Error al subir a ControlFile. La imagen se guardará localmente.', 'warning');
            }
            
            // Continuar con modo local si falla ControlFile
          }
        }
        
                  // Soportar múltiples imágenes por pregunta
            const nuevasImagenes = imagenes.map((img, index) => {
              if (index === seccionIndex) {
                const currentImages = img[preguntaIndex] || [];
                
                // Crear objeto de imagen con metadatos mejorados
                const imageData = {
                  ...compressedFile,
                  // Agregar metadatos de ControlFile si están disponibles
                  ...(controlFileData && { 
                    controlFileData,
                    uploadedToControlFile: true,
                    controlFileTimestamp: new Date().toISOString()
                  }),
                  // Metadatos locales
                  localTimestamp: new Date().toISOString(),
                  seccionIndex,
                  preguntaIndex,
                  originalSize: file.size,
                  compressedSize: compressedFile.size,
                  compressionRatio: ((1 - compressedFile.size/file.size) * 100).toFixed(1)
                };
                
                const updatedImages = Array.isArray(currentImages) 
                  ? [...currentImages, imageData]
                  : [imageData];
                
                return [...img.slice(0, preguntaIndex), updatedImages, ...img.slice(preguntaIndex + 1)];
              }
              return img;
            });
        
                  setImagenes(nuevasImagenes);
            guardarImagenes(nuevasImagenes);
            
            // Mostrar mensaje de éxito
            if (uploadSuccess) {
              console.log(`🎉 Imagen procesada y subida exitosamente a ControlFile: ${controlFileData.controlFileId}`);
              showNotification('✅ Imagen guardada en ControlFile', 'success');
            } else {
              console.log(`✅ Imagen procesada y guardada localmente para pregunta ${preguntaIndex} de sección ${seccionIndex}`);
              showNotification('⚠️ Imagen guardada localmente (ControlFile no disponible)', 'warning');
            }
            } catch (error) {
          console.error('❌ Error al procesar imagen:', error);
          
          // Mostrar error al usuario
          let errorMessage = 'Error al procesar la imagen.';
          
          if (error.message.includes('compresión')) {
            errorMessage = 'Error al comprimir la imagen. Intenta con una imagen más pequeña.';
          } else if (error.message.includes('ControlFile')) {
            errorMessage = 'Error al subir a ControlFile. La imagen se guardará localmente.';
          } else if (error.message.includes('red')) {
            errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
          }
          
          showNotification(`❌ ${errorMessage}`, 'error');
          
          // Fallback: usar imagen original si falla todo
          try {
            const nuevasImagenes = imagenes.map((img, index) => {
              if (index === seccionIndex) {
                const currentImages = img[preguntaIndex] || [];
                const updatedImages = Array.isArray(currentImages) 
                  ? [...currentImages, file]
                  : [file];
                
                return [...img.slice(0, preguntaIndex), updatedImages, ...img.slice(preguntaIndex + 1)];
              }
              return img;
            });
            
            setImagenes(nuevasImagenes);
            guardarImagenes(nuevasImagenes);
            
            console.log('⚠️ Usando imagen original sin optimizar como fallback');
            showNotification('✅ Imagen guardada sin optimizar como respaldo.', 'info');
            
          } catch (fallbackError) {
            console.error('❌ Error crítico en fallback:', fallbackError);
            showNotification('❌ Error crítico al guardar la imagen. Contacta al soporte.', 'error');
          }
        } finally {
        // Ocultar indicador de procesamiento
        setProcesandoImagen(prev => ({ ...prev, [key]: false }));
      }
    };

    // Funciones para manejar cámara web
    const handleOpenCameraDialog = (seccionIndex, preguntaIndex) => {
      setCurrentImageSeccion(seccionIndex);
      setCurrentImagePregunta(preguntaIndex);
      setOpenCameraDialog(true);
    };

    const handleCloseCameraDialog = () => {
      setOpenCameraDialog(false);
    };

    const handlePhotoCapture = async (compressedFile) => {
      try {
        console.log('📸 Procesando foto capturada desde cámara:', {
          fileName: compressedFile.name,
          fileSize: compressedFile.size,
          fileType: compressedFile.type
        });
        
        // Crear un evento simulado para usar handleFileChange
        const simulatedEvent = {
          target: { 
            files: [compressedFile] 
          }
        };
        
        // Usar la función optimizada de handleFileChange
        await handleFileChange(currentImageSeccion, currentImagePregunta, simulatedEvent);
        
        console.log('✅ Foto de cámara procesada exitosamente');
        
      } catch (error) {
        console.error('❌ Error procesando foto de cámara:', error);
        showNotification('Error al procesar la foto de la cámara. Intenta de nuevo.', 'error');
      }
    };

    const handleSelectFromGallery = () => {
      // Simular click en el input de galería
      const input = document.getElementById(`upload-gallery-${currentImageSeccion}-${currentImagePregunta}`);
      if (input) {
        input.click();
      }
      handleCloseCameraDialog();
    };

    // Función para navegar a una pregunta específica
    const navegarAPregunta = (seccionIndex, preguntaIndex) => {
      setTimeout(() => {
        let intentos = 0;
        const maxIntentos = 10;
        
        const buscarElemento = () => {
          const elemento = document.getElementById(`pregunta-${seccionIndex}-${preguntaIndex}`);
          if (elemento) {
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            elemento.style.backgroundColor = '#fff3cd';
            elemento.style.border = '3px solid #ffc107';
            elemento.style.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
            
            setTimeout(() => {
              elemento.style.backgroundColor = '';
              elemento.style.border = '';
              elemento.style.boxShadow = '';
            }, 3000);
            
            console.log(`✅ Navegación exitosa a pregunta ${preguntaIndex} de sección ${seccionIndex}`);
          } else if (intentos < maxIntentos) {
            intentos++;
            console.log(`🔄 Intento ${intentos} de ${maxIntentos} para encontrar elemento`);
            setTimeout(buscarElemento, 50);
          } else {
            console.warn(`❌ Elemento no encontrado después de ${maxIntentos} intentos: pregunta-${seccionIndex}-${preguntaIndex}`);
          }
        };
        
        buscarElemento();
      }, 150);
    };

    // ✅ NUEVA FUNCIÓN: Eliminar imagen
    const handleDeleteImagen = (imagen, seccionIndex, preguntaIndex) => {
      try {
        console.log('[PreguntasYSeccion] Eliminando imagen:', {
          seccionIndex,
          preguntaIndex,
          imagen
        });

        const nuevasImagenes = imagenes.map((img, index) => {
          if (index === seccionIndex) {
            const currentImages = img[preguntaIndex] || [];
            
            if (Array.isArray(currentImages)) {
              // Filtrar la imagen a eliminar
              const updatedImages = currentImages.filter((img, imgIndex) => {
                // Si es la misma imagen (comparar por timestamp o nombre)
                if (img.timestamp === imagen.timestamp || 
                    img.nombre === imagen.nombre ||
                    img === imagen) {
                  console.log('[PreguntasYSeccion] Imagen eliminada:', img);
                  return false;
                }
                return true;
              });
              
              return [...img.slice(0, preguntaIndex), updatedImages, ...img.slice(preguntaIndex + 1)];
            } else {
              // Si no es array, eliminar la imagen
              return [...img.slice(0, preguntaIndex), [], ...img.slice(preguntaIndex + 1)];
            }
          }
          return img;
        });

        setImagenes(nuevasImagenes);
        guardarImagenes(nuevasImagenes);
        
        console.log('[PreguntasYSeccion] Imagen eliminada exitosamente');
        showNotification('✅ Imagen eliminada', 'success');
        
      } catch (error) {
        console.error('[PreguntasYSeccion] Error eliminando imagen:', error);
        showNotification('❌ Error al eliminar la imagen', 'error');
      }
    };

    // ✅ NUEVA FUNCIÓN: Descargar imagen
    const handleDownloadImagen = (imagen, seccionIndex, preguntaIndex) => {
      try {
        console.log('[PreguntasYSeccion] Descargando imagen:', {
          seccionIndex,
          preguntaIndex,
          imagen
        });

        // La descarga se maneja en el componente ImagenAuditoria
        // Aquí solo registramos la acción
        showNotification('✅ Descarga iniciada', 'info');
        
      } catch (error) {
        console.error('[PreguntasYSeccion] Error descargando imagen:', error);
        showNotification('❌ Error al descargar la imagen', 'error');
      }
    };

    if (!Array.isArray(secciones)) {
      return (
        <Box sx={mobileBoxStyle}>
          <Typography variant="body2" color="text.secondary">
            Error: Las secciones no están en el formato correcto.
          </Typography>
        </Box>
      );
    }

    const preguntasNoContestadas = obtenerPreguntasNoContestadas(secciones, respuestas);

    return (
      <Box>
        {/* Botón de progreso compacto */}
        <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setOpenPreguntasNoContestadas(true)}
            startIcon={preguntasNoContestadas.length > 0 ? <WarningIcon /> : <CheckCircleIcon />}
            color={preguntasNoContestadas.length > 0 ? "warning" : "success"}
            sx={{ 
              fontSize: '0.75rem',
              height: '32px',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              borderWidth: '2px',
              '&:hover': {
                borderWidth: '2px'
              }
            }}
          >
            {preguntasNoContestadas.length > 0 
              ? `${preguntasNoContestadas.length} pendientes` 
              : 'Todas completadas'
            }
          </Button>
        </Box>

        {secciones.map((seccion, seccionIndex) => (
          <Box key={seccionIndex} mb={isMobile ? 2 : 4}>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              sx={{ 
                mb: isMobile ? 1.5 : 2, 
                fontWeight: 'bold', 
                color: 'primary.main',
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}
            >
              {seccionIndex + 1}. {seccion.nombre}
            </Typography>
            <Stack spacing={isMobile ? 2 : 3}>
              {seccion.preguntas.map((pregunta, preguntaIndex) => (
                <PreguntaItem
                  key={preguntaIndex}
                  seccionIndex={seccionIndex}
                  preguntaIndex={preguntaIndex}
                  pregunta={pregunta}
                  respuesta={respuestas[seccionIndex]?.[preguntaIndex] || ''}
                  comentario={comentarios[seccionIndex]?.[preguntaIndex] || ''}
                  imagenes={imagenes[seccionIndex]?.[preguntaIndex] || null}
                  isMobile={isMobile}
                  mobileBoxStyle={mobileBoxStyle}
                  onRespuestaChange={handleRespuestaChange}
                  onOpenModal={handleOpenModal}
                  onOpenCameraDialog={handleOpenCameraDialog}
                  procesandoImagen={procesandoImagen}
                // ✅ NUEVAS PROPS para manejo de imágenes
                onDeleteImagen={handleDeleteImagen}
                onDownloadImagen={handleDownloadImagen}
              />
            ))}
          </Stack>
        </Box>
      ))}

      {/* Inputs de archivo ocultos */}
      {secciones.map((seccion, seccionIndex) => (
        seccion.preguntas.map((pregunta, preguntaIndex) => (
          <Box key={`inputs-${seccionIndex}-${preguntaIndex}`} sx={{ display: 'none' }}>
            {/* Input para cámara */}
            <input
              id={`upload-camera-${seccionIndex}-${preguntaIndex}`}
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(seccionIndex, preguntaIndex, event)}
              style={{ display: 'none' }}
            />
            {/* Input para galería */}
            <input
              id={`upload-gallery-${seccionIndex}-${preguntaIndex}`}
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(seccionIndex, preguntaIndex, event)}
              style={{ display: 'none' }}
            />
          </Box>
        ))
      ))}

      {/* Modales */}
      <CommentModal
        open={modalAbierto}
        onClose={handleCloseModal}
        comentario={comentario}
        onComentarioChange={handleComentarioChange}
        onGuardarComentario={handleGuardarComentario}
      />

      <CameraDialog
        open={openCameraDialog}
        onClose={handleCloseCameraDialog}
        onPhotoCapture={handlePhotoCapture}
        onSelectFromGallery={handleSelectFromGallery}
        seccionIndex={currentImageSeccion}
        preguntaIndex={currentImagePregunta}
      />

      <PendingQuestionsModal
        open={openPreguntasNoContestadas}
        onClose={() => setOpenPreguntasNoContestadas(false)}
        preguntasNoContestadas={preguntasNoContestadas}
        onNavigateToQuestion={navegarAPregunta}
      />

      {/* Snackbar para notificaciones */}
      <Snackbar open={notification.open} autoHideDuration={6000} onClose={closeNotification}>
        <Alert onClose={closeNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PreguntasYSeccion;