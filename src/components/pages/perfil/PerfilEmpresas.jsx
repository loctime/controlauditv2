import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemAvatar, Avatar, ListItemText, Chip, Alert, CircularProgress, Button
} from '@mui/material';
import { Business as BusinessIcon, ExpandMore as ExpandMoreIcon, Store as StoreIcon } from '@mui/icons-material';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useNavigate } from 'react-router-dom';

// Componente para mostrar sucursales de una empresa
const SucursalesEmpresa = ({ empresaId }) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresaId) return;
    setLoading(true);
    const q = query(collection(db, 'sucursales'), where('empresaId', '==', empresaId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSucursales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      console.debug(`[SucursalesEmpresa] ${snapshot.docs.length} sucursales para empresa ${empresaId}`);
    });
    return () => unsubscribe();
  }, [empresaId]);

  if (loading) return <CircularProgress size={20} sx={{ ml: 2 }} />;
  if (sucursales.length === 0) return <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>Sin sucursales</Typography>;

  return (
    <List dense>
      {sucursales.map(sucursal => (
        <ListItem key={sucursal.id}>
          <ListItemAvatar>
            <Avatar>
              <StoreIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={sucursal.nombre}
            secondary={sucursal.direccion || ''}
          />
        </ListItem>
      ))}
    </List>
  );
};

const PerfilEmpresas = ({ empresas, loading }) => {
  // Log de depuración
  console.debug('[PerfilEmpresas] empresas:', empresas);
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Mis Empresas</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {empresas.length} empresa(s)
          </Typography>
          {/* Botón para ir a gestión de empresas */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              console.log('[PerfilEmpresas] Navegando a /establecimiento');
              navigate('/establecimiento');
            }}
            sx={{ ml: 2 }}
          >
            Gestionar Empresas
          </Button>
        </Box>
      </Box>
      {loading ? (
        <Alert severity="info">Cargando empresas...</Alert>
      ) : empresas.length === 0 ? (
        <Alert severity="info">No tienes empresas registradas.</Alert>
      ) : (
        empresas.map((empresa) => (
          <Accordion key={empresa.id} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <ListItem disableGutters>
                <ListItemAvatar>
                  <Avatar src={empresa.logo || undefined}>
                    {!empresa.logo && <BusinessIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={empresa.nombre}
                  secondary={`${empresa.direccion || ''} ${empresa.telefono ? '• ' + empresa.telefono : ''}`}
                />
                <Chip label="Propietario" size="small" color="primary" />
              </ListItem>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Sucursales:</Typography>
              <SucursalesEmpresa empresaId={empresa.id} />
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
};

export default PerfilEmpresas;
