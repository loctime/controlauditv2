import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { Box, Typography, Card, CardContent, Button, Grid, Alert } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const GaleriaFormulariosPublicos = ({ onCopiar }) => {
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicForms = async () => {
      setLoading(true);
      const q = query(collection(db, 'formularios'), where('esPublico', '==', true));
      const snapshot = await getDocs(q);
      setFormularios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      console.debug('[GaleriaFormulariosPublicos] Formularios públicos cargados:', snapshot.docs.length);
    };
    fetchPublicForms();
  }, []);

  if (loading) return <Alert severity="info">Cargando formularios públicos...</Alert>;
  if (formularios.length === 0) return <Alert severity="info">No hay formularios públicos aún.</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Galería de Formularios Públicos</Typography>
      <Grid container spacing={2}>
        {formularios.map(form => (
          <Grid item xs={12} md={6} lg={4} key={form.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{form.nombre}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Secciones: {Array.isArray(form.secciones) ? form.secciones.length : 0} | Preguntas: {Array.isArray(form.secciones) ? form.secciones.reduce((acc, s) => acc + (Array.isArray(s.preguntas) ? s.preguntas.length : 0), 0) : 0}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => onCopiar(form)}
                  fullWidth
                >
                  Copiar a mi sistema
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default GaleriaFormulariosPublicos; 