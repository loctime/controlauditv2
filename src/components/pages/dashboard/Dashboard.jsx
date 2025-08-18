// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Typography, Box, Grid, Paper, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Tabs, Tab, CircularProgress } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { collection, addDoc, setDoc, doc, updateDoc, query, where, getDocs, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { toast } from 'react-toastify';
import { verifyAdminCode, verifySuperAdminCode } from "../../../config/admin";
import GestionClientes from "./GestionClientes";
import userService from "../../../services/userService";
import { getEnvironmentInfo } from "../../../config/environment.js";
import BackendHealthCheck from "../../../utils/backendHealthCheck.js";
import BackendStatus from "../../../utils/backendStatus.js";

// Datos de ejemplo (se mantienen como fallback)
const empresasEjemplo = [
  {
    id: 'empresa1',
    nombre: 'Empresa Ejemplo',
    usuariosActuales: 4,
    usuariosMaximos: 10,
    estadoPago: 'al_dia',
    fechaVencimiento: '2024-07-01',
  },
  {
    id: 'empresa218',
    nombre: 'Empresa XYZ',
    usuariosActuales: 12,
    usuariosMaximos: 10,
    estadoPago: 'vencido',
    fechaVencimiento: '2024-06-10',
  },
];

function Dashboard() {
  const { userProfile, role, permisos, userEmpresas } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [openAdminDialog, setOpenAdminDialog] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [form, setForm] = useState({ nombre: '', email: '', usuariosMaximos: 1, password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Estados para empresas reales
  const [empresasReales, setEmpresasReales] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [resumenPagos, setResumenPagos] = useState({ alDia: 0, vencidos: 0 });

     // Función para cargar empresas reales con información de usuarios
   const cargarEmpresasReales = async () => {
     if (!userProfile?.uid || !role) {
       setEmpresasReales([]);
       setLoadingEmpresas(false);
       return;
     }

     setLoadingEmpresas(true);
     try {
       let empresasData = [];
       
       // Obtener clientes administradores según el rol del usuario
       if (role === 'supermax') {
         // Super administradores ven todos los clientes administradores
         const usuariosRef = collection(db, "usuarios");
         const clientesQuery = query(usuariosRef, where("role", "==", "max"));
         const clientesSnapshot = await getDocs(clientesQuery);
         empresasData = clientesSnapshot.docs.map(doc => ({
           id: doc.id,
           nombre: doc.data().displayName || doc.data().email,
           propietarioId: doc.id,
           ...doc.data()
         }));
       } else if (role === 'max') {
         // Clientes administradores solo ven sus propios datos
         const userRef = doc(db, "usuarios", userProfile.uid);
         const userSnap = await getDoc(userRef);
         if (userSnap.exists()) {
           const userData = userSnap.data();
           empresasData = [{
             id: userProfile.uid,
             nombre: userData.displayName || userData.email,
             propietarioId: userProfile.uid,
             ...userData
           }];
         }
       } else {
         // Operarios ven datos de su cliente admin
         if (userProfile.clienteAdminId) {
           const adminRef = doc(db, "usuarios", userProfile.clienteAdminId);
           const adminSnap = await getDoc(adminRef);
           if (adminSnap.exists()) {
             const adminData = adminSnap.data();
             empresasData = [{
               id: userProfile.clienteAdminId,
               nombre: adminData.displayName || adminData.email,
               propietarioId: userProfile.clienteAdminId,
               ...adminData
             }];
           }
         }
       }

                           // Enriquecer datos con información de usuarios
        const empresasEnriquecidas = await Promise.all(
          empresasData.map(async (cliente) => {
            // Contar usuarios operarios de este cliente
            const usuariosRef = collection(db, "usuarios");
            const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", cliente.id));
            const usuariosSnapshot = await getDocs(usuariosQuery);
            const usuariosCount = usuariosSnapshot.size;

            return {
              ...cliente,
              usuariosActuales: usuariosCount,
              usuariosMaximos: cliente.limiteUsuarios || 10,
              estadoPago: cliente.estadoPago || 'al_dia',
              fechaVencimiento: cliente.fechaVencimiento ? 
                (cliente.fechaVencimiento.toDate ? cliente.fechaVencimiento.toDate().toISOString().split('T')[0] : new Date(cliente.fechaVencimiento).toISOString().split('T')[0]) : 
                new Date().toISOString().split('T')[0],
              propietarioEmail: cliente.email || 'N/A'
            };
          })
        );

             // Filtrar empresas válidas (con nombre y datos básicos)
       const empresasValidas = empresasEnriquecidas.filter(empresa => 
         empresa.nombre && empresa.nombre.trim() !== ''
       );
       
       // Log para debugging
       console.log('=== EMPRESAS CARGADAS ===');
       empresasValidas.forEach(emp => {
         console.log(`Empresa: ${emp.nombre} | Estado: ${emp.estadoPago} | Usuarios: ${emp.usuariosActuales}/${emp.usuariosMaximos}`);
       });
       console.log('==========================');
       
       setEmpresasReales(empresasValidas);
       
       // Calcular resumen de pagos
       const alDia = empresasValidas.filter(emp => emp.estadoPago === 'al_dia').length;
       const vencidos = empresasValidas.filter(emp => emp.estadoPago === 'vencido').length;
       setResumenPagos({ alDia, vencidos });

    } catch (error) {
      console.error('Error al cargar empresas:', error);
      toast.error('Error al cargar empresas');
    } finally {
      setLoadingEmpresas(false);
    }
  };

  // Cargar empresas cuando cambie el usuario o rol
  useEffect(() => {
    cargarEmpresasReales();
  }, [userProfile?.uid, role]);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Función para activar administrador con código
  const activarAdminConCodigo = async () => {
    if (!adminCode.trim()) {
      toast.error('Ingresa el código de administrador');
      return;
    }

    if (!userProfile?.uid) {
      toast.error('No se pudo identificar tu usuario');
      return;
    }

    try {
      let newRole = null;
      let newPermisos = {};

      // Verificar código de super administrador
      if (verifySuperAdminCode(adminCode)) {
        newRole = 'supermax';
        newPermisos = {
          puedeCrearEmpresas: true,
          puedeCrearSucursales: true,
          puedeCrearAuditorias: true,
          puedeCompartirFormularios: true,
          puedeAgregarSocios: true,
          puedeGestionarUsuarios: true,
          puedeGestionarSistema: true,
          puedeEliminarUsuarios: true,
          puedeVerLogs: true
        };
        toast.success('¡Código válido! Rol actualizado a Super Administrador (supermax). Recarga la página para ver los cambios.');
      }
      // Verificar código de administrador normal
      else if (verifyAdminCode(adminCode)) {
        newRole = 'max';
        newPermisos = {
          puedeCrearEmpresas: true,
          puedeCrearSucursales: true,
          puedeCrearAuditorias: true,
          puedeCompartirFormularios: true,
          puedeAgregarSocios: true,
          puedeGestionarUsuarios: true,
          puedeVerLogs: true,
          puedeGestionarSistema: true,
          puedeEliminarUsuarios: true
        };
        toast.success('¡Código válido! Rol actualizado a Cliente Administrador (max). Recarga la página para ver los cambios.');
      }
      // Código incorrecto
      else {
        toast.error('Código de administrador incorrecto');
        return;
      }

      // Actualizar usuario en Firestore
      const userRef = doc(db, 'usuarios', userProfile.uid);
      await updateDoc(userRef, {
        role: newRole,
        permisos: newPermisos
      });

      setOpenAdminDialog(false);
      setAdminCode('');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      toast.error('Error al actualizar rol');
    }
  };

  // Función temporal para actualizar rol a administrador (mantener por compatibilidad)
  const actualizarRolAAdmin = async () => {
    setOpenAdminDialog(true);
  };

  // Log de información del usuario
  console.log('=== INFORMACIÓN DEL USUARIO ===');
  console.log('Rol actual:', role);
  console.log('Permisos:', permisos);
  console.log('Perfil completo:', userProfile);
  console.log('================================');

  // Función para diagnosticar problemas de conectividad
  const diagnosticarBackend = async () => {
    try {
      // Primero verificar el estado del entorno
      const statusChecker = new BackendStatus();
      const statusReport = statusChecker.generateStatusReport();
      
      console.log('📋 Reporte de estado del entorno:', statusReport);
      
      // Luego verificar conectividad
      const healthChecker = new BackendHealthCheck();
      const diagnostico = await healthChecker.runFullDiagnostic();
      
      return {
        success: diagnostico.connectivity.success,
        message: diagnostico.connectivity.success ? 'Backend funcionando correctamente' : 'Error de conectividad',
        details: {
          ...diagnostico,
          statusReport
        }
      };
    } catch (error) {
      console.error('❌ Error en diagnóstico del backend:', error);
      return { 
        success: false, 
        message: `Error en diagnóstico: ${error.message}`,
        details: error
      };
    }
  };

  // Función para mostrar diagnóstico completo
  const mostrarDiagnostico = async () => {
    try {
      setLoading(true);
      const diagnostico = await diagnosticarBackend();
      
      if (diagnostico.success) {
        toast.success('✅ Backend funcionando correctamente');
        console.log('📊 Diagnóstico completo:', diagnostico.details);
      } else {
        toast.error(`❌ ${diagnostico.message}`);
        console.error('Detalles del error:', diagnostico.details);
        
        // Mostrar recomendaciones si están disponibles
        if (diagnostico.details?.recommendations) {
          diagnostico.details.recommendations.forEach(rec => {
            console.log(rec);
          });
        }
      }
    } catch (error) {
      toast.error('Error al realizar diagnóstico');
      console.error('Error en diagnóstico:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!form.password) {
      setError('La contraseña temporal es obligatoria.');
      setLoading(false);
      return;
    }
    
    try {
      // Primero diagnosticar el backend
      const diagnostico = await diagnosticarBackend();
      if (!diagnostico.success) {
        console.log('⚠️ Backend no disponible, continuando con creación en Firestore...');
        // No bloquear la creación, permitir que use el fallback
      }
      
      // 1. Crear usuario principal usando el backend (sin desconectar)
      const password = form.password || 'Cambiar123!';
      const userRes = await userService.createUser({
        email: form.email,
        password: password,
        nombre: form.nombre,
        role: 'max',
        permisos: {
          puedeCrearEmpresas: true,
          puedeCrearSucursales: true,
          puedeCrearAuditorias: true,
          puedeCompartirFormularios: true,
          puedeAgregarSocios: true,
          puedeGestionarUsuarios: true,
          puedeVerLogs: true,
          puedeGestionarSistema: true,
          puedeEliminarUsuarios: true
        }
      });

      // Verificar si requiere creación manual
      if (userRes.requiresManualCreation) {
        toast.warning('⚠️ Usuario creado en Firestore. El administrador debe crear el usuario en Firebase Auth manualmente.');
        console.log('📝 Usuario pendiente de creación en Firebase Auth:', userRes);
      }

      // 2. Crear empresa en Firestore
      const empresaRef = await addDoc(collection(db, 'empresas'), {
        nombre: form.nombre,
        emailContacto: form.email,
        usuariosMaximos: Number(form.usuariosMaximos),
        usuariosActuales: 1,
        usuarios: [userRes.uid],
        estadoPago: 'al_dia',
        fechaUltimoPago: new Date(),
        fechaVencimiento: null,
        plan: 'estandar',
      });

      // 3. Actualizar usuario con información adicional usando Firestore directamente
      const userRef = doc(db, 'usuarios', userRes.uid);
      await updateDoc(userRef, {
        empresaId: empresaRef.id,
        plan: 'estandar',
        limiteUsuarios: Number(form.usuariosMaximos),
        usuariosActivos: 0,
        fechaCreacion: new Date(),
        estadoPago: 'al_dia'
      });

      setOpenDialog(false);
      setForm({ nombre: '', email: '', usuariosMaximos: 1, password: '' });
      toast.success('Empresa y usuario principal creados correctamente sin desconectar tu sesión.');
    } catch (err) {
      setError(err.message || 'Error al crear empresa y usuario.');
    } finally {
      setLoading(false);
    }
  };

  // Solo super administradores pueden ver el dashboard
  if (role !== 'supermax') {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" color="error">
          Acceso denegado: Solo los Super Administradores (supermax) pueden ver el Dashboard.
        </Typography>
      </Box>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box className="page-container dashboard-container">
      <Box className="content-container">
      <Typography variant="h4" gutterBottom>Dashboard Dueño del Sistema</Typography>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Crear Cliente" />
        <Tab label="Gestión de Clientes" />
      </Tabs>

      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" color="primary" onClick={handleOpenDialog}>
              Agregar Empresa / Usuario Principal
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={mostrarDiagnostico}
              disabled={loading}
            >
              🔍 Diagnosticar Backend
            </Button>
          </Box>
        </>
      )}

      {tabValue === 1 && (
        <GestionClientes />
      )}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Agregar Administrador Principal</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="nombre"
              label="Nombre"
              type="text"
              fullWidth
              required
              value={form.nombre}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="email"
              label="Email"
              type="email"
              fullWidth
              required
              value={form.email}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="usuariosMaximos"
              label="Límite de Usuarios"
              type="number"
              fullWidth
              required
              inputProps={{ min: 1 }}
              value={form.usuariosMaximos}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="password"
              label="Contraseña temporal"
              type="text"
              fullWidth
              required
              value={form.password}
              onChange={handleChange}
              helperText="La contraseña temporal será enviada al usuario principal."
            />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal para código de administrador */}
      <Dialog open={openAdminDialog} onClose={() => setOpenAdminDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Activar Administrador</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Ingresa el código de administrador para activar los permisos en tu cuenta.
          </Typography>
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Códigos disponibles:
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>AUDITORIA2024</strong> - Cliente Administrador (max)
            </Typography>
            <Typography variant="body2">
              • <strong>SUPERMAX2024</strong> - Developer (supermax)
            </Typography>
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="Código de Administrador"
            type="password"
            fullWidth
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            placeholder="Ingresa el código"
            helperText="Ingresa AUDITORIA2024 para Cliente Admin o SUPERMAX2024 para Developer"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdminDialog(false)}>Cancelar</Button>
          <Button onClick={activarAdminConCodigo} variant="contained">
            Activar
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3}>
        {/* Resumen de pagos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Resumen de Pagos</Typography>
            <Box sx={{ mt: 2 }}>
              <Card sx={{ mb: 2, bgcolor: '#e8f5e8' }}>
                <CardContent>
                  <Typography variant="h6" color="success.main">Pagos al Día</Typography>
                  <Typography variant="h4">{resumenPagos.alDia}</Typography>
                  <Typography variant="body2">Empresas con pagos actualizados</Typography>
                </CardContent>
              </Card>
              <Card sx={{ bgcolor: '#ffebee' }}>
                <CardContent>
                  <Typography variant="h6" color="error.main">Pagos Vencidos</Typography>
                  <Typography variant="h4">{resumenPagos.vencidos}</Typography>
                  <Typography variant="body2">Empresas con pagos pendientes</Typography>
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Grid>
        {/* Tabla de empresas/usuarios */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Empresas/Clientes</Typography>
                         {loadingEmpresas ? (
               <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                 <CircularProgress />
               </Box>
             ) : empresasReales.length === 0 ? (
               <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                 <Typography variant="body1" color="text.secondary">
                   No hay empresas disponibles para mostrar
                 </Typography>
               </Box>
             ) : (
               <TableContainer>
                 <Table size="small">
                   <TableHead>
                     <TableRow>
                       <TableCell>Nombre</TableCell>
                       <TableCell align="center">Usuarios (actual/máx)</TableCell>
                       <TableCell align="center">Estado de pago</TableCell>
                       <TableCell align="center">Vencimiento</TableCell>
                       <TableCell align="center">Acciones</TableCell>
                     </TableRow>
                   </TableHead>
                   <TableBody>
                     {empresasReales.map((empresa) => (
                       <TableRow key={empresa.id}>
                         <TableCell>{empresa.nombre}</TableCell>
                         <TableCell align="center">{empresa.usuariosActuales} / {empresa.usuariosMaximos}</TableCell>
                         <TableCell align="center">
                           <span style={{ color: empresa.estadoPago === 'al_dia' ? 'green' : 'red', fontWeight: 'bold' }}>
                             {empresa.estadoPago === 'al_dia' ? 'Al día' : 'Vencido'}
                           </span>
                         </TableCell>
                         <TableCell align="center">{empresa.fechaVencimiento}</TableCell>
                         <TableCell align="center">
                           <Button size="small" variant="outlined">Ver</Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </TableContainer>
             )}
          </Paper>
        </Grid>
      </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;
