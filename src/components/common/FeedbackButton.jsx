import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
  Close as CloseIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import { createFeedbackClient } from '@controlfile/feedback-sdk';
import { auth } from '../../firebaseControlFile';
import { useAuth } from '../context/AuthContext';

const FeedbackButton = () => {
  const location = useLocation();
  const { isLogged } = useAuth();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle'); // idle, capturing, sending, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const feedbackClientRef = useRef(null);

  // Inicializar cliente de feedback
  React.useEffect(() => {
    try {
      feedbackClientRef.current = createFeedbackClient({
        appId: 'controlaudit',
        baseUrl: 'https://controlfile.onrender.com',
        getToken: async () => {
          const user = auth.currentUser;
          return user ? await user.getIdToken() : null;
        }
      });
    } catch (error) {
      console.error('[FeedbackButton] Error inicializando SDK:', error);
    }
  }, []);

  const handleOpen = async () => {
    setOpen(true);
    setStatus('capturing');
    setErrorMessage('');
    setScreenshot(null);

    try {
      // Capturar screenshot
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: 1,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });

      // Convertir canvas a blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'screenshot.png', { type: 'image/png' });
          setScreenshot(file);
          setStatus('idle');
        } else {
          setStatus('error');
          setErrorMessage('Error al capturar la pantalla');
        }
      }, 'image/png');
    } catch (error) {
      console.error('[FeedbackButton] Error capturando screenshot:', error);
      setStatus('error');
      setErrorMessage('Error al capturar la pantalla');
    }
  };

  const handleClose = () => {
    if (status === 'sending') return; // No cerrar mientras se envía
    
    setOpen(false);
    setComment('');
    setStatus('idle');
    setErrorMessage('');
    setScreenshot(null);
  };

  const handleSubmit = async () => {
    if (!comment.trim() || !screenshot || !feedbackClientRef.current) {
      return;
    }

    setStatus('sending');
    setErrorMessage('');

    try {
      const viewport = {
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1
      };

      await feedbackClientRef.current.create({
        screenshot: screenshot,
        comment: comment.trim(),
        context: {
          page: {
            url: window.location.href,
            route: location.pathname
          },
          viewport: viewport
        }
      });

      setStatus('success');
      
      // Cerrar después de 2 segundos
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('[FeedbackButton] Error enviando feedback:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Error al enviar el feedback');
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case 'capturing':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Capturando pantalla...
            </Typography>
          </Box>
        );
      case 'sending':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Enviando feedback...
            </Typography>
          </Box>
        );
      case 'success':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main' }} />
            <Typography variant="body1" color="success.main" fontWeight="bold">
              ¡Feedback enviado exitosamente!
            </Typography>
          </Box>
        );
      case 'error':
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="error">
              {errorMessage || 'Ocurrió un error. Por favor, intenta nuevamente.'}
            </Alert>
          </Box>
        );
      default:
        return null;
    }
  };

  // No mostrar si el usuario no está autenticado
  if (!isLogged) {
    return null;
  }

  return (
    <>
      <Fab
        color="primary"
        aria-label="feedback"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          boxShadow: 3
        }}
      >
        <FeedbackIcon />
      </Fab>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FeedbackIcon color="primary" />
            <Typography variant="h6">Enviar Feedback</Typography>
          </Box>
          {status !== 'sending' && (
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
              size="small"
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>

        <DialogContent>
          {getStatusContent()}

          {status === 'idle' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Comparte tus comentarios, sugerencias o reporta un problema. Se incluirá una captura de pantalla automáticamente.
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comentario"
                placeholder="Describe tu feedback..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!screenshot}
              />

              {screenshot && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Pantalla capturada correctamente
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        {status === 'idle' && (
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={!screenshot}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              startIcon={<SendIcon />}
              disabled={!comment.trim() || !screenshot}
            >
              Enviar
            </Button>
          </DialogActions>
        )}

        {status === 'error' && (
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose}>Cerrar</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!comment.trim() || !screenshot}
            >
              Reintentar
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default FeedbackButton;
