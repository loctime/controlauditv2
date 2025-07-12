import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon
} from "@mui/icons-material";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";

const ListaSucursales = ({ empresaId }) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userProfile, role } = useAuth();

  useEffect(() => {
    cargarSucursales();
    // eslint-disable-next-line
  }, [empresaId, userProfile, role]);

  const cargarSucursales = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si no hay usuario autenticado, no cargar nada
      if (!userProfile) {
        setSucursales([]);
        return;
      }

      let sucursalesData = [];

      // Aplicar filtrado multi-tenant según el rol
      if (role === 'supermax') {
        // Super administradores ven todas las sucursales
        const sucursalesSnapshot = await getDocs(collection(db, "sucursales"));
        sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fechaCreacion: doc.data().fechaCreacion?.toDate?.() || new Date()
        }));
      } else if (role === 'max') {
        // Clientes administradores ven sus sucursales y las de sus usuarios operarios
        // Primero obtener las empresas del cliente administrador
        const empresasRef = collection(db, "empresas");
        const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.uid));
        const empresasSnapshot = await getDocs(empresasQuery);
        const empresasIds = empresasSnapshot.docs.map(doc => doc.id);

        // Obtener usuarios operarios del cliente administrador
        const usuariosRef = collection(db, "usuarios");
        const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
        const usuariosSnapshot = await getDocs(usuariosQuery);
        const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

        // Obtener empresas de los usuarios operarios (solo si hay usuarios operarios)
        let empresasOperariosIds = [];
        if (usuariosOperarios.length > 0) {
          const empresasOperariosQuery = query(empresasRef, where("propietarioId", "in", usuariosOperarios));
          const empresasOperariosSnapshot = await getDocs(empresasOperariosQuery);
          empresasOperariosIds = empresasOperariosSnapshot.docs.map(doc => doc.id);
        }

        // Combinar todas las empresas que puede ver
        const todasLasEmpresasIds = [...empresasIds, ...empresasOperariosIds];

        if (todasLasEmpresasIds.length > 0) {
          // Obtener sucursales de todas las empresas que puede ver
          const sucursalesRef = collection(db, "sucursales");
          const sucursalesQuery = query(sucursalesRef, where("empresaId", "in", todasLasEmpresasIds));
          const sucursalesSnapshot = await getDocs(sucursalesQuery);
          sucursalesData = sucursalesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaCreacion: doc.data().fechaCreacion?.toDate?.() || new Date()
          }));
        }
      } else if (role === 'operario') {
        // Usuarios operarios ven sucursales de su cliente administrador
        if (userProfile.clienteAdminId) {
          // Obtener empresas del cliente administrador
          const empresasRef = collection(db, "empresas");
          const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.clienteAdminId));
          const empresasSnapshot = await getDocs(empresasQuery);
          const empresasIds = empresasSnapshot.docs.map(doc => doc.id);

          if (empresasIds.length > 0) {
            // Obtener sucursales de las empresas del cliente administrador
            const sucursalesRef = collection(db, "sucursales");
            const sucursalesQuery = query(sucursalesRef, where("empresaId", "in", empresasIds));
            const sucursalesSnapshot = await getDocs(sucursalesQuery);
            sucursalesData = sucursalesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              fechaCreacion: doc.data().fechaCreacion?.toDate?.() || new Date()
            }));
          }
        }
      }

      // Filtrar por empresaId específico si está presente
      const filtradas = empresaId
        ? sucursalesData.filter(s => s.empresaId === empresaId)
        : sucursalesData;

      setSucursales(filtradas);
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
      setError("Error al cargar las sucursales");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (sucursalId, nombreSucursal) => {
    if (window.confirm(`¿Está seguro de que desea eliminar la sucursal "${nombreSucursal}"?`)) {
      try {
        await deleteDoc(doc(db, "sucursales", sucursalId));
        setSucursales(sucursales.filter(s => s.id !== sucursalId));
      } catch (error) {
        console.error("Error al eliminar sucursal:", error);
        setError("Error al eliminar la sucursal");
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
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