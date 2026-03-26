// src/services/controlFileInit.js
// Mantener el archivo para compatibilidad de imports.
//
// Con el sistema nuevo (Cambio 2/3), las carpetas se crean on-demand
// desde resolveContextFolder() llamando al backend /api/folders/resolve.

export const initializeControlFileFolders = async () => {
  return { mainFolderId: null, subFolders: {} };
};

export const getControlFileFolders = async () => {
  return { mainFolderId: null, subFolders: {} };
};

export const clearControlFileFolders = () => {};

export const forceRecreateFolders = async () => {
  return { mainFolderId: null, subFolders: {} };
};
