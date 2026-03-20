# Auditoria tecnica del sistema de subida y manejo de archivos (ControlAudit)

Fecha: 2026-03-11
Repositorio: `C:\Users\User\Desktop\controlauditv2`

## 1) Resumen ejecutivo

El sistema de archivos de ControlAudit esta parcialmente estandarizado alrededor de `unifiedFileUploadService`, pero todavia conviven flujos heterogeneos por modulo (validaciones, tamano maximo, multi-upload, forma de guardar referencias y descarga).

Patron predominante actual:

1. UI selecciona `File` (input file).
2. Modulo llama `uploadFileWithContext`.
3. `controlFileB2Service.uploadEvidence` sube via backend de ControlFile (`/api/uploads/presign` + `/proxy-upload` + `/confirm`).
4. Se guarda metadata en Firestore (normalmente `fileId` + `shareToken`, y en algunos casos URL temporal).
5. Visualizacion por URL de share o URL temporal.

## 2) Archivos clave (mapa tecnico)

- `src/services/unifiedFileUploadService.ts`
- `src/services/controlFileB2Service.ts`
- `src/services/contextFolderResolver.ts`
- `src/config/contextConfig.ts`
- `src/utils/imageUtils.js`
- `src/components/pages/auditoria/auditoria/components/PreguntaItem.jsx`
- `src/components/pages/auditoria/auditoriaService.jsx`
- `src/components/pages/accidentes/NuevoAccidenteModal.jsx`
- `src/components/pages/accidentes/EditarAccidenteModal.jsx`
- `src/services/accidenteService.js`
- `src/components/pages/incidentes/NuevoIncidenteModal.jsx`
- `src/components/pages/ausencias/AusenciaFormDialog.jsx`
- `src/components/pages/ausencias/AusenciaDetailPanel.jsx`
- `src/services/ausenciasFilesService.js`
- `src/components/pages/capacitaciones/CapacitacionImagesDialog.jsx`
- `src/components/pages/capacitaciones/shared/RegistrarAsistenciaInline.jsx`
- `src/components/pages/capacitaciones/shared/event-registry/EventRegistryInline.jsx`
- `src/services/capacitacionImageService.js`
- `src/services/registrosAsistenciaService.js`
- `src/services/offlineDatabase.js`
- `src/services/syncQueue.js`
- `src/components/common/OfflineIndicator.jsx`
- `backend/index.js`
- `backend/config/environment.js`

## 3) Como se suben los archivos

### Servicio comun de subida

`unifiedFileUploadService.uploadFileWithContext` centraliza el alta de metadata contextual y delega en `uploadEvidence`.

### Backend/storage real de subida

- No sube al backend propio de ControlAudit (`backend/index.js` no expone endpoints de upload de archivos de negocio).
- Sube al backend de ControlFile (`controlfile.onrender.com` por defecto), mediante:
  - `POST /api/uploads/presign`
  - `POST /api/uploads/proxy-upload`
  - `POST /api/uploads/confirm`
- En Firestore se crea/usa `shareToken` para acceso de archivos.

### Por modulo

- Auditorias: seleccion en `PreguntaItem`, subida efectiva al guardar en `auditoriaService`.
- Accidentes: subida en `accidenteService.subirImagenesNew`.
- Incidentes: usa `subirImagenes` de `accidenteService` (reutilizado).
- Salud ocupacional (ausencias): subida en `ausenciasFilesService.uploadAndAttachFiles`.
- Capacitaciones: subida en `capacitacionImageService` y en flujos inline de registros/eventos.

## 4) Como se guardan (metadata + colecciones)

### Metadata tecnica observada

Campos frecuentes:

- `fileId`
- `shareToken`
- `nombre` / `fileName`
- `mimeType` / `tipo`
- `size` / `tamano`
- `createdAt` / `uploadedAt`
- `uploadedBy`
- `tipoArchivo`
- contexto: `contextType`, `contextEventId`, `companyId`

### Colecciones/subcolecciones observadas

- Auditorias:
  - `apps/auditoria/owners/{ownerId}/reportes`
- Accidentes:
  - `apps/auditoria/owners/{ownerId}/accidentes/{accidenteId}`
- Incidentes:
  - almacenamiento con patron de accidentes (servicio compartido)
- Salud ocupacional:
  - `apps/auditoria/owners/{ownerId}/ausencias/{ausenciaId}/files`
- Capacitaciones:
  - `apps/auditoria/owners/{ownerId}/capacitaciones`
  - `apps/auditoria/owners/{ownerId}/registrosAsistencia`
- Compartido ControlFile:
  - coleccion `shares` (mapeo `fileId` -> `shareToken`)

## 5) Visualizacion / preview

Patrones detectados:

- Imagenes con `<img src=...>` y modal preview.
- Apertura en pestana nueva con `window.open(url, '_blank')`.
- Enlaces `<a href=...>` en algunos flujos.
- URL de visualizacion por token share: `https://files.controldoc.app/api/shares/{token}/image`.

Estado por modulo:

- Auditorias: preview imagen + apertura nueva pestana.
- Accidentes/Incidentes: preview imagen (incluye componentes de preview reutilizados).
- Salud ocupacional: apertura por URL resuelta (shareToken o presigned URL).
- Capacitaciones: preview y modal; coexistencia de flujos legacy/v2.

No se identifico un visor PDF universal transversal para todos los modulos de evidencia.

## 6) Descarga

Metodos observados:

- URL directa de share token (ControlFile).
- URL temporal por `getDownloadUrl(fileId)` (presigned GET).
- `window.open` y/o enlace `<a download>`.

Seguridad:

- Basada en presigned URLs temporales y share tokens gestionados por backend ControlFile.
- No se observa una politica homogenea de expiracion/renovacion expuesta de forma uniforme en UI.

## 7) Multi-upload

- Auditorias: por input de pregunta, no (`files[0]`), aunque una auditoria puede tener multiples evidencias distribuidas.
- Accidentes: si (`multiple`).
- Incidentes: si (`multiple`).
- Salud ocupacional: si (`multiple`).
- Capacitaciones: mixto; en inline/event-registry si (`multiple`), en `CapacitacionImagesDialog` se opera de a una.

## 8) Tipos de archivos permitidos

- Auditorias: `image/*`.
- Accidentes: `image/*`.
- Incidentes: `image/*`.
- Salud ocupacional: `.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt`.
- Capacitaciones: predominantemente imagenes en UI; metadata permite clasificar en `evidencia/material/certificado`.

## 9) Limites de tamano

- Auditorias: no se detecta limite explicito en input principal de preguntas.
- Accidentes: 5 MB.
- Incidentes: 5 MB.
- Salud ocupacional: 10 MB.
- Capacitaciones: 10 MB en varios flujos.

## 10) Offline

Infraestructura base:

- `offlineDatabase` (IndexedDB con stores como `fotos`, `syncQueue`, etc.).
- `autoSaveService` para persistencia local + Firestore + fallback localStorage.
- `syncQueue` con reintentos/backoff para sincronizacion diferida.
- `OfflineIndicator` muestra estado y cola offline.

Cobertura real:

- Auditorias: offline mas robusto (incluye fotos offline y sincronizacion posterior).
- Capacitaciones: soporte offline parcial en servicio de imagenes.
- Accidentes/Incidentes/Ausencias: no se observa el mismo nivel de pipeline offline integral para archivos.

## 11) Servicios comunes reutilizados

- Nucleo:
  - `unifiedFileUploadService`
  - `controlFileB2Service`
  - `contextFolderResolver`
  - `contextConfig`
- Por dominio:
  - `accidenteService`
  - `ausenciasFilesService`
  - `capacitacionImageService`
  - `registrosAsistenciaService`
- Offline:
  - `offlineDatabase`
  - `syncQueue`
  - `autoSaveService`

## 12) Inconsistencias detectadas

1. Referencia de archivo no uniforme:
- Algunos modulos guardan `shareToken + fileId`, otros guardan URL temporal directamente.

2. Contexto incorrecto/reutilizado:
- Incidentes reutiliza subida con `contextType: 'accidente'`.

3. Validaciones distintas:
- Tamanos maximos y tipos permitidos difieren sin politica central unica.

4. Multi-upload inconsistente:
- UIs mezclan single y multiple segun pantalla.

5. Descarga inconsistente:
- Mezcla de `window.open`, enlaces directos y presigned URL por servicio.

6. Duplicacion funcional (legacy + v2):
- Especialmente visible en capacitaciones/registros.

7. Offline asimetrico:
- Muy solido en auditorias, parcial en el resto.

## 13) Tabla final por modulo

| Modulo | Subida | Multiple | Tipos permitidos | Limite tamano | Preview | Descarga |
|---|---|---|---|---|---|---|
| Auditorias | Input en pregunta + subida al guardar (`uploadFileWithContext`) | No por input (si multiples evidencias globales) | Imagenes (`image/*`) | No explicito en componente principal | Si (`<img>`, modal/apertura) | URL de share/open nueva pestana |
| Accidentes | `accidenteService` -> `uploadFileWithContext` | Si | Imagenes | 5 MB | Si | URL temporal/presigned + apertura |
| Incidentes | Reutiliza flujo de accidentes | Si | Imagenes | 5 MB | Si | Igual que accidentes |
| Salud Ocupacional | `ausenciasFilesService.uploadAndAttachFiles` | Si | PDF, JPG/JPEG, PNG, WEBP, DOC/DOCX, TXT | 10 MB | Parcial (abrir recurso; preview segun tipo) | share token o presigned URL |
| Capacitaciones | `capacitacionImageService` + inline/event-registry | Mixto (si en inline, single en dialog especifico) | Mayormente imagenes (modelo soporta mas categorias) | 10 MB | Si (imagen + modal) | Share URL / enlace directo segun flujo |

## 14) Arquitectura ideal unificada (propuesta)

### Objetivo

Unificar UX, seguridad y mantenimiento con un unico pipeline de archivos para todos los modulos.

### Diseno propuesto

1. Componente unico de carga (`<UnifiedFileUploader />`)
- Props declarativas por contexto (`module`, `entityId`, `allowedTypesProfile`, `maxSizeMB`, `maxFiles`).
- Soporte single/multiple, drag-drop, progreso y estados de error estandarizados.

2. Servicio unico de dominio (`fileService`)
- API unica:
  - `upload(files, context)`
  - `getViewUrl(fileRef)`
  - `getDownloadUrl(fileRef)`
  - `delete(fileRef)`
- Siempre retorna `FileRef` canonizado:
  - `{ fileId, shareToken, name, mimeType, size, createdAt, uploadedBy, context }`.

3. Metadata uniforme en Firestore
- Subcoleccion estandar por entidad:
  - `.../{entity}/files/{fileDocId}`
- Esquema unico versionado (`schemaVersion`).
- Nunca persistir URLs temporales como fuente de verdad.

4. Validaciones centralizadas
- Perfiles globales (`IMAGE_ONLY`, `DOCS_STANDARD`, `MEDIA_EXTENDED`).
- Reglas en un unico modulo (`fileValidationPolicy.ts`).
- Mensajes de error homogeneos.

5. Preview universal
- Resolver unico de URL (`resolveFileViewUrl`).
- Visores por MIME:
  - imagen interna,
  - PDF interno,
  - documentos con fallback descarga.

6. Descarga unificada y segura
- Siempre via `fileService.getDownloadUrl(fileRef)` con expiracion corta.
- Rotacion/revalidacion transparente de URL en cliente.

7. Offline transversal
- Cola unica de uploads offline (`FILE_UPLOAD`) para todos los modulos.
- Persistencia blob en IndexedDB.
- Reintentos con backoff y estado visible en `OfflineIndicator` por modulo/entidad.

8. Observabilidad y trazabilidad
- Eventos tecnicos de upload/download/error (sin datos sensibles).
- Correlation ID por operacion para soporte.

## 15) Plan de implementacion recomendado

1. Definir contrato canonico `FileRef` + esquema Firestore unico.
2. Migrar accidentes/incidentes para dejar de persistir URLs temporales.
3. Corregir contexto de incidentes (`contextType` propio).
4. Introducir `UnifiedFileUploader` en modo incremental (primero capacitaciones y ausencias).
5. Unificar validaciones de tipos/tamano por perfil.
6. Extender cola offline comun a todos los modulos.
7. Deprecar flujos legacy duplicados (capacitaciones v1/v2).

## 16) Conclusion

ControlAudit ya cuenta con una base solida (servicio unificado + backend de ControlFile + soporte offline maduro en auditorias), pero persisten diferencias por modulo que complican mantenimiento, seguridad y experiencia de usuario.

La estandarizacion propuesta permite consolidar una sola arquitectura de archivos, reducir bugs por divergencia y facilitar la evolucion funcional del producto.
