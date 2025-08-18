import React from 'react';
import { Avatar, Typography, Box } from '@mui/material';
import { Person as PersonIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';

const PerfilHeader = ({ userProfile }) => {
  if (!userProfile) return null;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      {/* Avatar */}
      <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
        <PersonIcon />
      </Avatar>
      
      {/* Email */}
      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
        {userProfile.email}
      </Typography>
      
      {/* Fecha de membresía */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary">
          Miembro desde: {new Date(userProfile.createdAt?.seconds * 1000).toLocaleDateString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default PerfilHeader; 