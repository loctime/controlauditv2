import React, { useState, useEffect, useRef } from "react";
import { Button, Box, Typography, Stack, useTheme, useMediaQuery } from "@mui/material";
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

const PreguntasYSeccion = ({ 
  secciones: seccionesObj = {}, 
  guardarRespuestas, 
  guardarComentario, 
  guardarImagenes,
  guardarClasificaciones,
  guardarAccionesRequeridas,
  // Props para mantener respuestas existentes
  respuestasExistentes = [],
  comentariosExistentes = [],
  imagenesExistentes = [],
  clasificacionesExistentes = [],
  accionesRequeridasExistentes = [],
  // Props para carga de imágenes
  auditId,
  companyId
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
  const [clasificaciones, setClasificaciones] = useState([]);
  const [accionesRequeridas, setAccionesRequeridas] = useState([]);
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

  // Refs para rastrear props anteriores y detectar cambios
  const prevPropsRef = useRef({
    respuestasExistentes: null,
    comentariosExistentes: null,
    imagenesExistentes: null,
    clasificacionesExistentes: null
  });

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

      // Inicializar con clasificaciones existentes o vacías
      const newClasificaciones = secciones.map((seccion, seccionIndex) => 
        Array(seccion.preguntas.length).fill(null).map((_, preguntaIndex) => 
          clasificacionesExistentes[seccionIndex]?.[preguntaIndex] || { condicion: false, actitud: false }
        )
      );
      setClasificaciones(newClasificaciones);

      // Inicializar con acciones requeridas existentes o vacías
      const newAccionesRequeridas = secciones.map((seccion, seccionIndex) => 
        Array(seccion.preguntas.length).fill(null).map((_, preguntaIndex) => 
          accionesRequeridasExistentes[seccionIndex]?.[preguntaIndex] || null
        )
      );
      setAccionesRequeridas(newAccionesRequeridas);

      setInitialized(true);
    } else if (initialized && secciones.length > 0) {
      // Si ya está inicializado pero las secciones cambiaron o hay respuestas existentes que no están en el estado interno
      // Esto maneja el caso cuando el usuario navega hacia atrás y vuelve al paso de preguntas
      const tieneRespuestasEnProps = respuestasExistentes && respuestasExistentes.length > 0 && 
        respuestasExistentes.some((seccion) => 
          Array.isArray(seccion) && seccion.some((resp) => 
            resp !== '' && resp !== null && resp !== undefined
          )
        );
      
      const tieneRespuestasEnEstado = respuestas && respuestas.length > 0 && 
        respuestas.some((seccion) => 
          Array.isArray(seccion) && seccion.some((resp) => 
            resp !== '' && resp !== null && resp !== undefined
          )
        );
      
      // Si hay respuestas en props pero no en estado, restaurarlas
      if (tieneRespuestasEnProps && !tieneRespuestasEnEstado) {
        console.log('🔄 [PreguntasYSeccion] Restaurando respuestas al volver al paso de preguntas');
        const newRespuestas = secciones.map((seccion, seccionIndex) => 
          Array(seccion.preguntas.length).fill('').map((_, preguntaIndex) => 
            respuestasExistentes[seccionIndex]?.[preguntaIndex] || ''
          )
        );
        setRespuestas(newRespuestas);
        
        if (comentariosExistentes && comentariosExistentes.length > 0) {
          const newComentarios = secciones.map((seccion, seccionIndex) => 
            Array(seccion.preguntas.length).fill('').map((_, preguntaIndex) => 
              comentariosExistentes[seccionIndex]?.[preguntaIndex] || ''
            )
          );
          setComentarios(newComentarios);
        }
        
        if (imagenesExistentes && imagenesExistentes.length > 0) {
          const newImagenes = secciones.map((seccion, seccionIndex) => 
            Array(seccion.preguntas.length).fill(null).map((_, preguntaIndex) => 
              imagenesExistentes[seccionIndex]?.[preguntaIndex] || null
            )
          );
          setImagenes(newImagenes);
        }
        
        if (clasificacionesExistentes && clasificacionesExistentes.length > 0) {
          const newClasificaciones = secciones.map((seccion, seccionIndex) => 
            Array(seccion.preguntas.length).fill(null).map((_, preguntaIndex) => 
              clasificacionesExistentes[seccionIndex]?.[preguntaIndex] || { condicion: false, actitud: false }
            )
          );
          setClasificaciones(newClasificaciones);
        }
      }
    }
  }, [initialized, secciones, respuestasExistentes, comentariosExistentes, imagenesExistentes, clasificacionesExistentes, respuestas]);

  // Nuevo useEffect para actualizar cuando las props cambian después de la inicialización
  // Esto es necesario cuando se restauran datos después de que el componente ya se inicializó
  useEffect(() => {
    // Solo actualizar si ya está inicializado y hay secciones
    if (initialized && secciones.length > 0) {
      // Comparar con props anteriores para detectar cambios
      const propsCambiaron = 
        JSON.stringify(prevPropsRef.current.respuestasExistentes) !== JSON.stringify(respuestasExistentes) ||
        JSON.stringify(prevPropsRef.current.comentariosExistentes) !== JSON.stringify(comentariosExistentes) ||
        JSON.stringify(prevPropsRef.current.clasificacionesExistentes) !== JSON.stringify(clasificacionesExistentes) ||
        (imagenesExistentes && imagenesExistentes.length > 0 && 
         JSON.stringify(prevPropsRef.current.imagenesExistentes?.map(seccion => 
           seccion.map(img => img instanceof File ? 'FILE' : img)
         )) !== JSON.stringify(imagenesExistentes.map(seccion => 
           seccion.map(img => img instanceof File ? 'FILE' : img)
         )));
      
      // Verificar si hay respuestas válidas en las props
      const tieneRespuestasEnProps = respuestasExistentes && respuestasExistentes.length > 0 && 
        respuestasExistentes.some((seccion) => 
          Array.isArray(seccion) && seccion.some((resp) => 
            resp !== '' && resp !== null && resp !== undefined
          )
        );
      
      // Verificar si el estado interno está vacío o incompleto comparado con las props
      const estadoInternoVacioOIncompleto = !respuestas || respuestas.length === 0 || 
        !respuestas.some((seccion) => 
          Array.isArray(seccion) && seccion.some((resp) => 
            resp !== '' && resp !== null && resp !== undefined
          )
        );
      
      // ACTUALIZAR SIEMPRE que las props cambien Y tengan datos válidos
      // Esto asegura que las respuestas restauradas siempre se apliquen
      const debeActualizar = propsCambiaron && tieneRespuestasEnProps;
      
      console.log('🔍 [PreguntasYSeccion] Verificando actualización:', {
        initialized,
        propsCambiaron,
        tieneRespuestasEnProps,
        estadoInternoVacioOIncompleto,
        debeActualizar,
        respuestasExistentesLength: respuestasExistentes?.length || 0,
        respuestasExistentesContenido: respuestasExistentes,
        respuestasExistentesPrimeraSeccion: respuestasExistentes?.[0],
        respuestasExistentesPrimeraSeccionLength: respuestasExistentes?.[0]?.length || 0,
        respuestasExistentesPrimeraSeccionContenido: respuestasExistentes?.[0],
        respuestasLength: respuestas.length,
        respuestasContenido: respuestas
      });
      
      if (debeActualizar) {
        console.log('🔄 [PreguntasYSeccion] Actualizando desde respuestas restauradas');
        
        // Actualizar respuestas
        const newRespuestas = secciones.map((seccion, seccionIndex) => 
          Array(seccion.preguntas.length).fill('').map((_, preguntaIndex) => {
            const restaurada = respuestasExistentes[seccionIndex]?.[preguntaIndex];
            return restaurada !== undefined && restaurada !== null && restaurada !== '' 
              ? restaurada 
              : '';
          })
        );
        console.log('📋 [PreguntasYSeccion] Nuevas respuestas a establecer:', newRespuestas);
        setRespuestas(newRespuestas);

        // Actualizar comentarios
        const tieneComentariosRestaurados = comentariosExistentes && comentariosExistentes.length > 0 &&
          comentariosExistentes.some((seccion) => 
            Array.isArray(seccion) && seccion.some((com) => 
              com !== '' && com !== null && com !== undefined
            )
          );
        
        if (tieneComentariosRestaurados) {
          const newComentarios = secciones.map((seccion, seccionIndex) => 
            Array(seccion.preguntas.length).fill('').map((_, preguntaIndex) => {
              const restaurado = comentariosExistentes[seccionIndex]?.[preguntaIndex];
              return restaurado !== undefined && restaurado !== null && restaurado !== '' 
                ? restaurado 
                : '';
            })
          );
          setComentarios(newComentarios);
        }

        // Actualizar imágenes (File objects)
        const tieneImagenesRestauradas = imagenesExistentes && imagenesExistentes.length > 0 &&
          imagenesExistentes.some((seccion) => 
            Array.isArray(seccion) && seccion.some((img) => 
              img !== null && img !== undefined
            )
          );
        
        if (tieneImagenesRestauradas) {
          const newImagenes = secciones.map((seccion, seccionIndex) => 
            Array(seccion.preguntas.length).fill(null).map((_, preguntaIndex) => {
              const restaurada = imagenesExistentes[seccionIndex]?.[preguntaIndex];
              // Priorizar imágenes restauradas (File objects desde IndexedDB)
              return restaurada !== null && restaurada !== undefined 
                ? restaurada 
                : null;
            })
          );
          setImagenes(newImagenes);
        }

        // Actualizar clasificaciones
        const tieneClasificacionesRestauradas = clasificacionesExistentes && clasificacionesExistentes.length > 0 &&
          clasificacionesExistentes.some((seccion) => 
            Array.isArray(seccion) && seccion.some((clas) => 
              clas && (clas.condicion || clas.actitud)
            )
          );
        
        if (tieneClasificacionesRestauradas) {
          const newClasificaciones = secciones.map((seccion, seccionIndex) => 
            Array(seccion.preguntas.length).fill(null).map((_, preguntaIndex) => {
              const restaurada = clasificacionesExistentes[seccionIndex]?.[preguntaIndex];
              return restaurada && (restaurada.condicion || restaurada.actitud)
                ? restaurada 
                : { condicion: false, actitud: false };
            })
          );
          setClasificaciones(newClasificaciones);
        }
      }
      
      // Actualizar refs con las props actuales
      prevPropsRef.current = {
        respuestasExistentes,
        comentariosExistentes,
        imagenesExistentes,
        clasificacionesExistentes
      };
    }
  }, [initialized, secciones.length, respuestasExistentes, comentariosExistentes, imagenesExistentes, clasificacionesExistentes]);

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

  const handleClasificacionChange = (seccionIndex, preguntaIndex, nuevaClasificacion) => {
    console.log('🔍 [PreguntasYSeccion] handleClasificacionChange llamado:', {
      seccionIndex,
      preguntaIndex,
      nuevaClasificacion,
      clasificacionesActuales: clasificaciones
    });
    const nuevasClasificaciones = clasificaciones.map((clas, index) =>
      index === seccionIndex ? [...clas.slice(0, preguntaIndex), nuevaClasificacion, ...clas.slice(preguntaIndex + 1)] : clas
    );
    console.log('🔍 [PreguntasYSeccion] Nuevas clasificaciones después del cambio:', nuevasClasificaciones);
    setClasificaciones(nuevasClasificaciones);
    if (guardarClasificaciones) {
      console.log('🔍 [PreguntasYSeccion] Llamando a guardarClasificaciones con:', nuevasClasificaciones);
      guardarClasificaciones(nuevasClasificaciones);
    } else {
      console.warn('🔍 [PreguntasYSeccion] guardarClasificaciones NO está definido!');
    }
  };

  const handleAccionRequeridaChange = (seccionIndex, preguntaIndex, accionData) => {
    const nuevasAcciones = accionesRequeridas.map((acc, index) =>
      index === seccionIndex ? [...acc.slice(0, preguntaIndex), accionData, ...acc.slice(preguntaIndex + 1)] : acc
    );
    setAccionesRequeridas(nuevasAcciones);
    if (guardarAccionesRequeridas) {
      guardarAccionesRequeridas(nuevasAcciones);
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
      
      // Solo permitir una imagen por pregunta
      const nuevasImagenes = imagenes.map((img, index) => {
        if (index === seccionIndex) {
          // Reemplazar cualquier imagen existente con la nueva
          return [...img.slice(0, preguntaIndex), compressedFile, ...img.slice(preguntaIndex + 1)];
        }
        return img;
      });
      
      setImagenes(nuevasImagenes);
      guardarImagenes(nuevasImagenes);
      
      console.log(`✅ Imagen optimizada y guardada para pregunta ${preguntaIndex} de sección ${seccionIndex}`);
    } catch (error) {
      console.error('❌ Error al procesar imagen:', error);
      
      // Fallback: usar imagen original si falla la compresión
      const nuevasImagenes = imagenes.map((img, index) => {
        if (index === seccionIndex) {
          // Reemplazar cualquier imagen existente con la nueva
          return [...img.slice(0, preguntaIndex), file, ...img.slice(preguntaIndex + 1)];
        }
        return img;
      });
      
      setImagenes(nuevasImagenes);
      guardarImagenes(nuevasImagenes);
      
      console.log('⚠️ Usando imagen original sin optimizar');
    } finally {
      // Ocultar indicador ade procesamiento
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

  const handlePhotoCapture = (compressedFile) => {
    handleFileChange(currentImageSeccion, currentImagePregunta, { target: { files: [compressedFile] } });
  };

  const handleSelectFromGallery = () => {
    // Simular click en el input de galería
    const input = document.getElementById(`upload-gallery-${currentImageSeccion}-${currentImagePregunta}`);
    if (input) {
      input.click();
    }
    handleCloseCameraDialog();
  };

  const handleDeleteImage = (seccionIndex, preguntaIndex, imageIndex) => {
    const nuevasImagenes = imagenes.map((img, index) => {
      if (index === seccionIndex) {
        // Eliminar la imagen (solo hay una por pregunta)
        return [...img.slice(0, preguntaIndex), null, ...img.slice(preguntaIndex + 1)];
      }
      return img;
    });
    
    setImagenes(nuevasImagenes);
    guardarImagenes(nuevasImagenes);
    console.log(`🗑️ Imagen eliminada de pregunta ${preguntaIndex} de sección ${seccionIndex}`);
  };

  // Handler para cuando se sube una imagen usando ControlFile
  const handleImageUploaded = (seccionIndex, preguntaIndex, imageData) => {
    console.log('📸 [PreguntasYSeccion] Imagen subida:', { seccionIndex, preguntaIndex, imageData });
    
    // Actualizar el estado de imágenes con el fileId recibido
    const nuevasImagenes = imagenes.map((img, index) => {
      if (index === seccionIndex) {
        // Reemplazar cualquier imagen existente con la nueva (que contiene fileId)
        return [...img.slice(0, preguntaIndex), imageData, ...img.slice(preguntaIndex + 1)];
      }
      return img;
    });
    
    setImagenes(nuevasImagenes);
    guardarImagenes(nuevasImagenes);
    console.log(`✅ Imagen guardada con fileId para pregunta ${preguntaIndex} de sección ${seccionIndex}`);
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
                clasificacion={clasificaciones[seccionIndex]?.[preguntaIndex] || { condicion: false, actitud: false }}
                accionRequerida={accionesRequeridas[seccionIndex]?.[preguntaIndex] || null}
                isMobile={isMobile}
                mobileBoxStyle={mobileBoxStyle}
                onRespuestaChange={handleRespuestaChange}
                onOpenModal={handleOpenModal}
                onOpenCameraDialog={handleOpenCameraDialog}
                onDeleteImage={handleDeleteImage}
                onClasificacionChange={handleClasificacionChange}
                onAccionRequeridaChange={handleAccionRequeridaChange}
                procesandoImagen={procesandoImagen}
                auditId={auditId}
                companyId={companyId}
                onImageUploaded={handleImageUploaded}
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
    </Box>
  );
};

export default PreguntasYSeccion;