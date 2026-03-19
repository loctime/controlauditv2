import logger from '@/utils/logger';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Box, Typography, Stack, useTheme, useMediaQuery } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CameraDialog from './components/CameraDialog';
import CommentModal from './components/CommentModal';
import PendingQuestionsModal from './components/PendingQuestionsModal';
import PreguntaItem from './components/PreguntaItem';
import { obtenerPreguntasNoContestadas } from './utils/respuestaUtils.jsx';
import { softDeleteFile } from '../../../../services/unifiedFileService';

const normalizeQuestionMatrix = (secciones, source, emptyValue) =>
  secciones.map((seccion, seccionIndex) =>
    Array(seccion.preguntas.length)
      .fill(null)
      .map((_, preguntaIndex) => {
        const value = source?.[seccionIndex]?.[preguntaIndex];
        return value === undefined || value === null ? emptyValue : value;
      })
  );

const normalizeFilesMatrix = (secciones, source) =>
  secciones.map((seccion, seccionIndex) =>
    Array(seccion.preguntas.length)
      .fill(null)
      .map((_, preguntaIndex) => {
        const value = source?.[seccionIndex]?.[preguntaIndex];
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
      })
  );

export default function PreguntasYSeccion({
  secciones: seccionesObj = {},
  guardarRespuestas,
  guardarComentario,
  guardarImagenes,
  guardarClasificaciones,
  guardarAccionesRequeridas,
  respuestasExistentes = [],
  comentariosExistentes = [],
  imagenesExistentes = [],
  clasificacionesExistentes = [],
  accionesRequeridasExistentes = [],
  ownerId = null
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const secciones = useMemo(() => Object.values(seccionesObj || {}), [seccionesObj]);

  const mobileBoxStyle = {
    mb: isMobile ? 1.5 : 3,
    p: isMobile ? 2 : 3,
    borderRadius: 2,
    bgcolor: 'background.paper',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden'
  };

  const [respuestas, setRespuestas] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [accionesRequeridas, setAccionesRequeridas] = useState([]);
  const [imagenes, setImagenes] = useState([]);

  // Evita que el useEffect de "resincronización" desde props pise el estado local
  // justo después de subir/borrar desde la UI (causa imágenes que desaparecen).
  const skipNextImagenesSyncRef = useRef(false);
  const hasInitImagesRef = useRef(false);
  const seccionesKeyRef = useRef('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [comentario, setComentario] = useState('');
  const [currentSeccionIndex, setCurrentSeccionIndex] = useState(null);
  const [currentPreguntaIndex, setCurrentPreguntaIndex] = useState(null);

  const [openCameraDialog, setOpenCameraDialog] = useState(false);
  const [currentImageSeccion, setCurrentImageSeccion] = useState(null);
  const [currentImagePregunta, setCurrentImagePregunta] = useState(null);
  const [openPreguntasNoContestadas, setOpenPreguntasNoContestadas] = useState(false);

  useEffect(() => {
    if (!secciones.length) return;

    // Reiniciar init de imágenes solo si cambia la "forma" del cuestionario.
    const seccionesKey = `${secciones.length}:${secciones.map((s) => s?.preguntas?.length || 0).join(',')}`;
    if (seccionesKeyRef.current !== seccionesKey) {
      seccionesKeyRef.current = seccionesKey;
      hasInitImagesRef.current = false;
    }

    setRespuestas(normalizeQuestionMatrix(secciones, respuestasExistentes, ''));
    setComentarios(normalizeQuestionMatrix(secciones, comentariosExistentes, ''));
    if (skipNextImagenesSyncRef.current) {
      // Un ciclo de "gracia" para no pisar cambios locales.
      skipNextImagenesSyncRef.current = false;
    } else if (!hasInitImagesRef.current) {
      // Inicializar una vez por estructura de secciones. Después, el estado local
      // se mantiene por los handlers (subir/borrar), evitando que props vuelvan
      // a pisar (causa típica de "desaparece enseguida").
      setImagenes(normalizeFilesMatrix(secciones, imagenesExistentes));
      hasInitImagesRef.current = true;
    }

    setClasificaciones(
      secciones.map((seccion, seccionIndex) =>
        Array(seccion.preguntas.length)
          .fill(null)
          .map((_, preguntaIndex) => {
            const value = clasificacionesExistentes?.[seccionIndex]?.[preguntaIndex];
            return value || { condicion: false, actitud: false };
          })
      )
    );

    setAccionesRequeridas(
      secciones.map((seccion, seccionIndex) =>
        Array(seccion.preguntas.length)
          .fill(null)
          .map((_, preguntaIndex) => accionesRequeridasExistentes?.[seccionIndex]?.[preguntaIndex] || null)
      )
    );
  }, [
    secciones,
    respuestasExistentes,
    comentariosExistentes,
    imagenesExistentes,
    clasificacionesExistentes,
    accionesRequeridasExistentes
  ]);

  const handleRespuestaChange = (seccionIndex, preguntaIndex, value) => {
    const next = respuestas.map((seccion, idx) =>
      idx === seccionIndex ? [...seccion.slice(0, preguntaIndex), seccion[preguntaIndex] === value ? '' : value, ...seccion.slice(preguntaIndex + 1)] : seccion
    );
    setRespuestas(next);
    guardarRespuestas(next);
  };

  const handleGuardarComentario = () => {
    if (currentSeccionIndex === null || currentPreguntaIndex === null) return;

    const next = comentarios.map((seccion, idx) =>
      idx === currentSeccionIndex
        ? [...seccion.slice(0, currentPreguntaIndex), comentario, ...seccion.slice(currentPreguntaIndex + 1)]
        : seccion
    );

    setComentarios(next);
    guardarComentario(next);
    setModalAbierto(false);
    setComentario('');
  };

  const handleClasificacionChange = (seccionIndex, preguntaIndex, nuevaClasificacion) => {
    const next = clasificaciones.map((seccion, idx) =>
      idx === seccionIndex
        ? [...seccion.slice(0, preguntaIndex), nuevaClasificacion, ...seccion.slice(preguntaIndex + 1)]
        : seccion
    );
    setClasificaciones(next);
    guardarClasificaciones?.(next);
  };

  const handleAccionRequeridaChange = (seccionIndex, preguntaIndex, accionData) => {
    const next = accionesRequeridas.map((seccion, idx) =>
      idx === seccionIndex ? [...seccion.slice(0, preguntaIndex), accionData, ...seccion.slice(preguntaIndex + 1)] : seccion
    );
    setAccionesRequeridas(next);
    guardarAccionesRequeridas?.(next);
  };

  const handleDeleteImage = async (seccionIndex, preguntaIndex, fileIndex) => {
    const target = imagenes?.[seccionIndex]?.[preguntaIndex]?.[fileIndex] || null;
    logger.debug('[AUDITORIA IMG] delete click', { seccionIndex, preguntaIndex, fileIndex });
    const hasCanonicalRef =
      target &&
      typeof target === 'object' &&
      target.fileDocId &&
      target.entityId &&
      target.module;

    if (hasCanonicalRef && ownerId) {
      try {
        await softDeleteFile({
          ownerId,
          module: target.module || 'auditorias',
          entityId: target.entityId,
          fileDocId: target.fileDocId
        });
      } catch (error) {
        logger.warn('[PreguntasYSeccion] No se pudo aplicar soft delete canonico, se elimina de UI', error);
      }
    }

    skipNextImagenesSyncRef.current = true;
    setImagenes((prevImagenes) => {
      const next = (prevImagenes || []).map((seccion, idx) => {
        if (idx !== seccionIndex) return seccion;
        const current = Array.isArray(seccion[preguntaIndex]) ? seccion[preguntaIndex] : [];
        const updated = current.filter((_, index) => index !== fileIndex);
        return [...seccion.slice(0, preguntaIndex), updated, ...seccion.slice(preguntaIndex + 1)];
      });
      guardarImagenes?.(next);
      return next;
    });
  };

  const handleImageUploaded = (seccionIndex, preguntaIndex, filesSeleccionados = []) => {
    const validFiles = (filesSeleccionados || []).filter((f) => f instanceof File);
    logger.debug('[AUDITORIA IMG] handleImageUploaded', {
      seccionIndex,
      preguntaIndex,
      selectedCount: filesSeleccionados?.length || 0,
      validCount: validFiles.length,
      names: validFiles.map((f) => f?.name).slice(0, 5)
    });
    if (!validFiles.length) return;

    skipNextImagenesSyncRef.current = true;
    setImagenes((prevImagenes) => {
      const next = (prevImagenes || []).map((seccion, idx) => {
        if (idx !== seccionIndex) return seccion;
        const current = Array.isArray(seccion[preguntaIndex]) ? seccion[preguntaIndex] : [];
        return [
          ...seccion.slice(0, preguntaIndex),
          [...current, ...validFiles],
          ...seccion.slice(preguntaIndex + 1)
        ];
      });
      guardarImagenes?.(next);
      return next;
    });
  };

  const handleOpenModal = (seccionIndex, preguntaIndex) => {
    setCurrentSeccionIndex(seccionIndex);
    setCurrentPreguntaIndex(preguntaIndex);
    setComentario(comentarios?.[seccionIndex]?.[preguntaIndex] || '');
    setModalAbierto(true);
  };

  const handleOpenCameraDialog = (seccionIndex, preguntaIndex) => {
    setCurrentImageSeccion(seccionIndex);
    setCurrentImagePregunta(preguntaIndex);
    setOpenCameraDialog(true);
  };

  const handlePhotoCapture = (capturedFile) => {
    if (!(capturedFile instanceof File)) return;
    handleImageUploaded(currentImageSeccion, currentImagePregunta, [capturedFile]);
    setOpenCameraDialog(false);
  };

  const handleSelectFromGallery = () => {
    const input = document.getElementById(`upload-gallery-${currentImageSeccion}-${currentImagePregunta}`);
    if (input) input.click();
    setOpenCameraDialog(false);
  };

  const preguntasNoContestadas = obtenerPreguntasNoContestadas(secciones, respuestas);

  if (!Array.isArray(secciones) || secciones.length === 0) {
    return (
      <Box sx={mobileBoxStyle}>
        <Typography variant="body2" color="text.secondary">
          Error: Las secciones no estan en el formato correcto.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setOpenPreguntasNoContestadas(true)}
          startIcon={preguntasNoContestadas.length > 0 ? <WarningIcon /> : <CheckCircleIcon />}
          color={preguntasNoContestadas.length > 0 ? 'warning' : 'success'}
        >
          {preguntasNoContestadas.length > 0 ? `${preguntasNoContestadas.length} pendientes` : 'Todas completadas'}
        </Button>
      </Box>

      {secciones.map((seccion, seccionIndex) => (
        <Box key={seccionIndex} mb={isMobile ? 2 : 4}>
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ mb: isMobile ? 1.5 : 2, fontWeight: 'bold', color: 'primary.main' }}>
            {seccionIndex + 1}. {seccion.nombre}
          </Typography>

          <Stack spacing={isMobile ? 2 : 3}>
            {seccion.preguntas.map((pregunta, preguntaIndex) => (
              <PreguntaItem
                key={preguntaIndex}
                seccionIndex={seccionIndex}
                preguntaIndex={preguntaIndex}
                pregunta={pregunta}
                respuesta={respuestas?.[seccionIndex]?.[preguntaIndex] || ''}
                comentario={comentarios?.[seccionIndex]?.[preguntaIndex] || ''}
                imagenes={imagenes?.[seccionIndex]?.[preguntaIndex] || []}
                clasificacion={clasificaciones?.[seccionIndex]?.[preguntaIndex] || { condicion: false, actitud: false }}
                accionRequerida={accionesRequeridas?.[seccionIndex]?.[preguntaIndex] || null}
                isMobile={isMobile}
                mobileBoxStyle={mobileBoxStyle}
                onRespuestaChange={handleRespuestaChange}
                onOpenModal={handleOpenModal}
                onOpenCameraDialog={handleOpenCameraDialog}
                onDeleteImage={handleDeleteImage}
                onClasificacionChange={handleClasificacionChange}
                onAccionRequeridaChange={handleAccionRequeridaChange}
                procesandoImagen={{}}
                onImageUploaded={handleImageUploaded}
              />
            ))}
          </Stack>
        </Box>
      ))}

      <CommentModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        comentario={comentario}
        onComentarioChange={(event) => setComentario(event.target.value)}
        onGuardarComentario={handleGuardarComentario}
      />

      <CameraDialog
        open={openCameraDialog}
        onClose={() => setOpenCameraDialog(false)}
        onPhotoCapture={handlePhotoCapture}
        onSelectFromGallery={handleSelectFromGallery}
        seccionIndex={currentImageSeccion}
        preguntaIndex={currentImagePregunta}
      />

      <PendingQuestionsModal
        open={openPreguntasNoContestadas}
        onClose={() => setOpenPreguntasNoContestadas(false)}
        preguntasNoContestadas={preguntasNoContestadas}
        onNavigateToQuestion={(seccionIndex, preguntaIndex) => {
          const element = document.getElementById(`pregunta-${seccionIndex}-${preguntaIndex}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            logger.warn('No se encontro el elemento para navegar a la pregunta');
          }
        }}
      />
    </Box>
  );
}

