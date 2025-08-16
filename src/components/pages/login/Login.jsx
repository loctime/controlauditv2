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
        <CardContent sx={{ p: isSmallMobile ? 3 : 5 }}>
          <Box sx={{ textAlign: 'center', mb: isSmallMobile ? 4 : 5 }}>
            <Typography 
              variant={isSmallMobile ? "h5" : "h4"} 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                color: 'primary.main',
                mb: 2,
                lineHeight: 1.2
              }}
            >
              🔐 Iniciar Sesión
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                lineHeight: 1.5,
                mb: 1
              }}
            >
              Accede a tu cuenta de Control de Auditorías
            </Typography>
          </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: isSmallMobile ? 3 : 4 }}>
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
                    size={isSmallMobile ? "small" : "medium"}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          }
                        }
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: isSmallMobile ? '0.875rem' : '1rem'
                      },
                      '& .MuiInputBase-input': {
                        fontSize: isSmallMobile ? '0.875rem' : '1rem',
                        padding: isSmallMobile ? '12px 14px' : '16px 14px'
                      }
                    }}
                  />
                </Box>
                
                {/* Campo de contraseña */}
                <Box>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel 
                      htmlFor="outlined-adornment-password"
                      sx={{ fontSize: isSmallMobile ? '0.875rem' : '1rem' }}
                    >
                      🔒 Contraseña
                    </InputLabel>
                    <Field
                      as={OutlinedInput}
                      name="password"
                      id="outlined-adornment-password"
                      type={showPassword ? 'text' : 'password'}
                      size={isSmallMobile ? "small" : "medium"}
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
                        borderRadius: 2,
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: isSmallMobile ? '0.875rem' : '1rem',
                          padding: isSmallMobile ? '12px 14px' : '16px 14px'
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
                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Link
                    to="/forgot-password"
                    style={{ 
                      color: theme.palette.primary.main, 
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: isSmallMobile ? '0.875rem' : '1rem',
                      lineHeight: 1.5
                    }}
                  >
                    🔑 ¿Olvidaste tu contraseña?
                  </Link>
                </Box>
                
                {/* Botón de ingresar */}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    type="submit"
                    disabled={isSubmitting || loading}
                    size={isSmallMobile ? "medium" : "large"}
                    sx={{
                      color: 'white',
                      textTransform: 'none',
                      py: isSmallMobile ? 1.5 : 2,
                      px: isSmallMobile ? 3 : 4,
                      fontSize: isSmallMobile ? '1rem' : '1.1rem',
                      fontWeight: 600,
                      borderRadius: 2,
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
                
                {/* Separador */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  my: 3,
                  '&::before, &::after': {
                    content: '""',
                    flex: 1,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                  }
                }}>
                  <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>
                    o
                  </Typography>
                </Box>
                
                {/* Sección de descarga de APK */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    📱 Descarga nuestra aplicación móvil
                  </Typography>
                  <DownloadAPK variant="outlined" size="medium" showInfo={false} />
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