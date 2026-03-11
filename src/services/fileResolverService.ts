import { convertirShareTokenAUrl } from '../utils/imageUtils';
import { getDownloadUrl as getDownloadUrlByFileId } from './controlFileB2Service';
import { classifyPreviewType } from './fileValidationPolicy';

export function resolveViewUrl(fileRef) {
  if (!fileRef) return null;
  if (fileRef.shareToken) {
    return convertirShareTokenAUrl(fileRef.shareToken);
  }
  return null;
}

export async function resolveDownloadUrl(fileRef) {
  if (!fileRef) return null;

  if (fileRef.fileId) {
    try {
      return await getDownloadUrlByFileId(fileRef.fileId);
    } catch (_error) {
      // fallback below
    }
  }

  return resolveViewUrl(fileRef);
}

// Alias explicito para uso de UI/servicios con contrato uniforme basado en FileRef.
export async function getDownloadUrl(fileRef) {
  return await resolveDownloadUrl(fileRef);
}

export async function resolveFileAccess(fileRef) {
  const viewUrl = resolveViewUrl(fileRef);
  const downloadUrl = await resolveDownloadUrl(fileRef);
  const previewType = classifyPreviewType(fileRef?.mimeType || '');

  return {
    previewType,
    viewUrl,
    downloadUrl
  };
}
