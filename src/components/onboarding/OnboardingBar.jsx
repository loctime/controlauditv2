import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  LinearProgress,
  Button,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

const SESSION_KEY = 'onboarding_bar_dismissed';

export default function OnboardingBar({ onOpenWizard }) {
  const { loading, steps, completedCount, allDone, isLogged } = useOnboardingStatus();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const navigate = useNavigate();
  const theme = useTheme();

  if (!isLogged || loading || allDone || dismissed) return null;

  const progress = (completedCount / steps.length) * 100;

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setDismissed(true);
  };

  const handleStepClick = (step) => {
    if (!step.done) navigate(step.route);
  };

  return (
    <Box
      sx={{
        width: '100%',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(90deg, #1a237e 0%, #283593 100%)'
          : 'linear-gradient(90deg, #e8eaf6 0%, #ede7f6 100%)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        px: { xs: 2, md: 3 },
        py: 1.5,
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <RocketLaunchIcon
          sx={{ color: 'primary.main', fontSize: 20, flexShrink: 0 }}
        />

        <Typography
          variant="body2"
          sx={{ fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Configuración inicial · {completedCount}/{steps.length}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', flex: 1 }}>
          {steps.map((step) => (
            <Chip
              key={step.id}
              label={step.label}
              size="small"
              icon={
                step.done
                  ? <CheckCircleIcon style={{ color: '#4caf50' }} />
                  : <RadioButtonUncheckedIcon style={{ color: '#9e9e9e' }} />
              }
              onClick={() => handleStepClick(step)}
              sx={{
                cursor: step.done ? 'default' : 'pointer',
                opacity: step.done ? 0.7 : 1,
                fontWeight: step.done ? 400 : 500,
                bgcolor: step.done
                  ? (theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.15)' : '#e8f5e9')
                  : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'white'),
                '&:hover': step.done ? {} : {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#f3e5f5',
                },
              }}
            />
          ))}
        </Box>

        {completedCount === 0 && onOpenWizard && (
          <Button
            size="small"
            variant="contained"
            onClick={onOpenWizard}
            sx={{ flexShrink: 0, fontSize: '0.75rem', py: 0.5 }}
          >
            Comenzar setup
          </Button>
        )}

        <IconButton size="small" onClick={handleDismiss} sx={{ flexShrink: 0 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mt: 1, height: 3, borderRadius: 2 }}
      />
    </Box>
  );
}
