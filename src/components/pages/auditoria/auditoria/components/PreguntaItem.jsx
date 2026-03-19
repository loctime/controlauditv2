import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  useTheme,
  Collapse,
  Checkbox,
  FormControlLabel,
  TextField
} from '@mui/material';
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
import logger from '@/utils/logger';
import UnifiedFileUploader from '@/components/common/files/UnifiedFileUploader';
import UnifiedFilePreview from '@/components/common/files/UnifiedFilePreview';

const toFileArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

export default function PreguntaItem({
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
  onImageUploaded
}) {
  const theme = useTheme();
  const [expandedAccion, setExpandedAccion] = useState(false);

  const accionData =
    accionRequerida || {
      requiereAccion: false,
      accionTexto: '',
      fechaVencimiento: null
    };

  const files = useMemo(() => toFileArray(imagenes), [imagenes]);
  const isProcesando = procesandoImagen?.[`${seccionIndex}-${preguntaIndex}`] || false;

  const handleUploaderChange = (_merged, result) => {
    const accepted = result?.accepted || [];
    const rejected = result?.rejected || [];
    const warnings = result?.warnings || [];
    logger.debug('[AUDITORIA IMG] UnifiedFileUploader resultado', {
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      warningsCount: warnings.length,
      acceptedNames: accepted.map((f) => f?.name).slice(0, 5),
      rejectedNames: rejected.map((r) => r?.fileName).slice(0, 5)
    });

    if (!accepted.length) return;
    if (!onImageUploaded) {
      logger.warn('[AUDITORIA IMG] onImageUploaded NO definido', { seccionIndex, preguntaIndex });
      return;
    }

    onImageUploaded(seccionIndex, preguntaIndex, accepted);
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2, mb: isMobile ? 1.5 : 2 }}>
        <Typography
          variant={isMobile ? 'body1' : 'subtitle1'}
          sx={{ fontWeight: 500, flex: 1, fontSize: isMobile ? '0.875rem' : '1rem' }}
        >
          {pregunta}
        </Typography>
        {preguntaContestada([respuesta], 0, 0) ? (
          <Chip icon={<CheckCircleIcon />} label="Contestada" color="success" size={isMobile ? 'small' : 'medium'} />
        ) : (
          <Chip icon={<WarningIcon />} label="Sin contestar" color="warning" size={isMobile ? 'small' : 'medium'} />
        )}
      </Box>

      <Stack direction="column" spacing={isMobile ? 1 : 1.5}>
        <Stack direction="row" spacing={isMobile ? 0.5 : 1} flexWrap="wrap" sx={{ gap: isMobile ? 0.5 : 1 }}>
          {respuesta && respuesta.trim() !== ''
            ? (
              <Button
                variant="contained"
                startIcon={obtenerIconoRespuesta(respuesta)}
                onClick={() => onRespuestaChange(seccionIndex, preguntaIndex, respuesta)}
                sx={{
                  minWidth: isMobile ? 80 : 120,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  py: isMobile ? 0.5 : 1,
                  px: isMobile ? 1 : 2,
                  ...obtenerColorRespuesta(respuesta)
                }}
              >
                {respuesta}
              </Button>
              )
            : respuestasPosibles.map((respuestaOption, index) => (
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
                    borderColor: obtenerColorRespuesta(respuestaOption).backgroundColor
                  }
                }}
              >
                {respuestaOption}
              </Button>
              ))}
        </Stack>

        <Stack direction="row" spacing={isMobile ? 0.5 : 1} sx={{ gap: isMobile ? 0.5 : 1 }}>
          <Button
            variant={clasificacion?.condicion ? 'contained' : 'outlined'}
            startIcon={<BuildIcon />}
            onClick={() =>
              onClasificacionChange?.(seccionIndex, preguntaIndex, {
                condicion: !clasificacion?.condicion,
                actitud: clasificacion?.actitud || false
              })
            }
          >
            Condicion
          </Button>
          <Button
            variant={clasificacion?.actitud ? 'contained' : 'outlined'}
            startIcon={<PeopleIcon />}
            onClick={() =>
              onClasificacionChange?.(seccionIndex, preguntaIndex, {
                condicion: clasificacion?.condicion || false,
                actitud: !clasificacion?.actitud
              })
            }
          >
            Actitud
          </Button>
        </Stack>

        <Button variant="outlined" startIcon={<CommentIcon />} onClick={() => onOpenModal(seccionIndex, preguntaIndex)}>
          Comentario
        </Button>

        <Stack direction="row" spacing={isMobile ? 0.5 : 1} sx={{ gap: isMobile ? 0.5 : 1 }}>
          <Button
            variant="outlined"
            component="span"
            startIcon={<CameraAltIcon />}
            onClick={() => onOpenCameraDialog(seccionIndex, preguntaIndex)}
            disabled={isProcesando}
          >
            {isProcesando ? 'Procesando...' : 'Camara'}
          </Button>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <label htmlFor={`upload-gallery-${seccionIndex}-${preguntaIndex}`}>
              <Button variant="outlined" component="span" startIcon={<UploadIcon />} disabled={isProcesando}>
                {isProcesando ? 'Procesando...' : 'Subir'}
              </Button>
            </label>
            <UnifiedFileUploader
              id={`upload-gallery-${seccionIndex}-${preguntaIndex}`}
              accept="*/*"
              files={[]}
              onFilesChange={handleUploaderChange}
              helperText=""
              inputProps={{ style: { display: 'none' } }}
            />
          </Box>
        </Stack>
      </Stack>

      <Box mt={isMobile ? 1.5 : 2} display="flex" alignItems="center" gap={isMobile ? 2 : 3} flexWrap="wrap">
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: 'italic', fontSize: isMobile ? '0.75rem' : '0.875rem' }}
        >
          {comentario ? `Comentario: ${comentario}` : 'Sin comentario'}
        </Typography>

        {files.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {files.map((fileItem, fileIndex) => {
              const previewFileRef =
                fileItem && typeof fileItem === 'object' && (fileItem.fileId || fileItem.shareToken)
                  ? fileItem
                  : null;

              return (
                <Box key={`${preguntaIndex}-${fileIndex}`} sx={{ position: 'relative', width: isMobile ? 90 : 120 }}>
                  {previewFileRef ? (
                    <UnifiedFilePreview fileRef={previewFileRef} height={isMobile ? 80 : 100} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Archivo pendiente: {fileItem?.name || 'sin nombre'}
                    </Typography>
                  )}
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
                      '&:hover': { backgroundColor: '#d32f2f' }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage?.(seccionIndex, preguntaIndex, fileIndex);
                    }}
                  >
                    x
                  </Button>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <Box mt={isMobile ? 1.5 : 2}>
        <FormControlLabel
          control={
            <Checkbox
              checked={accionData.requiereAccion || false}
              onChange={(e) => {
                const nuevaAccion = {
                  ...accionData,
                  requiereAccion: e.target.checked,
                  accionTexto: e.target.checked ? accionData.accionTexto : '',
                  fechaVencimiento: e.target.checked ? accionData.fechaVencimiento : null
                };
                setExpandedAccion(Boolean(e.target.checked));
                onAccionRequeridaChange?.(seccionIndex, preguntaIndex, nuevaAccion);
              }}
              size={isMobile ? 'small' : 'medium'}
            />
          }
          label={<Typography variant="body2">Accion requerida</Typography>}
        />

        <Collapse in={expandedAccion || (accionData.requiereAccion && accionData.accionTexto)}>
          <Box sx={{ mt: 1, p: 2, borderRadius: 1, bgcolor: 'warning.50', border: `1px solid ${theme.palette.warning.light}` }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              label="Accion a tomar"
              value={accionData.accionTexto || ''}
              onChange={(e) =>
                onAccionRequeridaChange?.(seccionIndex, preguntaIndex, {
                  ...accionData,
                  requiereAccion: true,
                  accionTexto: e.target.value
                })
              }
              sx={{ mb: 2 }}
            />

            <DatePicker
              label="Fecha de vencimiento"
              value={accionData.fechaVencimiento ? dayjs(accionData.fechaVencimiento) : null}
              onChange={(newValue) =>
                onAccionRequeridaChange?.(seccionIndex, preguntaIndex, {
                  ...accionData,
                  requiereAccion: true,
                  fechaVencimiento: newValue ? newValue.toISOString() : null
                })
              }
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />

            <Button
              size="small"
              variant="text"
              color="warning"
              startIcon={expandedAccion ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setExpandedAccion(!expandedAccion)}
              sx={{ mt: 1 }}
            >
              {expandedAccion ? 'Ocultar detalles' : 'Mostrar detalles'}
            </Button>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}



