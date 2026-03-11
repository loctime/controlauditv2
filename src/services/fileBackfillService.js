import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId } from '../firebase/firestoreAppWriter';

const MODULE_COLLECTION_MAP = {
  auditorias: 'reportes',
  accidentes: 'accidentes',
  incidentes: 'accidentes',
  salud_ocupacional: 'ausencias',
  capacitaciones: 'capacitaciones'
};

function resolveCollectionPath(ownerId, module) {
  const key = MODULE_COLLECTION_MAP[module];
  if (!key) throw new Error(`Modulo no soportado para backfill: ${module}`);

  if (key === 'reportes') return firestoreRoutesCore.reportes(ownerId);
  if (key === 'accidentes') return firestoreRoutesCore.accidentes(ownerId);
  if (key === 'ausencias') return firestoreRoutesCore.ausencias(ownerId);
  return firestoreRoutesCore.capacitaciones(ownerId);
}

export async function backfillLegacyFiles({ ownerId, module, dryRun = true, batchSize = 50 }) {
  if (!ownerId) throw new Error('ownerId es requerido');

  const collectionPath = resolveCollectionPath(ownerId, module);
  const entitiesRef = collection(db, ...collectionPath);
  const snapshot = await getDocs(query(entitiesRef, limit(batchSize)));

  const results = {
    scanned: snapshot.size,
    migrated: 0,
    skipped: 0,
    dryRun
  };

  for (const entityDoc of snapshot.docs) {
    const data = entityDoc.data() || {};
    const legacyImages = Array.isArray(data.imagenes) ? data.imagenes : [];
    if (!legacyImages.length) {
      results.skipped += 1;
      continue;
    }

    if (!dryRun) {
      const filesRef = collection(db, ...collectionPath, entityDoc.id, 'files');
      for (const image of legacyImages) {
        const inferredFileId = typeof image === 'string' ? image : (image.fileId || image.id || null);
        const inferredShareToken = typeof image === 'string'
          ? (image.startsWith('http') ? null : image)
          : (image.shareToken || null);

        if (!inferredFileId && !inferredShareToken) continue;

        await addDocWithAppId(filesRef, {
          fileId: inferredFileId || inferredShareToken,
          shareToken: inferredShareToken,
          name: image?.nombre || 'legacy_file',
          mimeType: image?.mimeType || 'application/octet-stream',
          size: image?.size || 0,
          module,
          entityId: entityDoc.id,
          companyId: data.empresaId || 'system',
          uploadedBy: data.creadoPor || null,
          uploadedAt: image?.createdAt || new Date(),
          status: 'active',
          schemaVersion: 1,
          backfilledFromLegacy: true
        });
      }
    }

    results.migrated += 1;
  }

  return results;
}
