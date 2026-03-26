import { auth } from '../firebaseControlFile';
import { FileContext } from '../types/fileContext';

const BACKEND_URL =
  (import.meta as any).env?.VITE_CONTROLFILE_BACKEND_URL ||
  'https://controlfile.onrender.com';

export async function resolveContextFolder(context: FileContext): Promise<string> {
  // Validación mínima antes de llamar al backend
  if (!context.contextType || !context.contextType.trim()) {
    throw new Error('contextType es requerido');
  }

  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');
  const token = await user.getIdToken();

  const response = await fetch(`${BACKEND_URL}/api/folders/resolve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appId: 'controlaudit',
      contextType: context.contextType,
      contextEventId: context.contextEventId || undefined,
      companyId: context.companyId || undefined,
      sucursalId: context.sucursalId || undefined,
      tipoArchivo: context.tipoArchivo || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `Error al resolver carpeta: ${response.status}`);
  }

  const { folderId } = await response.json();
  if (!folderId) throw new Error('El backend no devolvió folderId');
  return folderId;
}

// Mantener clearFolderCache y validateContext como no-ops por compatibilidad
export function clearFolderCache(): void {}

export function validateContext(_context: FileContext): void {}
