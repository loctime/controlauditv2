import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { collection, getDocs, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../../context/AuthContext';
import Swal from 'sweetalert2';

const SucursalesTab = ({ empresaId, empresaNombre, userEmpresas, loadEmpresasStats }) => {
  const { userProfile } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openSucursalForm, setOpenSucursalForm] = useState(false);
  const [sucursalForm, setSucursalForm] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  });

  useEffect(() => {
    if (empresaId) {
      loadSucursales();
    }
  }, [empresaId]);

  const loadSucursales = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'sucursales'), where('empresaId', '==', empresaId));
      const snapshot = await getDocs(q);
      const sucursalesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSucursales(sucursalesData);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSucursalFormChange = (e) => {
    const { name, value } = e.target;
    setSucursalForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSucursal = async () => {
    if (!sucursalForm.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la sucursal es requerido'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'sucursales'), {
        ...sucursalForm,
        empresaId: empresaId,
        fechaCreacion: Timestamp.now(),
        creadoPor: userProfile?.uid,
        creadoPorEmail: userProfile?.email,
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid
      });

      setSucursalForm({ nombre: '', direccion: '', telefono: '' });
      setOpenSucursalForm(false);
      
      await loadSucursales();
      
      if (typeof loadEmpresasStats === 'function') {
        loadEmpresasStats(userEmpresas);
      }

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Sucursal creada exitosamente'
      });
    } catch (error) {
      console.error('Error creando sucursal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear la sucursal: ' + error.message
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Sucursales de {empresaNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<StorefrontIcon />}
          onClick={() => setOpenSucursalForm(true)}
        >
          Agregar Sucursal
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : sucursales.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="textSecondary">
            No hay sucursales registradas para esta empresa
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {sucursales.map((sucursal) => (
            <Grid item xs={12} sm={6} md={4} key={sucursal.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {sucursal.nombre}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    <strong>Dirección:</strong> {sucursal.direccion}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    <strong>Teléfono:</strong> {sucursal.telefono}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Creada: {sucursal.fechaCreacion?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {openSucursalForm && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setOpenSucursalForm(false)}
        >
          <Paper
            sx={{ p: 3, maxWidth: 400, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Agregar Sucursal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Nombre *
                </Typography>
                <input
                  type="text"
                  name="nombre"
                  value={sucursalForm.nombre}
                  onChange={handleSucursalFormChange}
                  placeholder="Nombre de la sucursal"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Dirección
                </Typography>
                <input
                  type="text"
                  name="direccion"
                  value={sucursalForm.direccion}
                  onChange={handleSucursalFormChange}
                  placeholder="Dirección de la sucursal"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Teléfono
                </Typography>
                <input
                  type="text"
                  name="telefono"
                  value={sucursalForm.telefono}
                  onChange={handleSucursalFormChange}
                  placeholder="Teléfono de la sucursal"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleAddSucursal}
                  sx={{ flex: 1 }}
                >
                  Crear
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setOpenSucursalForm(false)}
                  sx={{ flex: 1 }}
                >
                  Cancelar
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default SucursalesTab;

