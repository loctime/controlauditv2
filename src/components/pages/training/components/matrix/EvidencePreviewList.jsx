import { useState } from 'react';
import { Box, Button, Collapse, Stack, Typography } from '@mui/material';
import UnifiedFilePreview from '@/components/common/files/UnifiedFilePreview';
import { convertirShareTokenAUrl } from '../../../../../utils/imageUtils';

export default function EvidencePreviewList({ evidenceIds = [], previewHeight = 160 }) {
  const [openSet, setOpenSet] = useState(new Set());

  const togglePreview = (shareToken) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(shareToken)) {
        next.delete(shareToken);
      } else {
        next.add(shareToken);
      }
      return next;
    });
  };

  if (!evidenceIds.length) {
    return (
      <Typography variant="caption" color="text.secondary">
        Sin evidencia
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      {evidenceIds.map((shareToken, idx) => {
        const url = convertirShareTokenAUrl(shareToken);
        const isOpen = openSet.has(shareToken);
        const fileRef = {
          shareToken,
          name: `Evidencia ${idx + 1}`
        };

        return (
          <Box key={`${shareToken}-${idx}`} sx={{ display: 'grid', gap: 0.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                sx={{ color: 'primary.main', wordBreak: 'break-all' }}
              >
                Evidencia {idx + 1}
              </Typography>
              <Button size="small" variant="outlined" onClick={() => togglePreview(shareToken)}>
                {isOpen ? 'Ocultar' : 'Ver'}
              </Button>
            </Stack>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 0.5, border: '1px solid #eeeeee', borderRadius: 1, p: 1 }}>
                <UnifiedFilePreview fileRef={fileRef} height={previewHeight} />
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Stack>
  );
}
