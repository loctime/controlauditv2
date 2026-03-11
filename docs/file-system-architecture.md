# Unified File System Architecture

## 1. Overview

The unified file system standardizes how files are uploaded, stored, previewed, downloaded, and deleted across ControlAudit.

Primary goals:
- Avoid duplicated upload logic between modules.
- Centralize file validation rules.
- Standardize canonical metadata (`FileRef`).
- Support evidence files consistently across multiple business modules.

Modules currently using this architecture:
- `auditorias`
- `accidentes`
- `incidentes`
- `capacitaciones`
- `ausencias` (salud ocupacional)

---

## 2. FileRef Contract

Canonical metadata is represented as `FileRef`.

```ts
FileRef {
  fileId: string
  shareToken: string | null

  name: string
  mimeType: string
  size: number

  module: string
  entityId: string
  companyId: string

  uploadedBy: string | null
  uploadedAt: Timestamp

  status: "active" | "deleted"

  schemaVersion: 1
}
```

Field meaning:
- `fileId`: stable file identifier returned by ControlFile.
- `shareToken`: token used for view/download resolution when available.
- `name`: original file name.
- `mimeType`: MIME type of the file.
- `size`: file size in bytes.
- `module`: logical module owner (`auditorias`, `accidentes`, etc.).
- `entityId`: parent entity ID (audit, incident, training session, absence, etc.).
- `companyId`: tenant/company scope.
- `uploadedBy`: user ID that uploaded the file.
- `uploadedAt`: upload timestamp.
- `status`: lifecycle state (`active` or `deleted`).
- `schemaVersion`: metadata schema version (currently `1`).

---

## 3. Upload Pipeline

All uploads must follow the unified pipeline:

1. UI selects one or multiple files.
2. Validation runs through `fileValidationPolicy`.
3. Upload goes through `uploadFileWithContext` (inside unified services).
4. `unifiedFileService.uploadFiles` persists canonical `FileRef` metadata.
5. Metadata is saved under the entity `files` subcollection.

```mermaid
flowchart LR
  A[UI File Input / UnifiedFileUploader] --> B[fileValidationPolicy]
  B --> C[uploadFileWithContext]
  C --> D[unifiedFileService.uploadFiles]
  D --> E[ControlFile backend]
  D --> F[Persist FileRef in Firestore]
  F --> G[entities/{entityId}/files]
```

---

## 4. Storage Structure

Canonical Firestore location:

- `entities/{entityId}/files`

In implementation, `entities` maps to each module route (for example, reportes, accidentes/incidentes docs, capacitaciones, ausencias), and each entity stores files in its `files` subcollection.

Important rule:
- The `files` subcollection is the **source of truth**.

Legacy fields such as:
- `imagenes`
- `filesByQuestion`

are kept only as temporary **read fallback** for historical records.

---

## 5. File Preview

UI preview is standardized through:
- `UnifiedFilePreview`

Supported behavior by type:
- Image: inline preview.
- PDF: embedded PDF viewer.
- Video: inline video player.
- Audio: inline audio player.
- Other types: fallback to download action.

---

## 6. Download Resolution

Downloads are resolved through:
- `fileResolverService`

Why:
- Download/view URLs are temporary and can expire.
- The system must not persist temporary URLs as source-of-truth data.
- URLs are resolved dynamically from canonical metadata (`fileId`, `shareToken`) at read/download time.

---

## 7. Validation Policy

Central policy:
- `fileValidationPolicy`

Current rules:
- Maximum file size: `500MB`.
- Warning threshold: `100MB` (non-blocking warning).
- Executable blocklist (hard reject): `exe`, `bat`, `cmd`, `msi`, `sh`, `js`.

All upload entry points must reuse this policy.

---

## 8. Soft Delete

Deletion is logical (not physical):
- `unifiedFileService.softDeleteFile(...)`

Behavior:
- Sets `status = "deleted"` on the canonical file document.
- Deleted files are filtered from normal list/preview/download flows.
- Physical storage deletion is not part of normal UI deletion flow.

---

## 9. Legacy Compatibility

Legacy metadata formats (for example `imagenes`, `filesByQuestion`) remain supported for **read-only compatibility** with old records.

Rules during migration window:
- Canonical reads are first.
- Legacy fallback is used only if canonical data does not exist.
- New writes must not persist legacy arrays.

---

## 10. Rules for Future Development

Mandatory rules:
- Do **not** store raw/temporary URLs as canonical data.
- Do **not** persist `imagenes` arrays or similar legacy URL-mapped arrays.
- Do **not** bypass `uploadFileWithContext`.

All new upload implementations must go through unified services:
- `uploadFileWithContext`
- `unifiedFileService.uploadFiles`
- `FileRef` persistence in `files` subcollection
- `UnifiedFilePreview` for rendering
- `fileResolverService` for URL resolution
- `softDeleteFile` for deletion
