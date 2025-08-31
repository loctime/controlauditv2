import React from 'react';
import { Box, Typography, Link, Tooltip } from '@mui/material';
import { CloudUpload as CloudIcon } from '@mui/icons-material';

const ControlFileInfo = ({ variant = 'subtle' }) => {
  const handleClick = () => {
    // Abrir ControlFile en nueva pestaña
    window.open('https://controlfile.app', '_blank');
  };

  if (variant === 'subtle') {
    return (
      <Tooltip title="Almacenamiento seguro con ControlFile" arrow>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            opacity: 0.6,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8
            }
          }}
          onClick={handleClick}
        >
          <CloudIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption" color="text.secondary">
            Powered by ControlFile
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  if (variant === 'footer') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Almacenamiento seguro con
        </Typography>
        <Link
          href="https://controlfile.app"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'primary.main',
            textDecoration: 'none',
            fontWeight: 600,
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          <CloudIcon sx={{ fontSize: 16 }} />
          ControlFile
        </Link>
      </Box>
    );
  }

  return null;
};

export default ControlFileInfo;
