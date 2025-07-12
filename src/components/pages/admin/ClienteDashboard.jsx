//src/components/pages/admin/ClienteDashboard.jsx
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
  Stack,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
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
  Delete,
  History,
  Visibility
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

function ClienteDashboard() {
  const { userProfile, role, permisos } = useContext(AuthContext);
  const [auditorias, setAuditorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
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

      {/* Pestañas */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ px: 2 }}>
          <Tabs value={currentTab} onChange={handleTabChange} centered>
            <Tab 
              icon={<CalendarToday />} 
              label="Calendario" 
              iconPosition="start"
            />
            <Tab 
              icon={<History />} 
              label="Historial" 
              iconPosition="start"
            />
          </Tabs>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{ 
              fontSize: '0.85rem',
              minWidth: 'auto',
              px: 2,
              borderRadius: '20px'
            }}
          >
            +
          </Button>
        </Box>
      </Paper>

      {/* Contenido de las pestañas */}
      {currentTab === 0 && (
        <Box>
          {/* Contenido principal */}
          <Grid container spacing={3}>
            {/* Lado izquierdo - Calendario */}
            <Grid item xs={12} lg={6}>
              <CalendarioAuditorias 
                auditorias={auditorias}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
              />
            </Grid>

            {/* Lado derecho - Auditorías del día */}
            <Grid item xs={12} lg={6}>
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday color="primary" />
                    Auditorías del {selectedDate ? selectedDate.toLocaleDateString() : 'día seleccionado'}
                  </Typography>
                  {selectedDate && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => setOpenDialog(true)}
                      sx={{ fontSize: '0.85rem' }}
                    >
                      Agendar
                    </Button>
                  )}
                </Box>
                {!selectedDate ? (
                  <Typography variant="body2" color="text.secondary">
                    Selecciona una fecha en el calendario para ver las auditorías
                  </Typography>
                ) : auditoriasDelDiaSeleccionado.length === 0 ? (
                  <Box textAlign="center" py={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No hay auditorías agendadas para este día
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<Add />}
                      onClick={() => setOpenDialog(true)}
                      sx={{ mt: 1 }}
                    >
                      Agendar Primera Auditoría
                    </Button>
                  </Box>
                ) : (
                  <List>
                    {auditoriasDelDiaSeleccionado.map((auditoria) => (
                      <ListItem key={auditoria.id} divider>
                        <ListItemText
                          primary={
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {auditoria.empresa}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body1" sx={{ mt: 1 }}>
                                <LocationOn sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                                {auditoria.sucursal || 'Casa Central'}
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 0.5 }}>
                                <Schedule sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                                {auditoria.hora}
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 0.5 }}>
                                <Description sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                                {auditoria.formulario}
                              </Typography>
                              {auditoria.descripcion && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                  "{auditoria.descripcion}"
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={1}>
                            {auditoria.estado === 'agendada' && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<CheckCircle />}
                                onClick={() => handleCompletarAuditoria(auditoria.id)}
                              >
                                Completar
                              </Button>
                            )}
                            <IconButton
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

              {/* Próximas auditorías */}
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule color="primary" />
                  Próximas Auditorías
                </Typography>
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
                        <ListItem key={auditoria.id} divider sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {auditoria.empresa}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(auditoria.fecha).toLocaleDateString()} • {auditoria.hora}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                  {auditoria.formulario}
                                </Typography>
                                {auditoria.sucursal && (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                    📍 {auditoria.sucursal}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <Chip 
                            label="Pendiente" 
                            size="small" 
                            color="warning" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </ListItem>
                      ))}
                  </List>
                )}
              </Paper>

              {/* Resumen general */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="primary" />
                  Resumen General
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={4}>
                    <Card sx={{ bgcolor: '#fff3e0', textAlign: 'center' }}>
                      <CardContent sx={{ py: 2 }}>
                        <Typography variant="h6" color="warning.main">
                          Pendientes
                        </Typography>
                        <Typography variant="h4">{auditoriasPendientes.length}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card sx={{ bgcolor: '#e8f5e8', textAlign: 'center' }}>
                      <CardContent sx={{ py: 2 }}>
                        <Typography variant="h6" color="success.main">
                          Completadas
                        </Typography>
                        <Typography variant="h4">{auditoriasCompletadas.length}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card sx={{ bgcolor: '#e3f2fd', textAlign: 'center' }}>
                      <CardContent sx={{ py: 2 }}>
                        <Typography variant="h6" color="info.main">
                          Este Mes
                        </Typography>
                        <Typography variant="h4">
                          {auditorias.filter(aud => {
                            const fecha = new Date(aud.fecha);
                            const ahora = new Date();
                            return fecha.getMonth() === ahora.getMonth() && 
                                   fecha.getFullYear() === ahora.getFullYear();
                          }).length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {currentTab === 1 && (
        <HistorialAuditorias auditorias={auditoriasCompletadas} />
      )}

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

export default ClienteDashboard; 