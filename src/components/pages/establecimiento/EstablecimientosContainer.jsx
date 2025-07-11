import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, CardContent, Grid, IconButton, Typography, Box, CardActions, Divider, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import { db, storage } from "../../../firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AddEmpresaModal from "./AddEmpresaModal";
import EliminarEmpresa from "./EliminarEmpresa";
import Swal from 'sweetalert2';
import { useAuth } from "../../context/AuthContext";

const EstablecimientosContainer = () => {
  const { userProfile, userEmpresas, canViewEmpresa, crearEmpresa } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [empresa, setEmpresa] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    logo: null
  });
  const [loading, setLoading] = useState(false);

  const obtenerEmpresas = useCallback(async () => {
    try {
      if (!userProfile) return;
      
      const refCollection = collection(db, "empresas");
      const querySnapshot = await getDocs(refCollection);
      const todasLasEmpresas = querySnapshot.docs.map((empresa) => ({
        ...empresa.data(),
        id: empresa.id,
      }));
      
      // Filtrar empresas que el usuario puede ver
      const empresasPermitidas = todasLasEmpresas.filter(empresa => 
        canViewEmpresa(empresa.id)
      );
      
      setEmpresas(empresasPermitidas);
    } catch (error) {
      console.error("Error al obtener empresas:", error);
    }
  }, [userProfile, canViewEmpresa]);

  useEffect(() => {
    obtenerEmpresas();
  }, [obtenerEmpresas]);

  const handleCloseModal = () => {
    setOpenModal(false);
    obtenerEmpresas(); // Actualiza la lista de empresas después de cerrar el modal
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmpresa((prevEmpresa) => ({
      ...prevEmpresa,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    setEmpresa((prevEmpresa) => ({
      ...prevEmpresa,
      logo: e.target.files[0]
    }));
  };

  const handleAddEmpresa = async () => {
    setLoading(true);
    try {
      let logoURL = "";
      if (empresa.logo) {
        // Cargar la imagen al almacenamiento de Firebase
        const logoRef = ref(storage, `logos/${empresa.logo.name}`);
        const snapshot = await uploadBytes(logoRef, empresa.logo);
        logoURL = await getDownloadURL(snapshot.ref);
      }

      // Crear el documento de la empresa usando el contexto
      const empresaData = {
        nombre: empresa.nombre,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        logo: logoURL
      };
      
      await crearEmpresa(empresaData);

      Swal.fire({
        icon: 'success',
        title: 'Empresa Agregada',
        text: 'La empresa ha sido agregada con éxito.',
      });

      handleCloseModal();
    } catch (error) {
      console.error("Error al agregar empresa:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al agregar la empresa.',
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarEmpresa = () => {
    obtenerEmpresas(); // Actualiza la lista de empresas después de eliminar una
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 3 }, py: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Empresas Registradas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenModal(true)}
          sx={{ minWidth: 180, fontWeight: 600 }}
        >
          Agregar Empresa
        </Button>
      </Box>
      <Divider sx={{ mb: 4 }} />
      <Grid container spacing={4}>
        {empresas.map((empresa) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={empresa.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2, borderRadius: 3, boxShadow: 3 }}>
              <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                {empresa.logo && empresa.logo.trim() !== "" ? (
                  <img
                    src={empresa.logo}
                    alt="Logo de la empresa"
                    style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 12, marginBottom: 12, border: '1px solid #eee' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 2,
                      marginBottom: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      color: "#666",
                      border: "2px dashed #ccc"
                    }}
                  >
                    {empresa.nombre.charAt(0).toUpperCase()}
                  </Box>
                )}
                <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
                  {empresa.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 0.5 }}>
                  Dirección: {empresa.direccion}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 0.5 }}>
                  Teléfono: {empresa.telefono}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <CardActions sx={{ justifyContent: 'space-between', mt: 'auto' }}>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                  <Link to={`/sucursales/${empresa.id}`} style={{ textDecoration: "none", flex: 1 }}>
                    <Button variant="contained" color="primary" fullWidth>
                      Sucursales
                    </Button>
                  </Link>
                  <EliminarEmpresa
                    empresaId={empresa.id}
                    eliminarEmpresa={eliminarEmpresa}
                  />
                </Stack>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      {openModal && (
        <AddEmpresaModal
          open={openModal}
          handleClose={handleCloseModal}
          handleAddEmpresa={handleAddEmpresa}
          empresa={empresa}
          handleInputChange={handleInputChange}
          handleLogoChange={handleLogoChange}
          loading={loading}
        />
      )}
    </Box>
  );
};

export default EstablecimientosContainer;
