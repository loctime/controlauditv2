// ControlFile init disabled — stubs to avoid breaking imports.

console.warn('[controlFileInit] ControlFile initialization disabled. Using stubs.');

export const initializeControlFileFolders = async () => {
  console.warn('[controlFileInit] initializeControlFileFolders called but disabled.');
  return { mainFolderId: null, subFolders: {} };
};

export const getControlFileFolders = async () => {
  console.warn('[controlFileInit] getControlFileFolders called but disabled.');
  return { mainFolderId: null, subFolders: { auditorias: null, accidentes: null, empresas: null } };
};

export const clearControlFileFolders = () => {
  console.warn('[controlFileInit] clearControlFileFolders called but disabled.');
  try { localStorage.removeItem('controlfile_folders'); } catch (e) {}
};

export const forceRecreateFolders = async () => {
  console.warn('[controlFileInit] forceRecreateFolders called but disabled.');
  return await initializeControlFileFolders();
};

