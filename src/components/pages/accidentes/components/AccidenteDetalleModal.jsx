import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Grid,
  Typography,
  Chip,
  Button
} from '@mui/material';
import { Close as CloseIcon, ReportProblem as AccidenteIcon, Warning as IncidenteIcon } from '@mui/icons-material';
import Swal from 'sweetalert2';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

/**
 * Modal de detalle de accidente
 */
const AccidenteDetalleModal = React.memo(({
  open,
  onClose,
  accidente,
  onCerrarCaso,
  actualizarEstadoAccidente
}) => {
  const [cerradoPorNombre, setCerradoPorNombre] = useState('');
  const [editadoPorNombre, setEditadoPorNombre] = useState('');

  useEffect(() => {
    const cargarNombresUsuarios = async () => {
      if (!accidente) return;
      
      // Cargar nombre de quien cerró
      if (accidente.cerradoPor) {
        try {
          const usuarioRef = doc(db, 'usuarios', accidente.cerradoPor);
          const usuarioDoc = await getDoc(usuarioRef);
          if (usuarioDoc.exists()) {
            const data = usuarioDoc.data();
            setCerradoPorNombre(data.displayName || data.email || accidente.cerradoPor);
          } else {
            setCerradoPorNombre(accidente.cerradoPor);
          }
        } catch (error) {
          console.error('Error cargando usuario que cerró:', error);
          setCerradoPorNombre(accidente.cerradoPor);
        }
      }

      // Cargar nombre de quien editó
      if (accidente.editadoPor) {
        try {
          const usuarioRef = doc(db, 'usuarios', accidente.editadoPor);
          const usuarioDoc = await getDoc(usuarioRef);
          if (usuarioDoc.exists()) {
            const data = usuarioDoc.data();
            setEditadoPorNombre(data.displayName || data.email || accidente.editadoPor);
          } else {
            setEditadoPorNombre(accidente.editadoPor);
          }
        } catch (error) {
          console.error('Error cargando usuario que editó:', error);
          setEditadoPorNombre(accidente.editadoPor);
        }
      }
    };

    if (open && accidente) {
      cargarNombresUsuarios();
    }
  }, [open, accidente]);

  if (!accidente) return null;

  const getEstadoColor = (estado) => estado === 'abierto' ? 'error' : 'success';
  
  const getTipoIcon = (tipo) => tipo === 'accidente' ? <AccidenteIcon /> : <IncidenteIcon />;

  const handleCerrarCaso = async () => {
    try {
      await actualizarEstadoAccidente(accidente.id, 'cerrado');
      Swal.fire('Éxito', 'Estado actualizado correctamente', 'success');
      onClose();
      if (onCerrarCaso) onCerrarCaso();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTipoIcon(accidente.tipo)}
            <Typography variant="h6">Detalle del {accidente.tipo}</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Fecha y Hora</Typography>
            <Typography variant="body1">
              {accidente.fechaHora?.toDate?.()?.toLocaleString() || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Estado</Typography>
            <Chip label={accidente.estado} color={getEstadoColor(accidente.estado)} size="small" />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Descripción</Typography>
            <Typography variant="body1">{accidente.descripcion}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">
              {accidente.tipo === 'accidente' ? 'Empleados Involucrados' : 'Testigos'}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {accidente.tipo === 'accidente'
                ? accidente.empleadosInvolucrados?.map((emp, index) => (
                    <Chip
                      key={index}
                      label={`${emp.empleadoNombre}${emp.conReposo ? ' (Con reposo)' : ''}`}
                      color={emp.conReposo ? 'error' : 'default'}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))
                : accidente.testigos?.map((testigo, index) => (
                    <Chip key={index} label={testigo.empleadoNombre} sx={{ mr: 1, mb: 1 }} />
                  ))
              }
            </Box>
          </Grid>
          {accidente.imagenes?.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Imágenes
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {accidente.imagenes.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Imagen ${index + 1}`}
                    style={{
                      width: 150,
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(img, '_blank')}
                  />
                ))}
              </Box>
            </Grid>
          )}
          {accidente.fechaCierre && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Fecha de Cierre</Typography>
              <Typography variant="body1">
                {accidente.fechaCierre?.toDate?.()?.toLocaleString() || 'N/A'}
              </Typography>
            </Grid>
          )}
          {cerradoPorNombre && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Cerrado Por</Typography>
              <Typography variant="body1">{cerradoPorNombre}</Typography>
            </Grid>
          )}
          {accidente.fechaEdicion && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Última Edición</Typography>
              <Typography variant="body1">
                {accidente.fechaEdicion?.toDate?.()?.toLocaleString() || 'N/A'}
              </Typography>
            </Grid>
          )}
          {editadoPorNombre && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Editado Por</Typography>
              <Typography variant="body1">{editadoPorNombre}</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        {accidente.estado === 'abierto' && (
          <Button onClick={handleCerrarCaso} color="success" variant="contained">
            Cerrar Caso
          </Button>
        )}
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
});

AccidenteDetalleModal.displayName = 'AccidenteDetalleModal';

export default AccidenteDetalleModal;

