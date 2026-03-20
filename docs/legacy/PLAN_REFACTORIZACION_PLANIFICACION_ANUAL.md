# Plan de refactorización: planificación anual de capacitaciones

## 1. Diagnóstico del modelo actual

### 1.1 Modelo de datos actual

| Entidad | Ubicación | Campos relevantes |
|--------|------------|-------------------|
| **training_plan** | `trainingPlans` | `id`, `companyId`, `branchId`, `year` (opcional), `status`, … |
| **training_plan_item** | `trainingPlanItems` | `id`, `planId`, `trainingTypeId`, **`plannedMonth`** (1-12), `status`, `notes`, … |

- **Cardinalidad**: Un ítem por cada combinación (plan, tipo de capacitación, mes). Ej.: vigencia 3 → 4 ítems con `plannedMonth` 1, 4, 7, 10.
- **Sesiones**: Guardan `planId` y `planItemId`; el “mes planificado” se infiere del ítem (`plannedMonth`).
- **Catálogo (training type)**: `validityMonths` (vigencia en meses). No existe `startMonth` en ningún lado.

### 1.2 Función actual: `generatePlannedMonths(validityMonths)`

**Archivo:** `src/services/training/trainingPlanService.js` (líneas 22-30).

```javascript
for (let m = 1; m <= 12; m += interval) {
  months.push(m);
}
```

- Siempre empieza en **enero (1)**.
- Se detiene cuando `m > 12`; no hay aritmética modular.
- Cuando `validityMonths` no divide 12 (p. ej. 5, 7, 8), se generan menos meses de los que corresponden al ciclo real.

**Ejemplo (vigencia 5, inicio marzo):**

- Ciclo real: marzo → agosto → enero → junio → noviembre → (abril)…
- Resultado actual: [1, 6, 11]. Faltan 3, 4, 8, 9.

### 1.3 Flujos que dependen de esta lógica

| Flujo | Uso | Impacto si la generación es incorrecta |
|-------|-----|----------------------------------------|
| **CatalogScreen – Agregar a plan** | Vista previa “Meses planificados” y llamada a `addTrainingTypeToPlan` | Se muestran y crean menos meses; sin mes de inicio configurable. |
| **addTrainingTypeToPlan** | Crea un ítem por cada mes devuelto por `generatePlannedMonths(validityMonths)` | Plan con menos ítems de los necesarios. |
| **addTrainingTypeToPlanByPlanId** | Igual que arriba | Mismo efecto. |
| **findCompatiblePlanItems** | Filtra ítems por `item.plannedMonth === sessionMonth` | Si no existe ítem para un mes (p. ej. abril con vigencia 5), la sesión no encuentra plan. |
| **PlanItemsPage / vistas por mes** | Listan ítems por `plannedMonth` | Los meses no generados nunca aparecen. |

### 1.4 Restricciones actuales de vigencia

- **UI**: `TextField type="number"` sin límite a divisores de 12 (CatalogScreen líneas 384, 520).
- **Backend**: Solo se valida `v > 0 && v <= 12`; por defecto 12 si no es válido. No hay restricción a 1, 3, 6, 12.

---

## 2. Modelo de datos propuesto (normalizado)

### 2.1 Por qué no guardar frecuencia e inicio en cada ítem

En una primera propuesta se añadían `frequencyMonths` y `startMonth` en **training_plan_item**. Eso genera **redundancia**: todos los ítems del mismo (planId, trainingTypeId) comparten los mismos valores. Repetir esos datos en cada documento:

- Aumenta el tamaño del almacenamiento y el riesgo de inconsistencia si se actualiza en un ítem y no en otros.
- No aporta información que no pueda derivarse de una sola configuración por (plan, tipo).

Por tanto, se propone un **modelo normalizado** donde la configuración de frecuencia y mes de inicio vive en una entidad separada.

### 2.2 Entidad nueva: configuración (plan, tipo)

**training_plan_training_type** (nueva colección o documento por (planId, trainingTypeId)):

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `planId` | string | Sí | Plan al que pertenece. |
| `trainingTypeId` | string | Sí | Tipo de capacitación. |
| `frequencyMonths` | number (1-12) | Sí | Cada cuántos meses se repite la capacitación en este plan. |
| `startMonth` | number (1-12) | Sí | Mes de inicio del ciclo dentro del año (por defecto 1). |

- **Cardinalidad**: Un registro por cada (planId, trainingTypeId) que use frecuencia automática. Se crea o actualiza al agregar un tipo al plan con “frecuencia automática”.
- **Ventajas del modelo normalizado**: Sin redundancia; un solo lugar para consultar y editar frecuencia e inicio; generación de ítems se hace leyendo esta configuración y aplicando `generatePlannedMonths(frequencyMonths, startMonth)`.

### 2.3 Ítems de plan (sin frecuencia ni inicio)

**training_plan_item** se mantiene sin campos de frecuencia ni inicio:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `planId` | string | Sí | Ya existe |
| `trainingTypeId` | string | Sí | Ya existe |
| `plannedMonth` | number (1-12) | Sí | Mes planificado dentro del año. |
| `status` | string | Sí | Ya existe |
| `notes` | string | No | Ya existe |
| … | … | … | Resto de campos sin cambios (targetAudience, priority, etc.) |

- La **generación de ítems** se hace así: se obtiene o crea la configuración (plan, tipo) con `frequencyMonths` y `startMonth`; se llama `generatePlannedMonths(frequencyMonths, startMonth)`; se crea un **training_plan_item** por cada mes devuelto, solo con `planId`, `trainingTypeId`, `plannedMonth` y el resto de campos. La relación “cuántas veces al año y desde qué mes” queda en **training_plan_training_type**, no en cada ítem.

---

## 3. Frecuencia vs vigencia del certificado (aclaración conceptual)

### 3.1 Uso actual en el sistema

Hoy el sistema usa un único campo en el catálogo de tipos de capacitación: **`validityMonths`**. En la práctica se está utilizando como **frecuencia de repetición** (“cada cuántos meses hay que capacitar”), no como “vigencia del certificado”.

- **Frecuencia de repetición**: cada N meses se debe realizar la capacitación (ej.: cada 6 meses).
- **Vigencia del certificado**: cuánto tiempo se considera válido el certificado tras la capacitación (ej.: 12 meses).

Son conceptos distintos. Ejemplo real: “capacitación cada 6 meses, certificado válido 12 meses”.

### 3.2 Decisión para esta refactorización

- **En esta refactorización** se mantiene el uso actual: **`validityMonths` del catálogo se sigue usando como frecuencia** (equivalente a `frequencyMonths`) a la hora de generar meses planificados y de mostrar “cada N meses” en la UI.
- **Modelo futuro recomendado**: separar en el catálogo (o en la configuración del plan) dos conceptos:
  - **frequencyMonths**: cada cuántos meses se repite la capacitación en el plan.
  - **certificateValidityMonths**: vigencia del certificado tras la realización (para vencimientos, alertas, etc.).

Este documento y la implementación asociada no introducen `certificateValidityMonths`; solo se aclara la semántica y se deja sentada la evolución futura.

---

## 4. Nueva implementación de `generatePlannedMonths` (plan anual)

### 4.1 Alcance: solo año calendario

El sistema trabaja con **planes anuales**: cada plan corresponde a un año natural y los ítems tienen un **plannedMonth** entre 1 y 12. No se debe generar un “ciclo infinito” que dé la vuelta al año (p. ej. noviembre + 5 meses = abril del año siguiente). Por tanto:

- **No se usa aritmética modular** que cierre el ciclo dando la vuelta a enero.
- **Solo se generan meses dentro del mismo año calendario**: desde `startMonth` hasta 12, sumando `frequencyMonths` mientras el resultado sea ≤ 12.

Así, el resultado de la función es exactamente el conjunto de meses del año en que, según la frecuencia y el inicio, hay que planificar esa capacitación en **ese** año.

### 4.2 Firma y contrato

```text
generatePlannedMonths(frequencyMonths, startMonth?) → number[]
```

- **frequencyMonths**: número en 1–12 (cada cuántos meses se repite).
- **startMonth**: 1–12; por defecto 1 (enero).
- **Devuelve**: array de meses (1–12) ordenado ascendente, **solo los que caen dentro del año** (desde startMonth hasta ≤ 12).

### 4.3 Algoritmo

```text
1. Normalizar: frequencyMonths y startMonth en 1–12; si no válidos, usar 12 y 1.
2. mes = startMonth
3. Mientras mes <= 12:
      agregar mes al resultado
      mes += frequencyMonths
4. Devolver el array (ya ordenado por construcción).
```

Pseudocódigo equivalente:

```text
mes = startMonth
mientras mes <= 12:
   agregar mes
   mes += frequencyMonths
devolver resultado
```

### 4.4 Ejemplos esperados (plan anual)

| frequencyMonths | startMonth | Resultado | Comentario |
|----------------|------------|-----------|------------|
| 3 | 1 | [1, 4, 7, 10] | Cuatro veces en el año. |
| 5 | 3 | [3, 8] | Solo marzo y agosto; el siguiente (13) se pasa de 12. |
| 5 | 1 | [1, 6, 11] | Enero, junio, noviembre. |
| 12 | 7 | [7] | Una vez en el año (julio). |
| 1 | 1 | [1, 2, …, 12] | Los doce meses. |

No se generan meses “del año siguiente” (p. ej. para startMonth=3 y frequency=5 no aparece el 4 ni el 9, porque corresponderían a ciclos que ya cruzan a otro año).

### 4.5 Compatibilidad y exportación

- Mantener export de `generatePlannedMonths` en `trainingPlanService.js` y en `training/index.js`.
- Añadir tests unitarios: divisores de 12, no divisores (5, 7), distintos `startMonth`, y valores inválidos (defaults).

---

## 5. Cambios necesarios en UI

### 5.1 Modal “Agregar a plan anual” (CatalogScreen)

- **Estado del formulario**: Añadir `startMonth` (por defecto 1) al estado que ya incluye empresa, sucursal, notas (y tipo de capacitación seleccionado con su vigencia).
- **Selector “Mes de inicio”**: Nuevo control (select) con opciones 1–12 (nombres de mes en español). Ubicación sugerida: debajo del bloque “Frecuencia automática / Meses planificados”.
- **Vista previa “Meses planificados”**: Debe calcularse con `generatePlannedMonths(validityMonths, startMonth)` (plan anual: solo meses ≤ 12) y actualizarse al cambiar vigencia o mes de inicio.
- **Envío**: Al llamar a `addTrainingTypeToPlan`, pasar `startMonth` y usar `validityMonths` del catálogo como frecuencia.

### 5.2 Formularios de creación/edición de tipo de capacitación

- No es estrictamente necesario añadir “mes de inicio” aquí: el mes de inicio es una decisión del **plan** (cuándo empieza el ciclo para ese tipo en esa empresa/sucursal), no del catálogo. Opcional: en el futuro, un “mes de inicio por defecto” en el tipo (solo si el negocio lo pide).

### 5.3 Restricción de dominio para vigencia (frequencyMonths)

- **Opción A (recomendada):** Restringir en UI y backend a **1, 3, 6, 12** (y opcionalmente 2, 4). Select en lugar de input numérico libre. Evita casos “raros” y mantiene el modelo mental “N veces al año”.
- **Opción B:** Permitir 1–12 con la lógica de plan anual (solo meses ≤ 12). Mantener `TextField type="number"` con `min=1`, `max=12` y validación en backend.

En el plan se recomienda **Opción A** salvo que el negocio requiera explícitamente vigencias como 5 o 7.

---

## 6. Impacto por componente

### 6.1 trainingPlanService.js

| Función / elemento | Cambio |
|--------------------|--------|
| **generatePlannedMonths** | Reemplazar por la nueva firma `(frequencyMonths, startMonth)` y algoritmo **solo año calendario** (mes += frequencyMonths mientras mes ≤ 12). Sin ciclo modular. |
| **training_plan_training_type** (nueva entidad) | Crear o actualizar documento por (planId, trainingTypeId) con `frequencyMonths` y `startMonth` al agregar un tipo al plan con frecuencia automática. Consultar esta configuración para generar ítems o mostrar en UI. |
| **addTrainingTypeToPlan(ownerId, { …, validityMonths, startMonth })** | Añadir `startMonth` (default 1). Crear o actualizar **training_plan_training_type** con frequencyMonths (= validityMonths) y startMonth. Llamar `generatePlannedMonths(frequencyMonths, startMonth)` y crear un **training_plan_item** por cada mes (solo planId, trainingTypeId, plannedMonth, status, notes, …). No guardar frequencyMonths/startMonth en cada ítem. |
| **addTrainingTypeToPlanByPlanId** | Igual: recibir `startMonth`, persistir configuración en training_plan_training_type, generar meses con `generatePlannedMonths` y crear ítems sin campos de frecuencia/inicio. |
| **addTrainingTypeToAnnualPlan** | Sin cambio: crea un solo ítem con `plannedMonth` indicado; no usa `generatePlannedMonths`. |
| **createPlanItem** | Sin cambio de contrato: payload con planId, trainingTypeId, plannedMonth, etc. **No** incluir frequencyMonths ni startMonth en el ítem. |
| **findCompatiblePlanItems** | Sin cambio: sigue filtrando por `item.plannedMonth === sessionMonth`. |
| **listPlanItems** | Sin cambio. Ordenación por `plannedMonth` se mantiene. |

### 6.2 groupPlanItemsByMonth / PlanItemsPage / vistas

- Siguen leyendo `item.plannedMonth` (número 1–12). **Sin cambios** salvo que en el futuro se quiera mostrar en la UI “inicio del ciclo” o “cada N meses” leyendo `item.frequencyMonths` / `item.startMonth` (opcional).

### 6.3 CatalogScreen

- Añadir estado `startMonth` en el flujo “Agregar a plan”.
- Añadir selector “Mes de inicio” y actualizar vista previa con `generatePlannedMonths(validityMonths, startMonth)`.
- Pasar `startMonth` (y si se unifica nombre, `frequencyMonths`) en la llamada a `addTrainingTypeToPlan`.
- Si se adopta Opción A de dominio, reemplazar el campo de vigencia por un select (1, 3, 6, 12) en creación/edición de tipo y/o en el modal “Agregar a plan” según se desee restringir solo al plan o también al catálogo.

### 6.4 SessionCreateWizard / findCompatiblePlanItems

- Sin cambios en la estructura de candidatos (`planItemId`, `plannedMonth`). Si en el futuro se usa el modelo “un ítem con plannedMonths[]”, habría que adaptar `findCompatiblePlanItems` para devolver ítems donde `plannedMonths.includes(sessionMonth)` y exponer `plannedMonth: sessionMonth` en el candidato (ya contemplado en la opción alternativa del modelo).

---

## 7. Impacto en datos existentes y migración

### 7.1 Ítems ya creados y compatibilidad legacy

- Los ítems actuales no tienen configuración en **training_plan_training_type** (esa entidad es nueva). Comportamiento recomendado:
  - Tratarlos como **legacy**: no crear documentos de configuración retroactivos.
  - **Ítems sin configuración de frecuencia** (planes/tipos añadidos antes del rediseño): se consideran **mes de inicio = enero (1)** y **frecuencia derivada del catálogo** (`validityMonths` del tipo). Así la generación y la coincidencia de sesiones siguen funcionando sin migración.
- No es obligatorio migrar datos antiguos: los ítems legacy siguen teniendo `plannedMonth` y el resto del sistema funciona igual.

### 7.2 Migración opcional (regeneración)

- Si se quisiera “corregir” planes creados con vigencia 5 o 7 que hoy tienen solo [1,6,11] u otros conjuntos incompletos:
  1. Por cada (planId, trainingTypeId) que tenga ítems sin `frequencyMonths`/`startMonth`, obtener vigencia del catálogo.
  2. Asumir `startMonth = 1` (o un valor por defecto).
  3. Calcular `generatePlannedMonths(vigencia, startMonth)` y crear ítems faltantes (solo `plannedMonth` que no existan), sin borrar ítems ya vinculados a sesiones.
- No es parte mínima del rediseño; se puede hacer en una fase posterior.

### 7.3 Sesiones

- Las sesiones solo guardan `planId` y `planItemId`. No cambian con esta refactorización. No se requiere migración de sesiones.

---

## 8. Restricción de dominio para vigencia (recomendación final)

- **Recomendación:** **Opción A**: restringir a **1, 3, 6, 12** (y si se desea, 2 y 4).
  - Razones: menos casos borde, mensaje claro (“cada 1, 3, 6 o 12 meses”), y coherencia con el algoritmo de plan anual (solo meses ≤ 12).
- Si el negocio exige “cada 5 meses” u otros valores, usar **Opción B** (permitir 1–12) con `generatePlannedMonths` de plan anual y validación 1–12 en backend.

---

## 9. Resumen de arquitectura recomendada

1. **Modelo normalizado**: **training_plan_training_type** (planId, trainingTypeId, frequencyMonths, startMonth) para la configuración; **training_plan_item** (planId, trainingTypeId, plannedMonth, status, notes, …) sin campos de frecuencia ni inicio.
2. **Generación de meses**: `generatePlannedMonths(frequencyMonths, startMonth)` solo para el **año calendario** (mes = startMonth; mientras mes ≤ 12, agregar mes y mes += frequencyMonths). Sin ciclo modular.
3. **UI**: Modal “Agregar a plan” con selector “Mes de inicio” y vista previa dinámica; envío de `startMonth` y vigencia (como frecuencia) al servicio.
4. **Frecuencia vs vigencia**: En esta refactorización `validityMonths` del catálogo se sigue usando como frecuencia; el modelo futuro debería separar `frequencyMonths` y `certificateValidityMonths**. Restricción de vigencia a 1, 3, 6, 12 (Opción A) según se defina.
5. **Compatibilidad**: Ítems sin configuración en training_plan_training_type se consideran legacy (inicio enero, frecuencia desde catálogo); sin migración obligatoria; sesiones y `findCompatiblePlanItems` sin cambios de contrato.

Con esto se separa correctamente **frecuencia**, **mes de inicio** y **plan anual (solo meses del año)**, se evitan errores silenciosos en la planificación anual y se mantiene impacto mínimo en servicios y datos existentes.
