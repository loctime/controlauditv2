import logger from '@/utils/logger';
// src/components/shared/event-registry/EventRegistryInline.jsx
/**
 * Formulario inline para registrar eventos asociados a una entidad
 * 
 * PROPS:
 * - entityId: string
 * - entityType: string ('capacitacion' | 'accidente' | etc.)
 * - userId: string
 * - entity: Object | null (opcional, se carga si no se pasa)
 * - registryService: Object (servicio de registros)
 * - entityService: Object (servicio de entidad, para cargar si falta)
 * - fields: Array<FieldConfig> (configuraciÃƒÆ’Ã‚Â³n de campos)
 * - personasConfig: Object (config para campo de personas)
 * - evidenciasConfig: Object (config para campo de evidencias)
 * - onSaved: (registroId) => void
 * - onCancel: () => void
 * - compact: boolean (versiÃƒÆ’Ã‚Â³n compacta)
 */

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Paper,
  TextField
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { query, where, getDocs, Timestamp, collection } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { uploadFiles } from '../../../services/unifiedFileService';
import { validateFiles } from '../../../services/fileValidationPolicy';
import { useAuth } from '@/components/context/AuthContext';
import UnifiedFilePreview from '../../common/files/UnifiedFilePreview';

const ENTITY_TYPE_TO_MODULE = {
  accidente: 'accidentes',
  incidente: 'incidentes',
  capacitacion: 'capacitaciones',
  salud: 'salud_ocupacional',
  salud_ocupacional: 'salud_ocupacional',
  auditoria: 'auditorias',
  auditorias: 'auditorias'
};

/**
 * Componente inline para registrar eventos asociados a una entidad
 */
export default function EventRegistryInline({
  entityId,
  entityType,
  userId,
  ownerId,
  actorId,
  entity: entityProp,
  registryService,
  entityService,
  fields = [],
  personasConfig,
  evidenciasConfig = {},
  onSaved,
  onCancel,
  compact = false
}) {
  const { userProfile } = useAuth();
  const [entity, setEntity] = useState(entityProp || null);
  const [personas, setPersonas] = useState([]);
  const [selectedPersonas, setSelectedPersonas] = useState(new Set());
  const [loading, setLoading] = useState(!entityProp);
  const [saving, setSaving] = useState(false);
  
  // Estados para evidencias
  const [evidencias, setEvidencias] = useState([]);
  const [uploadingEvidencias, setUploadingEvidencias] = useState(new Set());
  const [error, setError] = useState(null);
  
  // Estados para campos custom
  const [customFields, setCustomFields] = useState({});
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const tenantOwnerId = ownerId || userProfile?.ownerId || userId || null;
  const currentActorId = actorId || userId || userProfile?.uid || null;

  useEffect(() => {
    if (tenantOwnerId && entityId) {
      loadData();
    }
    
  }, [entityId, tenantOwnerId, currentActorId]);

  const loadData = async () => {
    if (!tenantOwnerId) {
      setError('Usuario no autenticado');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Cargar entidad si no se pasÃƒÆ’Ã‚Â³ como prop
      if (!entityProp && entityService && entityService.getById) {
        const entityData = await entityService.getById(currentActorId, entityId);
        setEntity(entityData);
      }

      // Cargar personas si hay configuraciÃƒÆ’Ã‚Â³n
      if (personasConfig && personasConfig.collectionName) {
        if (!tenantOwnerId) {
          logger.error('[EventRegistryInline] ownerId no disponible');
          setError('Usuario no autenticado correctamente');
          setLoading(false);
          return;
        }
        const ownerId = tenantOwnerId;
        const collectionName = personasConfig.collectionName;
        const routeFunction = firestoreRoutesCore[collectionName];
        if (!routeFunction || typeof routeFunction !== 'function') {
          logger.error(`[EventRegistryInline] Collection ${collectionName} not found in firestoreRoutesCore`);
          setError(`ColecciÃƒÆ’Ã‚Â³n ${collectionName} no encontrada`);
          setLoading(false);
          return;
        }
        const personasRef = collection(dbAudit, ...routeFunction(ownerId));
        let q = query(personasRef);
        
        // Aplicar filtros si existen
        if (personasConfig.filterBy && entity) {
          const filters = personasConfig.filterBy(entity);
          if (filters) {
            Object.entries(filters).forEach(([field, value]) => {
              q = query(q, where(field, '==', value));
            });
          }
        }
        
        // Filtro por estado activo por defecto si existe el campo
        if (personasConfig.filterByEstado !== false) {
          q = query(q, where('estado', '==', 'activo'));
        }
        
        const snapshot = await getDocs(q);
        const personasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPersonas(personasData);
      }

      // Cargar registros existentes para pre-seleccionar personas
      if (registryService && registryService.getRegistriesByEntity) {
        const registros = await registryService.getRegistriesByEntity(tenantOwnerId, entityId);
        const personasRegistradas = new Set();
        registros.forEach(reg => {
          const personasField = personasConfig?.fieldName || 'empleadoIds';
          const personasData = reg[personasField];
          if (personasData && Array.isArray(personasData)) {
            personasData.forEach(persona => {
              const personaId = typeof persona === 'string' 
                ? persona 
                : (persona.id || persona.empleadoId || persona);
              if (personaId) {
                personasRegistradas.add(personaId);
              }
            });
          }
        });
        setSelectedPersonas(personasRegistradas);
      }

      // Cargar evidencias existentes
      if (registryService && registryService.getEvidenciasByEntity) {
        const evidenciasExistentes = await registryService.getEvidenciasByEntity(tenantOwnerId, entityId);
        setEvidencias(evidenciasExistentes);
      }
    } catch (error) {
      logger.error('Error al cargar datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePersona = (personaId) => {
    setSelectedPersonas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personaId)) {
        newSet.delete(personaId);
      } else {
        newSet.add(personaId);
      }
      return newSet;
    });
  };

  const handleSelectAllPersonas = () => {
    if (selectedPersonas.size === personas.length) {
      setSelectedPersonas(new Set());
    } else {
      setSelectedPersonas(new Set(personas.map(p => p.id)));
    }
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError(null);
    const maxCount = evidenciasConfig.maxCount || 50;
    const validation = validateFiles(files);

    if (validation.rejected.length > 0) {
      setError(validation.rejected.map((item) => item.fileName).join(' | '));
      return;
    }

    const validFiles = validation.accepted;
    if (evidencias.length + validFiles.length > maxCount) {
      setError(`Maximo ${maxCount} evidencias permitidas`);
      return;
    }

    for (const file of validFiles) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const tempEvidencia = {
        id: tempId,
        nombre: file.name,
        createdAt: Timestamp.now(),
        file: file,
        uploading: true
      };
      
      setEvidencias(prev => [...prev, tempEvidencia]);
      setUploadingEvidencias(prev => new Set([...prev, tempId]));

      try {
        const ownerId = tenantOwnerId;
        if (!ownerId) throw new Error('Contexto de owner no disponible');

        const companyId = entity?.empresaId || 'system';
        const module = ENTITY_TYPE_TO_MODULE[entityType] || 'capacitaciones';
        const uploadResult = await uploadFiles({
          ownerId,
          module,
          entityId: String(entityId),
          companyId,
          files: [file],
          uploadedBy: currentActorId || null,
          contextType: entityType,
          tipoArchivo: 'evidencia',
          sucursalId: entity?.sucursalId || undefined,
          capacitacionTipoId: entity?.capacitacionTipoId || undefined
        });

        if (!uploadResult.fileRefs || uploadResult.fileRefs.length === 0) {
          throw new Error('No se pudo persistir metadata canonica del archivo');
        }

        const persisted = uploadResult.fileRefs[0];
        const finalEvidencia = {
          id: persisted.id || persisted.fileId,
          fileDocId: persisted.id,
          shareToken: persisted.shareToken,
          nombre: persisted.name || file.name,
          createdAt: persisted.uploadedAt || Timestamp.now(),
          fileId: persisted.fileId,
          mimeType: persisted.mimeType,
          size: persisted.size,
          status: persisted.status || 'active'
        };

        setEvidencias((prev) =>
          prev.map((ev) => (ev.id === tempId ? finalEvidencia : ev))
        );

      } catch (err) {
        logger.error('Error al subir evidencia:', err);
        setError(`Error al subir ${file.name}: ${err.message}`);
        setEvidencias(prev => prev.filter(ev => ev.id !== tempId));
      } finally {
        setUploadingEvidencias(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });
      }
    }

    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleDeleteEvidencia = (evidenciaId) => {
    setEvidencias(prev => prev.filter(ev => ev.id !== evidenciaId));
  };

  const handleOpenCamera = () => cameraInputRef.current?.click();
  const handleOpenGallery = () => galleryInputRef.current?.click();

  const handleGuardar = async () => {
    if (!tenantOwnerId) return alert('Contexto de tenant no disponible');
    if (uploadingEvidencias.size > 0) return alert('EsperÃƒÆ’Ã‚Â¡ que terminen de subir las evidencias');
    
    // Validar campos requeridos
    for (const field of fields) {
      if (field.required) {
        if (field.type === 'personas' && selectedPersonas.size === 0) {
          return alert(`${field.label} es requerido`);
        }
        if (field.type === 'text' && !customFields[field.id]) {
          return alert(`${field.label} es requerido`);
        }
      }
    }

    // Validar personas si hay configuraciÃƒÆ’Ã‚Â³n
    if (personasConfig && selectedPersonas.size === 0) {
      return alert('SeleccionÃƒÆ’Ã‚Â¡ al menos una persona');
    }

    setSaving(true);

    try {
      const entityIdStr = String(entityId);

      // Preparar datos de personas segÃƒÆ’Ã‚Âºn configuraciÃƒÆ’Ã‚Â³n
      let personasData = [];
      if (personasConfig) {
        if (personasConfig.normalize) {
          personasData = personasConfig.normalize(Array.from(selectedPersonas));
        } else {
          personasData = Array.from(selectedPersonas);
        }
      }

      // Crear registro base (sin evidencias)
      const registro = await registryService.createRegistry({
        ownerId: tenantOwnerId,
        actorId: currentActorId,
        entityId: entityIdStr,
        personas: personasData,
        evidencias: [],
        metadata: {
          ...customFields,
          creadoPor: currentActorId
        }
      });

      // Preparar evidencias para guardar
      const evidenciasParaGuardar = evidencias
        .filter(ev => ev.fileId && !ev.id?.startsWith('temp_'))
        .map(ev => ({
          fileId: ev.fileId,
          shareToken: ev.shareToken,
          nombre: ev.nombre || 'evidencia',
          registroId: registro.id,
          entityId: entityIdStr,
          createdAt: ev.createdAt || Timestamp.now(),
          ...(personasData.length > 0 ? { personasIds: personasData } : {})
        }));

      // Asociar evidencias si hay
      if (evidenciasParaGuardar.length > 0) {
        await registryService.attachEvidencias({
          ownerId: tenantOwnerId,
          actorId: currentActorId,
          registroId: registro.id,
          evidencias: evidenciasParaGuardar
        });
      }

      alert(`Registro guardado correctamente`);
      
      if (onSaved) {
        onSaved(registro.id);
      }

    } catch (e) {
      logger.error(e);
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'personas':
        return (
          <Box key={field.id} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {field.label} ({personas.length})
              </Typography>
              {personas.length > 0 && (
                <Button size="small" onClick={handleSelectAllPersonas}>
                  {selectedPersonas.size === personas.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                </Button>
              )}
            </Box>

            {personas.length === 0 ? (
              <Alert severity="info">No hay personas disponibles</Alert>
            ) : (
              <Grid container spacing={1}>
                {personas.map((persona) => (
                  <Grid item xs={12} sm={6} key={persona.id}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        backgroundColor: selectedPersonas.has(persona.id) ? '#e3f2fd' : 'transparent'
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedPersonas.has(persona.id)}
                            onChange={() => handleTogglePersona(persona.id)}
                          />
                        }
                        label={
                          field.renderItem ? (
                            field.renderItem(persona)
                          ) : (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {persona.nombre || persona.id}
                              </Typography>
                              {persona.cargo && (
                                <Typography variant="caption" color="text.secondary">
                                  {persona.cargo}
                                </Typography>
                              )}
                            </Box>
                          )
                        }
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 'evidencias':
        return (
          <Box key={field.id} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              {field.label} ({evidencias.length})
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<CameraIcon />}
                onClick={handleOpenCamera}
                disabled={saving || uploadingEvidencias.size > 0}
                size="small"
              >
                CÃƒÆ’Ã‚Â¡mara
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoLibraryIcon />}
                onClick={handleOpenGallery}
                disabled={saving || uploadingEvidencias.size > 0}
                size="small"
              >
                GalerÃƒÆ’Ã‚Â­a
              </Button>
            </Box>

            <input
              ref={cameraInputRef}
              type="file"
              accept="*/*"
              capture="environment"
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="*/*"
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
            />

            {evidencias.length === 0 ? (
              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                No hay evidencias agregadas. Usa los botones de arriba para agregar.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {evidencias.map((evidencia, index) => {
                  const isUploading = uploadingEvidencias.has(evidencia.id) || evidencia.uploading;
                  const fileRef = {
                    id: evidencia.id || evidencia.fileId || `evidencia-${index}`,
                    fileId: evidencia.fileId || evidencia.id || null,
                    shareToken: evidencia.shareToken || null,
                    name: evidencia.nombre || `Evidencia ${index + 1}`,
                    mimeType: evidencia.mimeType || 'application/octet-stream',
                    status: evidencia.status || 'active'
                  };
                  const canPreview = Boolean(fileRef.fileId || fileRef.shareToken);

                  return (
                    <Grid item xs={6} sm={4} md={3} key={evidencia.id || index}>
                      <Box
                        sx={{
                          position: 'relative',
                          paddingTop: '100%',
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: 'background.paper'
                        }}
                      >
                        {canPreview ? (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              p: 0.5,
                              bgcolor: 'background.paper'
                            }}
                          >
                            <UnifiedFilePreview fileRef={fileRef} height={150} />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'grey.200',
                              color: 'text.secondary'
                            }}
                          >
                            {isUploading ? (
                              <CircularProgress size={24} />
                            ) : (
                              <Typography variant="caption">Cargando...</Typography>
                            )}
                          </Box>
                        )}
                        
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            p: 0.5,
                            display: 'flex',
                            gap: 0.5,
                            flexDirection: 'column'
                          }}
                        >
                          {isUploading && (
                            <CircularProgress size={16} sx={{ color: 'primary.main' }} />
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteEvidencia(evidencia.id)}
                            disabled={saving || isUploading}
                            sx={{
                              backgroundColor: 'error.main',
                              color: 'white',
                              '&:hover': { backgroundColor: 'error.dark' },
                              width: 24,
                              height: 24
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        {evidencia.nombre && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              p: 0.5,
                              fontSize: '0.7rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {evidencia.nombre}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        );

      case 'text':
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            value={customFields[field.id] || ''}
            onChange={(e) => setCustomFields(prev => ({ ...prev, [field.id]: e.target.value }))}
            required={field.required}
            multiline={field.multiline}
            rows={field.rows || 1}
            sx={{ mb: 2 }}
          />
        );

      case 'custom':
        return field.render ? (
          <Box key={field.id} sx={{ mb: 2 }}>
            {field.render({
              value: customFields[field.id],
              onChange: (value) => setCustomFields(prev => ({ ...prev, [field.id]: value })),
              entity,
              personas,
              evidencias
            })}
          </Box>
        ) : null;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !entity) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const content = (
    <>
      {!compact && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Registrar
          </Typography>
          {entity && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {entity.nombre || entityId}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Renderizar campos segÃƒÆ’Ã‚Âºn configuraciÃƒÆ’Ã‚Â³n */}
      {fields.map(field => renderField(field))}

      {/* Campos por defecto si no hay configuraciÃƒÆ’Ã‚Â³n */}
      {fields.length === 0 && (
        <>
          {/* Campo de personas por defecto */}
          {personasConfig && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Personas ({personas.length})
                </Typography>
                {personas.length > 0 && (
                  <Button size="small" onClick={handleSelectAllPersonas}>
                    {selectedPersonas.size === personas.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </Button>
                )}
              </Box>

              {personas.length === 0 ? (
                <Alert severity="info">No hay personas disponibles</Alert>
              ) : (
                <Grid container spacing={1}>
                  {personas.map((persona) => (
                    <Grid item xs={12} sm={6} key={persona.id}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1,
                          backgroundColor: selectedPersonas.has(persona.id) ? '#e3f2fd' : 'transparent'
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedPersonas.has(persona.id)}
                              onChange={() => handleTogglePersona(persona.id)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {persona.nombre || persona.id}
                              </Typography>
                              {persona.cargo && (
                                <Typography variant="caption" color="text.secondary">
                                  {persona.cargo}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Campo de evidencias por defecto */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Evidencias ({evidencias.length})
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<CameraIcon />}
                onClick={handleOpenCamera}
                disabled={saving || uploadingEvidencias.size > 0}
                size="small"
              >
                CÃƒÆ’Ã‚Â¡mara
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoLibraryIcon />}
                onClick={handleOpenGallery}
                disabled={saving || uploadingEvidencias.size > 0}
                size="small"
              >
                GalerÃƒÆ’Ã‚Â­a
              </Button>
            </Box>

            <input
              ref={cameraInputRef}
              type="file"
              accept="*/*"
              capture="environment"
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="*/*"
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
            />

            {evidencias.length === 0 ? (
              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                No hay evidencias agregadas. Usa los botones de arriba para agregar.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {evidencias.map((evidencia, index) => {
                  const isUploading = uploadingEvidencias.has(evidencia.id) || evidencia.uploading;
                  const fileRef = {
                    id: evidencia.id || evidencia.fileId || `evidencia-${index}`,
                    fileId: evidencia.fileId || evidencia.id || null,
                    shareToken: evidencia.shareToken || null,
                    name: evidencia.nombre || `Evidencia ${index + 1}`,
                    mimeType: evidencia.mimeType || 'application/octet-stream',
                    status: evidencia.status || 'active'
                  };
                  const canPreview = Boolean(fileRef.fileId || fileRef.shareToken);

                  return (
                    <Grid item xs={6} sm={4} md={3} key={evidencia.id || index}>
                      <Box
                        sx={{
                          position: 'relative',
                          paddingTop: '100%',
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: 'background.paper'
                        }}
                      >
                        {canPreview ? (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              p: 0.5,
                              bgcolor: 'background.paper'
                            }}
                          >
                            <UnifiedFilePreview fileRef={fileRef} height={150} />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'grey.200',
                              color: 'text.secondary'
                            }}
                          >
                            {isUploading ? (
                              <CircularProgress size={24} />
                            ) : (
                              <Typography variant="caption">Cargando...</Typography>
                            )}
                          </Box>
                        )}
                        
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            p: 0.5,
                            display: 'flex',
                            gap: 0.5,
                            flexDirection: 'column'
                          }}
                        >
                          {isUploading && (
                            <CircularProgress size={16} sx={{ color: 'primary.main' }} />
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteEvidencia(evidencia.id)}
                            disabled={saving || isUploading}
                            sx={{
                              backgroundColor: 'error.main',
                              color: 'white',
                              '&:hover': { backgroundColor: 'error.dark' },
                              width: 24,
                              height: 24
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        {evidencia.nombre && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              p: 0.5,
                              fontSize: '0.7rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {evidencia.nombre}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </>
      )}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleGuardar}
          disabled={
            saving || 
            uploadingEvidencias.size > 0 ||
            (personasConfig && selectedPersonas.size === 0)
          }
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
            },
            ml: onCancel ? 'auto' : 0
          }}
        >
          {saving ? (
            <CircularProgress size={24} />
          ) : uploadingEvidencias.size > 0 ? (
            `Subiendo evidencias... (${uploadingEvidencias.size})`
          ) : (
            `Guardar${personasConfig ? ` (${selectedPersonas.size} personas` : ''}${evidencias.length > 0 ? `, ${evidencias.length} evidencias` : ''}${personasConfig ? ')' : ''}`
          )}
        </Button>
      </Box>
    </>
  );

  if (compact) {
    return <Box sx={{ p: 2 }}>{content}</Box>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      {content}
    </Paper>
  );
}






