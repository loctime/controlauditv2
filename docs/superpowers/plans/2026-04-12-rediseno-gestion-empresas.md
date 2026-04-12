# Rediseño Gestión de Empresas y Sucursales — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar las tablas de empresas y sucursales por un sistema de cards expandibles limpio, manteniendo toda la lógica de datos, modales y navegación intacta.

**Architecture:** Se crean dos nuevos componentes (`EmpresaCard`, `SucursalCard`) que reemplazan `EmpresaRow` y `SucursalRow`. `EstablecimientosContainer` pasa de renderizar un `TableContainer` a una lista de `EmpresaCard`. `SucursalesTab` pasa de renderizar una tabla a una lista de `SucursalCard`. `EmpresasHeader` se simplifica eliminando el botón de Accidentes y el texto de instrucción.

**Tech Stack:** React 18, MUI v5 (Card, Box, Collapse, IconButton, Tooltip, Typography, Paper, CircularProgress), react-router-dom, hooks/servicios existentes sin modificar.

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|---|---|---|
| **Crear** | `components/EmpresaCard.jsx` | Card principal empresa: avatar, nombre, stats, expand/collapse, acciones |
| **Crear** | `components/SucursalCard.jsx` | Card interna sucursal: nombre, dirección, stats navegables, editar/eliminar |
| **Modificar** | `components/EmpresasHeader.jsx` | Quitar botón Accidentes; simplificar título |
| **Modificar** | `tabs/SucursalesTab.jsx` | Reemplazar TableContainer por lista de SucursalCard; eliminar sub-expansión |
| **Modificar** | `EstablecimientosContainer.jsx` | Reemplazar TableContainer+EmpresaRow por lista de EmpresaCard; limpiar estado |
| **Sin tocar** | `hooks/*`, `services/*`, todos los modales, tabs de contenido | Lógica de datos y navegación intacta |

---

## Task 1: Crear `EmpresaCard.jsx`

**Files:**
- Create: `src/components/pages/establecimiento/components/EmpresaCard.jsx`

Este componente reemplaza `EmpresaRow`. Recibe las mismas props que recibía `EmpresaRow` más `children` (contenido expandido = `SucursalesTab`).

- [ ] **Step 1: Crear el archivo `EmpresaCard.jsx`**

```jsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Typography,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BusinessIcon from '@mui/icons-material/Business';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { getUserDisplayName } from '../../../../utils/userDisplayNames';

const EmpresaCard = React.memo(({
  empresa,
  stats,
  isExpanded,
  onToggleRow,
  formatearEmail,
  ownerEmail = '',
  effectiveOwnerId = null,
  onEditClick,
  onOperariosClick,
  EliminarEmpresaComponent,
  canEditEmpresa = false,
  canDeleteEmpresa = false,
  canManageOperarios = false,
  children
}) => {
  const theme = useTheme();

  const ownerLabel = (() => {
    if (empresa?.propietarioEmail) return formatearEmail(empresa.propietarioEmail);
    if (ownerEmail && effectiveOwnerId && empresa?.ownerId && String(empresa.ownerId) === String(effectiveOwnerId)) {
      return formatearEmail(ownerEmail);
    }
    return 'N/A';
  })();

  const fechaCreacion = empresa.createdAt
    ? new Date(empresa.createdAt.toDate ? empresa.createdAt.toDate() : empresa.createdAt).toLocaleDateString()
    : 'N/A';

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 3,
        boxShadow: isExpanded ? 3 : 1,
        transition: 'box-shadow 0.2s',
        overflow: 'visible'
      }}
    >
      {/* Fila principal siempre visible */}
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 2,
          '&:last-child': { pb: 2 }
        }}
      >
        {/* Avatar / Logo */}
        {empresa.logo && typeof empresa.logo === 'string' && empresa.logo.trim() !== '' ? (
          <img
            src={empresa.logo}
            alt="Logo de la empresa"
            style={{
              width: 44,
              height: 44,
              objectFit: 'contain',
              borderRadius: 8,
              border: '1px solid #eee',
              flexShrink: 0
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Box
            sx={{
              width: 44,
              height: 44,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 700,
              color: theme.palette.primary.main,
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
              flexShrink: 0
            }}
          >
            {empresa.nombre.charAt(0).toUpperCase()}
          </Box>
        )}

        {/* Nombre + propietario + fecha */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {empresa.nombre}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {ownerLabel} · {fechaCreacion}
          </Typography>
        </Box>

        {/* Stats resumidas */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <StorefrontIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {stats.sucursales}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {stats.empleados}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ReportProblemIcon
              sx={{
                fontSize: 16,
                color: stats.accidentesAbiertos > 0 ? 'error.main' : 'text.secondary'
              }}
            />
            <Typography
              variant="body2"
              color={stats.accidentesAbiertos > 0 ? 'error.main' : 'text.secondary'}
            >
              {stats.accidentes}
            </Typography>
          </Box>
        </Box>

        {/* Acciones: editar, operarios, eliminar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {canEditEmpresa && (
            <Tooltip title="Editar empresa">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => { e.stopPropagation(); onEditClick(empresa); }}
                aria-label={`Editar empresa ${empresa.nombre}`}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canManageOperarios && onOperariosClick && (
            <Tooltip title={`Gestionar ${getUserDisplayName('default').toLowerCase()}s`}>
              <IconButton
                size="small"
                color="info"
                onClick={(e) => { e.stopPropagation(); onOperariosClick(empresa); }}
                aria-label={`Gestionar operarios de ${empresa.nombre}`}
              >
                <PersonAddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDeleteEmpresa && EliminarEmpresaComponent && (
            <Box onClick={(e) => e.stopPropagation()}>
              <EliminarEmpresaComponent empresa={empresa} onEmpresaEliminada={() => {}} />
            </Box>
          )}

          {/* Flecha expandir */}
          <Tooltip title={isExpanded ? 'Ocultar sucursales' : 'Ver sucursales'}>
            <IconButton
              size="small"
              onClick={() => onToggleRow(empresa.id)}
              aria-label={isExpanded ? `Ocultar detalles de ${empresa.nombre}` : `Mostrar detalles de ${empresa.nombre}`}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>

      {/* Contenido expandido (SucursalesTab) */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            backgroundColor: 'grey.50',
            borderTop: `1px solid ${theme.palette.divider}`,
            p: 2
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Card>
  );
});

EmpresaCard.displayName = 'EmpresaCard';

export default EmpresaCard;
```

- [ ] **Step 2: Verificar que el archivo se guardó correctamente**

```bash
ls src/components/pages/establecimiento/components/EmpresaCard.jsx
```

Esperado: el archivo existe sin error.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/establecimiento/components/EmpresaCard.jsx
git commit -m "feat: add EmpresaCard component replacing EmpresaRow table row"
```

---

## Task 2: Crear `SucursalCard.jsx`

**Files:**
- Create: `src/components/pages/establecimiento/components/SucursalCard.jsx`

Este componente reemplaza `SucursalRow`. Muestra nombre, dirección, stats navegables y botones editar/eliminar. Sin sub-expansión.

- [ ] **Step 1: Crear el archivo `SucursalCard.jsx`**

```jsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Tooltip,
  useTheme
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SucursalCard = React.memo(({
  sucursal,
  stats,
  onEdit,
  onDelete,
  navigateToPage,
  empresaId
}) => {
  const theme = useTheme();

  const handleNavEmpleados = () => {
    localStorage.setItem('selectedSucursal', sucursal.id);
    navigateToPage('/empleados', sucursal.id);
  };

  const handleNavCapacitaciones = () => {
    localStorage.setItem('selectedSucursal', sucursal.id);
    navigateToPage('/capacitaciones', sucursal.id);
  };

  const handleNavAccidentes = () => {
    navigateToPage('/accidentes', { empresaId, sucursalId: sucursal.id });
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderRadius: 2,
        backgroundColor: 'white',
        boxShadow: 0
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 1.5,
          '&:last-child': { pb: 1.5 }
        }}
      >
        {/* Nombre + dirección */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {sucursal.nombre}
          </Typography>
          {sucursal.direccion && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {sucursal.direccion}
            </Typography>
          )}
        </Box>

        {/* Stats navegables */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
          <Tooltip title={`${stats.empleados} empleado(s) — ir a módulo`}>
            <Box
              onClick={handleNavEmpleados}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { color: theme.palette.primary.main }
              }}
            >
              <PeopleIcon sx={{ fontSize: 15, color: 'inherit' }} />
              <Typography variant="body2">{stats.empleados}</Typography>
            </Box>
          </Tooltip>

          <Tooltip title={`${stats.capacitaciones} capacitación(es) — ir a módulo`}>
            <Box
              onClick={handleNavCapacitaciones}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { color: theme.palette.secondary.main }
              }}
            >
              <SchoolIcon sx={{ fontSize: 15, color: 'inherit' }} />
              <Typography variant="body2">{stats.capacitaciones}</Typography>
            </Box>
          </Tooltip>

          <Tooltip title={`${stats.accidentes} accidente(s) — ir a módulo`}>
            <Box
              onClick={handleNavAccidentes}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                color: stats.accidentesAbiertos > 0 ? 'error.main' : 'inherit',
                '&:hover': { color: theme.palette.error.main }
              }}
            >
              <ReportProblemIcon sx={{ fontSize: 15, color: 'inherit' }} />
              <Typography variant="body2" color="inherit">{stats.accidentes}</Typography>
            </Box>
          </Tooltip>
        </Box>

        {/* Acciones */}
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Tooltip title="Editar sucursal">
            <IconButton
              size="small"
              color="primary"
              onClick={() => onEdit(sucursal)}
              aria-label={`Editar sucursal ${sucursal.nombre}`}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar sucursal">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(sucursal)}
              aria-label={`Eliminar sucursal ${sucursal.nombre}`}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
});

SucursalCard.displayName = 'SucursalCard';

export default SucursalCard;
```

- [ ] **Step 2: Verificar que el archivo se guardó correctamente**

```bash
ls src/components/pages/establecimiento/components/SucursalCard.jsx
```

Esperado: el archivo existe sin error.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/establecimiento/components/SucursalCard.jsx
git commit -m "feat: add SucursalCard component replacing SucursalRow table row"
```

---

## Task 3: Simplificar `EmpresasHeader.jsx`

**Files:**
- Modify: `src/components/pages/establecimiento/components/EmpresasHeader.jsx`

Cambios: eliminar botón "Accidentes" y la prop `onNavigateToAccidentes`. Simplificar título a `"Empresas (N)"` sin ícono grande. Mantener "Verificar" y "+ Agregar Empresa".

- [ ] **Step 1: Reemplazar el contenido de `EmpresasHeader.jsx`**

```jsx
import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';

/**
 * Header de gestión de empresas — versión simplificada
 */
const EmpresasHeader = React.memo(({
  totalEmpresas,
  isSmallMobile,
  onVerificar,
  verificando,
  onAddEmpresa,
  canCreateEmpresa = false
}) => (
  <Box sx={{
    display: 'flex',
    flexDirection: isSmallMobile ? 'column' : 'row',
    alignItems: isSmallMobile ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    mb: 3,
    gap: 2
  }}>
    <Typography
      variant={isSmallMobile ? 'h5' : 'h4'}
      component="h1"
      sx={{ fontWeight: 700, color: 'text.primary' }}
    >
      Empresas ({totalEmpresas || 0})
    </Typography>

    <Box sx={{
      display: 'flex',
      gap: 1,
      flexWrap: 'wrap',
      justifyContent: isSmallMobile ? 'flex-start' : 'flex-end'
    }}>
      <Button
        variant="outlined"
        onClick={onVerificar}
        disabled={verificando}
        startIcon={verificando ? <CircularProgress size={16} /> : null}
        size={isSmallMobile ? 'small' : 'medium'}
      >
        {verificando ? 'Verificando...' : 'Verificar'}
      </Button>

      {canCreateEmpresa && (
        <Button
          variant="contained"
          onClick={onAddEmpresa}
          size={isSmallMobile ? 'small' : 'medium'}
        >
          + Agregar empresa
        </Button>
      )}
    </Box>
  </Box>
));

EmpresasHeader.displayName = 'EmpresasHeader';

export default EmpresasHeader;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pages/establecimiento/components/EmpresasHeader.jsx
git commit -m "feat: simplify EmpresasHeader - remove Accidentes button and instruction text"
```

---

## Task 4: Refactorizar `SucursalesTab.jsx`

**Files:**
- Modify: `src/components/pages/establecimiento/tabs/SucursalesTab.jsx`

Cambios:
- Reemplazar `TableContainer` / `Table` / `SucursalRow` por lista de `SucursalCard`
- Agregar header de sección con label "SUCURSALES" y botón "+ Agregar sucursal"
- Eliminar estado `expandedRows`, `activeTabPerSucursal`, `toggleRow`, `getActiveTab`, `renderExpandedContent`
- Eliminar imports de: `EmpleadosContent`, `CapacitacionesContent`, `AccidentesContent`, `AccionesRequeridas`, `SucursalTableHeader`, `SucursalRow`, `Table`, `TableBody`, `TableContainer`
- Agregar import de `SucursalCard`
- Mantener intacto: `loadSucursales`, `handleSubmit`, `handleDeleteSucursal`, `handleOpenCreateModal`, `handleOpenEditModal`, `navigateToPage`, `SucursalFormModal`

- [ ] **Step 1: Reemplazar el contenido de `SucursalesTab.jsx`**

```jsx
import logger from '@/utils/logger';
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  useTheme
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { registrarAccionSistema } from '../../../../utils/firestoreUtils';
import { calcularProgresoTargets } from '../../../../utils/sucursalTargetUtils';
import { useSucursalesStats } from '../hooks/useSucursalesStats';
import SucursalCard from '../components/SucursalCard';
import SucursalFormModal from '../components/SucursalFormModal';
import { sucursalService } from '../../../../services/sucursalService';

const SucursalesTab = ({ empresaId, empresaNombre, userEmpresas, loadEmpresasStats }) => {
  const { userProfile, getEffectiveOwnerId } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { sucursalesStats, loadSucursalesStats } = useSucursalesStats();

  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetsProgreso, setTargetsProgreso] = useState({});

  // Estado del modal unificado
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [sucursalForm, setSucursalForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    horasSemanales: 40,
    targetMensual: 0,
    targetAnualAuditorias: 12,
    targetMensualCapacitaciones: 1,
    targetAnualCapacitaciones: 12
  });

  const reloadSucursalesStats = async () => {
    if (sucursales && sucursales.length > 0 && userProfile?.ownerId) {
      await loadSucursalesStats(sucursales, userProfile.ownerId);
    }
  };

  useEffect(() => {
    if (empresaId) {
      loadSucursales();
    }
  }, [empresaId]);

  const loadSucursales = async () => {
    setLoading(true);
    try {
      const ownerId = getEffectiveOwnerId ? getEffectiveOwnerId() : userProfile?.ownerId;
      if (!ownerId) {
        logger.error('Error: ownerId efectivo es requerido');
        return;
      }
      const sucursalesData = await sucursalService.listByEmpresa(ownerId, empresaId);
      setSucursales(sucursalesData);
      await loadSucursalesStats(sucursalesData, ownerId);
      const progresos = await calcularProgresoTargets(sucursalesData);
      setTargetsProgreso(progresos);
    } catch (error) {
      logger.error('Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToPage = (page, data) => {
    if (typeof data === 'string') {
      logger.debug('Navegando a:', page, 'con sucursalId:', data);
      localStorage.setItem('selectedSucursal', data);
      navigate(page);
    } else if (typeof data === 'object') {
      logger.debug('Navegando a:', page, 'con empresaId:', data.empresaId, 'y sucursalId:', data.sucursalId);
      navigate(page, { state: { empresaId: data.empresaId, sucursalId: data.sucursalId } });
    } else {
      navigate(page);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSucursalForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setSucursalForm({
      nombre: '',
      direccion: '',
      telefono: '',
      horasSemanales: 40,
      targetMensual: 0,
      targetAnualAuditorias: 12,
      targetMensualCapacitaciones: 1,
      targetAnualCapacitaciones: 12
    });
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setModalMode('create');
    setOpenModal(true);
  };

  const handleOpenEditModal = (sucursal) => {
    setSucursalForm({
      id: sucursal.id,
      nombre: sucursal.nombre,
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      horasSemanales: sucursal.horasSemanales || 40,
      targetMensual: sucursal.targetMensual || 0,
      targetAnualAuditorias: sucursal.targetAnualAuditorias || 12,
      targetMensualCapacitaciones: sucursal.targetMensualCapacitaciones || 1,
      targetAnualCapacitaciones: sucursal.targetAnualCapacitaciones || 12
    });
    setModalMode('edit');
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    if (!sucursalForm.nombre.trim()) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'El nombre de la sucursal es requerido' });
      return;
    }

    try {
      const ownerId = getEffectiveOwnerId ? getEffectiveOwnerId() : userProfile?.ownerId;
      if (!ownerId) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'ownerId no disponible' });
        return;
      }
      const actor = { uid: userProfile?.uid || null, role: userProfile?.role || null };

      if (modalMode === 'create') {
        await sucursalService.crearSucursalCompleta(ownerId, { ...sucursalForm, empresaId }, actor);
        Swal.fire({ icon: 'success', title: 'Éxito', text: 'Sucursal creada exitosamente' });
      } else {
        await sucursalService.updateSucursal(ownerId, sucursalForm.id, {
          nombre: sucursalForm.nombre,
          direccion: sucursalForm.direccion,
          telefono: sucursalForm.telefono,
          horasSemanales: parseInt(sucursalForm.horasSemanales),
          targetMensual: parseInt(sucursalForm.targetMensual) || 0,
          targetAnualAuditorias: parseInt(sucursalForm.targetAnualAuditorias) || 12,
          targetMensualCapacitaciones: parseInt(sucursalForm.targetMensualCapacitaciones) || 1,
          targetAnualCapacitaciones: parseInt(sucursalForm.targetAnualCapacitaciones) || 12
        }, actor);

        await registrarAccionSistema(
          ownerId,
          `Sucursal actualizada: ${sucursalForm.nombre}`,
          {
            sucursalId: sucursalForm.id,
            nombre: sucursalForm.nombre,
            cambios: {
              direccion: sucursalForm.direccion,
              telefono: sucursalForm.telefono,
              horasSemanales: sucursalForm.horasSemanales
            }
          },
          'editar',
          'sucursal',
          sucursalForm.id
        );

        Swal.fire({ icon: 'success', title: 'Éxito', text: 'Sucursal actualizada exitosamente' });
      }

      setOpenModal(false);
      resetForm();
      await loadSucursales();

      if (typeof loadEmpresasStats === 'function' && ownerId) {
        const ownerId2 = getEffectiveOwnerId ? getEffectiveOwnerId() : userProfile?.ownerId;
        loadEmpresasStats(userEmpresas, ownerId2);
      }
    } catch (error) {
      logger.error(`Error ${modalMode === 'create' ? 'creando' : 'actualizando'} sucursal:`, error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al ${modalMode === 'create' ? 'crear' : 'actualizar'} la sucursal: ${error.message}`
      });
    }
  };

  const handleDeleteSucursal = async (sucursal) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar la sucursal "${sucursal.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: theme.palette.error.main,
      cancelButtonColor: theme.palette.primary.main,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const ownerId = getEffectiveOwnerId ? getEffectiveOwnerId() : userProfile?.ownerId;
        if (!ownerId) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'ownerId no disponible' });
          return;
        }

        const empleadosCount = await sucursalService.countEmpleadosBySucursal(ownerId, sucursal.id);
        if (empleadosCount > 0) {
          Swal.fire({
            icon: 'error',
            title: 'No se puede eliminar',
            text: `La sucursal "${sucursal.nombre}" tiene ${empleadosCount} empleado(s) asociado(s). Elimina primero los empleados.`
          });
          return;
        }

        await sucursalService.deleteSucursal(ownerId, sucursal.id, { uid: userProfile?.uid || null, role: userProfile?.role || null });

        await registrarAccionSistema(
          ownerId,
          `Sucursal eliminada: ${sucursal.nombre}`,
          { sucursalId: sucursal.id, nombre: sucursal.nombre, empresaId },
          'eliminar',
          'sucursal',
          sucursal.id
        );

        await loadSucursales();

        if (typeof loadEmpresasStats === 'function') {
          loadEmpresasStats(userEmpresas, ownerId);
        }

        Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Sucursal eliminada exitosamente' });
      } catch (error) {
        logger.error('Error eliminando sucursal:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error al eliminar la sucursal: ' + error.message });
      }
    }
  };

  return (
    <Box>
      {/* Header de sección */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.secondary', textTransform: 'uppercase' }}>
          Sucursales
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleOpenCreateModal}
        >
          + Agregar sucursal
        </Button>
      </Box>

      {/* Estados: loading / vacío / lista */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : sucursales.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No hay sucursales registradas para esta empresa
          </Typography>
        </Box>
      ) : (
        <Box>
          {sucursales.map((sucursal) => {
            const stats = sucursalesStats[sucursal.id] || {
              empleados: 0,
              capacitaciones: 0,
              capacitacionesCompletadas: 0,
              accidentes: 0,
              accidentesAbiertos: 0,
              accionesRequeridas: 0
            };

            return (
              <SucursalCard
                key={sucursal.id}
                sucursal={sucursal}
                stats={stats}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteSucursal}
                navigateToPage={navigateToPage}
                empresaId={empresaId}
              />
            );
          })}
        </Box>
      )}

      {/* Modal unificado crear/editar */}
      <SucursalFormModal
        open={openModal}
        onClose={() => { setOpenModal(false); resetForm(); }}
        formData={sucursalForm}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        isEditing={modalMode === 'edit'}
      />
    </Box>
  );
};

export default SucursalesTab;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pages/establecimiento/tabs/SucursalesTab.jsx
git commit -m "feat: refactor SucursalesTab to use SucursalCard instead of table"
```

---

## Task 5: Refactorizar `EstablecimientosContainer.jsx`

**Files:**
- Modify: `src/components/pages/establecimiento/EstablecimientosContainer.jsx`

Cambios:
- Reemplazar `TableContainer`/`Table`/`EmpresaRow` por lista de `EmpresaCard`
- Eliminar: `activeTabPerEmpresa`, `setActiveTab`, `getActiveTab`, imports de `Table*`, `Collapse`, `EmpresaTableHeader`, `EmpresaRow`, `EmpresaStats`
- Eliminar: el `Typography` de instrucción "Haz clic en la flecha..."
- Eliminar: tabs condicionales dentro del expand (`EmpleadosTab`, `CapacitacionesTab`, `AccidentesTab`) — solo queda `SucursalesTab`
- Eliminar: prop `onNavigateToAccidentes` del `EmpresasHeader` y el handler `() => navigate('/accidentes')`
- Mantener: toda la lógica de modales, `expandedRows`, `toggleRow`, hooks, permisos, handlers

- [ ] **Step 1: Reemplazar el contenido de `EstablecimientosContainer.jsx`**

```jsx
import logger from '@/utils/logger';
import React, { useState } from "react";
import {
  Button,
  Box,
  CircularProgress,
  Typography,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import { sucursalService } from '../../../services/sucursalService';
import { useAuth } from '@/components/context/AuthContext';
import AddEmpresaModal from "./AddEmpresaModal";
import SucursalFormModal from "./components/SucursalFormModal";
import EliminarEmpresa from "./EliminarEmpresa";
import EditarEmpresaModal from "./EditarEmpresa";
import EmpresaOperariosDialog from "./EmpresaOperariosDialog";
import SucursalesTab from "./tabs/SucursalesTab";
import EmpresaCard from "./components/EmpresaCard";

import { useEmpresasStats, useEmpresasHandlers, useEmpresasEditHandlers } from './hooks';
import { usePermissions } from '@/components/pages/admin/hooks/usePermissions';
import EmpresasHeader from './components/EmpresasHeader';

const EstablecimientosContainer = () => {
  const {
    userProfile,
    userEmpresas,
    loadingEmpresas,
    crearEmpresa,
    verificarYCorregirEmpresas,
    updateEmpresa,
    getEffectiveOwnerId
  } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const ownerId = getEffectiveOwnerId ? getEffectiveOwnerId() : userProfile?.ownerId;
  const { empresasStats, loadEmpresasStats } = useEmpresasStats(userEmpresas, ownerId);

  const {
    canCreateEmpresa,
    canEditEmpresa,
    canDeleteEmpresa,
    canManageOperarios,
    canViewEmpresa
  } = usePermissions();

  const {
    empresa,
    loading,
    handleInputChange,
    handleLogoChange,
    handleAddEmpresa,
    resetEmpresa,
    setLoading
  } = useEmpresasHandlers(ownerId, updateEmpresa);

  const {
    empresaEdit,
    loading: editLoading,
    setEmpresaEdit,
    handleEditInputChange,
    handleEditLogoChange,
    handleEditEmpresa,
    setLoading: setEditLoading
  } = useEmpresasEditHandlers(updateEmpresa, ownerId);

  const [openModal, setOpenModal] = useState(false);
  const [verificando, setVerificando] = useState(false);

  // Estado para flujo post-creación de empresa → sucursal
  const [postCreacionEmpresaId, setPostCreacionEmpresaId] = useState(null);
  const [openSucursalPostCreacion, setOpenSucursalPostCreacion] = useState(false);
  const [sucursalPostCreacionForm, setSucursalPostCreacionForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    horasSemanales: 40,
    targetMensual: 0,
    targetAnualAuditorias: 12,
    targetMensualCapacitaciones: 1,
    targetAnualCapacitaciones: 12
  });
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openOperariosModal, setOpenOperariosModal] = useState(false);
  const [selectedEmpresaForOperarios, setSelectedEmpresaForOperarios] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const formatearEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  const ownerEmail = userProfile?.email || '';

  const toggleRow = (empresaId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(empresaId)) {
      newExpanded.delete(empresaId);
    } else {
      newExpanded.add(empresaId);
    }
    setExpandedRows(newExpanded);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    resetEmpresa();
  };

  const handleCrearSucursalPostEmpresa = (empresaId) => {
    setPostCreacionEmpresaId(empresaId);
    setSucursalPostCreacionForm({
      nombre: '',
      direccion: '',
      telefono: '',
      horasSemanales: 40,
      targetMensual: 0,
      targetAnualAuditorias: 12,
      targetMensualCapacitaciones: 1,
      targetAnualCapacitaciones: 12
    });
    setOpenSucursalPostCreacion(true);
  };

  const handleCerrarSucursalPostCreacion = () => {
    setOpenSucursalPostCreacion(false);
    setPostCreacionEmpresaId(null);
  };

  const handleSucursalPostCreacionChange = (e) => {
    const { name, value } = e.target;
    setSucursalPostCreacionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitSucursalPostCreacion = async () => {
    if (!sucursalPostCreacionForm.nombre.trim()) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'El nombre de la sucursal es requerido' });
      return;
    }
    try {
      await sucursalService.crearSucursalCompleta(
        ownerId,
        { ...sucursalPostCreacionForm, empresaId: postCreacionEmpresaId },
        { uid: userProfile?.uid || null, role: userProfile?.role || null }
      );
      Swal.fire({ icon: 'success', title: 'Éxito', text: 'Sucursal creada exitosamente' });
      setOpenSucursalPostCreacion(false);
      setPostCreacionEmpresaId(null);
    } catch (error) {
      logger.error('[EstablecimientosContainer] Error creando sucursal post-empresa:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Error al crear la sucursal' });
    }
  };

  const handleVerificarEmpresas = async () => {
    setVerificando(true);
    try {
      await verificarYCorregirEmpresas();
      Swal.fire({ icon: 'success', title: 'Verificación completada', text: 'Las empresas han sido verificadas y corregidas si era necesario' });
    } catch (error) {
      logger.error('Error al verificar empresas:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al verificar las empresas' });
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

  const handleOpenOperariosModal = (empresa) => {
    setSelectedEmpresaForOperarios(empresa);
    setOpenOperariosModal(true);
  };

  const handleCloseOperariosModal = () => {
    setOpenOperariosModal(false);
    setSelectedEmpresaForOperarios(null);
  };

  const empresasFiltradas = (userEmpresas || [])
    .filter(empresa => empresa && empresa.id && empresa.nombre)
    .filter(empresa => canViewEmpresa(empresa.id));

  return (
    <Box sx={{ p: isSmallMobile ? 2 : 4 }}>
      <EmpresasHeader
        totalEmpresas={empresasFiltradas.length}
        isSmallMobile={isSmallMobile}
        onVerificar={handleVerificarEmpresas}
        verificando={verificando}
        onAddEmpresa={() => {
          logger.debug('🔵 [EstablecimientosContainer] Botón "Agregar Empresa" clickeado');
          setOpenModal(true);
        }}
        canCreateEmpresa={canCreateEmpresa}
      />

      {loadingEmpresas ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando empresas...
          </Typography>
        </Box>
      ) : empresasFiltradas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No hay empresas registradas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Hacé clic en "+ Agregar empresa" para crear tu primera empresa
          </Typography>
        </Box>
      ) : (
        <Box>
          {empresasFiltradas.map((empresa) => {
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
              <EmpresaCard
                key={empresa.id}
                empresa={empresa}
                stats={stats}
                isExpanded={isExpanded}
                onToggleRow={toggleRow}
                formatearEmail={formatearEmail}
                ownerEmail={ownerEmail}
                effectiveOwnerId={ownerId}
                onEditClick={handleOpenEditModal}
                onOperariosClick={handleOpenOperariosModal}
                EliminarEmpresaComponent={EliminarEmpresa}
                canEditEmpresa={canEditEmpresa}
                canDeleteEmpresa={canDeleteEmpresa}
                canManageOperarios={canManageOperarios}
              >
                <SucursalesTab
                  empresaId={empresa.id}
                  empresaNombre={empresa.nombre}
                  userEmpresas={userEmpresas}
                  loadEmpresasStats={loadEmpresasStats}
                />
              </EmpresaCard>
            );
          })}
        </Box>
      )}

      {openModal && (
        <AddEmpresaModal
          open={openModal}
          handleClose={handleCloseModal}
          handleAddEmpresa={async () => {
            logger.debug('🔵 [EstablecimientosContainer] handleAddEmpresa wrapper llamado');
            try {
              const empresaId = await handleAddEmpresa();
              logger.debug('[EstablecimientosContainer] ✅ handleAddEmpresa completado, empresaId:', empresaId);
              return empresaId;
            } catch (error) {
              logger.error('[EstablecimientosContainer] ❌ ERROR en handleAddEmpresa:', error);
              throw error;
            }
          }}
          onCrearSucursal={handleCrearSucursalPostEmpresa}
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
          handleEditEmpresa={async () => {
            await handleEditEmpresa();
            setOpenEditModal(false);
          }}
          empresa={empresaEdit}
          handleInputChange={handleEditInputChange}
          handleLogoChange={handleEditLogoChange}
          loading={editLoading}
        />
      )}

      {openOperariosModal && selectedEmpresaForOperarios && (
        <EmpresaOperariosDialog
          open={openOperariosModal}
          handleClose={handleCloseOperariosModal}
          empresaId={selectedEmpresaForOperarios.id}
          empresaNombre={selectedEmpresaForOperarios.nombre}
          ownerId={ownerId}
        />
      )}

      <SucursalFormModal
        open={openSucursalPostCreacion}
        onClose={handleCerrarSucursalPostCreacion}
        formData={sucursalPostCreacionForm}
        onChange={handleSucursalPostCreacionChange}
        onSubmit={handleSubmitSucursalPostCreacion}
        isEditing={false}
      />
    </Box>
  );
};

export default EstablecimientosContainer;
```

- [ ] **Step 2: Verificar que la app levanta sin errores de compilación**

```bash
npm run build 2>&1 | tail -20
```

Esperado: `Successfully compiled` o `webpack compiled successfully`. Si hay errores de import (módulo no encontrado), revisá que los paths en los imports nuevos sean exactamente:
- `"./components/EmpresaCard"` 
- `"./tabs/SucursalesTab"`

- [ ] **Step 3: Commit final**

```bash
git add src/components/pages/establecimiento/EstablecimientosContainer.jsx
git commit -m "feat: refactor EstablecimientosContainer to use EmpresaCard list instead of table"
```

---

## Verificación manual post-implementación

Abrir la app en el browser y verificar:

- [ ] El header muestra "Empresas (N)" con botones "Verificar" y "+ Agregar empresa"
- [ ] Las empresas se muestran como cards con avatar, nombre, propietario, fecha y stats
- [ ] Click en la flecha expande la card mostrando el label "SUCURSALES" y el botón "+ Agregar sucursal"
- [ ] Las sucursales se muestran como cards blancas internas con nombre, dirección, stats y botones
- [ ] Click en el número de empleados de una sucursal navega a `/empleados`
- [ ] Click en el número de capacitaciones navega a `/capacitaciones`
- [ ] Click en el número de accidentes navega a `/accidentes`
- [ ] Botón editar sucursal abre el modal de edición
- [ ] Botón eliminar sucursal dispara el Swal de confirmación
- [ ] Botón "+ Agregar sucursal" abre el modal de creación
- [ ] Botón editar empresa abre `EditarEmpresaModal`
- [ ] Botón eliminar empresa funciona (si el usuario tiene permisos)
- [ ] Botón "Verificar" del header dispara `handleVerificarEmpresas`
- [ ] Botón "+ Agregar empresa" abre `AddEmpresaModal`
- [ ] No aparece el texto "Haz clic en la flecha para expandir..."
- [ ] No aparece el bloque "Resumen de empresa" con 4 números grandes
- [ ] No aparece el botón "Accidentes" en el header
