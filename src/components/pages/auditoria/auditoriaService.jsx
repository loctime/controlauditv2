// Servicio centralizado para operaciones de auditoría
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, getDocs as getDocsQuery } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { uploadFileWithContext } from '../../../services/unifiedFileUploadService';
import { prepararDatosParaFirestore, registrarAccionSistema } from '../../../utils/firestoreUtils';
import { getOfflineDatabase, generateOfflineId } from '../../../services/offlineDatabase';
import syncQueueService from '../../../services/syncQueue';
import AccionesRequeridasService from '../../../services/accionesRequeridasService';

/**
 * Servicio centralizado para operaciones de auditoría
 * Maneja guardado, consultas, procesamiento de imágenes y estadísticas
 */
class AuditoriaService {
  
  /**
   * Genera estadísticas de respuestas de auditoría
   * @param {Array} respuestas - Array de respuestas
   * @returns {Object} Estadísticas calculadas
   */
  static generarEstadisticas(respuestas) {
    const respuestasPlanas = Array.isArray(respuestas) ? respuestas.flat() : [];
    
    const estadisticas = {
      Conforme: respuestasPlanas.filter(r => r === "Conforme").length,
      "No conforme": respuestasPlanas.filter(r => r === "No conforme").length,
      "Necesita mejora": respuestasPlanas.filter(r => r === "Necesita mejora").length,
      "No aplica": respuestasPlanas.filter(r => r === "No aplica").length,
    };

    const total = respuestasPlanas.length;
    const porcentajes = {};
    
    Object.keys(estadisticas).forEach(key => {
      porcentajes[key] = total > 0 ? ((estadisticas[key] / total) * 100).toFixed(2) : 0;
    });

    return {
      conteo: estadisticas,
      porcentajes,
      total,
      sinNoAplica: {
        ...estadisticas,
        "No aplica": 0
      }
    };
  }

  /**
   * Procesa y sube imágenes a ControlFile
   * @param {Array} imagenes - Array de archivos de imagen
   * @returns {Promise<Array>} URLs de las imágenes subidas
   */
  static async procesarImagenes(imagenes) {
    console.debug('[AuditoriaService] Procesando imágenes:', imagenes);
    
    if (!Array.isArray(imagenes)) {
      console.warn('[AuditoriaService] imagenes no es un array:', imagenes);
      return [];
    }
    
    const imagenesProcesadas = [];
    
    for (let seccionIndex = 0; seccionIndex < imagenes.length; seccionIndex++) {
      const seccionImagenes = [];
      const seccionActual = imagenes[seccionIndex];
      
      console.debug(`[AuditoriaService] Procesando sección ${seccionIndex}:`, seccionActual);
      
      if (!Array.isArray(seccionActual)) {
        console.warn(`[AuditoriaService] Sección ${seccionIndex} no es un array:`, seccionActual);
        imagenesProcesadas.push([]);
        continue;
      }
      
      for (let preguntaIndex = 0; preguntaIndex < seccionActual.length; preguntaIndex++) {
        const imagen = seccionActual[preguntaIndex];
        
        console.debug(`[AuditoriaService] Procesando imagen sección ${seccionIndex}, pregunta ${preguntaIndex}:`, imagen);
        
        // ✅ REGLA DE ORO: Si imagen tiene fileId, preservar sin subir (ya fue subida)
        if (imagen && typeof imagen === 'object' && imagen.fileId) {
          console.log(`[AuditoriaService] Imagen ya subida, preservando fileId: ${imagen.fileId}`);
          seccionImagenes.push(imagen);
          continue;
        }
        
        // ✅ Si tiene url pero no fileId, preservar (compatibilidad)
        if (imagen && typeof imagen === 'object' && imagen.url && !imagen.fileId) {
          console.log(`[AuditoriaService] Imagen con URL preservada: ${imagen.url}`);
          seccionImagenes.push(imagen);
          continue;
        }
        
        // Solo subir si es File
        if (imagen instanceof File) {
          try {
            console.log(`[AuditoriaService] 📤 Subiendo archivo a ControlFile: ${imagen.name}, tamaño: ${(imagen.size/1024/1024).toFixed(2)}MB`);
            
            const result = await uploadFileWithContext({
              file: imagen,
              context: {
                contextType: 'auditoria',
                contextEventId: 'auditoria_general',
                companyId: 'system',
                tipoArchivo: 'evidencia'
              },
              fecha: new Date()
            });
            
            const timestamp = Date.now();
            // ✅ Guardar shareToken con seccionId y preguntaId
            const imagenProcesada = {
              fileId: result.fileId,
              shareToken: result.shareToken,
              seccionId: seccionIndex.toString(),
              preguntaId: preguntaIndex.toString(),
              nombre: imagen.name,
              tipo: imagen.type,
              tamaño: imagen.size,
              timestamp: timestamp
            };
            
            console.debug(`[AuditoriaService] Imagen subida exitosamente a ControlFile:`, imagenProcesada);
            seccionImagenes.push(imagenProcesada);
          } catch (error) {
            console.error(`[AuditoriaService] Error al procesar imagen:`, error);
            seccionImagenes.push(null);
          }
        } else if (imagen && typeof imagen === 'object' && imagen.url) {
          // Si ya es un objeto con URL (ya procesada - compatible con URLs antiguas de Storage)
          console.debug(`[AuditoriaService] Imagen ya procesada:`, imagen);
          seccionImagenes.push(imagen);
        } else if (typeof imagen === 'string' && imagen.trim() !== '') {
          // Si es string, puede ser shareToken o URL antigua
          // Si empieza con http, es URL antigua (solo lectura, no guardar)
          // Si no, asumir que es shareToken
          if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
            console.debug(`[AuditoriaService] ⚠️ URL antigua detectada (solo lectura):`, imagen);
            // NO guardar URL, solo mantener para compatibilidad de lectura
            seccionImagenes.push({
              nombre: 'imagen_existente',
              tipo: 'image/*',
              tamaño: 0,
              timestamp: Date.now()
            });
          } else {
            // Asumir que es shareToken
            console.debug(`[AuditoriaService] ✅ ShareToken detectado:`, imagen);
            seccionImagenes.push({
              nombre: 'imagen_existente',
              tipo: 'image/*',
              tamaño: 0,
              shareToken: imagen,
              timestamp: Date.now()
            });
          }
        } else if (Array.isArray(imagen) && imagen.length > 0) {
          // Si es un array de imágenes, procesar la primera
          console.debug(`[AuditoriaService] Array de imágenes, procesando primera:`, imagen);
          const primeraImagen = imagen[0];
          if (primeraImagen instanceof File) {
            try {
            const result = await uploadFileWithContext({
              file: primeraImagen,
              context: {
                contextType: 'auditoria',
                contextEventId: 'auditoria_general',
                companyId: 'system',
                tipoArchivo: 'evidencia'
              },
              fecha: new Date()
            });
              
              seccionImagenes.push({
                fileId: result.fileId,
                shareToken: result.shareToken,
                seccionId: seccionIndex.toString(),
                preguntaId: preguntaIndex.toString(),
                nombre: primeraImagen.name,
                tipo: primeraImagen.type,
                tamaño: primeraImagen.size,
                timestamp: Date.now()
              });
            } catch (error) {
              console.error(`[AuditoriaService] Error al procesar primera imagen del array:`, error);
              seccionImagenes.push(null);
            }
          } else if (primeraImagen && typeof primeraImagen === 'object' && primeraImagen.url) {
            seccionImagenes.push(primeraImagen);
          } else {
            seccionImagenes.push(null);
          }
        } else {
          console.debug(`[AuditoriaService] Imagen no válida o null:`, imagen);
          seccionImagenes.push(null);
        }
      }
      
      console.debug(`[AuditoriaService] Sección ${seccionIndex} procesada:`, seccionImagenes);
      imagenesProcesadas.push(seccionImagenes);
    }
    
    console.debug('[AuditoriaService] Todas las imágenes procesadas:', imagenesProcesadas);
    return imagenesProcesadas;
  }

  /**
   * Procesa imágenes pendientes (Files) y las sube a ControlFile
   * @param {Array} imagenes - Array de Files pendientes
   * @param {string} parentFolderId - ID de la carpeta padre (legacy, ignorado en flujo unificado)
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Array>} Array de metadata de imágenes subidas
   */
  static async procesarImagenesPendientes(imagenes, auditEventId, companyId) {
    console.debug('[AuditoriaService] Procesando imágenes pendientes:', imagenes);
    
    if (!Array.isArray(imagenes)) {
      console.warn('[AuditoriaService] imagenes no es un array:', imagenes);
      return [];
    }
    
    const imagenesProcesadas = [];
    
    for (let seccionIndex = 0; seccionIndex < imagenes.length; seccionIndex++) {
      const seccionImagenes = [];
      const seccionActual = imagenes[seccionIndex];
      
      console.debug(`[AuditoriaService] Procesando sección ${seccionIndex}:`, seccionActual);
      
      if (!Array.isArray(seccionActual)) {
        console.warn(`[AuditoriaService] Sección ${seccionIndex} no es un array:`, seccionActual);
        imagenesProcesadas.push([]);
        continue;
      }
      
      for (let preguntaIndex = 0; preguntaIndex < seccionActual.length; preguntaIndex++) {
        const imagen = seccionActual[preguntaIndex];
        
        console.debug(`[AuditoriaService] Procesando imagen sección ${seccionIndex}, pregunta ${preguntaIndex}:`, imagen);
        
        // ✅ Si ya tiene fileId, preservar (ya fue subida previamente)
        if (imagen && typeof imagen === 'object' && imagen.fileId) {
          console.log(`[AuditoriaService] Imagen ya subida, preservando fileId: ${imagen.fileId}`);
          seccionImagenes.push(imagen);
          continue;
        }
        
        // ✅ Si es File, subirlo a ControlFile
        if (imagen instanceof File) {
          try {
            const nombreArchivo = `pregunta_${preguntaIndex}.png`;
            console.log(`[AuditoriaService] 📤 Subiendo archivo a ControlFile: ${nombreArchivo}, tamaño: ${(imagen.size/1024/1024).toFixed(2)}MB`);
            
            const result = await uploadFileWithContext({
              file: imagen,
              context: {
                contextType: 'auditoria',
                contextEventId: 'auditoria_general',
                companyId: companyId || 'system',
                tipoArchivo: 'evidencia'
              },
              fecha: new Date()
            });
            
            // ✅ Guardar metadata con shareToken, seccionId y preguntaId
            const imagenProcesada = {
              fileId: result.fileId,
              shareToken: result.shareToken,
              seccionId: seccionIndex.toString(),
              preguntaId: preguntaIndex.toString(),
              name: imagen.name,
              mime: imagen.type,
              size: imagen.size
            };
            
            console.debug(`[AuditoriaService] Imagen subida exitosamente a ControlFile:`, imagenProcesada);
            seccionImagenes.push(imagenProcesada);
          } catch (error) {
            console.error(`[AuditoriaService] Error al procesar imagen:`, error);
            seccionImagenes.push(null);
          }
        } else if (imagen && typeof imagen === 'object' && imagen.shareToken) {
          // Si ya es un objeto con shareToken (compatibilidad)
          console.debug(`[AuditoriaService] Imagen ya procesada:`, imagen);
          seccionImagenes.push(imagen);
        } else {
          console.debug(`[AuditoriaService] Imagen no válida o null:`, imagen);
          seccionImagenes.push(null);
        }
      }
      
      console.debug(`[AuditoriaService] Sección ${seccionIndex} procesada:`, seccionImagenes);
      imagenesProcesadas.push(seccionImagenes);
    }
    
    console.debug('[AuditoriaService] Todas las imágenes procesadas:', imagenesProcesadas);
    return imagenesProcesadas;
  }

  /**
   * Genera nombre de archivo para la auditoría
   * @param {Object} empresa - Datos de la empresa
   * @param {string} sucursal - Nombre de la sucursal
   * @param {Object} user - Datos del usuario
   * @returns {string} Nombre del archivo
   */
  static generarNombreArchivo(empresa, sucursal, user) {
    const fecha = new Date().toISOString().split('T')[0];
    const nombreEmpresa = empresa?.nombre || "Empresa";
    const ubicacion = sucursal && sucursal.trim() !== "" ? `_${sucursal}` : "_CasaCentral";
    const nombreUsuario = user?.displayName || user?.email || "Usuario";
    
    return `${nombreEmpresa}${ubicacion}_${nombreUsuario}_${fecha}`;
  }

  // Helper para limpiar arrays anidados recursivamente
  static limpiarArraysAnidados(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.limpiarArraysAnidados(item));
    } else if (obj && typeof obj === 'object') {
      const objLimpio = {};
      Object.keys(obj).forEach(key => {
        const valor = obj[key];
        if (Array.isArray(valor)) {
          // Si es un array, verificar si contiene arrays anidados
          objLimpio[key] = valor.map(item => {
            if (Array.isArray(item)) {
              return item.join(', '); // Convertir arrays anidados a string
            }
            // Si es un objeto de imagen, mantenerlo pero usar shareToken si existe
            if (item && typeof item === 'object') {
              if (item.shareToken) {
                return { ...item, shareToken: item.shareToken }; // ✅ Priorizar shareToken
              }
              // ⚠️ COMPATIBILIDAD: Si solo tiene URL (datos antiguos), mantener para lectura
              if (item.url && typeof item.url === 'string') {
                return item; // Mantener objeto de imagen intacto (solo lectura)
              }
            }
            return this.limpiarArraysAnidados(item);
          });
        } else {
          // Si es un objeto de imagen, mantenerlo pero usar shareToken si existe
          if (valor && typeof valor === 'object') {
            if (valor.shareToken) {
              objLimpio[key] = { ...valor, shareToken: valor.shareToken }; // ✅ Priorizar shareToken
            } else if (valor.url && typeof valor.url === 'string') {
              objLimpio[key] = valor; // ⚠️ COMPATIBILIDAD: Mantener objeto de imagen intacto (solo lectura)
            } else {
              objLimpio[key] = this.limpiarArraysAnidados(valor);
            }
          } else {
            objLimpio[key] = this.limpiarArraysAnidados(valor);
          }
        }
      });
      return objLimpio;
    }
    return obj;
  }

  // Helper para procesar acciones requeridas y generar IDs únicos
  static procesarAccionesRequeridas(accionesRequeridas, secciones) {
    if (!Array.isArray(accionesRequeridas) || accionesRequeridas.length === 0) {
      return [];
    }

    const accionesProcesadas = [];
    
    accionesRequeridas.forEach((seccionAcciones, seccionIndex) => {
      if (!Array.isArray(seccionAcciones)) return;
      
      seccionAcciones.forEach((accionData, preguntaIndex) => {
        if (!accionData || !accionData.requiereAccion || !accionData.accionTexto) {
          return; // Solo procesar acciones que estén marcadas y tengan texto
        }

        const seccion = secciones?.[seccionIndex];
        const preguntaTexto = seccion?.preguntas?.[preguntaIndex] || 'Pregunta sin texto';

        const accionProcesada = {
          id: accionData.id || `accion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          preguntaIndex: {
            seccionIndex,
            preguntaIndex
          },
          preguntaTexto,
          accionTexto: accionData.accionTexto,
          fechaVencimiento: accionData.fechaVencimiento ? (accionData.fechaVencimiento instanceof Date ? accionData.fechaVencimiento.toISOString() : accionData.fechaVencimiento) : null,
          estado: 'pendiente',
          fechaCreacion: new Date().toISOString(),
          fechaCompletada: null,
          completadaPor: null,
          comentarios: [],
          modificaciones: []
        };

        accionesProcesadas.push(accionProcesada);
      });
    });

    return accionesProcesadas;
  }

  // Helper para transformar arrays anidados a arrays de objetos por sección
  static anidarAObjetosPorSeccion(arr) {
    if (!Array.isArray(arr)) return [];
    
    return arr.map((valores, idx) => {
      // Si valores es un array, procesar cada elemento para evitar arrays anidados
      let valoresProcesados = [];
      if (Array.isArray(valores)) {
        valoresProcesados = valores.map(valor => {
          // Si el valor es un array, convertirlo a string o procesarlo
          if (Array.isArray(valor)) {
            return valor.join(', '); // Convertir array a string
          }
          
          // Si es un objeto (como imagen), mantenerlo como objeto pero asegurar que sea serializable
          if (valor && typeof valor === 'object' && !(valor instanceof File)) {
            // ✅ PRIORIDAD: Si tiene shareToken, guardar solo shareToken
            if (valor.shareToken) {
              return {
                shareToken: valor.shareToken,
                nombre: valor.nombre || 'imagen',
                tipo: valor.tipo || 'image/*',
                tamaño: valor.tamaño || 0,
                timestamp: valor.timestamp || Date.now()
              };
            }
            // ⚠️ COMPATIBILIDAD: Si solo tiene URL (datos antiguos), mantener para lectura pero NO guardar URL
            // Esto es solo para compatibilidad, los nuevos datos siempre deben tener shareToken
            if (valor.url && typeof valor.url === 'string') {
              return {
                // NO guardar url, solo mantener metadata
                nombre: valor.nombre || 'imagen',
                tipo: valor.tipo || 'image/*',
                tamaño: valor.tamaño || 0,
                timestamp: valor.timestamp || Date.now()
              };
            }
            // Si es otro tipo de objeto, convertirlo a string solo si es necesario
            return valor;
          }
          
          // Para strings y otros tipos primitivos, mantener como están
          return valor;
        });
      } else if (valores !== null && valores !== undefined) {
        valoresProcesados = [valores];
      }
      
      return { 
        seccion: idx, 
        valores: valoresProcesados 
      };
    });
  }

  /**
   * Guarda una auditoría (online/offline automático)
   * @param {Object} datosAuditoria - Datos de la auditoría
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Promise<string>} ID del documento guardado
   */
  static async guardarAuditoria(datosAuditoria, userProfile) {
    // Verificar conectividad
    if (!navigator.onLine) {
      return await this.guardarAuditoriaOffline(datosAuditoria, userProfile);
    }

    try {
      return await this.guardarAuditoriaOnline(datosAuditoria, userProfile);
    } catch (error) {
      console.error('❌ Error en guardado online, fallback a offline:', error);
      return await this.guardarAuditoriaOffline(datosAuditoria, userProfile);
    }
  }

  /**
   * Guarda una auditoría online en Firestore
   * @param {Object} datosAuditoria - Datos de la auditoría
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Promise<string>} ID del documento guardado
   */
  static async guardarAuditoriaOnline(datosAuditoria, userProfile) {
    try {
      // Validar datos requeridos
      if (!datosAuditoria.empresa || !datosAuditoria.formulario) {
        throw new Error("Faltan datos requeridos para guardar la auditoría");
      }

      // Validar que userProfile.uid esté presente (obligatorio para multi-tenant)
      if (!userProfile || !userProfile.uid) {
        throw new Error("userProfile.uid es requerido para guardar la auditoría en arquitectura multi-tenant");
      }

      // ✅ PASO 1: Procesar imágenes pendientes (Files) usando flujo unificado
      let imagenesProcesadas = [];
      if (datosAuditoria.imagenes && datosAuditoria.imagenes.length > 0) {
        imagenesProcesadas = await this.procesarImagenesPendientes(
          datosAuditoria.imagenes,
          null, // Legacy retirado intencionalmente: parentFolderId ya no se usa.
          datosAuditoria.empresa?.id || 'system'
        );
      }

      // Generar estadísticas
      const estadisticas = this.generarEstadisticas(datosAuditoria.respuestas);

      // Preparar datos para Firestore
      const datosCompletos = {
        empresaId: datosAuditoria.empresa?.id || null,
        empresaNombre: datosAuditoria.empresa?.nombre || null,
        sucursal: datosAuditoria.sucursal || "Casa Central",
        formularioId: datosAuditoria.formulario?.id || null,
        nombreForm: datosAuditoria.formulario?.nombre || null,
        // Guardar como arrays de objetos por sección para evitar arrays anidados
        respuestas: this.anidarAObjetosPorSeccion(datosAuditoria.respuestas),
        comentarios: this.anidarAObjetosPorSeccion(datosAuditoria.comentarios),
        imagenes: this.anidarAObjetosPorSeccion(imagenesProcesadas),
        clasificaciones: this.anidarAObjetosPorSeccion(datosAuditoria.clasificaciones || []),
        accionesRequeridas: this.procesarAccionesRequeridas(datosAuditoria.accionesRequeridas || [], datosAuditoria.secciones || []),
        secciones: Array.isArray(datosAuditoria.secciones) ? datosAuditoria.secciones.map(seccion => {
          // Asegurar que las secciones no contengan arrays anidados
          if (seccion && typeof seccion === 'object') {
            const seccionLimpia = { ...seccion };
            // Procesar preguntas si existen
            if (Array.isArray(seccionLimpia.preguntas)) {
              seccionLimpia.preguntas = seccionLimpia.preguntas.map(pregunta => {
                if (pregunta && typeof pregunta === 'object') {
                  const preguntaLimpia = { ...pregunta };
                  // Convertir arrays a strings si es necesario
                  Object.keys(preguntaLimpia).forEach(key => {
                    if (Array.isArray(preguntaLimpia[key])) {
                      preguntaLimpia[key] = preguntaLimpia[key].join(', ');
                    }
                  });
                  return preguntaLimpia;
                }
                return pregunta;
              });
            }
            return seccionLimpia;
          }
          return seccion;
        }) : [],
        estadisticas: estadisticas,
        estado: "completada",
        nombreArchivo: this.generarNombreArchivo(
          datosAuditoria.empresa, 
          datosAuditoria.sucursal, 
          userProfile
        ),
        creadoPor: userProfile?.uid || null,
        creadoPorEmail: userProfile?.email || null,
        ownerId: userProfile?.ownerId || null,
        usuarioId: userProfile?.uid || null,
        timestamp: serverTimestamp(),
        fechaCreacion: new Date().toISOString(),
        version: "2.0",
        // Guardar firmas
        firmaAuditor: datosAuditoria.firmaAuditor || null,
        firmaResponsable: datosAuditoria.firmaResponsable || null,
        // Guardar campos adicionales del reporte
        tareaObservada: datosAuditoria.tareaObservada || '',
        lugarSector: datosAuditoria.lugarSector || '',
        equiposInvolucrados: datosAuditoria.equiposInvolucrados || '',
        supervisor: datosAuditoria.supervisor || '',
        numeroTrabajadores: datosAuditoria.numeroTrabajadores || '',
        nombreInspector: datosAuditoria.nombreInspector || '',
        nombreResponsable: datosAuditoria.nombreResponsable || ''
      };

      // Limpiar valores undefined y arrays anidados
      Object.keys(datosCompletos).forEach(key => {
        if (typeof datosCompletos[key] === 'undefined') {
          datosCompletos[key] = null;
        }
      });

      // Limpiar arrays anidados recursivamente
      const datosLimpios = this.limpiarArraysAnidados(datosCompletos);

      // Log para debugging
      console.log('[AuditoriaService] Datos limpios para Firestore:', JSON.stringify(datosLimpios, null, 2));
      console.log('[AuditoriaService] Clasificaciones a guardar:', JSON.stringify(datosLimpios.clasificaciones, null, 2));

      // Guardar en Firestore owner-centric: apps/auditoria/owners/{ownerId}/reportes
      if (!userProfile?.ownerId) {
        throw new Error('ownerId es requerido para guardar reporte');
      }
      const ownerId = userProfile.ownerId; // ownerId viene del token
      const reportesRef = collection(dbAudit, ...firestoreRoutesCore.reportes(ownerId));
      console.log('[AuditoriaService] Guardando reporte en ruta owner-centric:', `apps/auditoria/owners/${ownerId}/reportes`);
      const docRef = await addDoc(reportesRef, datosLimpios);

      // Crear acciones requeridas en la subcolección de la sucursal si existen
      if (datosCompletos.accionesRequeridas && datosCompletos.accionesRequeridas.length > 0) {
        try {
          // Obtener sucursalId - buscar en la colección de sucursales del owner
          let sucursalId = null;
          if (datosAuditoria.sucursal && datosAuditoria.sucursal !== "Casa Central") {
            // Construir ruta correcta usando firestoreRoutesCore (owner-centric)
            const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerId));
            console.log('[AuditoriaService] Buscando sucursal por nombre en path:', sucursalesRef.path);
            const q = query(sucursalesRef, where("nombre", "==", datosAuditoria.sucursal));
            const sucursalesSnapshot = await getDocs(q);
            
            if (!sucursalesSnapshot.empty) {
              sucursalId = sucursalesSnapshot.docs[0].id;
            }
          }

          // Si encontramos sucursalId, crear las acciones requeridas
          if (sucursalId) {
            const sucursalDocRef = doc(dbAudit, ...firestoreRoutesCore.sucursal(ownerId, sucursalId));
            const accionesCollectionRef = collection(sucursalDocRef, 'acciones_requeridas');
            
            await AccionesRequeridasService.crearAccionesDesdeReporte(
              accionesCollectionRef,
              docRef.id,
              sucursalId,
              datosAuditoria.empresa?.id || null,
              datosCompletos.accionesRequeridas
            );
            console.log(`✅ ${datosCompletos.accionesRequeridas.length} acciones requeridas creadas en sucursal`);
          } else {
            console.warn('⚠️ No se encontró sucursalId, las acciones requeridas no se crearán en la subcolección');
          }
        } catch (accionesError) {
          // No fallar el guardado del reporte si falla la creación de acciones
          console.error('❌ Error al crear acciones requeridas (no crítico):', accionesError);
        }
      }

      // Registrar log de operación
      await registrarAccionSistema(
        userProfile?.uid,
        `Auditoría guardada: ${datosAuditoria.empresa?.nombre} - ${datosAuditoria.formulario?.nombre}`,
        {
          auditoriaId: docRef.id,
          empresa: datosAuditoria.empresa?.nombre,
          sucursal: datosAuditoria.sucursal,
          formulario: datosAuditoria.formulario?.nombre
        },
        'crear',
        'auditoria',
        docRef.id
      );

      console.log(`✅ Auditoría guardada exitosamente: ${docRef.id}`);
      return docRef.id;

    } catch (error) {
      console.error("❌ Error al guardar auditoría online:", error);
      throw error;
    }
  }

  /**
   * Guarda una auditoría offline en IndexedDB
   * @param {Object} datosAuditoria - Datos de la auditoría
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Promise<string>} ID del documento guardado
   */
  static async guardarAuditoriaOffline(datosAuditoria, userProfile) {
    try {
      // Validar datos requeridos
      if (!datosAuditoria.empresa || !datosAuditoria.formulario) {
        throw new Error("Faltan datos requeridos para guardar la auditoría");
      }

      // Inicializar base de datos offline
      const db = await getOfflineDatabase();
      if (!db) {
        throw new Error('No se pudo inicializar la base de datos offline');
      }

      // Generar ID único para la auditoría offline
      const auditoriaId = generateOfflineId();
      
      // Asegurar que tenemos los datos de auth correctos
      const authData = {
        userId: userProfile?.uid || datosAuditoria.usuarioId,
        userEmail: userProfile?.email || datosAuditoria.usuarioEmail || 'usuario@ejemplo.com',
        usuarioEmail: userProfile?.email || datosAuditoria.usuarioEmail || 'usuario@ejemplo.com',
        userDisplayName: userProfile?.displayName || userProfile?.email || 'Usuario',
        userRole: userProfile?.role || 'operario',
        ownerId: userProfile?.ownerId || datosAuditoria.ownerId || null
      };

      // Preparar datos para IndexedDB
      const saveData = {
        id: auditoriaId,
        ...datosAuditoria,
        ...authData, // Incluir todos los datos de auth
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'pending_sync',
        // Generar estadísticas
        estadisticas: this.generarEstadisticas(datosAuditoria.respuestas),
        // Generar nombre de archivo
        nombreArchivo: this.generarNombreArchivo(
          datosAuditoria.empresa, 
          datosAuditoria.sucursal, 
          userProfile
        )
      };

      // Guardar auditoría en IndexedDB
      await db.put('auditorias', saveData);

      // Procesar y guardar fotos si existen
      if (datosAuditoria.imagenes && datosAuditoria.imagenes.length > 0) {
        await this.guardarFotosOffline(datosAuditoria.imagenes, auditoriaId, db);
      }

      // Encolar para sincronización
      await syncQueueService.enqueueAuditoria(saveData, 1);

      console.log(`✅ Auditoría guardada offline: ${auditoriaId}`);
      return auditoriaId;

    } catch (error) {
      console.error("❌ Error al guardar auditoría offline:", error);
      throw error;
    }
  }

  /**
   * Guarda fotos offline en IndexedDB
   * @param {Array} imagenes - Array de imágenes
   * @param {string} auditoriaId - ID de la auditoría
   * @param {Object} db - Instancia de IndexedDB
   */
  static async guardarFotosOffline(imagenes, auditoriaId, db) {
    try {
      for (let seccionIndex = 0; seccionIndex < imagenes.length; seccionIndex++) {
        const seccionImagenes = imagenes[seccionIndex];
        
        if (!Array.isArray(seccionImagenes)) continue;

        for (let preguntaIndex = 0; preguntaIndex < seccionImagenes.length; preguntaIndex++) {
          const imagen = seccionImagenes[preguntaIndex];
          
          // ✅ REGLA DE ORO: NO guardar en IndexedDB imágenes que ya tengan fileId
          if (imagen && typeof imagen === 'object' && imagen.fileId) {
            console.log(`[AuditoriaService] Imagen ya sincronizada, NO guardando en IndexedDB: ${imagen.fileId}`);
            continue;
          }
          
          // Solo guardar File objects que aún no tienen fileId
          if (imagen instanceof File) {
            // Convertir File a Blob y guardar en IndexedDB
            const fotoId = generateOfflineId();
            const fotoData = {
              id: fotoId,
              auditoriaId: auditoriaId,
              seccionIndex: seccionIndex,
              preguntaIndex: preguntaIndex,
              blob: imagen,
              mime: imagen.type,
              width: 0, // Se puede calcular si es necesario
              height: 0,
              size: imagen.size,
              createdAt: Date.now(),
              originalName: imagen.name
            };

            await db.put('fotos', fotoData);
            
            // Actualizar referencia en la auditoría
            seccionImagenes[preguntaIndex] = {
              id: fotoId,
              offline: true,
              originalName: imagen.name,
              size: imagen.size
            };

            console.log(`📸 Foto guardada offline: ${fotoId}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error al guardar fotos offline:', error);
      throw error;
    }
  }

  /**
   * Obtiene auditorías filtradas por usuario y permisos
   * @param {Object} userProfile - Perfil del usuario
   * @param {Object} filtros - Filtros adicionales
   * @returns {Promise<Array>} Lista de auditorías
   */
  static async obtenerAuditorias(userProfile, filtros = {}) {
    try {
      // En modelo owner-centric, todas las auditorías pertenecen al ownerId
      if (!userProfile?.ownerId) {
        console.warn('[auditoriaService.obtenerAuditorias] ownerId no disponible');
        return [];
      }
      
      const ownerId = userProfile.ownerId;
      const reportesRef = collection(dbAudit, ...firestoreRoutesCore.reportes(ownerId));
      
      let auditorias = [];
      
      // Aplicar filtros según el rol del usuario (SIN orderBy para evitar índices compuestos)
      if (userProfile.role === 'operario') {
        // Operarios ven solo las auditorías compartidas con ellos o creadas por ellos
        const queries = [
          query(reportesRef, where("creadoPor", "==", userProfile.uid)),
          query(reportesRef, where("usuarioId", "==", userProfile.uid))
        ];
        
        const snapshots = await Promise.all(queries.map(q => getDocs(q).catch(() => ({ docs: [] }))));
        const allAuditorias = snapshots.flatMap(s => s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const uniqueAuditorias = Array.from(new Map(allAuditorias.map(a => [a.id, a])).values());
        
        // Ordenar en memoria por timestamp
        auditorias = uniqueAuditorias.sort((a, b) => {
          const timestampA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
          const timestampB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
          return timestampB - timestampA;
        });
      } else if (userProfile.role === 'admin') {
        // Admin ve todas las auditorías de su ownerId
        const snapshot = await getDocs(reportesRef);
        auditorias = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => {
          const timestampA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
          const timestampB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
          return timestampB - timestampA;
        });
      } else {
        // Para supermax, no aplicar filtros (puede ver todo)
        const snapshot = await getDocs(reportesRef);
        auditorias = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => {
          const timestampA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
          const timestampB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
          return timestampB - timestampA;
        });
      }

      // Aplicar filtros adicionales en memoria
      let auditoriasFiltradas = auditorias;
      
      if (filtros.empresa) {
        auditoriasFiltradas = auditoriasFiltradas.filter(a => 
          a.empresaNombre?.toLowerCase().includes(filtros.empresa.toLowerCase())
        );
      }
      
      if (filtros.fechaDesde) {
        auditoriasFiltradas = auditoriasFiltradas.filter(a => 
          new Date(a.fechaCreacion) >= new Date(filtros.fechaDesde)
        );
      }
      
      if (filtros.fechaHasta) {
        auditoriasFiltradas = auditoriasFiltradas.filter(a => 
          new Date(a.fechaCreacion) <= new Date(filtros.fechaHasta)
        );
      }

      return auditoriasFiltradas;

    } catch (error) {
      console.error("❌ Error al obtener auditorías:", error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas generales de auditorías
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Promise<Object>} Estadísticas generales
   */
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

      auditorias.forEach(auditoria => {
        // Estadísticas por empresa
        const empresa = auditoria.empresaNombre || 'Sin empresa';
        estadisticas.porEmpresa[empresa] = (estadisticas.porEmpresa[empresa] || 0) + 1;

        // Estadísticas por mes
        const fecha = new Date(auditoria.fechaCreacion);
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        estadisticas.porMes[mes] = (estadisticas.porMes[mes] || 0) + 1;

        // Calcular conformidad
        if (auditoria.estadisticas?.conteo) {
          totalConformes += auditoria.estadisticas.conteo.Conforme || 0;
          totalRespuestas += auditoria.estadisticas.total || 0;
        }
      });

      estadisticas.promedioConformidad = totalRespuestas > 0 
        ? ((totalConformes / totalRespuestas) * 100).toFixed(2) 
        : 0;

      return estadisticas;

    } catch (error) {
      console.error("❌ Error al obtener estadísticas:", error);
      throw error;
    }
  }
}

export default AuditoriaService;

