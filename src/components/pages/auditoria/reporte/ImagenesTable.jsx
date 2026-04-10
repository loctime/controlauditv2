import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box } from '@mui/material';
import UnifiedFilePreview from '@/components/common/files/UnifiedFilePreview';

const getSafeValue = (val) => {
  if (!val) return 'Dato no disponible';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    if (Array.isArray(val)) return getSafeValue(val[0]);
    if (val.texto) return val.texto;
    if (val.name) return val.name;
    return JSON.stringify(val);
  }
  return String(val);
};

const toFileRefList = (value) => {
  const asList = Array.isArray(value) ? value : value ? [value] : [];
  return asList
    .map((item) => {
      if (!item) return null;
      if (item.fileId || item.shareToken) {
        return {
          fileId: item.fileId || item.shareToken,
          shareToken: item.shareToken || null,
          name: item.name || item.nombre || 'archivo',
          mimeType: item.mimeType || item.tipo || 'application/octet-stream',
          size: item.size || 0,
          status: item.status || 'active'
        };
      }
      if (typeof item === 'string') {
        const match = item.match(/\/shares\/([^/]+)/i);
        const shareToken = item.startsWith('http') ? match?.[1] : item;
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
    })
    .filter(Boolean);
};

export default function ImagenesTable({ secciones, imagenes, comentarios }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Seccion</TableCell>
            <TableCell>Pregunta</TableCell>
            <TableCell>Archivo</TableCell>
            <TableCell>Comentario</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {secciones.flatMap((seccion, seccionIndex) =>
            seccion.preguntas.map((pregunta, preguntaIndex) => {
              const fileList = toFileRefList(imagenes?.[seccionIndex]?.[preguntaIndex]);
              const comentario = comentarios?.[seccionIndex]?.[preguntaIndex];

              return (
                <TableRow key={`${seccion.nombre}-${preguntaIndex}`}>
                  <TableCell>{seccion.nombre}</TableCell>
                  <TableCell>{typeof pregunta === 'string' ? pregunta : pregunta?.texto || pregunta?.text || ''}</TableCell>
                  <TableCell>
                    {fileList.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {fileList.map((fileRef, idx) => (
                          <UnifiedFilePreview key={`${fileRef.fileId}-${idx}`} fileRef={fileRef} height={220} />
                        ))}
                      </Box>
                    ) : (
                      'Archivo no disponible'
                    )}
                  </TableCell>
                  <TableCell>{comentario ? getSafeValue(comentario) : 'Comentario no disponible'}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

