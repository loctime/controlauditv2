import { useState } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  LinearProgress,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

const SESSION_KEY = 'onboarding_bar_dismissed';

const STEP_META = [
  { icon: StorefrontIcon, color: '#3b82f6', border: '#bfdbfe' },
  { icon: LocationOnIcon, color: '#10b981', border: '#a7f3d0' },
  { icon: PeopleIcon,     color: '#f59e0b', border: '#fde68a' },
  { icon: AssignmentIcon, color: '#8b5cf6', border: '#ddd6fe' },
];

export default function OnboardingBar({ onOpenWizardAtStep }) {
  const { loading, steps, completedCount, allDone, isLogged } = useOnboardingStatus();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!isLogged || loading || allDone || dismissed) return null;

  const progress = (completedCount / steps.length) * 100;

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setDismissed(true);
  };

  return (
    <Box
      sx={{
        width: '100%',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1e1b4b 0%, #1e3a5f 100%)'
          : 'linear-gradient(135deg, #eef2ff 0%, #fdf4ff 100%)',
        borderBottom: `2px solid`,
        borderColor: theme.palette.mode === 'dark' ? '#4338ca' : '#c7d2fe',
        px: { xs: 2, md: 3 },
        pt: 1.5,
        pb: 1,
      }}
    >
      {/* Fila principal */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, flexWrap: 'wrap' }}>

        {/* Icono + título */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Box
            sx={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <RocketLaunchIcon sx={{ color: 'white', fontSize: 16 }} />
          </Box>
          {!isMobile && (
            <Box>
              <Typography variant="body2" fontWeight={700} lineHeight={1.1}>
                Configuración inicial
              </Typography>
              <Typography variant="caption" color="text.secondary" lineHeight={1}>
                {completedCount}/{steps.length} pasos
              </Typography>
            </Box>
          )}
        </Box>

        {/* Steps chips */}
        <Box sx={{ display: 'flex', gap: 1, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {steps.map((step, idx) => {
            const meta = STEP_META[idx];
            const Icon = meta.icon;
            return (
              <Tooltip key={step.id} title={step.done ? `${step.label} ✓` : `Clic para crear: ${step.label}`}>
                <Box
                  onClick={() => !step.done && onOpenWizardAtStep?.(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.5,
                    py: 0.6,
                    borderRadius: 2,
                    border: `1.5px solid`,
                    borderColor: step.done ? `${meta.color}55` : meta.border,
                    bgcolor: step.done
                      ? (theme.palette.mode === 'dark' ? `${meta.color}22` : `${meta.color}12`)
                      : 'white',
                    cursor: step.done ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                    '&:hover': step.done ? {} : {
                      bgcolor: `${meta.color}18`,
                      borderColor: meta.color,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${meta.color}33`,
                    },
                  }}
                >
                  {step.done
                    ? <CheckCircleIcon sx={{ color: meta.color, fontSize: 16 }} />
                    : <Icon sx={{ color: meta.color, fontSize: 16 }} />
                  }
                  {!isMobile && (
                    <Typography
                      variant="caption"
                      fontWeight={step.done ? 400 : 600}
                      sx={{
                        color: step.done ? 'text.secondary' : meta.color,
                        textDecoration: step.done ? 'line-through' : 'none',
                        opacity: step.done ? 0.7 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {step.label}
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* CTA si no hay nada */}
        {completedCount === 0 && (
          <Button
            size="small"
            variant="contained"
            onClick={() => onOpenWizardAtStep?.(0)}
            sx={{
              flexShrink: 0,
              fontSize: '0.72rem',
              py: 0.5,
              px: 1.5,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              fontWeight: 700,
              '&:hover': { background: 'linear-gradient(135deg, #2563eb, #7c3aed)' },
            }}
          >
            Comenzar
          </Button>
        )}

        <IconButton size="small" onClick={handleDismiss} sx={{ flexShrink: 0, opacity: 0.5, '&:hover': { opacity: 1 } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Barra de progreso */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          mt: 1,
          height: 4,
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e7ff',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            borderRadius: 2,
          },
        }}
      />
    </Box>
  );
}
