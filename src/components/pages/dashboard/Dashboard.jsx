// src/pages/Dashboard.jsx
import React, { useContext, useState } from "react";
import { Typography, Box, Grid, Paper, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { AuthContext } from "../../context/AuthContext";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { collection, addDoc, setDoc, doc } from "firebase/firestore";


import { db, signUp} from "../../../firebaseConfig";


const empresasEjemplo = [
  {
    id: 'empresa1',
    nombre: 'Empresa Ejemplo',
    sociosActuales: 4,
    sociosMaximos: 10,
    estadoPago: 'al_dia',
    fechaVencimiento: '2024-07-01',
  },
  {
    id: 'empresa2',
    nombre: 'Empresa XYZ',
    sociosActuales: 12,
    sociosMaximos: 10,
    estadoPago: 'vencido',
    fechaVencimiento: '2024-06-10',
  },
];

function Dashboard() {
  const { userProfile } = useContext(AuthContext);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', sociosMaximos: 1, password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
      // 1. Crear usuario principal en Auth
      const password = form.password || 'Cambiar123!'; // Puedes pedir la contraseña o generar una temporal
      const userRes = await signUp({ email: form.email, password });
      const user = userRes.user;
      // 2. Crear empresa en Firestore
      const empresaRef = await addDoc(collection(db, 'empresas'), {
        nombre: form.nombre,
        emailContacto: form.email,
        sociosMaximos: Number(form.sociosMaximos),
        sociosActuales: 1,
        usuarios: [user.uid],
        estadoPago: 'al_dia',
        fechaUltimoPago: new Date(),
        fechaVencimiento: null,
        plan: 'estandar',
      });
      // 3. Crear usuario principal en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nombre: form.nombre,
        email: form.email,
        empresaId: empresaRef.id,
        role: 'max',
        permisos: {
          puedeAgregarEmpresas: true,
          puedeAgregarFormularios: true,
          puedeHacerAuditorias: true
        }
      });
      setOpenDialog(false);
      setForm({ nombre: '', email: '', sociosMaximos: 1, password: '' });
      alert('Empresa y usuario principal creados correctamente.');
    } catch (err) {
      setError(err.message || 'Error al crear empresa y usuario.');
    } finally {
      setLoading(false);
    }
  };

  // Si el usuario es dueño del sistema (rol maxdigfer)
  if (userProfile?.role === "maxdigfer") {
    return (
      <Box sx={{ padding: 4 }}>
        <Typography variant="h4" gutterBottom>Dashboard Dueño del Sistema</Typography>
        <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handleOpenDialog}>
          Agregar Empresa / Usuario Principal
        </Button>
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Agregar Empresa y Usuario Principal</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                name="nombre"
                label="Nombre de la Empresa"
                type="text"
                fullWidth
                required
                value={form.nombre}
                onChange={handleChange}
              />
              <TextField
                margin="dense"
                name="email"
                label="Email del Usuario Principal"
                type="email"
                fullWidth
                required
                value={form.email}
                onChange={handleChange}
              />
              <TextField
                margin="dense"
                name="sociosMaximos"
                label="Límite de Usuarios (Socios)"
                type="number"
                fullWidth
                required
                inputProps={{ min: 1 }}
                value={form.sociosMaximos}
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
        <Grid container spacing={3}>
          {/* Calendario de pagos */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Calendario de Pagos</Typography>
              <Box sx={{ height: 400 }}>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  height={350}
                  events={[
                    { title: 'Pago Empresa Ejemplo', date: '2024-06-10', color: '#4caf50' },
                    { title: 'Vencimiento Empresa XYZ', date: '2024-06-15', color: '#f44336' }
                  ]}
                />
              </Box>
            </Paper>
          </Grid>
          {/* Tabla de empresas/usuarios */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Empresas/Clientes</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell align="center">Socios (actual/máx)</TableCell>
                      <TableCell align="center">Estado de pago</TableCell>
                      <TableCell align="center">Vencimiento</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {empresasEjemplo.map((empresa) => (
                      <TableRow key={empresa.id}>
                        <TableCell>{empresa.nombre}</TableCell>
                        <TableCell align="center">{empresa.sociosActuales} / {empresa.sociosMaximos}</TableCell>
                        <TableCell align="center">
                          <span style={{ color: empresa.estadoPago === 'al_dia' ? 'green' : 'red', fontWeight: 'bold' }}>
                            {empresa.estadoPago === 'al_dia' ? 'Al día' : 'Vencido'}
                          </span>
                        </TableCell>
                        <TableCell align="center">{empresa.fechaVencimiento}</TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined" color="primary" sx={{ mr: 1 }}>Editar socios</Button>
                          <Button size="small" variant="contained" color="success">Registrar pago</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          {/* Alertas */}
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              (Aquí irán las alertas de morosidad y vencimientos)
            </Alert>
          </Grid>
          {/* Controles */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Controles de Socios y Pagos</Typography>
              <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'gray' }}>
                (Aquí irán los formularios para asignar límite de socios y registrar pagos)
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Dashboard normal para otros roles
  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4">Bienvenido al Dashboard</Typography>
      <Typography variant="body1" sx={{ marginTop: 2 }}>
        Aquí puedes navegar y acceder a todas las funcionalidades de la aplicación.
      </Typography>
    </Box>
  );
}

export default Dashboard;
