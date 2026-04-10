import React from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { resolveFileAccess } from '../../../services/fileResolverService';

export default function UnifiedFilePreview({ fileRef, height = 240 }) {
  const [state, setState] = React.useState({ previewType: 'download', viewUrl: null, downloadUrl: null });

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      const result = await resolveFileAccess(fileRef);
      if (mounted) setState(result);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [fileRef]);

  if (!fileRef) return null;

  const { previewType, viewUrl, downloadUrl } = state;
  const finalDownloadUrl = downloadUrl || viewUrl;

  // Fallback: si resolveFileAccess no logra clasificar como `image`,
  // pero por mime/ext parece imagen, igual renderizamos usando el URL disponible.
  const nameForExt = fileRef?.name || fileRef?.nombre || fileRef?.fileName || '';
  const mimeForType = fileRef?.mimeType || '';
  const isLikelyImage =
    (typeof mimeForType === 'string' && mimeForType.toLowerCase().startsWith('image/')) ||
    (typeof nameForExt === 'string' && /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/i.test(nameForExt));

  const isLikelyControlFileImageUrl =
    typeof finalDownloadUrl === 'string' && /\/image(\?.*)?$/i.test(finalDownloadUrl);

  if ((isLikelyImage || isLikelyControlFileImageUrl) && finalDownloadUrl) {
    return (
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <img src={finalDownloadUrl} alt={nameForExt || fileRef?.fileId || fileRef?.shareToken || 'imagen'} style={{ maxWidth: '100%', maxHeight: height, objectFit: 'contain' }} />
        <IconButton
          onClick={() => handleDownloadFile(fileRef)}
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            }
          }}
          title="Descargar imagen"
        >
          <DownloadIcon />
        </IconButton>
      </Box>
    );
  }

  if (previewType === 'image' && viewUrl) {
    return (
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <img src={viewUrl} alt={fileRef.name} style={{ maxWidth: '100%', maxHeight: height, objectFit: 'contain' }} />
        <IconButton
          href={finalDownloadUrl || viewUrl}
          download={fileRef?.name || fileRef?.nombre || 'imagen'}
          target="_blank"
          rel="noreferrer"
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            }
          }}
          title="Descargar imagen"
        >
          <DownloadIcon />
        </IconButton>
      </Box>
    );
  }

  if (previewType === 'pdf' && viewUrl) {
    return (
      <Box sx={{ position: 'relative' }}>
        <iframe title={fileRef.name} src={viewUrl} style={{ width: '100%', height, border: 0 }} />
        <Button
          href={finalDownloadUrl || viewUrl}
          download={fileRef?.name || fileRef?.nombre || 'documento.pdf'}
          target="_blank"
          rel="noreferrer"
          variant="contained"
          startIcon={<DownloadIcon />}
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
            }
          }}
        >
          Descargar PDF
        </Button>
      </Box>
    );
  }

  if (previewType === 'video' && viewUrl) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <video controls style={{ width: '100%', maxHeight: height }} src={viewUrl} />
        <Button
          href={finalDownloadUrl || viewUrl}
          download={fileRef?.name || fileRef?.nombre || 'video'}
          target="_blank"
          rel="noreferrer"
          variant="outlined"
          startIcon={<DownloadIcon />}
        >
          Descargar video
        </Button>
      </Box>
    );
  }

  if (previewType === 'audio' && viewUrl) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <audio controls style={{ width: '100%' }} src={viewUrl} />
        <Button
          href={finalDownloadUrl || viewUrl}
          download={fileRef?.name || fileRef?.nombre || 'audio'}
          target="_blank"
          rel="noreferrer"
          variant="outlined"
          startIcon={<DownloadIcon />}
        >
          Descargar audio
        </Button>
      </Box>
    );
  }

  const handleDownloadFile = async (file) => {
  try {
    // Crear URL de descarga directa usando el archivo
    const downloadUrl = file.shareToken 
      ? `/shares/${file.shareToken}`
      : file.downloadUrl 
      ? file.downloadUrl 
      : file.viewUrl;

    if (downloadUrl) {
      // Forzar descarga usando fetch y blob para evitar que el navegador abra archivos de Office
      const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${window.location.origin}${downloadUrl}`;
      
      fetch(fullUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name || file.nombre || 'archivo';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        })
        .catch(error => {
          console.error('Error en fetch descargando archivo:', error);
          // Fallback a método anterior si fetch falla
          const link = document.createElement('a');
          link.href = fullUrl;
          link.download = file.name || file.nombre || 'archivo';
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    } else {
      console.error('No se pudo generar la URL de descarga para este archivo.');
    }
  } catch (error) {
    console.error('Error descargando archivo:', error);
  }
};

return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="body2">Preview no disponible para este tipo de archivo.</Typography>
      <Button 
        variant="contained" 
        onClick={() => handleDownloadFile(fileRef)}
        startIcon={<DownloadIcon />}
      >
        Descargar archivo
      </Button>
    </Box>
  );
}
