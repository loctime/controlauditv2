import React, { useState, useEffect } from "react";
import { 
  Button, 
  Grid, 
  Typography, 
  Box, 
  Tooltip, 
  IconButton, 
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { useNavigate } from "react-router-dom";
import { storage } from "../../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs, query, where } from "firebase/firestore";
import AddEmpresaModal from "./AddEmpresaModal";
import EliminarEmpresa from "./EliminarEmpresa";
import Swal from 'sweetalert2';
import { useAuth } from "../../context/AuthContext";
import EditarEmpresaModal from "./EditarEmpresa";
import { db } from "../../../firebaseConfig";
import SucursalesTab from "./tabs/SucursalesTab";
import EmpleadosTab from "./tabs/EmpleadosTab";
import CapacitacionesTab from "./tabs/CapacitacionesTab";
import AccidentesTab from "./tabs/AccidentesTab";
import EmpresaStats from "./components/EmpresaStats";

const EstablecimientosContainer = () => {
  const { userProfile, userEmpresas, loadingEmpresas, crearEmpresa, verificarYCorregirEmpresas, updateEmpresa } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const formatearEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  const [openModal, setOpenModal] = useState(false);
  const [empresa, setEmpresa] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    logo: null
  });
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [empresaEdit, setEmpresaEdit] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [empresasStats, setEmpresasStats] = useState({});
  const [activeTabPerEmpresa, setActiveTabPerEmpresa] = useState({});

  // Cargar estadísticas cuando las empresas estén disponibles
  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0) {
      loadEmpresasStats(userEmpresas);
    }
  }, [userEmpresas]);

  const loadEmpresasStats = async (empresas) => {
    const stats = {};
    
    for (const empresa of empresas) {
      try {
        const sucursalesSnapshot = await getDocs(query(collection(db, 'sucursales'), where('empresaId', '==', empresa.id)));
        const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
        
        if (sucursalesIds.length === 0) {
          stats[empresa.id] = {
            sucursales: 0,
            empleados: 0,
            capacitaciones: 0,
            capacitacionesCompletadas: 0,
            accidentes: 0,
            accidentesAbiertos: 0
          };
          continue;
        }

        const [empleadosSnapshot, capacitacionesSnapshot, accidentesSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'empleados'), where('sucursalId', 'in', sucursalesIds))),
          getDocs(query(collection(db, 'capacitaciones'), where('sucursalId', 'in', sucursalesIds))),
          getDocs(query(collection(db, 'accidentes'), where('sucursalId', 'in', sucursalesIds)))
        ]);
        
        stats[empresa.id] = {
          sucursales: sucursalesIds.length,
          empleados: empleadosSnapshot.docs.length,
          capacitaciones: capacitacionesSnapshot.docs.length,
          capacitacionesCompletadas: capacitacionesSnapshot.docs.filter(doc => doc.data().estado === 'completada').length,
          accidentes: accidentesSnapshot.docs.length,
          accidentesAbiertos: accidentesSnapshot.docs.filter(doc => doc.data().estado === 'abierto').length
        };
      } catch (error) {
        console.error(`Error cargando stats para empresa ${empresa.id}:`, error);
        stats[empresa.id] = {
          sucursales: 0,
          empleados: 0,
          capacitaciones: 0,
          capacitacionesCompletadas: 0,
          accidentes: 0,
          accidentesAbiertos: 0
        };
      }
    }
    
    setEmpresasStats(stats);
  };

  const toggleRow = (empresaId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(empresaId)) {
      newExpanded.delete(empresaId);
    } else {
      newExpanded.add(empresaId);
    }
    setExpandedRows(newExpanded);
  };

  const setActiveTab = (empresaId, tab) => {
    setActiveTabPerEmpresa(prev => ({
      ...prev,
      [empresaId]: tab
    }));
  };

  const getActiveTab = (empresaId) => {
    return activeTabPerEmpresa[empresaId] || 'sucursales';
  };

  const handleCloseModal = () => {
    setOpenModal(false);
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
    if (!empresa.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la empresa es requerido'
      });
      return;
    }

    setLoading(true);
    try {
      let logoURL = "";
      if (empresa.logo) {
        const storageRef = ref(storage, `empresas/${Date.now()}_${empresa.logo.name}`);
        const snapshot = await uploadBytes(storageRef, empresa.logo);
        logoURL = await getDownloadURL(snapshot.ref);
      }

      await crearEmpresa({
        nombre: empresa.nombre,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        logo: logoURL
      });

      setEmpresa({
        nombre: "",
        direccion: "",
        telefono: "",
        logo: null
      });

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Empresa creada exitosamente'
      });
    } catch (error) {
      console.error('Error al crear empresa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear la empresa'
      });
    } finally {
      setLoading(false);
      setOpenModal(false);
    }
  };

  const eliminarEmpresa = async () => {
    // Las empresas se recargarán automáticamente desde el contexto
  };

  const handleVerificarEmpresas = async () => {
    setVerificando(true);
    try {
      await verificarYCorregirEmpresas();
      Swal.fire({
        icon: 'success',
        title: 'Verificación completada',
        text: 'Las empresas han sido verificadas y corregidas si era necesario'
      });
    } catch (error) {
      console.error('Error al verificar empresas:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al verificar las empresas'
      });
    } finally {
      setVerificando(false);
    }
  };

  const handleOpenEditModal = (empresa) => {
    setEmpresaEdit(empresa);
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setEmpresaEdit(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEmpresaEdit((prevEmpresa) => ({
      ...prevEmpresa,
      [name]: value
    }));
  };

  const handleEditLogoChange = (e) => {
    setEmpresaEdit((prevEmpresa) => ({
      ...prevEmpresa,
      logo: e.target.files[0]
    }));
  };

  const handleEditEmpresa = async () => {
    if (!empresaEdit.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la empresa es requerido'
      });
      return;
    }

    setLoading(true);
    try {
      let logoURL = empresaEdit.logoURL || "";
      if (empresaEdit.logo && empresaEdit.logo instanceof File) {
        const storageRef = ref(storage, `empresas/${Date.now()}_${empresaEdit.logo.name}`);
        const snapshot = await uploadBytes(storageRef, empresaEdit.logo);
        logoURL = await getDownloadURL(snapshot.ref);
      }

      await updateEmpresa(empresaEdit.id, {
        nombre: empresaEdit.nombre,
        direccion: empresaEdit.direccion,
        telefono: empresaEdit.telefono,
        logo: logoURL
      });

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Empresa actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar empresa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar la empresa'
      });
    } finally {
      setLoading(false);
      setOpenEditModal(false);
    }
  };

  // Ya no se usa navegación a sucursales, todo se maneja aquí con tabs expandibles

  return (
    <Box sx={{ p: isSmallMobile ? 2 : 4 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isSmallMobile ? 'column' : 'row',
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 4,
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BusinessIcon sx={{ fontSize: isSmallMobile ? 32 : 40, color: 'primary.main' }} />
          <Typography 
            variant={isSmallMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            Gestión de Empresas ({userEmpresas?.length || 0})
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap',
          justifyContent: isSmallMobile ? 'center' : 'flex-end'
        }}>
          <Button
            variant="outlined"
            onClick={handleVerificarEmpresas}
            disabled={verificando}
            startIcon={verificando ? <CircularProgress size={16} /> : <ExpandMoreIcon />}
            size={isSmallMobile ? "small" : "medium"}
          >
            {verificando ? "Verificando..." : "Verificar"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => navigate('/accidentes')}
            startIcon={<ReportProblemIcon />}
            size={isSmallMobile ? "small" : "medium"}
          >
            Accidentes
          </Button>
          <Button
            variant="contained"
            onClick={() => setOpenModal(true)}
            startIcon={<BusinessIcon />}
            size={isSmallMobile ? "small" : "medium"}
          >
            Agregar Empresa
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Haz clic en la flecha para expandir y ver las opciones de gestión para cada empresa.
      </Typography>

      {/* Contenido - Tabla Expandible */}
      {loadingEmpresas ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando empresas...
          </Typography>
        </Box>
      ) : (userEmpresas || []).length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No hay empresas registradas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Haz clic en "Agregar Empresa" para crear tu primera empresa
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell><strong>Empresa</strong></TableCell>
                <TableCell><strong>Propietario</strong></TableCell>
                <TableCell><strong>Dirección</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>Sucursales</strong></TableCell>
                <TableCell><strong>Empleados</strong></TableCell>
                <TableCell><strong>Capacitaciones</strong></TableCell>
                <TableCell><strong>Accidentes</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(userEmpresas || []).filter(empresa => empresa && empresa.id && empresa.nombre).map((empresa) => {
                const isExpanded = expandedRows.has(empresa.id);
                const stats = empresasStats[empresa.id] || {
                  sucursales: 0,
                  empleados: 0,
                  capacitaciones: 0,
                  capacitacionesCompletadas: 0,
                  accidentes: 0,
                  accidentesAbiertos: 0
                };

                return (
                  <React.Fragment key={empresa.id}>
                    {/* Fila principal */}
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleRow(empresa.id)}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {empresa.logo && empresa.logo.trim() !== "" ? (
                            <img
                              src={empresa.logo}
                              alt="Logo de la empresa"
                              style={{ 
                                width: 40, 
                                height: 40, 
                                objectFit: 'contain', 
                                borderRadius: 8, 
                                border: '1px solid #eee' 
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                color: theme.palette.primary.main,
                                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                              }}
                            >
                              {empresa.nombre.charAt(0).toUpperCase()}
                            </Box>
                          )}
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {empresa.nombre}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Creada: {empresa.createdAt ? new Date(empresa.createdAt.toDate ? empresa.createdAt.toDate() : empresa.createdAt).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {empresa.propietarioEmail ? formatearEmail(empresa.propietarioEmail) : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {empresa.direccion || 'Sin dirección'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {empresa.telefono || 'Sin teléfono'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              borderRadius: 1
                            },
                            p: 1,
                            borderRadius: 1,
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            if (!isExpanded) {
                              toggleRow(empresa.id);
                            }
                            setActiveTab(empresa.id, 'sucursales');
                          }}
                        >
                          <StorefrontIcon color="primary" fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {stats.sucursales}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              borderRadius: 1
                            },
                            p: 1,
                            borderRadius: 1,
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            if (!isExpanded) {
                              toggleRow(empresa.id);
                            }
                            setActiveTab(empresa.id, 'empleados');
                          }}
                        >
                          <PeopleIcon color="primary" fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {stats.empleados}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                              borderRadius: 1
                            },
                            p: 1,
                            borderRadius: 1,
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            if (!isExpanded) {
                              toggleRow(empresa.id);
                            }
                            setActiveTab(empresa.id, 'capacitaciones');
                          }}
                        >
                          <SchoolIcon color="secondary" fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {stats.capacitaciones}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              borderRadius: 1
                            },
                            p: 1,
                            borderRadius: 1,
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            if (!isExpanded) {
                              toggleRow(empresa.id);
                            }
                            setActiveTab(empresa.id, 'accidentes');
                          }}
                        >
                          <ReportProblemIcon 
                            color={stats.accidentesAbiertos > 0 ? "error" : "action"} 
                            fontSize="small" 
                          />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {stats.accidentes}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Editar empresa">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenEditModal(empresa)}
                            >
                              <BusinessIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Ver sucursales">
                            <IconButton 
                              size="small" 
                              onClick={() => toggleRow(empresa.id)}
                              color="secondary"
                            >
                              <StorefrontIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <EliminarEmpresa empresa={empresa} onEmpresaEliminada={eliminarEmpresa} />
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    {/* Fila expandible con botones de gestión */}
                    <TableRow>
                      <TableCell colSpan={10} sx={{ py: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 1 , backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
                            

                            {/* Contenido del tab activo */}
                            <Box>
                              {getActiveTab(empresa.id) === 'sucursales' && (
                                <SucursalesTab 
                                  empresaId={empresa.id} 
                                  empresaNombre={empresa.nombre}
                                  userEmpresas={userEmpresas}
                                  loadEmpresasStats={loadEmpresasStats}
                                />
                              )}
                              {getActiveTab(empresa.id) === 'empleados' && (
                                <EmpleadosTab empresaId={empresa.id} empresaNombre={empresa.nombre} />
                              )}
                              {getActiveTab(empresa.id) === 'capacitaciones' && (
                                <CapacitacionesTab empresaId={empresa.id} empresaNombre={empresa.nombre} />
                              )}
                              {getActiveTab(empresa.id) === 'accidentes' && (
                                <AccidentesTab empresaId={empresa.id} empresaNombre={empresa.nombre} />
                              )}
                            </Box>
                            
                            {/* Resumen de estadísticas */}
                            <EmpresaStats empresaNombre={empresa.nombre} stats={stats} />
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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
      {openEditModal && empresaEdit && (
        <EditarEmpresaModal
          open={openEditModal}
          handleClose={handleCloseEditModal}
          handleEditEmpresa={handleEditEmpresa}
          empresa={empresaEdit}
          handleInputChange={handleEditInputChange}
          handleLogoChange={handleEditLogoChange}
          loading={loading}
        />
      )}
    </Box>
  );
};

export default EstablecimientosContainer;
