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
    // Eliminar las primeras entradas (más antiguas)
    const entriesToRemove = folderCache.size - MAX_CACHE_SIZE;
    const keysToRemove = Array.from(folderCache.keys()).slice(0, entriesToRemove);
    keysToRemove.forEach(key => folderCache.delete(key));
    console.log(`[contextFolderResolver] 🧹 Cache limpiado: ${entriesToRemove} entradas removidas`);
  }
}

/**
 * Resuelve la estructura completa de carpetas según el contexto
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
 * @param context - Contexto del archivo
 * @returns Promise<string> - ID de la carpeta final (parentId)
 * @throws Error si la validación falla o no se puede crear la estructura
 */
/**
 * Valida el contexto básico según configuración
 * Iteración 1: Solo validaciones de tipos y campos requeridos
 * Iteración 2: Agregar validación de existencia en Firestore
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

export async function resolveContextFolder(context: FileContext): Promise<string> {
  // Validar contexto antes de resolver carpetas
  validateContext(context);
  
  const config = getContextConfig(context.contextType);

  // Verificar cache
  const cacheKey = getCacheKey(context);
  if (folderCache.has(cacheKey)) {
    const cachedFolderId = folderCache.get(cacheKey);
    if (cachedFolderId) {
      console.log(`[contextFolderResolver] ✅ Usando carpeta desde cache: ${cacheKey}`);
      return cachedFolderId;
    }
  }

  try {
    // 1. Carpeta principal ControlAudit
    const mainFolderId = await ensureTaskbarFolder('ControlAudit');
    if (!mainFolderId) {
      throw new Error('No se pudo crear/obtener carpeta principal ControlAudit');
    }

    // 2. Carpeta Archivos (reemplaza Evidencias)
    const archivosFolderId = await ensureSubFolder('Archivos', mainFolderId);
    if (!archivosFolderId) {
      throw new Error('No se pudo crear carpeta Archivos');
    }

    // 3. Carpeta por contextType
    const contextTypeFolderId = await ensureSubFolder(context.contextType, archivosFolderId);
    if (!contextTypeFolderId) {
      throw new Error(`No se pudo crear carpeta contextType: ${context.contextType}`);
    }

    // 4. Carpeta por contextEventId
    const eventFolderId = await ensureSubFolder(context.contextEventId, contextTypeFolderId);
    if (!eventFolderId) {
      throw new Error(`No se pudo crear carpeta evento: ${context.contextEventId}`);
    }

    // 5. Carpeta por companyId (si es requerido)
    let currentFolderId = eventFolderId;
    if (config.requiresCompanyId && context.companyId) {
      const companyFolderId = await ensureSubFolder(context.companyId, currentFolderId);
      if (!companyFolderId) {
        throw new Error(`No se pudo crear carpeta empresa: ${context.companyId}`);
      }
      currentFolderId = companyFolderId;
    }

    // 6. Carpeta por sucursalId (si es requerido)
    if (config.requiresSucursalId && context.sucursalId) {
      const sucursalFolderId = await ensureSubFolder(context.sucursalId, currentFolderId);
      if (!sucursalFolderId) {
        throw new Error(`No se pudo crear carpeta sucursal: ${context.sucursalId}`);
      }
      currentFolderId = sucursalFolderId;
    }

    // 7. Carpeta por tipoArchivo (siempre presente)
    const tipoArchivoFolderId = await ensureSubFolder(context.tipoArchivo, currentFolderId);
    if (!tipoArchivoFolderId) {
      throw new Error(`No se pudo crear carpeta tipoArchivo: ${context.tipoArchivo}`);
    }

    // Guardar en cache y mantener tamaño
    folderCache.set(cacheKey, tipoArchivoFolderId);
    maintainCache();

    const path = [
      'Archivos',
      context.contextType,
      context.contextEventId,
      config.requiresCompanyId ? context.companyId : null,
      config.requiresSucursalId ? context.sucursalId : null,
      context.tipoArchivo
    ].filter(Boolean).join('/');

    console.log(`[contextFolderResolver] ✅ Estructura creada: ${path} → ${tipoArchivoFolderId}`);

    return tipoArchivoFolderId;
  } catch (error) {
    console.error('[contextFolderResolver] ❌ Error al resolver carpeta:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Limpia el cache de carpetas
 * Útil para testing o cuando se necesita forzar recreación
 */
export function clearFolderCache(): void {
  const size = folderCache.size;
  folderCache.clear();
  console.log(`[contextFolderResolver] 🧹 Cache limpiado: ${size} entradas removidas`);
}

/**
 * Exporta validación para uso en otros servicios
 * Útil para validar antes de construir contexto
 */
export { validateContext };
