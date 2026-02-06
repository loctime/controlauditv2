/**
 * Resolver global de carpetas basado en contexto de evento
 * Iteración 1: Resuelve estructura de carpetas según contextType y configuración
 * 
 * Responsabilidades:
 * - Validar contexto básico (tipos, campos requeridos)
 * - Resolver estructura completa de carpetas
 * - Cachear resoluciones para performance
 */

import { ensureTaskbarFolder, ensureSubFolder } from './controlFileB2Service';
import { FileContext } from '../types/fileContext';
import { getContextConfig } from '../config/contextConfig';

/**
 * Cache en memoria para resoluciones de carpetas
 * Evita múltiples llamadas a ControlFile para la misma estructura
 * Límite: 100 entradas (LRU implícito por orden de acceso)
 */
const MAX_CACHE_SIZE = 100;
const folderCache = new Map<string, string>();

/**
 * Genera clave de cache para una estructura de carpetas
 */
function getCacheKey(context: FileContext): string {
  const parts = [
    context.contextType,
    context.contextEventId,
    context.companyId,
    context.sucursalId || '',
    context.tipoArchivo,
  ];
  return parts.join('|');
}

/**
 * Limpia cache si excede el tamaño máximo (mantiene las más recientes)
 */
function maintainCache(): void {
  if (folderCache.size > MAX_CACHE_SIZE) {
    // Eliminar las primeras entradas (más antiguas) - LRU implícito
    const entriesToRemove = folderCache.size - MAX_CACHE_SIZE;
    const keysToRemove = Array.from(folderCache.keys()).slice(0, entriesToRemove);
    keysToRemove.forEach(key => folderCache.delete(key));
  }
}

/**
 * Valida el contexto básico según configuración
 * 
 * Iteración 1: Solo validaciones de tipos y campos requeridos
 * Iteración 2: Agregar validación de existencia en Firestore
 * 
 * @param context - Contexto del archivo a validar
 * @throws Error si el contexto no cumple con los requisitos del contextType
 */
function validateContext(context: FileContext): void {
  const config = getContextConfig(context.contextType);

  if (!context.contextEventId || context.contextEventId.trim() === '') {
    throw new Error(`contextEventId es requerido y no puede estar vacío`);
  }

  if (config.requiresCompanyId && (!context.companyId || context.companyId.trim() === '')) {
    throw new Error(`companyId es requerido para contextType "${context.contextType}"`);
  }

  if (config.requiresSucursalId && (!context.sucursalId || context.sucursalId.trim() === '')) {
    throw new Error(`sucursalId es requerido para contextType "${context.contextType}"`);
  }

  if (config.requiresTipoArchivo && (!context.tipoArchivo || context.tipoArchivo.trim() === '')) {
    throw new Error(`tipoArchivo es requerido para contextType "${context.contextType}"`);
  }

  if (!config.validTiposArchivo.includes(context.tipoArchivo)) {
    throw new Error(
      `tipoArchivo "${context.tipoArchivo}" no es válido para contextType "${context.contextType}". ` +
      `Tipos permitidos: ${config.validTiposArchivo.join(', ')}`
    );
  }
}

/**
 * Resuelve la estructura completa de carpetas según el contexto de evento
 * 
 * Estructura objetivo:
 * ControlAudit/
 * └── Archivos/
 *     └── {contextType}/
 *         └── {contextEventId}/
 *             └── {companyId}/           (opcional según contexto)
 *                 └── {sucursalId}/      (opcional según contexto)
 *                     └── {tipoArchivo}/
 * 
 * La función valida el contexto, verifica cache, y crea la estructura completa
 * si no existe. Los resultados se cachean para mejorar performance.
 * 
 * @param context - Contexto del archivo con todos los campos requeridos
 * @returns Promise<string> - ID de la carpeta final (parentId) donde se debe subir el archivo
 * @throws Error si la validación falla o no se puede crear la estructura
 */
export async function resolveContextFolder(context: FileContext): Promise<string> {
  // Validar contexto antes de resolver carpetas
  validateContext(context);
  
  const config = getContextConfig(context.contextType);

  // Verificar cache
  const cacheKey = getCacheKey(context);
  const cachedFolderId = folderCache.get(cacheKey);
  if (cachedFolderId) {
    return cachedFolderId;
  }

  try {
    const folderConfig = config.folderConfig || {
      rootFolderName: 'Archivos',
      useArchivosRoot: true,
      includeEventFolder: true,
      includeCompanyFolder: config.requiresCompanyId,
      includeSucursalFolder: config.requiresSucursalId,
      includeTipoArchivoFolder: true,
    };

    const useArchivosRoot = folderConfig.useArchivosRoot ?? true;
    const includeEventFolder = folderConfig.includeEventFolder ?? true;
    const includeCompanyFolder = folderConfig.includeCompanyFolder ?? config.requiresCompanyId;
    const includeSucursalFolder = folderConfig.includeSucursalFolder ?? config.requiresSucursalId;
    const includeTipoArchivoFolder = folderConfig.includeTipoArchivoFolder ?? true;

    // 1. Carpeta principal ControlAudit
    const mainFolderId = await ensureTaskbarFolder('ControlAudit');
    if (!mainFolderId) {
      throw new Error('No se pudo crear/obtener carpeta principal ControlAudit');
    }

    // 2. Carpeta raíz configurable (por defecto: Archivos)
    let currentFolderId = mainFolderId;
    if (useArchivosRoot) {
      const archivosFolderId = await ensureSubFolder(folderConfig.rootFolderName, mainFolderId);
      if (!archivosFolderId) {
        throw new Error(`No se pudo crear carpeta ${folderConfig.rootFolderName}`);
      }
      currentFolderId = archivosFolderId;

      // 3. Carpeta por contextType (solo si usamos raíz Archivos)
      const contextTypeFolderId = await ensureSubFolder(context.contextType, currentFolderId);
      if (!contextTypeFolderId) {
        throw new Error(`No se pudo crear carpeta contextType: ${context.contextType}`);
      }
      currentFolderId = contextTypeFolderId;
    } else {
      const rootFolderId = await ensureSubFolder(folderConfig.rootFolderName, currentFolderId);
      if (!rootFolderId) {
        throw new Error(`No se pudo crear carpeta ${folderConfig.rootFolderName}`);
      }
      currentFolderId = rootFolderId;
    }

    // 4. Carpeta por contextEventId (si aplica)
    const shouldIncludeEventFolder =
      includeEventFolder &&
      !(context.contextType === 'auditoria' && context.contextEventId === 'auditoria_general');
    if (shouldIncludeEventFolder) {
      const eventFolderId = await ensureSubFolder(context.contextEventId, currentFolderId);
      if (!eventFolderId) {
        throw new Error(`No se pudo crear carpeta evento: ${context.contextEventId}`);
      }
      currentFolderId = eventFolderId;
    }

    // 5. Carpeta por companyId (si aplica)
    if (includeCompanyFolder && context.companyId) {
      const companyFolderId = await ensureSubFolder(context.companyId, currentFolderId);
      if (!companyFolderId) {
        throw new Error(`No se pudo crear carpeta empresa: ${context.companyId}`);
      }
      currentFolderId = companyFolderId;
    }

    // 6. Carpeta por sucursalId (si aplica)
    if (includeSucursalFolder && context.sucursalId) {
      const sucursalFolderId = await ensureSubFolder(context.sucursalId, currentFolderId);
      if (!sucursalFolderId) {
        throw new Error(`No se pudo crear carpeta sucursal: ${context.sucursalId}`);
      }
      currentFolderId = sucursalFolderId;
    }

    // 7. Carpeta por tipoArchivo (si aplica)
    if (includeTipoArchivoFolder) {
      const tipoArchivoFolderId = await ensureSubFolder(context.tipoArchivo, currentFolderId);
      if (!tipoArchivoFolderId) {
        throw new Error(`No se pudo crear carpeta tipoArchivo: ${context.tipoArchivo}`);
      }
      currentFolderId = tipoArchivoFolderId;
    }

    // Guardar en cache y mantener tamaño
    folderCache.set(cacheKey, currentFolderId);
    maintainCache();

    return currentFolderId;
  } catch (error) {
    console.error('[contextFolderResolver] ❌ Error al resolver carpeta:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Limpia el cache de carpetas
 * 
 * Útil para testing o cuando se necesita forzar recreación de estructuras.
 * En producción, el cache se mantiene automáticamente con límite de tamaño.
 * 
 * @returns void
 */
export function clearFolderCache(): void {
  folderCache.clear();
}

/**
 * Exporta validación para uso en otros servicios
 * Útil para validar contexto antes de construir FileContext completo
 * 
 * @param context - Contexto a validar
 * @throws Error si el contexto no es válido
 */
export { validateContext };
