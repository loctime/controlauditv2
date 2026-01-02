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
 * - fields: Array<FieldConfig> (configuración de campos)
 * - personasConfig: Object (config para campo de personas)
 * - evidenciasConfig: Object (config para campo de evidencias)
 * - onSaved: (registroId) => void
 * - onCancel: () => void
 * - compact: boolean (versión compacta)
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { auditUserCollection } from '../../../firebaseControlFile';
import { uploadEvidence, ensureTaskbarFolder, ensureSubFolder } from '../../../services/controlFileB2Service';
import { auth } from '../../../firebaseControlFile';
import { convertirShareTokenAUrl } from '../../../utils/imageUtils';

/**
 * Componente inline para registrar eventos asociados a una entidad
 */
export default function EventRegistryInline({
  entityId,
  entityType,
  userId,
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
  const [entity, setEntity] = useState(entityProp || null);
  const [personas, setPersonas] = useState([]);
  const [selectedPersonas, setSelectedPersonas] = useState(new Set());
  const [loading, setLoading] = useState(!entityProp);
  const [saving, setSaving] = useState(false);
  
  // Estados para evidencias
  const [evidencias, setEvidencias] = useState([]);
  const [uploadingEvidencias, setUploadingEvidencias] = useState(new Set());
  const [evidenciaBlobUrls, setEvidenciaBlobUrls] = useState(new Map());
  const [loadingEvidencias, setLoadingEvidencias] = useState(new Set());
  const [error, setError] = useState(null);
  
  // Estados para campos custom
  const [customFields, setCustomFields] = useState({});
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const blobUrlsRef = useRef(new Map());

  useEffect(() => {
    if (userId && entityId) {
      loadData();
    }
    
    return () => {
      blobUrlsRef.current.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      blobUrlsRef.current.clear();
    };
  }, [entityId, userId]);

  const loadData = async () => {
    if (!userId) {
      setError('Usuario no autenticado');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Cargar entidad si no se pasó como prop
      if (!entityProp && entityService && entityService.getById) {
        const entityData = await entityService.getById(userId, entityId);
        setEntity(entityData);
      }

      // Cargar personas si hay configuración
      if (personasConfig && personasConfig.collectionName) {
        const personasRef = auditUserCollection(userId, personasConfig.collectionName);
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
        const registros = await registryService.getRegistriesByEntity(userId, entityId);
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
        const evidenciasExistentes = await registryService.getEvidenciasByEntity(userId, entityId);
        setEvidencias(evidenciasExistentes);

        // Cargar evidencias como blob URLs
        evidenciasExistentes.forEach(ev => {
          if (ev.shareToken || ev.id) {
            loadEvidenciaAsBlob(ev.id || ev.fileId, ev.shareToken || ev.id);
          }
        });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
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

    const maxSize = evidenciasConfig.maxSize || 10 * 1024 * 1024; // 10MB default
    const maxCount = evidenciasConfig.maxCount || 50;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      if (file.size > maxSize) {
        setError(`La imagen es demasiado grande (máximo ${maxSize / 1024 / 1024}MB)`);
        return;
      }
      if (evidencias.length >= maxCount) {
        setError(`Máximo ${maxCount} evidencias permitidas`);
        return;
      }
    }

    for (const file of files) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const previewURL = URL.createObjectURL(file);
      
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
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');
        
        const companyId = entity?.empresaId || 'system';
        const mainFolderId = await ensureTaskbarFolder('ControlAudit');
        const folderName = evidenciasConfig.folderName || entityType || 'evidencias';
        const targetFolderId = await ensureSubFolder(folderName, mainFolderId) || mainFolderId;
        
        const result = await uploadEvidence({
          file: file,
          auditId: `${entityType}_${entityId}`,
          companyId: companyId,
          parentId: targetFolderId,
          fecha: new Date()
        });
        
        const finalEvidencia = {
          id: result.fileId,
          shareToken: result.shareToken,
          nombre: file.name,
          createdAt: Timestamp.now(),
          fileId: result.fileId
        };
        
        setEvidencias(prev => 
          prev.map(ev => ev.id === tempId ? finalEvidencia : ev)
        );
        
        loadEvidenciaAsBlob(result.fileId, result.shareToken);
        URL.revokeObjectURL(previewURL);
      } catch (err) {
        console.error('Error al subir evidencia:', err);
        setError(`Error al subir ${file.name}: ${err.message}`);
        setEvidencias(prev => prev.filter(ev => ev.id !== tempId));
        URL.revokeObjectURL(previewURL);
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

  const loadEvidenciaAsBlob = async (evidenciaId, shareToken) => {
    if (!shareToken) return;
    if (loadingEvidencias.has(evidenciaId) || evidenciaBlobUrls.has(evidenciaId) || blobUrlsRef.current.has(evidenciaId)) return;
    
    setLoadingEvidencias(prev => new Set([...prev, evidenciaId]));
    
    try {
      const evidenciaUrl = convertirShareTokenAUrl(shareToken);
      if (!evidenciaUrl) return;
      
      const response = await fetch(evidenciaUrl, { 
        mode: 'cors', 
        credentials: 'omit' 
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      blobUrlsRef.current.set(evidenciaId, blobUrl);
      setEvidenciaBlobUrls(prev => {
        const newMap = new Map(prev);
        newMap.set(evidenciaId, blobUrl);
        return newMap;
      });
    } catch (error) {
      console.error(`Error cargando evidencia ${evidenciaId}:`, error);
      const fallbackUrl = convertirShareTokenAUrl(shareToken);
      if (fallbackUrl) {
        blobUrlsRef.current.set(evidenciaId, fallbackUrl);
        setEvidenciaBlobUrls(prev => {
          const newMap = new Map(prev);
          newMap.set(evidenciaId, fallbackUrl);
          return newMap;
        });
      }
    } finally {
      setLoadingEvidencias(prev => {
        const newSet = new Set(prev);
        newSet.delete(evidenciaId);
        return newSet;
      });
    }
  };

  const handleDeleteEvidencia = (evidenciaId) => {
    const blobUrl = evidenciaBlobUrls.get(evidenciaId) || blobUrlsRef.current.get(evidenciaId);
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
    
    blobUrlsRef.current.delete(evidenciaId);
    setEvidenciaBlobUrls(prev => {
      const newMap = new Map(prev);
      newMap.delete(evidenciaId);
      return newMap;
    });
    
    setEvidencias(prev => prev.filter(ev => ev.id !== evidenciaId));
  };

  const handleOpenCamera = () => cameraInputRef.current?.click();
  const handleOpenGallery = () => galleryInputRef.current?.click();

  const handleGuardar = async () => {
    if (!userId) return alert('Usuario no autenticado');
    if (uploadingEvidencias.size > 0) return alert('Esperá que terminen de subir las evidencias');
    
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

    // Validar personas si hay configuración
    if (personasConfig && selectedPersonas.size === 0) {
      return alert('Seleccioná al menos una persona');
    }

    setSaving(true);

    try {
      const entityIdStr = String(entityId);

      // Preparar datos de personas según configuración
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
        userId,
        entityId: entityIdStr,
        personas: personasData,
        evidencias: [],
        metadata: {
          ...customFields,
          creadoPor: userId
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
          userId,
          registroId: registro.id,
          evidencias: evidenciasParaGuardar
        });
      }

      alert(`Registro guardado correctamente`);
      
      if (onSaved) {
        onSaved(registro.id);
      }

    } catch (e) {
      console.error(e);
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
                Cámara
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoLibraryIcon />}
                onClick={handleOpenGallery}
                disabled={saving || uploadingEvidencias.size > 0}
                size="small"
              >
                Galería
              </Button>
            </Box>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
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
                  const isLoading = loadingEvidencias.has(evidencia.id);
                  
                  const blobUrl = evidenciaBlobUrls.get(evidencia.id);
                  const directUrl = convertirShareTokenAUrl(evidencia.shareToken || evidencia.url);
                  const evidenciaUrl = blobUrl || directUrl;
                  
                  if (!evidenciaUrl && (evidencia.shareToken || evidencia.id) && !isLoading && !isUploading) {
                    loadEvidenciaAsBlob(evidencia.id, evidencia.shareToken || evidencia.id);
                  }

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
                        {evidenciaUrl ? (
                          <img
                            src={evidenciaUrl}
                            alt={`Evidencia ${index + 1}`}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(evidenciaUrl, '_blank')}
                            onError={() => {
                              if (evidencia.shareToken || evidencia.id) {
                                loadEvidenciaAsBlob(evidencia.id, evidencia.shareToken || evidencia.id);
                              }
                            }}
                          />
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
                            {isLoading || isUploading ? (
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

      {/* Renderizar campos según configuración */}
      {fields.map(field => renderField(field))}

      {/* Campos por defecto si no hay configuración */}
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
                Cámara
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoLibraryIcon />}
                onClick={handleOpenGallery}
                disabled={saving || uploadingEvidencias.size > 0}
                size="small"
              >
                Galería
              </Button>
            </Box>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
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
                  const isLoading = loadingEvidencias.has(evidencia.id);
                  
                  const blobUrl = evidenciaBlobUrls.get(evidencia.id);
                  const directUrl = convertirShareTokenAUrl(evidencia.shareToken || evidencia.url);
                  const evidenciaUrl = blobUrl || directUrl;
                  
                  if (!evidenciaUrl && (evidencia.shareToken || evidencia.id) && !isLoading && !isUploading) {
                    loadEvidenciaAsBlob(evidencia.id, evidencia.shareToken || evidencia.id);
                  }

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
                        {evidenciaUrl ? (
                          <img
                            src={evidenciaUrl}
                            alt={`Evidencia ${index + 1}`}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(evidenciaUrl, '_blank')}
                            onError={() => {
                              if (evidencia.shareToken || evidencia.id) {
                                loadEvidenciaAsBlob(evidencia.id, evidencia.shareToken || evidencia.id);
                              }
                            }}
                          />
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
                            {isLoading || isUploading ? (
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
