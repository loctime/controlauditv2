import React from 'react';
import { Box } from '@mui/material';

const APKPageWrapper = ({ children }) => {
  return (
    <Box sx={{ 
      p: 2,
      height: '100%',
      overflow: 'auto',
      bgcolor: 'background.default'
    }}>
      {children}
    </Box>
  );
};

export default APKPageWrapper;
