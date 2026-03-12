export const MAX_FILE_SIZE = 500 * 1024 * 1024;
export const WARNING_FILE_SIZE = 100 * 1024 * 1024;

export const BLOCKED_EXTENSIONS = new Set(['exe', 'bat', 'cmd', 'msi', 'sh', 'js']);

export const EXECUTABLE_MIME_PREFIXES = [
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-sh',
  'application/javascript',
  'text/javascript',
  'application/x-bat'
];

export const PREVIEWABLE_MIME_TYPES = {
  image: /^image\//i,
  pdf: /^application\/pdf$/i,
  video: /^video\//i,
  audio: /^audio\//i
};

const PREVIEWABLE_EXTENSIONS = {
  image: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif']),
  pdf: new Set(['pdf']),
  video: new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v']),
  audio: new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac'])
};

const getExtension = (fileName = '') => {
  const chunks = String(fileName).toLowerCase().split('.');
  return chunks.length > 1 ? chunks.pop() : '';
};

const isExecutableMime = (mimeType = '') => {
  const value = String(mimeType).toLowerCase();
  return EXECUTABLE_MIME_PREFIXES.some((prefix) => value.startsWith(prefix));
};

export function classifyPreviewType(mimeType = '', fileName = '') {
  const normalizedMime = String(mimeType || '').toLowerCase();
  const ext = getExtension(fileName || '');

  if (PREVIEWABLE_MIME_TYPES.image.test(normalizedMime) || PREVIEWABLE_EXTENSIONS.image.has(ext)) return 'image';
  if (PREVIEWABLE_MIME_TYPES.pdf.test(normalizedMime) || PREVIEWABLE_EXTENSIONS.pdf.has(ext)) return 'pdf';
  if (PREVIEWABLE_MIME_TYPES.video.test(normalizedMime) || PREVIEWABLE_EXTENSIONS.video.has(ext)) return 'video';
  if (PREVIEWABLE_MIME_TYPES.audio.test(normalizedMime) || PREVIEWABLE_EXTENSIONS.audio.has(ext)) return 'audio';
  return 'download';
}

export function validateFile(file) {
  const issues = [];
  const warnings = [];

  if (!file) {
    return {
      valid: false,
      issues: [{ code: 'FILE_REQUIRED', message: 'No se encontro archivo' }],
      warnings
    };
  }

  const extension = getExtension(file.name);
  if (BLOCKED_EXTENSIONS.has(extension) || isExecutableMime(file.type)) {
    issues.push({
      code: 'EXECUTABLE_BLOCKED',
      message: 'Este tipo de archivo esta bloqueado por seguridad'
    });
  }

  if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE) {
    issues.push({
      code: 'MAX_SIZE_EXCEEDED',
      message: 'El archivo excede el tamano maximo permitido (500MB)'
    });
  }

  if (typeof file.size === 'number' && file.size >= WARNING_FILE_SIZE) {
    warnings.push({
      code: 'LARGE_FILE_WARNING',
      message: 'Archivo pesado (>=100MB). La subida puede demorar.'
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings
  };
}

export function validateFiles(files = []) {
  const accepted = [];
  const rejected = [];
  const warnings = [];

  const list = Array.from(files || []);

  for (const file of list) {
    const result = validateFile(file);
    if (result.valid) {
      accepted.push(file);
      if (result.warnings.length) {
        warnings.push({ fileName: file.name, warnings: result.warnings });
      }
    } else {
      rejected.push({ fileName: file?.name || 'archivo', issues: result.issues });
    }
  }

  return { accepted, rejected, warnings };
}

