import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  Grid, 
  IconButton, 
  InputAdornment, 
  InputLabel, 
  OutlinedInput, 
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
// import { Google as GoogleIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { onSignIn } from '../../../firebaseConfig';
// import { signInWithGoogleNative, isGoogleAuthNativeAvailable } from '../../../utils/googleAuthNative';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import SmartAPKDownload from '../../common/SmartAPKDownload.jsx';

import { usePlatform } from '../../../hooks/usePlatform.js';

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { handleLogin } = useAuth();
  const { isAPK } = usePlatform();

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const initialValues = {
    email: '',
    password: ''
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Correo electrónico inválido').required('Ingresa el correo electronico'),
    password: Yup.string().required('Ingresa la Contraseña')
  });

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    setLoading(true);
    setError('');
    try {
      const result = await onSignIn(values);
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
      setErrors({ password: errorMessage });
    }
    setLoading(false);
    setSubmitting(false);
  };

  // Función para Google Auth - TEMPORALMENTE DESHABILITADA
  /*
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      let result;
      
      // En APK, usar navegador externo + deep link
      if (isAPK && isGoogleAuthNativeAvailable()) {
        console.log('📱 Usando navegador externo para Google Auth en APK...');
        result = await signInWithGoogleNative();
        
        // Si se abrió el navegador externo
        if (result.pendingExternalBrowser) {
          setError('Se abrió el navegador. Completa el login allí y regresa a la app.');
          setLoading(false);
          return;
        }
      } else {
        // En web, usar el flujo web (temporalmente deshabilitado)
        throw new Error('Google Sign-In web temporalmente deshabilitado. Usa email y contraseña.');
      }
      
      // Procesar resultado
      if (result && result.user) {
        handleLogin(result.user);
        navigate("/auditoria");
      }
    } catch (error) {
      console.error('Error en Google Auth:', error);
      setError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
    }
    setLoading(false);
  };
  */

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



          {/* Botón de Google - TEMPORALMENTE DESHABILITADO */}
          {/*
          {isAPK && isGoogleAuthNativeAvailable() && (
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
          )}
          
          {isAPK && !isGoogleAuthNativeAvailable() && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                📱 En la aplicación móvil, usa tu email y contraseña para acceder
              </Typography>
            </Box>
          )}
          */}

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
              <Form>
                <TextField
                  fullWidth
                  name="email"
                  label="Correo Electrónico"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  margin="normal"
                  variant="outlined"
                  disabled={loading}
                />

                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel htmlFor="password">Contraseña</InputLabel>
                  <OutlinedInput
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && Boolean(errors.password)}
                    disabled={loading}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Contraseña"
                  />
                  {touched.password && errors.password && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                      {errors.password}
                    </Typography>
                  )}
                </FormControl>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || isSubmitting}
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
              </Form>
            )}
          </Formik>

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
