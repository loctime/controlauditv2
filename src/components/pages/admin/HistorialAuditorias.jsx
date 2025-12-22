//src/components/pages/admin/HistorialAuditorias.jsx
import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Stack
} from "@mui/material";
import {
  Visibility,
  CheckCircle,
  Schedule,
  Business,
  LocationOn,
  Description,
  CalendarToday
} from "@mui/icons-material";
import { getDocs, query, where, orderBy } from "firebase/firestore";
import { auditUserCollection } from "../../../firebaseControlFile";
import { toast } from 'react-toastify';
import { useAuth } from "../../context/AuthContext";

const HistorialAuditorias = () => {
  const { userProfile } = useAuth();
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuditoria, setSelectedAuditoria] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  useEffect(() => {
    cargarAuditorias();
  }, [userProfile]);

  const cargarAuditorias = async () => {
    try {
      setLoading(true);
      
      if (!userProfile?.uid) {
        setAuditorias([]);
        return;
      }

      // Leer desde estructura multi-tenant: apps/auditoria/users/{uid}/auditorias_agendadas
      const auditoriasRef = auditUserCollection(userProfile.uid, 'auditorias_agendadas');
      const q = query(
        auditoriasRef,
        where('estado', '==', 'completada'),
        orderBy('fechaCompletada', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const auditoriasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAuditorias(auditoriasData);
      
      console.log('[DEBUG] Historial cargado desde multi-tenant:', {
        total: auditoriasData.length,
        userId: userProfile.uid
      });
      
    } catch (error) {
      console.error('Error cargando auditorías:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const auditoriasFiltradas = auditorias.filter(auditoria => {
    const cumpleEmpresa = !filtroEmpresa || 
      auditoria.empresa.toLowerCase().includes(filtroEmpresa.toLowerCase());
    const cumpleFecha = !filtroFecha || auditoria.fecha === filtroFecha;
    return cumpleEmpresa && cumpleFecha;
  });

  const handleVerDetalles = (auditoria) => {
    setSelectedAuditoria(auditoria);
    setOpenDialog(true);
  };

  const getEstadisticas = () => {
    const total = auditorias.length;
    const esteMes = auditorias.filter(aud => {
      const fecha = new Date(aud.fecha);
      const ahora = new Date();
      return fecha.getMonth() === ahora.getMonth() && 
             fecha.getFullYear() === ahora.getFullYear();
    }).length;
    
    const empresasUnicas = new Set(auditorias.map(aud => aud.empresa)).size;
    
    return { total, esteMes, empresasUnicas };
  };

  const estadisticas = getEstadisticas();

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Cargando historial...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CheckCircle color="primary" />
        Historial de Auditorías Completadas
      </Typography>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e8f5e8' }}>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Total Completadas
              </Typography>
              <Typography variant="h4">{estadisticas.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Este Mes
              </Typography>
              <Typography variant="h4">{estadisticas.esteMes}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" color="info.main">
                Empresas Auditadas
              </Typography>
              <Typography variant="h4">{estadisticas.empresasUnicas}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filtros</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Filtrar por empresa"
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              placeholder="Nombre de la empresa..."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Filtrar por fecha"
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de auditorías */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Auditorías Completadas ({auditoriasFiltradas.length})
        </Typography>
        
        {auditoriasFiltradas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No hay auditorías completadas para mostrar
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empresa</TableCell>
                  <TableCell>Sucursal</TableCell>
                  <TableCell>Formulario</TableCell>
                  <TableCell>Fecha Programada</TableCell>
                  <TableCell>Fecha Completada</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditoriasFiltradas.map((auditoria) => (
                  <TableRow key={auditoria.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Business color="primary" />
                        {auditoria.empresa}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn color="secondary" />
                        {auditoria.sucursal || 'Casa Central'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Description color="info" />
                        {auditoria.formulario}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarToday color="action" />
                        {new Date(auditoria.fecha).toLocaleDateString()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CheckCircle color="success" />
                        {auditoria.fechaCompletada 
                          ? new Date(auditoria.fechaCompletada.seconds * 1000).toLocaleDateString()
                          : 'N/A'
                        }
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleVerDetalles(auditoria)}
                        title="Ver detalles"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog de detalles */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Visibility color="primary" />
            Detalles de la Auditoría
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAuditoria && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Empresa</Typography>
                  <Typography variant="body1">{selectedAuditoria.empresa}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Sucursal</Typography>
                  <Typography variant="body1">
                    {selectedAuditoria.sucursal || 'Casa Central'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Formulario</Typography>
                  <Typography variant="body1">{selectedAuditoria.formulario}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Hora Programada</Typography>
                  <Typography variant="body1">{selectedAuditoria.hora}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Fecha Programada</Typography>
                  <Typography variant="body1">
                    {new Date(selectedAuditoria.fecha).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Fecha Completada</Typography>
                  <Typography variant="body1">
                    {selectedAuditoria.fechaCompletada 
                      ? new Date(selectedAuditoria.fechaCompletada.seconds * 1000).toLocaleDateString()
                      : 'N/A'
                    }
                  </Typography>
                </Grid>
                {selectedAuditoria.descripcion && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary">Descripción</Typography>
                    <Typography variant="body1">{selectedAuditoria.descripcion}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Usuario</Typography>
                  <Typography variant="body1">{selectedAuditoria.usuarioNombre}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Estado</Typography>
                  <Chip 
                    label="Completada" 
                    color="success" 
                    icon={<CheckCircle />}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HistorialAuditorias; 