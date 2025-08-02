import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon
} from "@mui/icons-material";
import { collection, getDocs, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";

const ListaSucursales = ({ empresaId }) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userProfile, userEmpresas, role } = useAuth();

  // Suscripción reactiva a sucursales multi-tenant
  useEffect(() => {
    if (!userProfile) {
      setSucursales([]);
      setLoading(false);
      setError("No hay usuario autenticado");
      return;
    }

    setLoading(true);
    setError(null);
    
    let empresasDisponibles = userEmpresas || [];
    
    if (empresasDisponibles.length === 0) {
      setSucursales([]);
      setLoading(false);
      setError("No hay empresas disponibles para este usuario");
      return;
    }

    let empresasAConsultar = empresasDisponibles;
    if (empresaId) {
      const empresaEspecifica = empresasDisponibles.find(e => e.id === empresaId);
      if (empresaEspecifica) {
        empresasAConsultar = [empresaEspecifica];
      } else {
        setSucursales([]);
        setLoading(false);
        setError(`No tienes acceso a la empresa con ID: ${empresaId}`);
        return;
      }
    }

    const empresasIds = empresasAConsultar.map(e => e.id);
    
    if (empresasIds.length === 0) {
      setSucursales([]);
      setLoading(false);
      setError("No hay empresas válidas para consultar");
      return;
    }

    const sucursalesRef = collection(db, "sucursales");
    const sucursalesQuery = query(sucursalesRef, where("empresaId", "in", empresasIds));
    
    const unsubscribe = onSnapshot(sucursalesQuery, (snapshot) => {
      const sucursalesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate?.() || new Date()
      }));
      setSucursales(sucursalesData);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('[ListaSucursales] Error en onSnapshot:', error);
      setError("Error al cargar las sucursales: " + error.message);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [empresaId, userProfile, userEmpresas, role]);

  const handleEliminar = async (sucursalId, nombreSucursal) => {
    if (window.confirm(`¿Está seguro de que desea eliminar la sucursal "${nombreSucursal}"?`)) {
      try {
        await deleteDoc(doc(db, "sucursales", sucursalId));
        // La suscripción onSnapshot ya maneja la actualización en tiempo real
      } catch (error) {
        console.error("[ListaSucursales] Error al eliminar sucursal:", error);
        setError("Error al eliminar la sucursal: " + error.message);
      }
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar permisos de acceso
  if (!userProfile) {
    return (
      <Box>
        <Alert severity="error">
          No tienes permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" flexDirection="column" gap={2}>
        <CircularProgress />
        <Typography>Cargando sucursales...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Sucursales Registradas ({sucursales.length})
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {sucursales.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No hay sucursales registradas
          </Typography>
          {empresaId && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Para esta empresa específica
            </Typography>
          )}
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Las sucursales aparecerán aquí una vez que se creen.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {sucursales.map((sucursal) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sucursal.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div">
                      {sucursal.nombre}
                    </Typography>
                    <Chip 
                      label={sucursal.empresa || sucursal.empresaId} 
                      color="primary"
                      size="small"
                    />
                  </Box>
                  
                  <Typography color="textSecondary" gutterBottom>
                    <strong>Dirección:</strong> {sucursal.direccion}
                  </Typography>
                  
                  <Typography color="textSecondary" gutterBottom>
                    <strong>Teléfono:</strong> {sucursal.telefono}
                  </Typography>
                  
                  <Typography color="textSecondary" gutterBottom>
                    <strong>Fecha de creación:</strong> {formatearFecha(sucursal.fechaCreacion)}
                  </Typography>

                  <Box display="flex" gap={1} mt={2}>
                    <IconButton 
                      size="small" 
                      color="primary"
                      disabled
                    >
                      <EditIcon />
                    </IconButton>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => handleEliminar(sucursal.id, sucursal.nombre)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ListaSucursales; 