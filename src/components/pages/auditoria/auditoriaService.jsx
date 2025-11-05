// Servicio centralizado para operaciones de auditoría
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { uploadToControlFile, getDownloadUrl } from '../../../services/controlFileService';
import { getControlFileFolders } from '../../../services/controlFileInit';
import { prepararDatosParaFirestore, registrarAccionSistema } from '../../../utils/firestoreUtils';
import { getOfflineDatabase, generateOfflineId } from '../../../services/offlineDatabase';
import syncQueueService from '../../../services/syncQueue';

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
    
    // Obtener carpeta de auditorías desde ControlFile
    let folderIdAuditorias = null;
    try {
      const folders = await getControlFileFolders();
      folderIdAuditorias = folders.subFolders?.auditorias;
      if (!folderIdAuditorias) {
        console.warn('[AuditoriaService] ⚠️ No se encontró carpeta de auditorías, usando raíz');
      }
    } catch (error) {
      console.error('[AuditoriaService] Error al obtener carpetas ControlFile:', error);
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
        
        if (imagen instanceof File) {
          try {
            console.debug(`[AuditoriaService] Subiendo archivo a ControlFile: ${imagen.name}, tamaño: ${(imagen.size/1024/1024).toFixed(2)}MB`);
            
            // Subir imagen a ControlFile
            const fileId = await uploadToControlFile(imagen, folderIdAuditorias);
            
            // Obtener URL de descarga
            const url = await getDownloadUrl(fileId);
            
            const timestamp = Date.now();
            const imagenProcesada = {
              nombre: imagen.name,
              tipo: imagen.type,
              tamaño: imagen.size,
              url: url,
              fileId: fileId, // Guardar fileId para referencia futura
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
          // Si es una URL directa (compatibilidad con URLs antiguas)
          console.debug(`[AuditoriaService] Imagen como URL:`, imagen);
          seccionImagenes.push({
            nombre: 'imagen_existente',
            tipo: 'image/*',
            tamaño: 0,
            url: imagen,
            timestamp: Date.now()
          });
        } else if (Array.isArray(imagen) && imagen.length > 0) {
          // Si es un array de imágenes, procesar la primera
          console.debug(`[AuditoriaService] Array de imágenes, procesando primera:`, imagen);
          const primeraImagen = imagen[0];
          if (primeraImagen instanceof File) {
            try {
              const fileId = await uploadToControlFile(primeraImagen, folderIdAuditorias);
              const url = await getDownloadUrl(fileId);
              
              seccionImagenes.push({
                nombre: primeraImagen.name,
                tipo: primeraImagen.type,
                tamaño: primeraImagen.size,
                url: url,
                fileId: fileId,
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
            // Si es un objeto de imagen, mantenerlo como objeto
            if (item && typeof item === 'object' && item.url && typeof item.url === 'string') {
              return item; // Mantener objeto de imagen intacto
            }
            return this.limpiarArraysAnidados(item);
          });
        } else {
          // Si es un objeto de imagen, mantenerlo como objeto
          if (valor && typeof valor === 'object' && valor.url && typeof valor.url === 'string') {
            objLimpio[key] = valor; // Mantener objeto de imagen intacto
          } else {
            objLimpio[key] = this.limpiarArraysAnidados(valor);
          }
        }
      });
      return objLimpio;
    }
    return obj;
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
            // Si es un objeto de imagen con URL, mantenerlo como objeto
            if (valor.url && typeof valor.url === 'string') {
              return {
                url: valor.url,
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

      // Procesar imágenes si existen
      let imagenesProcesadas = [];
      if (datosAuditoria.imagenes && datosAuditoria.imagenes.length > 0) {
        imagenesProcesadas = await this.procesarImagenes(datosAuditoria.imagenes);
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
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid || null,
        timestamp: serverTimestamp(),
        fechaCreacion: new Date().toISOString(),
        version: "2.0",
        // Guardar firmas
        firmaAuditor: datosAuditoria.firmaAuditor || null,
        firmaResponsable: datosAuditoria.firmaResponsable || null
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

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, "reportes"), datosLimpios);

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
        clienteAdminId: userProfile?.clienteAdminId || datosAuditoria.clienteAdminId || userProfile?.uid || datosAuditoria.usuarioId
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
      let oldUid = userProfile.migratedFromUid;
      
      // Si no hay migratedFromUid, buscar por email para encontrar datos antiguos
      if (!oldUid && userProfile.email) {
        console.log('[auditoriaService.obtenerAuditorias] No hay migratedFromUid, buscando por email:', userProfile.email);
        const usuariosRef = collection(db, 'usuarios');
        const emailQuery = query(usuariosRef, where('email', '==', userProfile.email));
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          const usuariosConEmail = emailSnapshot.docs.filter(doc => doc.id !== userProfile.uid);
          if (usuariosConEmail.length > 0) {
            oldUid = usuariosConEmail[0].id;
            console.log('[auditoriaService.obtenerAuditorias] ⚠️ Encontrado usuario antiguo por email:', oldUid);
          }
        }
      }
      
      let auditorias = [];
      
      // Aplicar filtros según el rol del usuario (SIN orderBy para evitar índices compuestos)
      if (userProfile.role === 'operario') {
        const queries = [
          query(collection(db, "reportes"), where("creadoPor", "==", userProfile.uid)),
          query(collection(db, "reportes"), where("usuarioId", "==", userProfile.uid))
        ];
        
        if (oldUid) {
          queries.push(
            query(collection(db, "reportes"), where("creadoPor", "==", oldUid)),
            query(collection(db, "reportes"), where("usuarioId", "==", oldUid))
          );
        }
        
        const snapshots = await Promise.all(queries.map(q => getDocs(q).catch(() => ({ docs: [] }))));
        const allAuditorias = snapshots.flatMap(s => s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const uniqueAuditorias = Array.from(new Map(allAuditorias.map(a => [a.id, a])).values());
        
        // Ordenar en memoria por timestamp
        auditorias = uniqueAuditorias.sort((a, b) => {
          const timestampA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
          const timestampB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
          return timestampB - timestampA;
        });
      } else if (userProfile.role === 'max') {
        const queries = [
          query(collection(db, "reportes"), where("clienteAdminId", "==", userProfile.uid)),
          query(collection(db, "reportes"), where("creadoPor", "==", userProfile.uid)),
          query(collection(db, "reportes"), where("usuarioId", "==", userProfile.uid))
        ];
        
        if (oldUid) {
          queries.push(
            query(collection(db, "reportes"), where("clienteAdminId", "==", oldUid)),
            query(collection(db, "reportes"), where("creadoPor", "==", oldUid)),
            query(collection(db, "reportes"), where("usuarioId", "==", oldUid))
          );
        }
        
        const snapshots = await Promise.all(queries.map(q => getDocs(q).catch(() => ({ docs: [] }))));
        const allAuditorias = snapshots.flatMap(s => s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const uniqueAuditorias = Array.from(new Map(allAuditorias.map(a => [a.id, a])).values());
        
        // Ordenar en memoria por timestamp
        auditorias = uniqueAuditorias.sort((a, b) => {
          const timestampA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
          const timestampB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
          return timestampB - timestampA;
        });
      } else {
        // Para supermax, no aplicar filtros (puede ver todo)
        const snapshot = await getDocs(collection(db, "reportes"));
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
