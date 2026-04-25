import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Grid,
  Chip,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const STEPS_INFO = [
  {
    icon: StorefrontIcon,
    color: '#3b82f6',
    bg: '#eff6ff',
    label: 'Crear tu empresa',
    desc: 'El nombre y logo de tu organización. Base de todo lo demás.',
  },
  {
    icon: LocationOnIcon,
    color: '#10b981',
    bg: '#ecfdf5',
    label: 'Agregar una sucursal',
    desc: 'Cada sede o ubicación donde realizás auditorías.',
  },
  {
    icon: PeopleIcon,
    color: '#f59e0b',
    bg: '#fffbeb',
    label: 'Cargar empleados',
    desc: 'El equipo que participará en auditorías y capacitaciones.',
  },
  {
    icon: AssignmentIcon,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    label: 'Crear un formulario',
    desc: 'El checklist que usarás para auditar. Podés editarlo después.',
  },
];

const SESSION_KEY = 'onboarding_welcome_dismissed';

export default function OnboardingWelcome({ onStartWizard }) {
  const [open, setOpen] = useState(
    () => sessionStorage.getItem(SESSION_KEY) !== 'true'
  );

  const handleStart = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setOpen(false);
    onStartWizard?.();
  };

  const handleClose = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #7c3aed 100%)',
          px: { xs: 3, md: 5 },
          py: { xs: 4, md: 5 },
          textAlign: 'center',
          color: 'white',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <RocketLaunchIcon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          ¡Bienvenido a ControlAudit!
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 500, mx: 'auto' }}>
          Para empezar a auditar necesitás configurar 4 cosas básicas.
          Solo te lleva unos minutos.
        </Typography>
      </Box>

      <DialogContent sx={{ px: { xs: 3, md: 5 }, py: 4 }}>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {STEPS_INFO.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Grid item xs={12} sm={6} key={idx}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    border: `1.5px solid ${step.color}22`,
                    bgcolor: step.bg,
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: `0 4px 16px ${step.color}22` },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: step.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ color: 'white', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Chip
                        label={`Paso ${idx + 1}`}
                        size="small"
                        sx={{
                          bgcolor: step.color,
                          color: 'white',
                          fontSize: '0.65rem',
                          height: 18,
                          fontWeight: 700,
                        }}
                      />
                      <Typography variant="body2" fontWeight={700}>
                        {step.label}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {step.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button onClick={handleClose} variant="outlined" color="inherit">
            Lo hago después
          </Button>
          <Button
            onClick={handleStart}
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              fontWeight: 700,
              px: 4,
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
              },
            }}
          >
            Comenzar configuración
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
