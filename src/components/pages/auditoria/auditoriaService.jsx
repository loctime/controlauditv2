import logger from '@/utils/logger';
import { collection, addDoc, getDocs, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { updateDocWithAppId } from '../../../firebase/firestoreAppWriter';
import { uploadFiles } from '../../../services/unifiedFileService';
import { validateFile } from '../../../services/fileValidationPolicy';
import { prepararDatosParaFirestore, registrarAccionSistema } from '../../../utils/firestoreUtils';
import { getOfflineDatabase, generateOfflineId } from '../../../services/offlineDatabase';
import syncQueueService from '../../../services/syncQueue';
import AccionesRequeridasService from '../../../services/accionesRequeridasService';

const SCHEMA_VERSION = 1;

const parseShareToken = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return value.trim() || null;
  }

  const match = value.match(/\/shares\/([^/]+)/i);
  return match?.[1] || null;
};

const normalizeFileRef = (value, defaults) => {
  if (!value) return null;

  if (value.fileId || value.shareToken) {
    return {
      fileId: value.fileId || value.shareToken,
      shareToken: value.shareToken || null,
      name: value.name || value.nombre || 'archivo',
      mimeType: value.mimeType || value.tipo || 'application/octet-stream',
      size: value.size || value.tamano || value["tama�o"] || 0,
      module: 'auditorias',
      entityId: defaults.entityId,
      companyId: defaults.companyId,
      uploadedBy: defaults.uploadedBy,
      uploadedAt: value.uploadedAt || value.createdAt || new Date().toISOString(),
      status: value.status || 'active',
      schemaVersion: 1
    };
  }

  if (typeof value === 'string') {
    const shareToken = parseShareToken(value);
    if (!shareToken) return null;
    return {
      fileId: shareToken,
      shareToken,
      name: 'archivo_legacy',
      mimeType: 'application/octet-stream',
      size: 0,
      module: 'auditorias',
      entityId: defaults.entityId,
      companyId: defaults.companyId,
      uploadedBy: defaults.uploadedBy,
      uploadedAt: new Date().toISOString(),
      status: 'active',
      schemaVersion: 1
    };
  }

  return null;
};

const toSeccionValues = (arr) => {
  if (!Array.isArray(arr)) return [];
  if (arr.length > 0 && arr[0] && typeof arr[0] === 'object' && Array.isArray(arr[0].valores)) {
    return arr.map((item) => item?.valores || []);
  }
  return arr;
};

const emptyFilesByQuestion = (secciones = []) => {
  return (secciones || []).map((seccion) => {
    const preguntas = Array.isArray(seccion?.preguntas) ? seccion.preguntas : [];
    return preguntas.map(() => []);
  });
};


const flattenFilesByQuestion = (filesByQuestion = []) => {
  return filesByQuestion.flatMap((seccion) =>
    (Array.isArray(seccion) ? seccion : []).flatMap((pregunta) => (Array.isArray(pregunta) ? pregunta : []))
  );
};

class AuditoriaService {
  static generarEstadisticas(respuestas) {
    const respuestasPlanas = Array.isArray(respuestas) ? respuestas.flat() : [];

    const estadisticas = {
      Conforme: respuestasPlanas.filter((r) => r === 'Conforme').length,
      'No conforme': respuestasPlanas.filter((r) => r === 'No conforme').length,
      'Necesita mejora': respuestasPlanas.filter((r) => r === 'Necesita mejora').length,
      'No aplica': respuestasPlanas.filter((r) => r === 'No aplica').length
    };

    const total = respuestasPlanas.length;
    const porcentajes = {};

    Object.keys(estadisticas).forEach((key) => {
      porcentajes[key] = total > 0 ? ((estadisticas[key] / total) * 100).toFixed(2) : 0;
    });

    return {
      conteo: estadisticas,
      porcentajes,
      total,
      sinNoAplica: {
        ...estadisticas,
        'No aplica': 0
      }
    };
  }

  static generarNombreArchivo(empresa, sucursal, user) {
    const fecha = new Date().toISOString().split('T')[0];
    const nombreEmpresa = empresa?.nombre || 'Empresa';
    const ubicacion = sucursal && sucursal.trim() !== '' ? `_${sucursal}` : '_CasaCentral';
    const nombreUsuario = user?.displayName || user?.email || 'Usuario';

    return `${nombreEmpresa}${ubicacion}_${nombreUsuario}_${fecha}`;
  }

  static limpiarArraysAnidados(obj) {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.limpiarArraysAnidados(item));
    }
    if (obj && typeof obj === 'object') {
      const out = {};
      Object.keys(obj).forEach((key) => {
        out[key] = this.limpiarArraysAnidados(obj[key]);
      });
      return out;
    }
    return obj;
  }

  static procesarAccionesRequeridas(accionesRequeridas, secciones) {
    if (!Array.isArray(accionesRequeridas) || accionesRequeridas.length === 0) return [];

    const accionesProcesadas = [];

    accionesRequeridas.forEach((seccionAcciones, seccionIndex) => {
      if (!Array.isArray(seccionAcciones)) return;

      seccionAcciones.forEach((accionData, preguntaIndex) => {
        if (!accionData || !accionData.requiereAccion || !accionData.accionTexto) return;

        const seccion = secciones?.[seccionIndex];
        const preguntaTexto = seccion?.preguntas?.[preguntaIndex] || 'Pregunta sin texto';

        accionesProcesadas.push({
          id: accionData.id || `accion_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          preguntaIndex: { seccionIndex, preguntaIndex },
          preguntaTexto,
          accionTexto: accionData.accionTexto,
          fechaVencimiento: accionData.fechaVencimiento
            ? (accionData.fechaVencimiento instanceof Date
                ? accionData.fechaVencimiento.toISOString()
                : accionData.fechaVencimiento)
            : null,
          estado: 'pendiente',
          fechaCreacion: new Date().toISOString(),
          fechaCompletada: null,
          completadaPor: null,
          comentarios: [],
          modificaciones: []
        });
      });
    });

    return accionesProcesadas;
  }

  static anidarAObjetosPorSeccion(arr) {
    const secciones = toSeccionValues(arr);
    return secciones.map((valores, idx) => ({
      seccion: idx,
      valores: Array.isArray(valores) ? valores : []
    }));
  }

  static collectFilesByQuestion(imagenesInput, secciones, defaults) {
    const input = toSeccionValues(imagenesInput);
    const filesByQuestion = emptyFilesByQuestion(secciones);
    const pendingUploads = [];

    input.forEach((seccionValues, seccionIndex) => {
      if (!Array.isArray(seccionValues)) return;

      seccionValues.forEach((cellValue, preguntaIndex) => {
        const asList = Array.isArray(cellValue) ? cellValue : cellValue ? [cellValue] : [];

        asList.forEach((item) => {
          if (item instanceof File) {
            const validation = validateFile(item);
            if (validation.valid) {
              pendingUploads.push({ file: item, seccionIndex, preguntaIndex });
            }
            return;
          }

          const normalized = normalizeFileRef(item, defaults);
          if (normalized) {
            filesByQuestion[seccionIndex][preguntaIndex].push(normalized);
          }
        });
      });
    });

    return { filesByQuestion, pendingUploads };
  }

  static async guardarAuditoria(datosAuditoria, userProfile) {
    if (!navigator.onLine) {
      const id = await this.guardarAuditoriaOffline(datosAuditoria, userProfile);
      return { id, uploadFailures: [] };
    }

    try {
      return await this.guardarAuditoriaOnline(datosAuditoria, userProfile);
    } catch (error) {
      logger.error('Error en guardado online, fallback a offline:', error);
      const id = await this.guardarAuditoriaOffline(datosAuditoria, userProfile);
      return { id, uploadFailures: [] };
    }
  }

  static async guardarAuditoriaOnline(datosAuditoria, userProfile) {
    try {
      if (!datosAuditoria.empresa || !datosAuditoria.formulario) {
        throw new Error('Faltan datos requeridos para guardar la auditoria');
      }
      if (!userProfile?.uid || !userProfile?.ownerId) {
        throw new Error('userProfile.uid y ownerId son requeridos');
      }

      const ownerId = userProfile.ownerId;
      const actorId = userProfile.uid;
      const companyId = datosAuditoria.empresa?.id || 'system';

      const estadisticas = this.generarEstadisticas(datosAuditoria.respuestas);

      const datosCompletos = {
        empresaId: datosAuditoria.empresa?.id || null,
        empresaNombre: datosAuditoria.empresa?.nombre || null,
        sucursal: datosAuditoria.sucursal || 'Casa Central',
        formularioId: datosAuditoria.formulario?.id || null,
        nombreForm: datosAuditoria.formulario?.nombre || null,
        respuestas: this.anidarAObjetosPorSeccion(datosAuditoria.respuestas),
        comentarios: this.anidarAObjetosPorSeccion(datosAuditoria.comentarios),
        clasificaciones: this.anidarAObjetosPorSeccion(datosAuditoria.clasificaciones || []),
        accionesRequeridas: this.procesarAccionesRequeridas(
          datosAuditoria.accionesRequeridas || [],
          datosAuditoria.secciones || []
        ),
        secciones: Array.isArray(datosAuditoria.secciones) ? datosAuditoria.secciones : [],
        estadisticas,
        estado: 'completada',
        nombreArchivo: this.generarNombreArchivo(datosAuditoria.empresa, datosAuditoria.sucursal, userProfile),
        creadoPor: actorId,
        creadoPorEmail: userProfile?.email || null,
        ownerId,
        usuarioId: actorId,
        timestamp: serverTimestamp(),
        fechaCreacion: new Date().toISOString(),
        version: '3.0',
        schemaVersion: SCHEMA_VERSION,
        firmaAuditor: datosAuditoria.firmaAuditor || null,
        firmaResponsable: datosAuditoria.firmaResponsable || null,
        tareaObservada: datosAuditoria.tareaObservada || '',
        lugarSector: datosAuditoria.lugarSector || '',
        equiposInvolucrados: datosAuditoria.equiposInvolucrados || '',
        supervisor: datosAuditoria.supervisor || '',
        numeroTrabajadores: datosAuditoria.numeroTrabajadores || '',
        nombreInspector: datosAuditoria.nombreInspector || '',
        nombreResponsable: datosAuditoria.nombreResponsable || '',
        filesCount: 0
      };

      const datosLimpios = this.limpiarArraysAnidados(prepararDatosParaFirestore(datosCompletos));

      const reportesRef = collection(dbAudit, ...firestoreRoutesCore.reportes(ownerId));
      const docRef = await addDoc(reportesRef, datosLimpios);

      const { filesByQuestion, pendingUploads } = this.collectFilesByQuestion(
        datosAuditoria.imagenes,
        datosAuditoria.secciones || [],
        {
          entityId: docRef.id,
          companyId,
          uploadedBy: actorId
        }
      );

      logger.debug('[auditoriaService] guardarAuditoriaOnline: pendingUploads', {
        pendingUploadsCount: pendingUploads?.length || 0,
        hasImagenes: Array.isArray(datosAuditoria.imagenes) && datosAuditoria.imagenes.length > 0,
        entityId: docRef.id,
        companyId,
        ownerId
      });

      let uploadFailures = [];
      if (pendingUploads.length > 0) {
        logger.debug('[auditoriaService] Subiendo archivos evidencia (uploadFiles)', {
          filesToUpload: pendingUploads.length,
          module: 'auditorias',
          entityId: docRef.id
        });

        const uploadResult = await uploadFiles({
          ownerId,
          module: 'auditorias',
          entityId: docRef.id,
          companyId,
          files: pendingUploads.map((entry) => entry.file),
          uploadedBy: actorId,
          contextType: 'auditoria',
          tipoArchivo: 'evidencia'
        });

        logger.debug('[auditoriaService] uploadFiles resultado', {
          fileRefsCount: Array.isArray(uploadResult?.fileRefs) ? uploadResult.fileRefs.length : null,
          rejectedCount: Array.isArray(uploadResult?.rejected) ? uploadResult.rejected.length : null,
          warningsCount: Array.isArray(uploadResult?.warnings) ? uploadResult.warnings.length : null,
          failuresCount: Array.isArray(uploadResult?.failures) ? uploadResult.failures.length : null
        });

        uploadFailures = Array.isArray(uploadResult.failures) ? uploadResult.failures : [];
        const fileDocTagUpdates = [];

        uploadResult.fileRefs.forEach((savedRef, index) => {
          const target = pendingUploads[index];
          if (!target) return;

          filesByQuestion[target.seccionIndex][target.preguntaIndex].push({
            fileDocId: savedRef.id,
            fileId: savedRef.fileId,
            shareToken: savedRef.shareToken || null,
            name: savedRef.name,
            mimeType: savedRef.mimeType,
            size: savedRef.size,
            module: 'auditorias',
            entityId: docRef.id,
            companyId,
            uploadedBy: savedRef.uploadedBy || actorId,
            uploadedAt: savedRef.uploadedAt || new Date().toISOString(),
            status: 'active',
            schemaVersion: 1
          });

          const fileDocRef = doc(dbAudit, ...firestoreRoutesCore.reporte(ownerId, docRef.id), 'files', savedRef.id);
          fileDocTagUpdates.push(
            updateDocWithAppId(fileDocRef, {
              questionRef: {
                seccionIndex: target.seccionIndex,
                preguntaIndex: target.preguntaIndex
              },
              module: 'auditorias',
              entityId: docRef.id,
              companyId,
              updatedAt: serverTimestamp()
            })
          );
        });

        if (fileDocTagUpdates.length > 0) {
          const tagResults = await Promise.allSettled(fileDocTagUpdates);
          const failedTags = tagResults.filter((item) => item.status === 'rejected').length;
          if (failedTags > 0) {
            logger.warn(`[auditoriaService] ${failedTags} archivos no pudieron etiquetarse con questionRef`);
          }
        }

        if (uploadFailures.length > 0) {
          logger.error('[auditoriaService] Fallos en persistencia canonica de archivos', uploadFailures);
        }
      }

      const flatFiles = flattenFilesByQuestion(filesByQuestion);

      await updateDocWithAppId(docRef, {
        filesCount: flatFiles.length,
        filesUploadFailures: uploadFailures,
        hasUploadFailures: uploadFailures.length > 0,
        schemaVersion: SCHEMA_VERSION
      });

      if (datosCompletos.accionesRequeridas?.length > 0) {
        try {
          let sucursalId = null;
          if (datosAuditoria.sucursal && datosAuditoria.sucursal !== 'Casa Central') {
            const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerId));
            const q = query(sucursalesRef, where('nombre', '==', datosAuditoria.sucursal));
            const sucursalesSnapshot = await getDocs(q);
            if (!sucursalesSnapshot.empty) {
              sucursalId = sucursalesSnapshot.docs[0].id;
            }
          }

          if (sucursalId) {
            const sucursalDocRef = doc(dbAudit, ...firestoreRoutesCore.sucursal(ownerId, sucursalId));
            const accionesCollectionRef = collection(sucursalDocRef, 'acciones_requeridas');
            await AccionesRequeridasService.crearAccionesDesdeReporte(
              accionesCollectionRef,
              docRef.id,
              sucursalId,
              companyId,
              datosCompletos.accionesRequeridas
            );
          }
        } catch (accionesError) {
          logger.error('Error al crear acciones requeridas (no critico):', accionesError);
        }
      }

      await registrarAccionSistema(
        actorId,
        `Auditoria guardada: ${datosAuditoria.empresa?.nombre} - ${datosAuditoria.formulario?.nombre}`,
        {
          auditoriaId: docRef.id,
          empresa: datosAuditoria.empresa?.nombre,
          sucursal: datosAuditoria.sucursal,
          formulario: datosAuditoria.formulario?.nombre,
          filesCount: flatFiles.length
        },
        'crear',
        'auditoria',
        docRef.id
      );

      // Etapa 4a: Si no hay vínculo con agenda, buscar coincidencias para aviso en /panel
      if (!datosAuditoria.auditoriaIdAgenda) {
        try {
          const agendaRef = collection(dbAudit, ...firestoreRoutesCore.auditorias_agendadas(ownerId));
          const agendaQuery = query(
            agendaRef,
            where('empresa', '==', datosAuditoria.empresa?.nombre || ''),
            where('formulario', '==', datosAuditoria.formulario?.nombre || ''),
            where('estado', '==', 'agendada')
          );
          const agendaSnap = await getDocs(agendaQuery);
          const reporteFecha = new Date();
          const updatePromises = [];
          agendaSnap.docs.forEach(agendaDoc => {
            const agendaFecha = new Date(agendaDoc.data().fecha);
            const diffDias = Math.abs(reporteFecha - agendaFecha) / (1000 * 60 * 60 * 24);
            if (diffDias <= 7) {
              updatePromises.push(
                updateDocWithAppId(agendaDoc.ref, {
                  reporteSinVincular: docRef.id,
                  fechaReporteSinVincular: serverTimestamp()
                })
              );
            }
          });
          if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            logger.debug('[auditoriaService] Etapa 4: marcadas', updatePromises.length, 'agendas con reporte sin vincular:', docRef.id);
          }
        } catch (etapa4Error) {
          // No bloquear el guardado principal si falla la detección
          logger.warn('[auditoriaService] Etapa 4: error en detección de coincidencias:', etapa4Error);
        }
      }

      return { id: docRef.id, uploadFailures };
    } catch (error) {
      logger.error('Error al guardar auditoria online:', error);
      throw error;
    }
  }

  static async guardarAuditoriaOffline(datosAuditoria, userProfile) {
    try {
      if (!datosAuditoria.empresa || !datosAuditoria.formulario) {
        throw new Error('Faltan datos requeridos para guardar la auditoria');
      }

      const db = await getOfflineDatabase();
      if (!db) {
        throw new Error('No se pudo inicializar la base de datos offline');
      }

      const auditoriaId = datosAuditoria.id || datosAuditoria.auditoriaId || generateOfflineId();
      const authData = {
        userId: userProfile?.uid || datosAuditoria.usuarioId,
        userEmail: userProfile?.email || datosAuditoria.usuarioEmail || 'usuario@ejemplo.com',
        usuarioEmail: userProfile?.email || datosAuditoria.usuarioEmail || 'usuario@ejemplo.com',
        userDisplayName: userProfile?.displayName || userProfile?.email || 'Usuario',
        userRole: userProfile?.role || 'operario',
        ownerId: userProfile?.ownerId || datosAuditoria.ownerId || null
      };

      const saveData = {
        id: auditoriaId,
        ...datosAuditoria,
        ...authData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'pending_sync',
        estadisticas: this.generarEstadisticas(datosAuditoria.respuestas),
        nombreArchivo: this.generarNombreArchivo(datosAuditoria.empresa, datosAuditoria.sucursal, userProfile)
      };

      await db.put('auditorias', saveData);

      logger.debug(`[SYNC DEBUG] tipo: CREATE_AUDITORIA | id: ${auditoriaId} | origen: manual | action: save_offline`);

      // Limpiar fotos previas si ya existía un borrador con este ID
      const fotosPrevias = await db.getAllFromIndex('fotos', 'by-auditoriaId', auditoriaId);
      for (const foto of fotosPrevias) {
        await db.delete('fotos', foto.id);
      }

      if (datosAuditoria.imagenes && datosAuditoria.imagenes.length > 0) {
        await this.guardarFotosOffline(datosAuditoria.imagenes, auditoriaId, db);
      }

      await syncQueueService.enqueueAuditoria(saveData, 1, { origin: 'manual' });
      return auditoriaId;
    } catch (error) {
      logger.error('Error al guardar auditoria offline:', error);
      throw error;
    }
  }

  static async guardarFotosOffline(imagenes, auditoriaId, db) {
    try {
      for (let seccionIndex = 0; seccionIndex < imagenes.length; seccionIndex++) {
        const seccionImagenes = imagenes[seccionIndex];
        if (!Array.isArray(seccionImagenes)) continue;

        for (let preguntaIndex = 0; preguntaIndex < seccionImagenes.length; preguntaIndex++) {
          const cell = seccionImagenes[preguntaIndex];
          const items = Array.isArray(cell) ? cell : [cell];

          for (const imagen of items) {
            if (imagen && typeof imagen === 'object' && imagen.fileId) {
              continue;
            }

            if (imagen instanceof File) {
              const fotoId = generateOfflineId();
              const fotoData = {
                id: fotoId,
                auditoriaId,
                seccionIndex,
                preguntaIndex,
                blob: imagen,
                mime: imagen.type,
                width: 0,
                height: 0,
                size: imagen.size,
                createdAt: Date.now(),
                originalName: imagen.name
              };

              await db.put('fotos', fotoData);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error al guardar fotos offline:', error);
      throw error;
    }
  }

  static async obtenerAuditorias(userProfile, filtros = {}) {
    try {
      if (!userProfile?.ownerId) {
        logger.warn('[auditoriaService.obtenerAuditorias] ownerId no disponible');
        return [];
      }

      const ownerId = userProfile.ownerId;
      const reportesRef = collection(dbAudit, ...firestoreRoutesCore.reportes(ownerId));

      let auditorias = [];

      if (userProfile.role === 'operario') {
        const queries = [
          query(reportesRef, where('creadoPor', '==', userProfile.uid)),
          query(reportesRef, where('usuarioId', '==', userProfile.uid))
        ];

        const snapshots = await Promise.all(queries.map((q) => getDocs(q).catch(() => ({ docs: [] }))));
        const allAuditorias = snapshots.flatMap((s) => s.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })));
        auditorias = Array.from(new Map(allAuditorias.map((a) => [a.id, a])).values());
      } else {
        const snapshot = await getDocs(reportesRef);
        auditorias = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }));
      }

      auditorias = auditorias.sort((a, b) => {
        const timestampA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
        const timestampB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
        return timestampB - timestampA;
      });

      let auditoriasFiltradas = auditorias;

      if (filtros.empresa) {
        auditoriasFiltradas = auditoriasFiltradas.filter((a) =>
          a.empresaNombre?.toLowerCase().includes(filtros.empresa.toLowerCase())
        );
      }

      if (filtros.fechaDesde) {
        auditoriasFiltradas = auditoriasFiltradas.filter((a) =>
          new Date(a.fechaCreacion) >= new Date(filtros.fechaDesde)
        );
      }

      if (filtros.fechaHasta) {
        auditoriasFiltradas = auditoriasFiltradas.filter((a) =>
          new Date(a.fechaCreacion) <= new Date(filtros.fechaHasta)
        );
      }

      return auditoriasFiltradas;
    } catch (error) {
      logger.error('Error al obtener auditorias:', error);
      throw error;
    }
  }

  static async obtenerEstadisticasGenerales(userProfile) {
    try {
      const auditorias = await this.obtenerAuditorias(userProfile);

      const estadisticas = {
        totalAuditorias: auditorias.length,
        porEmpresa: {},
        porMes: {},
        promedioConformidad: 0
      };

      let totalConformes = 0;
      let totalRespuestas = 0;

      auditorias.forEach((auditoria) => {
        const empresa = auditoria.empresaNombre || 'Sin empresa';
        estadisticas.porEmpresa[empresa] = (estadisticas.porEmpresa[empresa] || 0) + 1;

        const fecha = new Date(auditoria.fechaCreacion);
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        estadisticas.porMes[mes] = (estadisticas.porMes[mes] || 0) + 1;

        if (auditoria.estadisticas?.conteo) {
          totalConformes += auditoria.estadisticas.conteo.Conforme || 0;
          totalRespuestas += auditoria.estadisticas.total || 0;
        }
      });

      estadisticas.promedioConformidad =
        totalRespuestas > 0 ? ((totalConformes / totalRespuestas) * 100).toFixed(2) : 0;

      return estadisticas;
    } catch (error) {
      logger.error('Error al obtener estadisticas:', error);
      throw error;
    }
  }
}

export default AuditoriaService;








