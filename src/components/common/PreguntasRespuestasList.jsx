import logger from '@/utils/logger';
import { Box, Typography, Paper, Divider, Chip } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import UnifiedFilePreview from '@/components/common/files/UnifiedFilePreview';

const toFileRef = (value) => {
  if (!value) return null;
  if (value.fileId || value.shareToken) {
    return {
      fileId: value.fileId || value.shareToken,
      shareToken: value.shareToken || null,
      name: value.name || value.nombre || 'archivo',
      mimeType: value.mimeType || value.tipo || 'application/octet-stream',
      size: value.size || 0,
      status: value.status || 'active'
    };
  }
  if (typeof value === 'string') {
    const match = value.match(/\/shares\/([^/]+)/i);
    const shareToken = value.startsWith('http') ? match?.[1] : value;
    if (!shareToken) return null;
    return {
      fileId: shareToken,
      shareToken,
      name: 'archivo_legacy',
      mimeType: 'application/octet-stream',
      size: 0,
      status: 'active'
    };
  }
  return null;
};

const toFileRefList = (value) => {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.map(toFileRef).filter(Boolean);
};

export default function PreguntasRespuestasList({ secciones = [], respuestas = [], comentarios = [], imagenes = [], clasificaciones = [] }) {
  if (!Array.isArray(secciones) || secciones.length === 0) {
    logger.warn('[PreguntasRespuestasList] No hay secciones para mostrar');
    return <Typography variant="body2" color="text.secondary">No hay datos para mostrar.</Typography>;
  }

  return (
    <Box>
      {secciones.map((seccion, sIdx) => (
        <Paper key={seccion.nombre || sIdx} sx={{ p: 2, mb: 3 }} elevation={2}>
          <Typography variant="h6" color="primary" gutterBottom>
            {typeof seccion.nombre === 'string' ? seccion.nombre : (seccion?.texto || seccion?.text || `Sección ${sIdx + 1}`)}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {Array.isArray(seccion.preguntas) && seccion.preguntas.length > 0 ? (
            seccion.preguntas.map((pregunta, pIdx) => {
              const respuesta = respuestas[sIdx]?.[pIdx];
              const comentario = comentarios[sIdx]?.[pIdx] || '';
              const fileList = toFileRefList(imagenes[sIdx]?.[pIdx]);
              const clasificacion = clasificaciones[sIdx]?.[pIdx] || { condicion: false, actitud: false };

              return (
                <Box key={pIdx} sx={{ mb: 2, pl: 1, borderLeft: '3px solid #1976d2' }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {pIdx + 1}. {typeof pregunta === 'string' ? pregunta : (pregunta?.texto || pregunta?.text || `Pregunta ${pIdx + 1}`)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Respuesta:</strong> {!respuesta ? 'Sin responder' : respuesta}
                  </Typography>

                  {(clasificacion.condicion || clasificacion.actitud) && (
                    <Box sx={{ mb: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {clasificacion.condicion && <Chip icon={<BuildIcon />} label="Condicion" size="small" color="info" />}
                      {clasificacion.actitud && <Chip icon={<PeopleIcon />} label="Actitud" size="small" color="secondary" />}
                    </Box>
                  )}

                  {comentario && comentario.trim() !== '' && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 0.5 }}>
                      <strong>Comentario:</strong> {comentario}
                    </Typography>
                  )}

                  {fileList.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {fileList.map((fileRef, fileIndex) => (
                        <UnifiedFilePreview key={`${fileRef.fileId || 'file'}-${fileIndex}`} fileRef={fileRef} height={220} />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })
          ) : (
            <Typography variant="body2" color="text.secondary">No hay preguntas en esta seccion.</Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
}

