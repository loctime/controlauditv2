// ControlFile integration removed — stubs to avoid breaking imports.
// If you want to re-enable a file-storage integration, replace these stubs
// with an implementation using Firebase Storage or another provider.

console.warn('[controlFileService] ControlFile integration is disabled. Using stubs.');

export const createTaskbarFolder = async (appName) => {
  console.warn('[controlFileService] createTaskbarFolder called but integration is disabled.');
  return null;
};

export const createNavbarFolder = async (name, parentId = null) => {
  console.warn('[controlFileService] createNavbarFolder called but integration is disabled.');
  return null;
};

export const createSubFolder = async (name, parentId) => {
  console.warn('[controlFileService] createSubFolder called but integration is disabled.');
  return null;
};

export const uploadToControlFile = async (file, parentId = null, onProgress = null) => {
  console.warn('[controlFileService] uploadToControlFile called but integration is disabled.');
  return null;
};

export const getDownloadUrl = async (fileId) => {
  console.warn('[controlFileService] getDownloadUrl called but integration is disabled.');
  return null;
};

export const listFiles = async (parentId = null, pageSize = 50) => {
  console.warn('[controlFileService] listFiles called but integration is disabled.');
  return [];
};

export const deleteFile = async (fileId) => {
  console.warn('[controlFileService] deleteFile called but integration is disabled.');
  return;
};

export const createShareLink = async (fileId, expiresInHours = 24) => {
  console.warn('[controlFileService] createShareLink called but integration is disabled.');
  return null;
};

export const getFileInfo = async (fileId) => {
  console.warn('[controlFileService] getFileInfo called but integration is disabled.');
  return null;
};

