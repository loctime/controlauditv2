import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { onSignIn, signInWithGoogleSimple } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import SmartAPKDownload from '../../common/SmartAPKDownload.jsx';
import { formatAuthError } from '../../../utils/errorFormat';

const Login = () => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { handleLogin } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
      const result = await onSignIn({ email, password });
      handleLogin(result.user);
      navigate("/auditoria");
    } catch (error) {
      console.error(error);
      let errorMessage = 'Correo electrónico o contraseña incorrectos';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Función SIMPLE para Google Auth
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🚀 Iniciando Google Auth...');
      const result = await signInWithGoogleSimple();
      
      if (result.success && result.user) {
        console.log('✅ Google Auth exitoso:', result.user.uid);
        handleLogin(result.user);
        navigate("/auditoria");
      }
      
    } catch (error) {
      console.error('❌ Error en Google Auth:', error);
      setError(formatAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="page-container"
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <SmartAPKDownload />
      
      <Card sx={{ 
        maxWidth: 400, 
        width: '100%', 
        mx: 'auto',
        mt: isSmallMobile ? 2 : 8,
        boxShadow: 3
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
            ControlAudit
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Botón de Google */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{ 
                mb: 3,
                py: 1.5,
                borderColor: 'grey.300',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'grey.400',
                  backgroundColor: 'grey.50'
                }
              }}
            >
              Continuar con Google
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                o
              </Typography>
            </Divider>
          </Box>

          {/* Formulario de login */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              name="email"
              label="Correo Electrónico"
              type="email"
              margin="normal"
              variant="outlined"
              disabled={loading}
              required
            />

            <TextField
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              margin="normal"
              variant="outlined"
              disabled={loading}
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                }
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              ¿No tienes cuenta?{' '}
              <Link to="/register" style={{ color: theme.palette.primary.main, textDecoration: 'none' }}>
                Regístrate aquí
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
