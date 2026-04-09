import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Select,
  MenuItem
} from '@mui/material';

export default function PeriodSelector({ 
  selectedYear, 
  onYearChange 
}) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 3,
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Año
            </Typography>
            <Select
              size="small"
              value={selectedYear}
              onChange={(event) => onYearChange(event.target.value)}
              aria-label="Seleccionar año"
              sx={{
                minWidth: '100px',
                backgroundColor: 'white',
                '& .MuiSelect-select': {
                  py: 0.75,
                  fontSize: '0.75rem',
                  color: '#1f2937'
                }
              }}
            >
              {years.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#dbeafe',
            padding: '4px 12px',
            borderRadius: '16px',
            border: '1px solid #93c5fd'
          }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: '#1e40af',
                fontSize: '0.75rem'
              }}
            >
              Dashboard SST - Vista anual completa
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
