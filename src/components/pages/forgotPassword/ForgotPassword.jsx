import React, { useState } from "react";
import { Box, Button, Grid, TextField, Typography, Alert } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../../../firebaseControlFile";
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const initialValues = {
    email: ''
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Correo electrónico inválido')
      .required('Ingresa el correo electrónico')
  });

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await forgotPassword(values.email);
      setSuccess('Se ha enviado un correo de recuperación a tu dirección de email.');
    } catch (error) {
      console.error(error);
      let errorMessage = 'Error al enviar el correo de recuperación.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Intenta más tarde.';
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
          Recuperar Contraseña
        </Typography>
        
        <Typography variant="body1" textAlign="center" sx={{ mb: 3 }}>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
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
                    {loading ? 'Enviando...' : 'Enviar Correo de Recuperación'}
                  </Button>
                </Grid>
                <Grid size={{ xs: 12 }} textAlign="center">
                  <Typography variant="body2">
                    ¿Recordaste tu contraseña?{' '}
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

export default ForgotPassword;
