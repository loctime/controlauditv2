import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Paper
} from '@mui/material';

export default function PeriodSelector({ 
  selectedYear, 
  selectedMonth, 
  onYearChange, 
  onMonthChange 
}) {
  const months = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <Paper elevation={1} sx={{
      p: 2,
      mb: 3,
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        {/* Selector de Año */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
            Año:
          </Typography>
          <ButtonGroup size="small" variant="outlined">
            {years.map(year => (
              <Button
                key={year}
                onClick={() => onYearChange(year)}
                variant={selectedYear === year ? 'contained' : 'outlined'}
                sx={{
                  minWidth: '60px',
                  backgroundColor: selectedYear === year ? '#3b82f6' : 'transparent',
                  color: selectedYear === year ? 'white' : '#64748b',
                  borderColor: '#d1d5db',
                  '&:hover': {
                    backgroundColor: selectedYear === year ? '#2563eb' : '#f3f4f6'
                  }
                }}
              >
                {year}
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        {/* Selector de Mes */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
            Mes:
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            flexWrap: 'wrap',
            maxWidth: '400px'
          }}>
            {months.map((month, index) => (
              <Button
                key={month}
                onClick={() => onMonthChange(index + 1)}
                size="small"
                variant={selectedMonth === index + 1 ? 'contained' : 'outlined'}
                sx={{
                  minWidth: '40px',
                  fontSize: '0.75rem',
                  backgroundColor: selectedMonth === index + 1 ? '#3b82f6' : 'transparent',
                  color: selectedMonth === index + 1 ? 'white' : '#64748b',
                  borderColor: '#d1d5db',
                  '&:hover': {
                    backgroundColor: selectedMonth === index + 1 ? '#2563eb' : '#f3f4f6'
                  }
                }}
              >
                {month}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Indicador de período actual */}
        <Box sx={{ 
          ml: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: '#dbeafe',
          padding: '4px 12px',
          borderRadius: '16px',
          border: '1px solid #93c5fd'
        }}>
          <Typography variant="caption" sx={{ 
            fontWeight: 600, 
            color: '#1e40af',
            fontSize: '0.75rem'
          }}>
            📊 Dashboard SST
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
