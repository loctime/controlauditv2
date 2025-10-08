import React, { useState, useEffect, useCallback } from "react";
import { 
  Button, 
  Card, 
  Grid, 
  Typography, 
  Box, 
  CardActions, 
  Divider, 
  Stack, 
  Tooltip, 
  IconButton, 
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Chip,
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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoIcon from '@mui/icons-material/Info';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { Link, useNavigate } from "react-router-dom";
import { storage, db } from "../../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs, query, where, addDoc, Timestamp } from "firebase/firestore";
import AddEmpresaModal from "./AddEmpresaModal";
import EliminarEmpresa from "./EliminarEmpresa";
import Swal from 'sweetalert2';
import { useAuth } from "../../context/AuthContext";
import EditarEmpresaModal from "./EditarEmpresa";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const EstablecimientosContainer = () => {
  const { userProfile, userEmpresas, crearEmpresa, verificarYCorregirEmpresas, getUserEmpresas, updateEmpresa, forceRefreshCache } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Función para formatear email (mostrar solo usuario)
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
  const [cargandoEmpresas, setCargandoEmpresas] = useState(false);
  const [empresasCargadas, setEmpresasCargadas] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [empresaEdit, setEmpresaEdit] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [empresasStats, setEmpresasStats] = useState({});
  const [activeTabPerEmpresa, setActiveTabPerEmpresa] = useState({});

  // Recargar empresas cuando el componente se monta
  useEffect(() => {
    if (userProfile && userProfile.uid && !empresasCargadas) {
      setCargandoEmpresas(true);
      getUserEmpresas(userProfile.uid).then(() => {
        setCargandoEmpresas(false);
        setEmpresasCargadas(true);
      });
    }
  }, [userProfile?.uid]); // Solo depende del uid del usuario

  // Cargar estadísticas cuando las empresas estén listas
  useEffect(() => {
    if (empresasCargadas && userEmpresas && userEmpresas.length > 0) {
      loadEmpresasStats(userEmpresas);
    }
  }, [empresasCargadas, userEmpresas]);

  // Cargar estadísticas de cada empresa
  const loadEmpresasStats = async (empresas) => {
    const stats = {};
    
    for (const empresa of empresas) {
      try {
        // Obtener todas las sucursales de esta empresa
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

        // Obtener estadísticas de todas las sucursales de esta empresa
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

  // Toggle expandir fila
  const toggleRow = (empresaId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(empresaId)) {
      newExpanded.delete(empresaId);
    } else {
      newExpanded.add(empresaId);
    }
    setExpandedRows(newExpanded);
  };

  // Cambiar tab activo para una empresa
  const setActiveTab = (empresaId, tab) => {
    setActiveTabPerEmpresa(prev => ({
      ...prev,
      [empresaId]: tab
    }));
  };

  // Obtener tab activo para una empresa (default: 'sucursales')
  const getActiveTab = (empresaId) => {
    return activeTabPerEmpresa[empresaId] || 'sucursales';
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    // No necesitamos llamara obtenerEmpresas() porque userEmpresas se actualiza automáticamente
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
    // Recargar empresas después de eliminar
    try {
      setCargandoEmpresas(true);
      await getUserEmpresas(userProfile.uid);
    } catch (error) {
      console.error('Error al recargar empresas después de eliminar:', error);
    } finally {
      setCargandoEmpresas(false);
    }
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

  const handleNavigateToSucursales = (empresaId) => {
    navigate(`/sucursales/${empresaId}`);
  };

  const handleForceRefreshCache = async () => {
    try {
      setCargandoEmpresas(true);
      setEmpresasCargadas(false); // Resetear el estado de empresas cargadas
      
      // Forzar actualización del cache
      await forceRefreshCache();
      
      // Recargar empresas
      await getUserEmpresas(userProfile.uid);
      
      setEmpresasCargadas(true);
      
      Swal.fire({
        icon: 'success',
        title: 'Cache actualizado',
        text: 'El cache offline se ha actualizado correctamente'
      });
    } catch (error) {
      console.error('Error actualizando cache:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar el cache offline'
      });
    } finally {
      setCargandoEmpresas(false);
    }
  };

  // Componente para mostrar sucursales de una empresa
  const SucursalesTab = ({ empresaId, empresaNombre }) => {
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openSucursalForm, setOpenSucursalForm] = useState(false);
    const [sucursalForm, setSucursalForm] = useState({
      nombre: '',
      direccion: '',
      telefono: ''
    });

    // Cargar sucursales cuando el tab se activa
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
        loadSucursales(); // Recargar lista
        loadEmpresasStats(userEmpresas); // Actualizar estadísticas

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
          text: 'Error al crear la sucursal'
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

        {/* Modal para agregar sucursal */}
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

  // Componente para mostrar empleados de una empresa
  const EmpleadosTab = ({ empresaId, empresaNombre }) => {
    const [empleados, setEmpleados] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (empresaId) {
        loadEmpleados();
      }
    }, [empresaId]);

    const loadEmpleados = async () => {
      setLoading(true);
      try {
        // Obtener todas las sucursales de esta empresa
        const sucursalesSnapshot = await getDocs(query(collection(db, 'sucursales'), where('empresaId', '==', empresaId)));
        const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
        
        if (sucursalesIds.length === 0) {
          setEmpleados([]);
          return;
        }

        // Obtener empleados de todas las sucursales
        const empleadosSnapshot = await getDocs(query(collection(db, 'empleados'), where('sucursalId', 'in', sucursalesIds)));
        const empleadosData = empleadosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmpleados(empleadosData);
      } catch (error) {
        console.error('Error cargando empleados:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Empleados de {empresaNombre}</Typography>
          <Button
            variant="contained"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/empleados')}
          >
            Gestionar Empleados
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : empleados.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" color="textSecondary">
              No hay empleados registrados para esta empresa
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {empleados.map((empleado) => (
              <Grid item xs={12} sm={6} md={4} key={empleado.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {empleado.nombre}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      <strong>DNI:</strong> {empleado.dni}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      <strong>Cargo:</strong> {empleado.cargo}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      <strong>Área:</strong> {empleado.area}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Estado:</strong> {empleado.estado}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  // Componente para mostrar capacitaciones de una empresa
  const CapacitacionesTab = ({ empresaId, empresaNombre }) => {
    const [capacitaciones, setCapacitaciones] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (empresaId) {
        loadCapacitaciones();
      }
    }, [empresaId]);

    const loadCapacitaciones = async () => {
      setLoading(true);
      try {
        // Obtener todas las sucursales de esta empresa
        const sucursalesSnapshot = await getDocs(query(collection(db, 'sucursales'), where('empresaId', '==', empresaId)));
        const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
        
        if (sucursalesIds.length === 0) {
          setCapacitaciones([]);
          return;
        }

        // Obtener capacitaciones de todas las sucursales
        const capacitacionesSnapshot = await getDocs(query(collection(db, 'capacitaciones'), where('sucursalId', 'in', sucursalesIds)));
        const capacitacionesData = capacitacionesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCapacitaciones(capacitacionesData);
      } catch (error) {
        console.error('Error cargando capacitaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    const getEstadoColor = (estado) => {
      switch (estado) {
        case 'activa': return 'warning';
        case 'completada': return 'success';
        case 'cancelada': return 'error';
        default: return 'default';
      }
    };

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Capacitaciones de {empresaNombre}</Typography>
          <Button
            variant="contained"
            startIcon={<SchoolIcon />}
            onClick={() => navigate('/capacitaciones')}
          >
            Gestionar Capacitaciones
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : capacitaciones.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" color="textSecondary">
              No hay capacitaciones registradas para esta empresa
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {capacitaciones.map((capacitacion) => (
              <Grid item xs={12} sm={6} md={4} key={capacitacion.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {capacitacion.nombre}
                      </Typography>
                      <Chip 
                        label={capacitacion.estado} 
                        color={getEstadoColor(capacitacion.estado)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      <strong>Tipo:</strong> {capacitacion.tipo}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      <strong>Instructor:</strong> {capacitacion.instructor}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      <strong>Fecha:</strong> {capacitacion.fechaRealizada?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Asistentes:</strong> {capacitacion.asistentes?.length || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  // Componente para mostrar accidentes de una empresa
  const AccidentesTab = ({ empresaId, empresaNombre }) => {
    const [accidentes, setAccidentes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (empresaId) {
        loadAccidentes();
      }
    }, [empresaId]);

    const loadAccidentes = async () => {
      setLoading(true);
      try {
        // Obtener todas las sucursales de esta empresa
        const sucursalesSnapshot = await getDocs(query(collection(db, 'sucursales'), where('empresaId', '==', empresaId)));
        const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
        
        if (sucursalesIds.length === 0) {
          setAccidentes([]);
          return;
        }

        // Obtener accidentes de todas las sucursales
        const accidentesSnapshot = await getDocs(query(collection(db, 'accidentes'), where('sucursalId', 'in', sucursalesIds)));
        const accidentesData = accidentesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAccidentes(accidentesData);
      } catch (error) {
        console.error('Error cargando accidentes:', error);
      } finally {
        setLoading(false);
      }
    };

    const getGravedadColor = (gravedad) => {
      switch (gravedad) {
        case 'leve': return 'success';
        case 'moderado': return 'warning';
        case 'grave': return 'error';
        default: return 'default';
      }
    };

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Accidentes de {empresaNombre}</Typography>
          <Button
            variant="contained"
            startIcon={<ReportProblemIcon />}
            onClick={() => navigate('/accidentes')}
          >
            Gestionar Accidentes
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : accidentes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" color="textSecondary">
              No hay accidentes registrados para esta empresa
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {accidentes.map((accidente) => (
              <Grid item xs={12} sm={6} md={4} key={accidente.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {accidente.tipo}
                      </Typography>
                      <Chip 
                        label={accidente.gravedad} 
                        color={getGravedadColor(accidente.gravedad)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      <strong>Empleado:</strong> {accidente.empleadoNombre}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      <strong>Fecha:</strong> {accidente.fechaHora?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      <strong>Lugar:</strong> {accidente.lugar}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      <strong>Días perdidos:</strong> {accidente.diasPerdidos || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Estado:</strong> {accidente.estado}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

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
            onClick={handleForceRefreshCache}
            disabled={cargandoEmpresas}
            startIcon={cargandoEmpresas ? <CircularProgress size={16} /> : <ExpandMoreIcon />}
            size={isSmallMobile ? "small" : "medium"}
          >
            {cargandoEmpresas ? "Actualizando..." : "Actualizar Cache"}
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
      {cargandoEmpresas ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando empresas...
          </Typography>
        </Box>
      ) : !empresasCargadas ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Preparando empresas...
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StorefrontIcon color="primary" fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {stats.sucursales}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PeopleIcon color="primary" fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {stats.empleados}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon color="secondary" fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {stats.capacitacionesCompletadas}/{stats.capacitaciones}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                              onClick={() => handleNavigateToSucursales(empresa.id)}
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
                           
                            
                            <Grid container spacing={2}>
                              {/* Sucursales */}
                              <Grid item xs={12} sm={6} md={3}>
                                <Button
                                  fullWidth
                                  variant={getActiveTab(empresa.id) === 'sucursales' ? "contained" : "outlined"}
                                  startIcon={<StorefrontIcon />}
                                  onClick={() => setActiveTab(empresa.id, 'sucursales')}
                                  sx={{ height: '60px', flexDirection: 'column', gap: 1 }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Sucursales: {stats.sucursales}
                                  </Typography>
                                  
                                </Button>
                              </Grid>
                              
                              {/* Empleados */}
                              <Grid item xs={12} sm={6} md={3}>
                                <Button
                                  fullWidth
                                  variant={getActiveTab(empresa.id) === 'empleados' ? "contained" : "outlined"}
                                  startIcon={<PeopleIcon />}
                                  onClick={() => setActiveTab(empresa.id, 'empleados')}
                                  sx={{ height: '60px', flexDirection: 'column', gap: 1 }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Empleados: {stats.empleados}
                                  </Typography>
                                  
                                </Button>
                              </Grid>
                              
                              {/* Capacitaciones */}
                              <Grid item xs={12} sm={6} md={3}>
                                <Button
                                  fullWidth
                                  variant={getActiveTab(empresa.id) === 'capacitaciones' ? "contained" : "outlined"}
                                  startIcon={<SchoolIcon />}
                                  onClick={() => setActiveTab(empresa.id, 'capacitaciones')}
                                  sx={{ height: '60px', flexDirection: 'column', gap: 1 }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Capacitaciones: {stats.capacitacionesCompletadas}/{stats.capacitaciones}
                                  </Typography>
                                
                                </Button>
                              </Grid>
                              
                              {/* Accidentes */}
                              <Grid item xs={12} sm={6} md={3}>
                                <Button
                                  fullWidth
                                  variant={getActiveTab(empresa.id) === 'accidentes' ? "contained" : "outlined"}
                                  startIcon={<ReportProblemIcon />}
                                  onClick={() => setActiveTab(empresa.id, 'accidentes')}
                                  sx={{ height: '60px', flexDirection: 'column', gap: 1 }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Accidentes: {stats.accidentes}
                                  </Typography>
                                 
                                </Button>
                              </Grid>
                            </Grid>

                            {/* Contenido del tab activo */}
                            <Box sx={{ mt: 3 }}>
                              {getActiveTab(empresa.id) === 'sucursales' && (
                                <SucursalesTab empresaId={empresa.id} empresaNombre={empresa.nombre} />
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
                            <Box sx={{ mt: 3, p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Resumen de {empresa.nombre}:
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={6} sm={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                                      {stats.sucursales}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Sucursales
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
                                      {stats.empleados}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Empleados totales
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                                      {stats.capacitacionesCompletadas}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Capacitaciones completadas
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color={stats.accidentes > 0 ? "error" : "success.main"} sx={{ fontWeight: 'bold' }}>
                                      {stats.accidentes}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Incidentes/Accidentes
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
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
