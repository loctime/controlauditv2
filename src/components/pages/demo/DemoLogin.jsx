import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/firebaseControlFile';
import { useAuth } from '@/components/context/AuthContext';
import BACKEND_CONFIG from '@/config/backend';
import { Box, CircularProgress, Typography } from '@mui/material';

const DemoLogin = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { handleLogin } = useAuth();

  useEffect(() => {
    const loginDemo = async () => {
      try {
        const res = await fetch(`${BACKEND_CONFIG.URL}/api/demo-token`);
        if (!res.ok) throw new Error('No se pudo obtener el token de demo');

        const { customToken } = await res.json();
        const userCredential = await signInWithCustomToken(auth, customToken);

        handleLogin(userCredential.user);
        navigate('/dashboard-seguridad', { replace: true });
      } catch (err) {
        console.error('[DemoLogin] Error:', err);
        setError(err.message || 'Error al iniciar sesión demo');
      }
    };

    loginDemo();
  }, []);

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
      <CircularProgress size={48} />
      <Typography sx={{ mt: 2 }} variant="h6">
        Cargando demo...
      </Typography>
    </Box>
  );
};

export default DemoLogin;
