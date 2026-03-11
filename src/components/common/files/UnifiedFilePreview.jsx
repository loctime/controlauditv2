import React from 'react';
import { Box, Button, Typography } from '@mui/material';
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

  if (previewType === 'image' && viewUrl) {
    return <img src={viewUrl} alt={fileRef.name} style={{ maxWidth: '100%', maxHeight: height, objectFit: 'contain' }} />;
  }

  if (previewType === 'pdf' && viewUrl) {
    return <iframe title={fileRef.name} src={viewUrl} style={{ width: '100%', height, border: 0 }} />;
  }

  if (previewType === 'video' && viewUrl) {
    return <video controls style={{ width: '100%', maxHeight: height }} src={viewUrl} />;
  }

  if (previewType === 'audio' && viewUrl) {
    return <audio controls style={{ width: '100%' }} src={viewUrl} />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="body2">Preview no disponible para este tipo de archivo.</Typography>
      {finalDownloadUrl ? (
        <Button variant="contained" component="a" href={finalDownloadUrl} target="_blank" rel="noreferrer">
          Descargar archivo
        </Button>
      ) : null}
    </Box>
  );
}
