import React, { useState, useEffect } from 'react';
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
import { Google as GoogleIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { onSignIn, signInWithGoogle } from '../../../firebaseConfig';
import { signInWithGoogleNative, initializeGoogleAuth, isGoogleAuthNativeAvailable } from '../../../utils/googleAuthNative';
import { signInWithGoogleAPK, handleGoogleRedirectResultAPK, isAPK } from '../../../utils/googleAuthAPK';
import { runFirebaseDiagnostics, quickCheck } from '../../../utils/firebaseDiagnostics';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import SmartAPKDownload from '../../common/SmartAPKDownload.jsx';

import { usePlatform } from '../../../hooks/usePlatform.js';
import LoadingScreen from '../../common/LoadingScreen';

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const navigate = useNavigate();
  const { handleLogin } = useAuth();
  const { isAPK } = usePlatform();

  // Inicializar Google Auth nativo cuando se carga el componente
  useEffect(() => {
    const initGoogleAuth = async () => {
      try {
        if (isAPK && isGoogleAuthNativeAvailable()) {
          console.log('📱 Inicializando Google Auth nativo al cargar...');
          await initializeGoogleAuth();
          console.log('✅ Google Auth nativo inicializado correctamente');
        }
        
        // ✅ Para APK, también verificar si hay un redirect pendiente de Google
        if (isAPK()) {
          console.log('📱 Verificando redirect pendiente de Google...');
          try {
            const result = await handleGoogleRedirectResultAPK();
            if (result && result.user) {
              console.log('✅ Redirect de Google detectado, procesando...');
              handleLogin(result.user);
              navigate("/auditoria");
            }
          } catch (error) {
            console.warn('⚠️ Error verificando redirect de Google:', error);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error inicializando Google Auth nativo:', error);
      } finally {
        // Siempre marcar como inicializado, incluso si falla
        setIsInitializing(false);
      }
    };

    // Simular un tiempo mínimo de carga para evitar parpadeos
    const timer = setTimeout(() => {
      initGoogleAuth();
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAPK]);

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  // Función para ejecutar diagnóstico
  const handleDiagnostics = async () => {
    try {
      setError('');
      console.log('🔍 Ejecutando diagnóstico de Firebase...');
      await runFirebaseDiagnostics();
    } catch (error) {
      console.error('Error ejecutando diagnóstico:', error);
      setError('Error ejecutando diagnóstico. Revisa la consola.');
    }
  };

  // Función para verificación rápida
  const handleQuickCheck = () => {
    try {
      setError('');
      console.log('⚡ Ejecutando verificación rápida...');
      quickCheck();
    } catch (error) {
      console.error('Error en verificación rápida:', error);
      setError('Error en verificación rápida. Revisa la consola.');
    }
  };

  // Mostrar pantalla de carga mientras se inicializa
  if (isInitializing) {
    return (
      <LoadingScreen 
        message="Inicializando ControlAudit..." 
        showProgress={true}
        progress={50}
      />
    );
  }

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

  // Función para Google Auth - Inteligente (APK vs Web)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      // ✅ PRIORIDAD 1: Si estamos en APK, usar autenticación nativa
      if (isAPK && isGoogleAuthNativeAvailable()) {
        console.log('📱 APK detectado, usando Google Sign-In nativo...');
        
        try {
          // Inicializar Google Auth nativo
          await initializeGoogleAuth();
          
          // Iniciar sesión nativa
          const result = await signInWithGoogleNative();
          
          if (result && result.user) {
            console.log('✅ Google Sign-In nativo exitoso:', result.user.uid);
            handleLogin(result.user);
            navigate("/auditoria");
            return;
          }
        } catch (nativeError) {
          console.warn('⚠️ Google Sign-In nativo falló, cambiando a web:', nativeError);
          setError(`Error nativo: ${nativeError.message}. Cambiando a web...`);
          
          // Si falla el nativo, continuar con el flujo web
        }
      }
      
      // ✅ PRIORIDAD 2: Flujo web (para navegador o si falla el nativo)
      console.log('🌐 Iniciando Google Sign-In web...');
      
      // ✅ Para APK, usar función específica
      let result;
      if (isAPK()) {
        console.log('📱 Usando Google Sign-In específico para APK...');
        result = await signInWithGoogleAPK();
      } else {
        console.log('🌐 Usando Google Sign-In web estándar...');
        result = await signInWithGoogle();
      }
      
      // Procesar resultado
      if (result && result.user) {
        handleLogin(result.user);
        navigate("/auditoria");
      } else if (result && result.pendingRedirect) {
        console.log('📱 Redirect iniciado, esperando resultado...');
        setError('Redireccionando a Google... Por favor, completa la autenticación.');
      }
    } catch (error) {
      console.error('Error en Google Auth:', error);
      setError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
    }
    setLoading(false);
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

          {/* Botones de diagnóstico para APK */}
          {isAPK && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Herramientas de diagnóstico (APK)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleQuickCheck}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Verificación Rápida
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleDiagnostics}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Diagnóstico Completo
                </Button>
              </Box>
            </Box>
          )}



          {/* Botón de Google - Web (funcional) */}
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
