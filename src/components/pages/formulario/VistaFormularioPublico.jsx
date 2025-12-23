import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile';
import { Box, Typography, Button, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const VistaFormularioPublico = () => {
  const { publicSharedId } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchForm = async () => {
      setLoading(true);
      const q = query(collection(dbAudit, 'formularios'), where('publicSharedId', '==', publicSharedId), where('esPublico', '==', true));
      const snapshot = await getDocs(q);
      setForm(snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      setLoading(false);
      console.debug('[VistaFormularioPublico] Formulario público cargado:', snapshot.empty ? 'No encontrado' : snapshot.docs[0].id);
    };
    fetchForm();
  }, [publicSharedId]);

  const copiarFormularioPublico = async (form) => {
    if (!userProfile) return;
    const nuevoFormulario = {
      ...form,
      clienteAdminId: userProfile.clienteAdminId || userProfile.uid,
      creadorId: userProfile.uid,
      esPublico: false,
      publicSharedId: null,
      createdAt: new Date()
    };
    delete nuevoFormulario.id;
    await addDoc(collection(dbAudit, 'formularios'), nuevoFormulario);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    console.debug('[VistaFormularioPublico] Formulario copiado a sistema:', userProfile.uid);
  };

  if (loading) return <Alert severity="info">Cargando formulario...</Alert>;
  if (!form) return <Alert severity="error">Formulario no encontrado o no es público.</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">{form.nombre}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Secciones: {Array.isArray(form.secciones) ? form.secciones.length : 0} | Preguntas: {Array.isArray(form.secciones) ? form.secciones.reduce((acc, s) => acc + (Array.isArray(s.preguntas) ? s.preguntas.length : 0), 0) : 0}
      </Typography>
      <Button
        variant="contained"
        onClick={() => copiarFormularioPublico(form)}
        disabled={!userProfile || copied}
      >
        {copied ? '¡Copiado!' : 'Copiar a mi sistema'}
      </Button>
    </Box>
  );
};

export default VistaFormularioPublico; 