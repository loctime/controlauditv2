import React, { useState } from "react";
import { Box, Button, FormControl, Grid, IconButton, InputAdornment, InputLabel, OutlinedInput, TextField, Typography, Alert } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from '../../../firebaseConfig';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const initialValues = {
    email: '',
    password: '',
    confirmPassword: ''
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Correo electrónico inválido')
      .required('Ingresa el correo electrónico'),
    password: Yup.string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .required('Ingresa la contraseña'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Las contraseñas deben coincidir')
      .required('Confirma la contraseña')
  });

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    setLoading(true);
    setError('');
    try {
      await signUp({ email: values.email, password: values.password });
      navigate("/");
    } catch (error) {
      console.error(error);
      let errorMessage = 'Error al registrar. Por favor, inténtalo de nuevo.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El correo electrónico ya está en uso.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido.';
      }
      
      setError(errorMessage);
      setErrors({ email: errorMessage });
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
        backgroundColor: '#f5f5f5',
      }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom textAlign="center">
          Registrarse
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
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
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Field 
                    as={TextField} 
                    name="email" 
                    label="Correo Electrónico" 
                    fullWidth 
                    disabled={isSubmitting || loading}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel htmlFor="outlined-adornment-password">
                      Contraseña
                    </InputLabel>
                    <Field
                      as={OutlinedInput}
                      name="password"
                      id="outlined-adornment-password"
                      type={showPassword ? 'text' : 'password'}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? (
                              <VisibilityOff color="primary" />
                            ) : (
                              <Visibility color="primary" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="Contraseña"
                      disabled={isSubmitting || loading}
                      error={touched.password && Boolean(errors.password)}
                    />
                  </FormControl>
                  {touched.password && errors.password && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                      {errors.password}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel htmlFor="outlined-adornment-confirmPassword">
                      Confirmar Contraseña
                    </InputLabel>
                    <Field
                      as={OutlinedInput}
                      name="confirmPassword"
                      id="outlined-adornment-confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={handleClickShowConfirmPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff color="primary" />
                            ) : (
                              <Visibility color="primary" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="Confirmar Contraseña"
                      disabled={isSubmitting || loading}
                      error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                    />
                  </FormControl>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                      {errors.confirmPassword}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    type="submit"
                    disabled={isSubmitting || loading}
                    sx={{
                      color: 'white',
                      textTransform: 'none',
                      py: 1.5,
                    }}
                  >
                    {loading ? 'Registrando...' : 'Registrarse'}
                  </Button>
                </Grid>
                <Grid size={{ xs: 12 }} textAlign="center">
                  <Typography variant="body2">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" style={{ color: 'steelblue', textDecoration: 'none' }}>
                      Inicia sesión aquí
                    </Link>
                  </Typography>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  );
};

export default Register;
