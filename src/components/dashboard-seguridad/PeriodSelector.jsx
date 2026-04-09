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
              Años
            </Typography>
            <Select
              size="small"
              value={selectedYear}
              onChange={(event) => onYearChange(event.target.value)}
              aria-label="Seleccionar año"
              sx={{
                minWidth: '90px',
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

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              flexWrap: 'wrap',
              overflowX: { xs: 'visible', md: 'auto' },
              pb: { xs: 0, md: 1 }
            }}
          >
            <Button
              key="todos"
              onClick={() => onMonthChange(null)}
              size="small"
              variant={selectedMonth === null ? 'contained' : 'outlined'}
              sx={{
                minWidth: '60px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                backgroundColor: selectedMonth === null ? '#3b82f6' : 'transparent',
                color: selectedMonth === null ? 'white' : '#64748b',
                borderColor: '#d1d5db',
                '&:hover': {
                  backgroundColor: selectedMonth === null ? '#2563eb' : '#f3f4f6'
                }
              }}
            >
              TODOS
            </Button>
            {months.map((month, index) => (
              <Button
                key={month}
                onClick={() => onMonthChange(index + 1)}
                size="small"
                variant={selectedMonth === index + 1 ? 'contained' : 'outlined'}
                sx={{
                  minWidth: '48px',
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
              📊 Dashboard SST
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
