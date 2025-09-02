// Ejemplos de uso de ControlFile con manejo automático de carpetas
// Este archivo muestra cómo subir archivos con el parentId correcto

import { 
  subirArchivoConCarpeta,
  subirArchivoACarpeta,
  subirArchivoARaiz,
  getOrCreateControlAuditRootFolder,
  createControlAuditSubfolder
} from '../lib/controlfile-upload';

/**
 * 📁 EJEMPLO 1: Subir archivo a la carpeta raíz de ControlAudit
 * El archivo se subirá con parentId = "root_{uid}_controlaudit"
 */
export async function ejemploSubidaARaiz(file) {
  try {
    console.log('🚀 Subiendo archivo a carpeta raíz...');
    
    const result = await subirArchivoARaiz(file);
    
    console.log('✅ Archivo subido exitosamente:', {
      fileId: result.fileId,
      parentId: result.parentId,
      folderName: result.folderName
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error en subida a raíz:', error);
    throw error;
  }
}

/**
 * 📁 EJEMPLO 2: Subir archivo a una carpeta específica
 * Se creará automáticamente la carpeta si no existe
 * El archivo se subirá con parentId = ID de la carpeta creada
 */
export async function ejemploSubidaACarpeta(file, nombreCarpeta) {
  try {
    console.log(`🚀 Subiendo archivo a carpeta: ${nombreCarpeta}`);
    
    const result = await subirArchivoACarpeta(file, nombreCarpeta);
    
    console.log('✅ Archivo subido exitosamente:', {
      fileId: result.fileId,
      parentId: result.parentId,
      folderName: result.folderName
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error en subida a carpeta:', error);
    throw error;
  }
}

/**
 * 📁 EJEMPLO 3: Subir archivo con manejo manual de carpetas
 * Útil cuando necesitas control total sobre la estructura
 */
export async function ejemploSubidaManual(file, nombreCarpeta, parentIdExistente = null) {
  try {
    console.log('🚀 Subida manual con control de carpetas...');
    
    const result = await subirArchivoConCarpeta(file, nombreCarpeta, parentIdExistente);
    
    console.log('✅ Archivo subido exitosamente:', {
      fileId: result.fileId,
      parentId: result.parentId,
      folderName: result.folderName
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error en subida manual:', error);
    throw error;
  }
}

/**
 * 📁 EJEMPLO 4: Crear estructura de carpetas antes de subir archivos
 * Útil para organizar archivos en múltiples niveles
 */
export async function ejemploEstructuraCarpetas() {
  try {
    console.log('📁 Creando estructura de carpetas...');
    
    // 1. Obtener carpeta raíz
    const rootFolder = await getOrCreateControlAuditRootFolder();
    console.log('✅ Carpeta raíz:', rootFolder.folderId);
    
    // 2. Crear subcarpeta "Auditorias"
    const auditoriasFolder = await createControlAuditSubfolder('Auditorias', rootFolder.folderId);
    console.log('✅ Carpeta Auditorias:', auditoriasFolder.folderId);
    
    // 3. Crear subcarpeta "2024" dentro de "Auditorias"
    const folder2024 = await createControlAuditSubfolder('2024', auditoriasFolder.folderId);
    console.log('✅ Carpeta 2024:', folder2024.folderId);
    
    // 4. Crear subcarpeta "Enero" dentro de "2024"
    const eneroFolder = await createControlAuditSubfolder('Enero', folder2024.folderId);
    console.log('✅ Carpeta Enero:', eneroFolder.folderId);
    
    return {
      root: rootFolder,
      auditorias: auditoriasFolder,
      year2024: folder2024,
      enero: eneroFolder
    };
    
  } catch (error) {
    console.error('❌ Error creando estructura:', error);
    throw error;
  }
}

/**
 * 📁 EJEMPLO 5: Subir archivo a una carpeta específica usando su ID
 * Útil cuando ya conoces el ID de la carpeta destino
 */
export async function ejemploSubidaConParentId(file, parentIdConocido) {
  try {
    console.log(`🚀 Subiendo archivo con parentId conocido: ${parentIdConocido}`);
    
    // No especificar folderName, solo parentId
    const result = await subirArchivoConCarpeta(file, undefined, parentIdConocido);
    
    console.log('✅ Archivo subido exitosamente:', {
      fileId: result.fileId,
      parentId: result.parentId,
      folderName: result.folderName
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error en subida con parentId:', error);
    throw error;
  }
}

/**
 * 📁 EJEMPLO 6: Subir múltiples archivos a la misma carpeta
 * Todos los archivos tendrán el mismo parentId
 */
export async function ejemploSubidaMultiple(files, nombreCarpeta) {
  try {
    console.log(`🚀 Subiendo ${files.length} archivos a carpeta: ${nombreCarpeta}`);
    
    const results = [];
    
    for (const file of files) {
      try {
        const result = await subirArchivoACarpeta(file, nombreCarpeta);
        results.push(result);
        console.log(`✅ ${file.name} subido exitosamente`);
      } catch (error) {
        console.error(`❌ Error subiendo ${file.name}:`, error);
        // Continuar con el siguiente archivo
      }
    }
    
    console.log(`✅ Subida completada: ${results.length}/${files.length} archivos exitosos`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Error en subida múltiple:', error);
    throw error;
  }
}

/**
 * 📋 RESUMEN DE USO:
 * 
 * 1. Para subida simple a carpeta raíz:
 *    const result = await subirArchivoARaiz(file);
 * 
 * 2. Para subida a carpeta específica (se crea automáticamente):
 *    const result = await subirArchivoACarpeta(file, 'MiCarpeta');
 * 
 * 3. Para subida con control total:
 *    const result = await subirArchivoConCarpeta(file, 'MiCarpeta', parentIdExistente);
 * 
 * 4. Para crear estructura de carpetas:
 *    const estructura = await ejemploEstructuraCarpetas();
 * 
 * 5. Para subida con parentId conocido:
 *    const result = await ejemploSubidaConParentId(file, 'id_carpeta_conocida');
 * 
 * 6. Para subida múltiple:
 *    const results = await ejemploSubidaMultiple(files, 'CarpetaDestino');
 * 
 * 🎯 TODOS los archivos subidos tendrán el parentId correcto:
 * - parentId: "root_{uid}_controlaudit" (carpeta raíz)
 * - parentId: "folder_{uid}_{timestamp}_{random}" (subcarpetas)
 * 
 * 📁 Estructura en ControlFile:
 * ControlAudit/
 * ├── Archivo1.jpg (parentId: "root_uid_controlaudit")
 * ├── MiCarpeta/
 * │   ├── Archivo2.jpg (parentId: "folder_uid_timestamp_random")
 * │   └── Archivo3.jpg (parentId: "folder_uid_timestamp_random")
 * └── Auditorias/
 *     └── 2024/
 *         └── Enero/
 *             └── Archivo4.jpg (parentId: "folder_uid_timestamp_random")
 */
