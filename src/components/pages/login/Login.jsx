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
  CardContent
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { onSignIn } from '../../../firebaseConfig';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import DownloadAPK from '../../common/DownloadAPK';

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { handleLogin } = useAuth();

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
      navigate("/");
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

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        p: isSmallMobile ? 2 : 4,
      }}
    >
      <Card
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          maxWidth: isMobile ? '100%' : 450,
          width: '100%',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease'
          },
          transition: 'all 0.3s ease'
        }}
      >
        <CardContent sx={{ p: isSmallMobile ? 4 : 6 }}>
          {/* Sección de descarga de APK - MOVIDA ARRIBA */}
          <Box sx={{ textAlign: 'center', mb: isSmallMobile ? 4 : 5 }}>
            <Typography 
              variant={isSmallMobile ? "h6" : "h5"} 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                fontWeight: 600,
                lineHeight: 1.4
              }}
            >
              📱 Descarga nuestra aplicación móvil
            </Typography>
            <DownloadAPK variant="outlined" size="large" showInfo={false} />
          </Box>

          <Box sx={{ textAlign: 'center', mb: isSmallMobile ? 5 : 6 }}>
            <Typography 
              variant={isSmallMobile ? "h4" : "h3"} 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                color: 'primary.main',
                mb: 3,
                lineHeight: 1.2
              }}
            >
              🔐 Iniciar Sesión
            </Typography>
            <Typography 
              variant={isSmallMobile ? "h6" : "h5"} 
              color="text.secondary"
              sx={{ 
                lineHeight: 1.5,
                mb: 2
              }}
            >
              Accede a tu cuenta de Control de Auditorías
            </Typography>
          </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center'
              }
            }}
          >
            {error}
          </Alert>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: isSmallMobile ? 4 : 5 }}>
                {/* Campo de email */}
                <Box>
                  <Field 
                    as={TextField} 
                    name="email" 
                    label="📧 Correo Electrónico" 
                    fullWidth 
                    disabled={isSubmitting || loading}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    size="large"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          }
                        }
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: isSmallMobile ? '1rem' : '1.1rem'
                      },
                      '& .MuiInputBase-input': {
                        fontSize: isSmallMobile ? '1rem' : '1.1rem',
                        padding: isSmallMobile ? '16px 18px' : '20px 18px'
                      }
                    }}
                  />
                </Box>
                
                {/* Campo de contraseña */}
                <Box>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel 
                      htmlFor="outlined-adornment-password"
                      sx={{ fontSize: isSmallMobile ? '1rem' : '1.1rem' }}
                    >
                      🔒 Contraseña
                    </InputLabel>
                    <Field
                      as={OutlinedInput}
                      name="password"
                      id="outlined-adornment-password"
                      type={showPassword ? 'text' : 'password'}
                      size="large"
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                            sx={{ color: 'primary.main' }}
                          >
                            {showPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="🔒 Contraseña"
                      disabled={isSubmitting || loading}
                      error={touched.password && Boolean(errors.password)}
                      sx={{
                        borderRadius: 3,
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: isSmallMobile ? '1rem' : '1.1rem',
                          padding: isSmallMobile ? '16px 18px' : '20px 18px'
                        }
                      }}
                    />
                  </FormControl>
                  {touched.password && errors.password && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                      {errors.password}
                    </Typography>
                  )}
                </Box>
                
                {/* Link de olvidé contraseña */}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link
                    to="/forgot-password"
                    style={{ 
                      color: theme.palette.primary.main, 
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: isSmallMobile ? '1rem' : '1.1rem',
                      lineHeight: 1.5
                    }}
                  >
                    🔑 ¿Olvidaste tu contraseña?
                  </Link>
                </Box>
                
                {/* Botón de ingresar */}
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    type="submit"
                    disabled={isSubmitting || loading}
                    size="large"
                    sx={{
                      color: 'white',
                      textTransform: 'none',
                      py: isSmallMobile ? 2 : 2.5,
                      px: isSmallMobile ? 4 : 5,
                      fontSize: isSmallMobile ? '1.1rem' : '1.2rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loading ? '⏳ Cargando...' : '🚀 Ingresar'}
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
          </CardContent>
        </Card>
      </Box>
    );
  };

export default Login;