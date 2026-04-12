# Galería de Formularios Públicos — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el sistema completo de galería de formularios públicos usando una colección plana `formularios_publicos` en Firestore, corrigiendo todos los bugs de path de Firestore y agregando chips de estado en la UI.

**Architecture:** Se introduce `formularios_publicos` como colección plana global en Firestore (`collection(dbAudit, 'formularios_publicos')`). Cuando un formulario se comparte, se crea un snapshot independiente en esa colección; el formulario original en `apps/auditoria/owners/{ownerId}/formularios/{id}` solo recibe `esPublico: true` y `publicSharedId`. Las copias que hacen otros owners se guardan en su propio owner-centric con `copiadoDesde` (ID del doc en `formularios_publicos`) y `nombreOriginal`.

**Tech Stack:** React, MUI, Firebase Firestore, Vite (sin test runner — verificación manual + build)

---

## Mapa de archivos

| Archivo | Tipo | Cambios |
|---|---|---|
| `src/services/formularioService.js` | Modificar | Agregar `getSnapshotPublico`, `publicarFormulario`; actualizar `copiarFormularioPublico`, `incrementarContadorCopias`, `actualizarRating` |
| `src/components/pages/perfil/PerfilFormularios.jsx` | Modificar | Reemplazar writes legacy; agregar confirm dialog; guard copia-mismo-nombre |
| `src/components/pages/editar/FormulariosAccordionList.jsx` | Modificar | Reemplazar `updateDoc` legacy por `formularioService.updateFormulario` |
| `src/components/pages/formulario/GaleriaFormulariosPublicos.jsx` | Modificar | Cambiar queries; unificar UID; agregar chips de estado |

---

## Task 1: Nuevos métodos en formularioService.js

**Files:**
- Modify: `src/services/formularioService.js`

### Contexto

`formularioService.js` ya usa `dbAudit + firestoreRoutesCore` correctamente para el CRUD owner-centric. Hay que agregar dos métodos nuevos y actualizar tres existentes para trabajar con `formularios_publicos`.

**Imports que ya están en el archivo y se necesitan:**
```js
import { collection, doc, getDoc, getDocs, query, where, increment } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { dbAudit } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';
```

- [ ] **Step 1.1: Agregar método `getSnapshotPublico`**

Insertar este método dentro del objeto `formularioService`, después de `actualizarRating` (al final, antes del cierre `}`):

```js
  /**
   * Busca el snapshot público de un formulario en formularios_publicos
   * @param {string} formularioOriginalId - ID del formulario en owner-centric
   * @returns {Promise<Object|null>} Snapshot con id, o null si no existe
   */
  async getSnapshotPublico(formularioOriginalId) {
    try {
      if (!formularioOriginalId) return null;
      const q = query(
        collection(dbAudit, 'formularios_publicos'),
        where('formularioOriginalId', '==', formularioOriginalId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
      logger.error('Error al buscar snapshot público:', error);
      return null;
    }
  },
```

- [ ] **Step 1.2: Agregar método `publicarFormulario`**

Insertar después de `getSnapshotPublico`:

```js
  /**
   * Crea o actualiza el snapshot de un formulario en formularios_publicos.
   * Primera vez: crea doc completo + actualiza original con esPublico y publicSharedId.
   * Re-publicar: actualiza solo nombre/secciones/fechaActualizado, preserva stats.
   * @param {string} formularioId - ID del formulario en owner-centric
   * @param {Object} userProfile - { uid, ownerId, email, displayName }
   * @param {Object} formularioData - Objeto completo del formulario (nombre, secciones, publicSharedId, ...)
   * @returns {Promise<{ publicSharedId: string, snapshotId: string, isNew: boolean }>}
   */
  async publicarFormulario(formularioId, userProfile, formularioData) {
    try {
      if (!formularioId) throw new Error('formularioId es requerido');
      if (!userProfile?.uid) throw new Error('Usuario no autenticado');
      if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

      const { nombre, secciones } = formularioData;
      const existing = await this.getSnapshotPublico(formularioId);

      if (existing) {
        // Re-publicar: actualizar solo contenido, preservar stats
        const docRef = doc(dbAudit, 'formularios_publicos', existing.id);
        await updateDocWithAppId(docRef, {
          nombre,
          secciones,
          fechaActualizado: Timestamp.now()
        });
        // Asegurar que el original también tenga esPublico: true
        const originalRef = doc(dbAudit, ...firestoreRoutesCore.formularios(userProfile.ownerId), formularioId);
        await updateDocWithAppId(originalRef, { esPublico: true });
        return { publicSharedId: existing.publicSharedId || formularioData.publicSharedId, snapshotId: existing.id, isNew: false };
      }

      // Primera publicación
      const { v4: uuidv4 } = await import('uuid');
      const publicSharedId = formularioData.publicSharedId || uuidv4();
      const formulariosPublicosRef = collection(dbAudit, 'formularios_publicos');
      const nuevoSnapshot = {
        formularioOriginalId: formularioId,
        ownerId: userProfile.ownerId,
        nombre,
        secciones,
        nombreOriginal: nombre,
        creadorId: userProfile.uid,
        creadorEmail: userProfile.email || '',
        creadorNombre: userProfile.displayName || userProfile.email || '',
        publicSharedId,
        fechaCompartido: Timestamp.now(),
        fechaActualizado: Timestamp.now(),
        esPublico: true,
        copiadoCount: 0,
        rating: 0,
        ratingsCount: 0,
        usuariosQueCopiaron: []
      };
      const docRef = await addDocWithAppId(formulariosPublicosRef, nuevoSnapshot);

      // Actualizar original en owner-centric
      const originalRef = doc(dbAudit, ...firestoreRoutesCore.formularios(userProfile.ownerId), formularioId);
      await updateDocWithAppId(originalRef, { esPublico: true, publicSharedId });

      return { publicSharedId, snapshotId: docRef.id, isNew: true };
    } catch (error) {
      logger.error('Error al publicar formulario:', error);
      throw error;
    }
  },
```

- [ ] **Step 1.3: Actualizar `copiarFormularioPublico`**

Reemplazar el método completo (líneas 173–200 aprox.) por:

```js
  /**
   * Copia un formulario público al owner del usuario que copia.
   * El formulario copiado queda con copiadoDesde (ID del doc en formularios_publicos)
   * y nombreOriginal (nombre al momento de copiar).
   * @param {Object} formularioPublico - Doc de formularios_publicos (debe tener id)
   * @param {Object} userProfile - { uid, ownerId, email, displayName }
   * @returns {Promise<string>} ID del formulario copiado
   */
  async copiarFormularioPublico(formularioPublico, userProfile) {
    try {
      if (!userProfile?.uid) throw new Error('Usuario no autenticado');
      if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

      const ownerId = userProfile.ownerId;
      const formulariosRef = collection(dbAudit, ...firestoreRoutesCore.formularios(ownerId));
      const nuevoFormulario = {
        nombre: formularioPublico.nombre,
        secciones: formularioPublico.secciones,
        ownerId,
        creadorId: userProfile.uid,
        creadorEmail: userProfile.email || '',
        creadorNombre: userProfile.displayName || userProfile.email || '',
        esPublico: false,
        copiadoDesde: formularioPublico.id,
        nombreOriginal: formularioPublico.nombre,
        timestamp: Timestamp.now(),
        ultimaModificacion: Timestamp.now(),
        estado: 'activo',
        version: '1.0'
      };

      const docRef = await addDocWithAppId(formulariosRef, nuevoFormulario);
      return docRef.id;
    } catch (error) {
      logger.error('Error al copiar formulario público:', error);
      throw error;
    }
  },
```

- [ ] **Step 1.4: Actualizar `incrementarContadorCopias`**

Reemplazar el método completo (líneas 210–233 aprox.) por:

```js
  /**
   * Incrementa el contador de copias en formularios_publicos.
   * @param {string} formularioPublicoId - ID del doc en formularios_publicos
   * @param {string} userId - UID del usuario que copia
   * @param {Array<string>} usuariosQueCopiaron - Array actual antes de agregar
   * @returns {Promise<void>}
   */
  async incrementarContadorCopias(formularioPublicoId, userId, usuariosQueCopiaron = []) {
    try {
      if (!formularioPublicoId || !userId) throw new Error('formularioPublicoId y userId son requeridos');
      const docRef = doc(dbAudit, 'formularios_publicos', formularioPublicoId);
      await updateDocWithAppId(docRef, {
        copiadoCount: increment(1),
        usuariosQueCopiaron: [...usuariosQueCopiaron, userId]
      });
    } catch (error) {
      logger.error('Error al incrementar contador de copias:', error);
      throw error;
    }
  },
```

- [ ] **Step 1.5: Actualizar `actualizarRating`**

Reemplazar el método completo (líneas 243–266 aprox.) por:

```js
  /**
   * Actualiza el rating promedio en formularios_publicos.
   * @param {string} formularioPublicoId - ID del doc en formularios_publicos
   * @param {number} nuevoRating - Nuevo valor de rating (promedio calculado)
   * @param {number} ratingsCount - Total de ratings después del nuevo voto
   * @returns {Promise<void>}
   */
  async actualizarRating(formularioPublicoId, nuevoRating, ratingsCount) {
    try {
      if (!formularioPublicoId) throw new Error('formularioPublicoId es requerido');
      const docRef = doc(dbAudit, 'formularios_publicos', formularioPublicoId);
      await updateDocWithAppId(docRef, {
        rating: nuevoRating,
        ratingsCount
      });
    } catch (error) {
      logger.error('Error al actualizar rating:', error);
      throw error;
    }
  },
```

- [ ] **Step 1.6: Verificar que el build no tiene errores**

```bash
cd C:\Users\User\Desktop\controlauditv2 && npm run build 2>&1 | tail -20
```

Esperado: build exitoso, sin errores de TypeScript/JS en `formularioService.js`.

---

## Task 2: Corregir PerfilFormularios.jsx

**Files:**
- Modify: `src/components/pages/perfil/PerfilFormularios.jsx`

### Contexto

`PerfilFormularios` recibe `formularios` como prop desde su padre (el perfil del usuario). Esos formularios vienen de `useFormulariosData` que ya lee del path owner-centric correcto. El componente expone botones de compartir, editar y eliminar. El objeto `form` tiene: `id`, `nombre`, `secciones`, `esPublico`, `publicSharedId`, `copiadoDesde` (nuevo campo), `nombreOriginal` (nuevo campo), `formularioOriginalId` (legacy).

- [ ] **Step 2.1: Agregar import de `formularioService` y reemplazar imports de Firebase legacy**

Reemplazar las líneas de imports existentes:
```js
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebaseControlFile';
import { v4 as uuidv4 } from 'uuid';
```

Por:
```js
import { formularioService } from '../../../services/formularioService';
```

Nota: `uuidv4` ahora se importa dinámicamente dentro del service. El `doc`, `updateDoc`, `deleteDoc`, `db` y `uuidv4` ya no se necesitan en este componente.

- [ ] **Step 2.2: Reemplazar `handleCompartir` completo**

Reemplazar la función `handleCompartir` (líneas 36–57) por:

```js
  const handleCompartir = async (form) => {
    if (!canCompartirFormularios) return;

    // Verificar si ya existe snapshot en galería → mostrar confirm
    const existing = await formularioService.getSnapshotPublico(form.id);
    if (existing) {
      const result = await Swal.fire({
        title: 'Actualizar versión pública',
        text: 'Este formulario ya está en la galería. ¿Querés actualizar la versión pública con los cambios actuales?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'Cancelar'
      });
      if (!result.isConfirmed) return;
    }

    try {
      const { publicSharedId } = await formularioService.publicarFormulario(form.id, userProfile, form);
      const url = `${window.location.origin}/formularios/public/${publicSharedId}`;
      setShareLink(url);
      setOpenShareId(form.id);
      logger.debug('[PerfilFormularios] Formulario publicado:', form.id, publicSharedId);
    } catch (error) {
      logger.error('[PerfilFormularios] Error al compartir formulario:', error);
      Swal.fire('Error', 'No se pudo compartir el formulario. Intentá de nuevo.', 'error');
    }
  };
```

- [ ] **Step 2.3: Reemplazar `handleEliminarFormulario` — fix path legacy**

Reemplazar `await deleteDoc(doc(db, 'formularios', form.id));` (línea 79) por:

```js
        await formularioService.deleteFormulario(form.id, { uid: userProfile?.uid }, userProfile);
```

Nota: la firma de `deleteFormulario` es `(formularioId, user, userProfile)`. `{ uid: userProfile?.uid }` actúa como el objeto `user` mínimo que necesita.

- [ ] **Step 2.4: Actualizar lógica de disabled + tooltip del botón Compartir**

Reemplazar el bloque del botón Compartir (líneas 341–357). El `form` puede tener `copiadoDesde` (nuevo) o `formularioOriginalId` (legacy). La regla de negocio:
- Legacy copia (`formularioOriginalId` sin `copiadoDesde`): siempre deshabilitado
- Nueva copia (`copiadoDesde`) con mismo nombre: deshabilitado, tooltip especial
- Nueva copia (`copiadoDesde`) con nombre cambiado: habilitado (se trata como formulario nuevo)

```jsx
                    {(() => {
                      const esLegacyCopia = !!form.formularioOriginalId && !form.copiadoDesde;
                      const esCopiadoConMismoNombre = !!form.copiadoDesde && form.nombre === form.nombreOriginal;
                      const compartirDeshabilitado = !canCompartirFormularios || esLegacyCopia || esCopiadoConMismoNombre;
                      const tooltipCompartir = !canCompartirFormularios
                        ? 'Sin permisos para compartir formularios'
                        : esLegacyCopia
                        ? 'No podés compartir un formulario copiado'
                        : esCopiadoConMismoNombre
                        ? 'Cambiá el nombre para poder compartirlo'
                        : form.esPublico
                        ? 'Actualizar versión pública en la galería'
                        : 'Compartir formulario en la galería';
                      return (
                        <Tooltip title={tooltipCompartir}>
                          <span>
                            <Button
                              variant="outlined"
                              color="primary"
                              size={isSmallMobile ? "small" : "medium"}
                              onClick={() => handleCompartir(form)}
                              disabled={compartirDeshabilitado}
                              sx={{
                                minWidth: isMobile ? '100%' : 'auto',
                                py: isSmallMobile ? 1 : 1.5
                              }}
                            >
                              📤 {form.esPublico ? 'Actualizar galería' : 'Compartir'}
                            </Button>
                          </span>
                        </Tooltip>
                      );
                    })()}
```

Esto reemplaza el `<Tooltip>` + `<Button>` del botón Compartir existente (el bloque que va desde `<Tooltip title={form.formularioOriginalId ? ...` hasta el `</span>` cierre del primer botón).

- [ ] **Step 2.5: Verificar build**

```bash
cd C:\Users\User\Desktop\controlauditv2 && npm run build 2>&1 | tail -20
```

Esperado: sin errores en `PerfilFormularios.jsx`.

---

## Task 3: Corregir FormulariosAccordionList.jsx

**Files:**
- Modify: `src/components/pages/editar/FormulariosAccordionList.jsx`

### Contexto

`FormulariosAccordionList` recibe `formularios` como prop (vienen de `useFormulariosData`, owner-centric). En el modal de edición llama `handleEditFormulario` que escribe en el path legacy `doc(db, "formularios", id)`. Hay que reemplazarlo por `formularioService.updateFormulario` que ya usa el path correcto.

- [ ] **Step 3.1: Agregar imports necesarios**

Agregar al bloque de imports (después de los imports de MUI existentes):

```js
import { formularioService } from '../../../services/formularioService';
```

En la línea de `useAuth()` (línea 43), agregar `user` y `userProfile`:

```js
  const { getUserFormularios, user, userProfile } = useAuth();
```

- [ ] **Step 3.2: Reemplazar `updateDoc` legacy en `handleEditFormulario`**

Reemplazar el bloque (líneas 92–100 aprox.):

```js
      await updateDoc(doc(db, "formularios", formularioEdit.id), {
        nombre: formularioEdit.nombre,
        estado: formularioEdit.estado,
        version: formularioEdit.version,
        esPublico: formularioEdit.esPublico,
        ultimaModificacion: new Date()
      });
```

Por:

```js
      await formularioService.updateFormulario(
        formularioEdit.id,
        {
          nombre: formularioEdit.nombre,
          estado: formularioEdit.estado,
          version: formularioEdit.version,
          esPublico: formularioEdit.esPublico
        },
        user,
        userProfile
      );
```

Nota: `formularioService.updateFormulario` ya agrega `ultimaModificacion: Timestamp.now()` internamente, no hace falta pasarlo.

- [ ] **Step 3.3: Limpiar imports no utilizados**

Eliminar las siguientes líneas si ya no se usan en el archivo:

```js
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseControlFile";
```

Verificar antes de eliminar que no haya otras referencias a `doc`, `updateDoc` o `db` en el mismo archivo.

- [ ] **Step 3.4: Verificar build**

```bash
cd C:\Users\User\Desktop\controlauditv2 && npm run build 2>&1 | tail -20
```

Esperado: sin errores en `FormulariosAccordionList.jsx`.

---

## Task 4: Reescribir capa de datos y UI de GaleriaFormulariosPublicos.jsx

**Files:**
- Modify: `src/components/pages/formulario/GaleriaFormulariosPublicos.jsx`

### Contexto

Este componente es el más afectado. Tiene tres problemas: (a) lee de la colección raíz incorrecta, (b) `misFormulariosCopiados` también usa path incorrecto, (c) `myUid` viene de localStorage en lugar del contexto. Además hay que agregar chips de estado. El rediseño usa:

- Lectura de galería: `collection(dbAudit, 'formularios_publicos')`
- Lectura de copiados del usuario: `collection(dbAudit, ...firestoreRoutesCore.formularios(userProfile.ownerId))` filtrado client-side por `copiadoDesde`
- `esPropio`: `form.creadorId === userProfile?.uid`
- `yaCopiado`: `copiadosDesdeIds.has(form.id)` (Set) con fallback en `usuariosQueCopiaron`

- [ ] **Step 4.1: Actualizar imports**

Reemplazar el bloque de imports de Firebase (líneas 3–4):

```js
import { collection, query, getDocs } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
```

(Se elimina `where` del import de firebase/firestore ya que la query de `formularios_publicos` no necesita filtro. Para `misFormulariosCopiados` tampoco se necesita `where` — se filtra client-side.)

- [ ] **Step 4.2: Reemplazar estados y eliminar `userInfo` / `myUid`**

En el bloque de estados (después de `const { userProfile } = useAuth();`), reemplazar:

```js
  const [misFormulariosCopiados, setMisFormulariosCopiados] = useState([]);
```

Por:

```js
  const [copiadosDesdeIds, setCopiadosDesdeIds] = useState(new Set());
```

Eliminar también el `useMemo` de `userInfo` y `myUid` (líneas 192–200 aprox.):

```js
  // Eliminar completamente este bloque:
  const userInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo'));
    } catch {
      return null;
    }
  }, []);
  const myUid = userInfo?.uid;
```

- [ ] **Step 4.3: Reemplazar primer `useEffect` — lectura de galería**

Reemplazar el primer `useEffect` (líneas 36–46) por:

```js
  useEffect(() => {
    const fetchPublicForms = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(dbAudit, 'formularios_publicos'));
        setFormularios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        logger.debug('[GaleriaFormulariosPublicos] Formularios públicos cargados:', snapshot.docs.length);
      } catch (error) {
        logger.error('[GaleriaFormulariosPublicos] Error al cargar galería:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicForms();
  }, []);
```

- [ ] **Step 4.4: Reemplazar segundo `useEffect` — lectura de copiados del usuario**

Reemplazar el segundo `useEffect` completo (líneas 49–83) por:

```js
  useEffect(() => {
    const fetchMisCopiados = async () => {
      if (!userProfile?.ownerId) return;
      try {
        const snapshot = await getDocs(
          collection(dbAudit, ...firestoreRoutesCore.formularios(userProfile.ownerId))
        );
        const copiados = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(f => !!f.copiadoDesde);
        setCopiadosDesdeIds(new Set(copiados.map(f => f.copiadoDesde)));
        logger.debug('[GaleriaFormulariosPublicos] IDs copiados:', copiados.length);
      } catch (error) {
        logger.error('[GaleriaFormulariosPublicos] Error al cargar copiados:', error);
      }
    };
    fetchMisCopiados();
  }, [userProfile, formularios]);
```

- [ ] **Step 4.5: Actualizar `handleCopiar`**

Reemplazar la función `handleCopiar` completa (líneas 122–174) por:

```js
  const handleCopiar = async (form) => {
    setCopiandoId(form.id);
    try {
      const yaCopiado = copiadosDesdeIds.has(form.id) || (form.usuariosQueCopiaron?.includes(userProfile?.uid) ?? false);

      if (!yaCopiado) {
        await formularioService.incrementarContadorCopias(
          form.id,
          userProfile.uid,
          form.usuariosQueCopiaron || []
        );
        setFormularios(prev => prev.map(f => f.id === form.id ? {
          ...f,
          copiadoCount: (f.copiadoCount || 0) + 1,
          usuariosQueCopiaron: [...(f.usuariosQueCopiaron || []), userProfile.uid]
        } : f));
      }

      await formularioService.copiarFormularioPublico(form, userProfile);
      logger.debug('[GaleriaFormulariosPublicos] Formulario copiado:', form.id);

      onCopiar && onCopiar(form);

      setCopiadosDesdeIds(prev => new Set([...prev, form.id]));
      setCopiadoExitoso(form.id);
      setTimeout(() => setCopiadoExitoso(null), 2000);
    } catch (e) {
      logger.error('Error al copiar formulario:', e);
    } finally {
      setCopiandoId(null);
    }
  };
```

- [ ] **Step 4.6: Actualizar `handlePuntuar`**

Reemplazar `handlePuntuar` (líneas 177–190) por:

```js
  const handlePuntuar = async (form, value) => {
    setRatingLoading(form.id);
    try {
      const ratingsCount = (form.ratingsCount || 0) + 1;
      const newRating = ((form.rating || 0) * (form.ratingsCount || 0) + value) / ratingsCount;
      await formularioService.actualizarRating(form.id, newRating, ratingsCount);
      setFormularios(prev => prev.map(f => f.id === form.id ? { ...f, rating: newRating, ratingsCount } : f));
      logger.debug('[GaleriaFormulariosPublicos] Formulario puntuado:', form.id, value);
    } catch (e) {
      logger.error('Error al puntuar:', e);
    } finally {
      setRatingLoading(null);
    }
  };
```

- [ ] **Step 4.7: Actualizar lógica de `esPropio` y `yaCopiado` en el render**

Dentro del `.map(form => { ... })` del render (línea 254 aprox.), reemplazar:

```js
          const esPropio = form.creadorId && myUid && form.creadorId === myUid;
          const yaCopiado = misFormulariosCopiados.some(
            (copiado) => (copiado.formularioOriginalId === form.id) || 
                         (copiado.nombre === form.nombre && copiado.creadorId === userProfile?.uid)
          );
          
          // Debug: mostrar información sobre formularios copiados
          if (form.nombre === 'RGRL') {
            logger.debug('[DEBUG] Formulario RGRL:', {
              formId: form.id,
              misFormulariosCopiados: misFormulariosCopiados.map(f => ({ 
                nombre: f.nombre, 
                formularioOriginalId: f.formularioOriginalId,
                creadorId: f.creadorId 
              })),
              yaCopiado
            });
          }
```

Por:

```js
          const esPropio = !!userProfile?.uid && form.creadorId === userProfile.uid;
          const yaCopiado = copiadosDesdeIds.has(form.id) || (form.usuariosQueCopiaron?.includes(userProfile?.uid) ?? false);
```

- [ ] **Step 4.8: Agregar chips de estado en AccordionSummary**

En el `AccordionSummary`, dentro del `<Box sx={{ flex: 1 }}>` donde están los chips actuales (línea ~277 aprox.), agregar los chips de estado DESPUÉS del `<Typography variant="h6">`:

```jsx
                    <Typography variant="h6" sx={{ display: 'inline', mr: 1 }}>{form.nombre}</Typography>
                    {/* Chips de estado */}
                    <Chip label="Público" size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
                    {esPropio && (
                      <Chip label="Propio" size="small" color="info" sx={{ ml: 1 }} />
                    )}
                    {yaCopiado && (
                      <Chip label="Ya copiado" size="small" color="success" sx={{ ml: 1 }} />
                    )}
                    {/* Chips de metadata */}
                    <Chip label={`Creador: ${form.creadorEmail || form.creadorNombre || 'N/A'}`} size="small" sx={{ ml: 1 }} />
```

(El chip `Creador:` reemplaza al existente que usaba `form.creadorDisplayName` que no existe en el nuevo schema.)

- [ ] **Step 4.9: Verificar build final**

```bash
cd C:\Users\User\Desktop\controlauditv2 && npm run build 2>&1 | tail -30
```

Esperado: build exitoso, sin errores en ninguno de los 4 archivos modificados.

- [ ] **Step 4.10: Verificación manual en browser**

Iniciar dev server:
```bash
cd C:\Users\User\Desktop\controlauditv2 && npm run dev
```

Checklist de verificación:

1. **Galería vacía sin romper**: ir a `/formularios-publicos` → debe cargar sin crash (puede estar vacía si no hay docs en `formularios_publicos` aún)

2. **Compartir primer formulario**: ir a `/perfil` → elegir un formulario propio no copiado → click "Compartir" → debe crear doc en `formularios_publicos` (verificar en Firestore console) y mostrar el diálogo con URL

3. **Re-compartir mismo formulario**: click "Compartir" de nuevo en el mismo formulario → debe aparecer diálogo de confirmación "¿Actualizar versión pública?" → confirmar → debe actualizar sin tocar `copiadoCount/rating`

4. **Formulario copiado con mismo nombre**: si existe un formulario con `copiadoDesde` y `nombre === nombreOriginal` → botón Compartir debe estar deshabilitado con tooltip "Cambiá el nombre para poder compartirlo"

5. **Galería con formularios**: después del paso 2, `/formularios-publicos` debe mostrar el formulario publicado con chip "Público" y chip "Propio"

6. **Copiar desde galería**: click "Copiar" en un formulario que no es propio → debe crear doc en owner-centric del usuario copiador con `copiadoDesde` y `nombreOriginal` → reload galería → chip "Ya copiado" debe aparecer

7. **FormulariosAccordionList edit**: ir a `/editar` → editar un formulario (nombre, estado, versión, público/privado) → guardar → debe persistir en owner-centric (verificar en Firestore console que la ruta es `apps/auditoria/owners/{ownerId}/formularios/{id}`)

---

## Notas de implementación

- **`uuid`**: En `publicarFormulario` se importa `uuidv4` dinámicamente. Si el bundle no lo soporta, mover el import al top del service: `import { v4 as uuidv4 } from 'uuid';`
- **Backward compatibility**: Formularios con `formularioOriginalId` (legacy) sin `copiadoDesde` siguen funcionando — `PerfilFormularios` los bloquea correctamente con la lógica `esLegacyCopia`
- **`VistaFormularioPublico`**: No está en scope. Sigue leyendo de la colección raíz `formularios`. El `publicSharedId` aún se guarda en el doc owner-centric del original, por lo que el flujo de share-link sigue funcionando si `VistaFormularioPublico` es corregido en una segunda iteración
- **`useFormularioHandlers`**: También usa paths legacy (para editar secciones/preguntas). No está en scope de este plan pero es deuda técnica documentada en `deuda-tecnica.md`
