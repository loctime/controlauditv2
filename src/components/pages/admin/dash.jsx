//src/components/pages/admin/dash.jsx
// Dashboard para Clientes Administradores
import React, { useContext, useState, useEffect } from "react";
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Alert, 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Card, 
  CardContent,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from "@mui/material";
import { 
  CalendarToday, 
  Add, 
  CheckCircle, 
  Schedule, 
  Business, 
  LocationOn,
  Description,
  Edit,
  Delete
} from "@mui/icons-material";
import { AuthContext } from "../../context/AuthContext";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { toast } from 'react-toastify';

// Componente de Calendario Simple
const CalendarioAuditorias = ({ auditorias, onSelectDate, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    // Días del mes anterior para completar la primera semana
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getAuditoriasForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return auditorias.filter(auditoria => 
      auditoria.fecha === dateStr
    );
  };

  const handleDateClick = (date) => {
    if (date) {
      onSelectDate(date);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday color="primary" />
          Calendario de Auditorías
        </Typography>
        <Box>
          <IconButton onClick={prevMonth} size="small">
            <Typography variant="h6">‹</Typography>
          </IconButton>
          <Typography variant="h6" component="span" sx={{ mx: 2 }}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Typography>
          <IconButton onClick={nextMonth} size="small">
            <Typography variant="h6">›</Typography>
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={1}>
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <Grid item xs={12/7} key={day}>
            <Box sx={{ 
              p: 1, 
              textAlign: 'center', 
              fontWeight: 'bold',
              bgcolor: 'grey.100',
              borderRadius: 1
            }}>
              {day}
            </Box>
          </Grid>
        ))}
        
        {days.map((day, index) => {
          const auditoriasDelDia = getAuditoriasForDate(day);
          const isSelected = selectedDate && day && 
            day.toDateString() === selectedDate.toDateString();
          
          return (
            <Grid item xs={12/7} key={index}>
              <Box
                onClick={() => handleDateClick(day)}
                sx={{
                  p: 1,
                  minHeight: 60,
                  border: day ? '1px solid #e0e0e0' : 'none',
                  borderRadius: 1,
                  cursor: day ? 'pointer' : 'default',
                  bgcolor: isSelected ? 'primary.light' : 'transparent',
                  color: isSelected ? 'white' : 'inherit',
                  '&:hover': day ? {
                    bgcolor: isSelected ? 'primary.main' : 'grey.100'
                  } : {},
                  position: 'relative'
                }}
              >
                {day && (
                  <>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {day.getDate()}
                    </Typography>
                    {auditoriasDelDia.length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={`${auditoriasDelDia.length} auditoría${auditoriasDelDia.length > 1 ? 's' : ''}`}
                          size="small"
                          color={auditoriasDelDia.some(a => a.estado === 'completada') ? 'success' : 'warning'}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

// Componente para Agendar Auditoría
const AgendarAuditoriaDialog = ({ open, onClose, onSave, empresas, sucursales, formularios }) => {
  const [form, setForm] = useState({
    empresa: '',
    sucursal: '',
    formulario: '',
    fecha: '',
    hora: '',
    descripcion: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.empresa || !form.formulario || !form.fecha || !form.hora) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    onSave(form);
    setForm({ empresa: '', sucursal: '', formulario: '', fecha: '', hora: '', descripcion: '' });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Add color="primary" />
          Agendar Nueva Auditoría
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Empresa</InputLabel>
                <Select
                  name="empresa"
                  value={form.empresa}
                  onChange={handleChange}
                  label="Empresa"
                >
                  {empresas.map((empresa) => (
                    <MenuItem key={empresa.id} value={empresa.nombre}>
                      {empresa.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sucursal (Opcional)</InputLabel>
                <Select
                  name="sucursal"
                  value={form.sucursal}
                  onChange={handleChange}
                  label="Sucursal (Opcional)"
                >
                  <MenuItem value="">Casa Central</MenuItem>
                  {sucursales
                    .filter(sucursal => !form.empresa || sucursal.empresa === form.empresa)
                    .map((sucursal) => (
                      <MenuItem key={sucursal.id} value={sucursal.nombre}>
                        {sucursal.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Formulario</InputLabel>
                <Select
                  name="formulario"
                  value={form.formulario}
                  onChange={handleChange}
                  label="Formulario"
                >
                  {formularios.map((formulario) => (
                    <MenuItem key={formulario.id} value={formulario.nombre}>
                      {formulario.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                name="fecha"
                label="Fecha"
                type="date"
                value={form.fecha}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                name="hora"
                label="Hora"
                type="time"
                value={form.hora}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="descripcion"
                label="Descripción (Opcional)"
                multiline
                rows={3}
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Agregar notas o detalles sobre la auditoría..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">
            Agendar Auditoría
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

function Dashboard() {
  const { userProfile, role, permisos } = useContext(AuthContext);
  const [auditorias, setAuditorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar empresas
        const empresasSnapshot = await getDocs(collection(db, 'empresas'));
        const empresasData = empresasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmpresas(empresasData);

        // Cargar sucursales
        const sucursalesSnapshot = await getDocs(collection(db, 'sucursales'));
        const sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSucursales(sucursalesData);

        // Cargar formularios
        const formulariosSnapshot = await getDocs(collection(db, 'formularios'));
        const formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFormularios(formulariosData);

        // Cargar auditorías agendadas
        const auditoriasSnapshot = await getDocs(collection(db, 'auditorias_agendadas'));
        const auditoriasData = auditoriasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAuditorias(auditoriasData);
      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleAgendarAuditoria = async (formData) => {
    try {
      const nuevaAuditoria = {
        ...formData,
        fecha: formData.fecha,
        hora: formData.hora,
        estado: 'agendada',
        usuarioId: userProfile?.uid,
        usuarioNombre: userProfile?.displayName || userProfile?.email,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'auditorias_agendadas'), nuevaAuditoria);
      
      setAuditorias(prev => [...prev, { id: docRef.id, ...nuevaAuditoria }]);
      setOpenDialog(false);
      toast.success('Auditoría agendada exitosamente');
    } catch (error) {
      console.error('Error agendando auditoría:', error);
      toast.error('Error al agendar la auditoría');
    }
  };

  const handleCompletarAuditoria = async (auditoriaId) => {
    try {
      const auditoriaRef = doc(db, 'auditorias_agendadas', auditoriaId);
      await updateDoc(auditoriaRef, {
        estado: 'completada',
        fechaCompletada: serverTimestamp()
      });

      setAuditorias(prev => prev.map(aud => 
        aud.id === auditoriaId 
          ? { ...aud, estado: 'completada', fechaCompletada: new Date() }
          : aud
      ));
      toast.success('Auditoría marcada como completada');
    } catch (error) {
      console.error('Error completando auditoría:', error);
      toast.error('Error al marcar como completada');
    }
  };

  const handleEliminarAuditoria = async (auditoriaId) => {
    try {
      await deleteDoc(doc(db, 'auditorias_agendadas', auditoriaId));
      setAuditorias(prev => prev.filter(aud => aud.id !== auditoriaId));
      toast.success('Auditoría eliminada');
    } catch (error) {
      console.error('Error eliminando auditoría:', error);
      toast.error('Error al eliminar la auditoría');
    }
  };

  const auditoriasDelDiaSeleccionado = selectedDate 
    ? auditorias.filter(auditoria => auditoria.fecha === selectedDate.toISOString().split('T')[0])
    : [];

  const auditoriasPendientes = auditorias.filter(aud => aud.estado === 'agendada');
  const auditoriasCompletadas = auditorias.filter(aud => aud.estado === 'completada');

  // Solo clientes administradores pueden ver este dashboard
  if (role !== 'max') {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" color="error">
          Acceso denegado: Solo los clientes administradores pueden ver este Dashboard.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Cargando dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Business color="primary" />
        Dashboard de Auditorías
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          sx={{ mb: 2 }}
        >
          Agendar Nueva Auditoría
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Calendario */}
        <Grid item xs={12} lg={8}>
          <CalendarioAuditorias 
            auditorias={auditorias}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
        </Grid>

        {/* Panel lateral */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Resumen */}
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Resumen</Typography>
              <Box sx={{ mt: 2 }}>
                <Card sx={{ mb: 2, bgcolor: '#fff3e0' }}>
                  <CardContent>
                    <Typography variant="h6" color="warning.main">
                      Pendientes
                    </Typography>
                    <Typography variant="h4">{auditoriasPendientes.length}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ bgcolor: '#e8f5e8' }}>
                  <CardContent>
                    <Typography variant="h6" color="success.main">
                      Completadas
                    </Typography>
                    <Typography variant="h4">{auditoriasCompletadas.length}</Typography>
                  </CardContent>
                </Card>
              </Box>
            </Paper>

            {/* Auditorías del día seleccionado */}
            {selectedDate && (
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Auditorías del {selectedDate.toLocaleDateString()}
                </Typography>
                {auditoriasDelDiaSeleccionado.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No hay auditorías agendadas para este día
                  </Typography>
                ) : (
                  <List dense>
                    {auditoriasDelDiaSeleccionado.map((auditoria) => (
                      <ListItem key={auditoria.id} divider>
                        <ListItemText
                          primary={auditoria.empresa}
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {auditoria.sucursal || 'Casa Central'} • {auditoria.hora}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {auditoria.formulario}
                              </Typography>
                              {auditoria.descripcion && (
                                <Typography variant="body2" color="text.secondary">
                                  {auditoria.descripcion}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={1}>
                            {auditoria.estado === 'agendada' && (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleCompletarAuditoria(auditoria.id)}
                                title="Marcar como completada"
                              >
                                <CheckCircle />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleEliminarAuditoria(auditoria.id)}
                              title="Eliminar"
                            >
                              <Delete />
                            </IconButton>
                          </Stack>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            )}

            {/* Próximas auditorías */}
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Próximas Auditorías</Typography>
              {auditoriasPendientes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No hay auditorías pendientes
                </Typography>
              ) : (
                <List dense>
                  {auditoriasPendientes
                    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                    .slice(0, 5)
                    .map((auditoria) => (
                      <ListItem key={auditoria.id} divider>
                        <ListItemText
                          primary={auditoria.empresa}
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {new Date(auditoria.fecha).toLocaleDateString()} • {auditoria.hora}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {auditoria.formulario}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip 
                          label="Pendiente" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      </ListItem>
                    ))}
                </List>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Dialog para agendar auditoría */}
      <AgendarAuditoriaDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handleAgendarAuditoria}
        empresas={empresas}
        sucursales={sucursales}
        formularios={formularios}
      />
    </Box>
  );
}

export default Dashboard;
