// Servicio centralizado para operaciones de auditoría
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebaseConfig';
import { prepararDatosParaFirestore, registrarLogOperario } from '../../../utils/firestoreUtils';

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
   * Procesa y sube imágenes a Firebase Storage
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
        
        if (imagen instanceof File) {
          try {
            console.debug(`[AuditoriaService] Subiendo archivo: ${imagen.name}, tamaño: ${(imagen.size/1024/1024).toFixed(2)}MB`);
            
            // Generar nombre único para la imagen
            const timestamp = Date.now();
            const nombreArchivo = `auditoria_${timestamp}_${imagen.name}`;
            const storageRef = ref(storage, `imagenes/auditorias/${nombreArchivo}`);
            
            // Subir imagen
            await uploadBytes(storageRef, imagen);
            const url = await getDownloadURL(storageRef);
            
            const imagenProcesada = {
              nombre: imagen.name,
              tipo: imagen.type,
              tamaño: imagen.size,
              url: url,
              timestamp: timestamp
            };
            
            console.debug(`[AuditoriaService] Imagen subida exitosamente:`, imagenProcesada);
            seccionImagenes.push(imagenProcesada);
          } catch (error) {
            console.error(`[AuditoriaService] Error al procesar imagen:`, error);
            seccionImagenes.push(null);
          }
        } else if (imagen && typeof imagen === 'object' && imagen.url) {
          // Si ya es un objeto con URL (ya procesada)
          console.debug(`[AuditoriaService] Imagen ya procesada:`, imagen);
          seccionImagenes.push(imagen);
        } else if (typeof imagen === 'string' && imagen.trim() !== '') {
          // Si es una URL directa
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
              const timestamp = Date.now();
              const nombreArchivo = `auditoria_${timestamp}_${primeraImagen.name}`;
              const storageRef = ref(storage, `imagenes/auditorias/${nombreArchivo}`);
              
              await uploadBytes(storageRef, primeraImagen);
              const url = await getDownloadURL(storageRef);
              
              seccionImagenes.push({
                nombre: primeraImagen.name,
                tipo: primeraImagen.type,
                tamaño: primeraImagen.size,
                url: url,
                timestamp: timestamp
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
            return this.limpiarArraysAnidados(item);
          });
        } else {
          objLimpio[key] = this.limpiarArraysAnidados(valor);
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
   * Guarda una auditoría en Firestore
   * @param {Object} datosAuditoria - Datos de la auditoría
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Promise<string>} ID del documento guardado
   */
  static async guardarAuditoria(datosAuditoria, userProfile) {
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
        // Agregar objeto empresa completo para compatibilidad con metadatos
        empresa: datosAuditoria.empresa || { id: datosAuditoria.empresaId, nombre: datosAuditoria.empresaNombre },
        empresaId: datosAuditoria.empresa?.id || null,
        empresaNombre: datosAuditoria.empresa?.nombre || null,
        sucursal: datosAuditoria.sucursal || "Casa Central",
        // Agregar objeto formulario completo para compatibilidad con metadatos
        formulario: datosAuditoria.formulario || { id: datosAuditoria.formularioId, nombre: datosAuditoria.nombreForm },
        formularioId: datosAuditoria.formulario?.id || null,
        nombreForm: datosAuditoria.formulario?.nombre || null,
        // Agregar formularioNombre para compatibilidad con metadatos
        formularioNombre: datosAuditoria.formulario?.nombre || datosAuditoria.formularioNombre || null,
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
        // Agregar campo auditor para mostrar en reportes
        auditor: userProfile?.displayName || userProfile?.nombre || userProfile?.email || 'Auditor no especificado',
        // Mantener compatibilidad con usuarioId si viene de metadatos
        usuarioId: datosAuditoria.usuarioId || userProfile?.uid || null,
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
      await registrarLogOperario(
        userProfile?.uid,
        'AUDITORIA_GUARDADA',
        {
          auditoriaId: docRef.id,
          empresa: datosAuditoria.empresa?.nombre,
          sucursal: datosAuditoria.sucursal,
          formulario: datosAuditoria.formulario?.nombre
        }
      );

      console.log(`✅ Auditoría guardada exitosamente: ${docRef.id}`);
      return docRef.id;

    } catch (error) {
      console.error("❌ Error al guardar auditoría:", error);
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
      let q = collection(db, "reportes");
      
      // Aplicar filtros según el rol del usuario
      if (userProfile.role === 'operario') {
        q = query(q, 
          where("usuarioId", "==", userProfile.uid),
          orderBy("timestamp", "desc")
        );
      } else if (userProfile.role === 'max') {
        q = query(q,
          where("clienteAdminId", "==", userProfile.uid),
          orderBy("timestamp", "desc")
        );
      }
      // Para supermax, no aplicar filtros (puede ver todo)

      const snapshot = await getDocs(q);
      const auditorias = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

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
