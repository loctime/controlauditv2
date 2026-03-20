# Training Module – UX Simplification Report

**Scope:** Frontend only. No backend, Firestore, or service contract changes unless strictly necessary.

**Goal:** Reduce conceptual duplication between screens and reorganize around user workflows (employee-centric view under a single "People" tab with internal sub-tabs).

---

## 1. Current navigation map

### Top-level tabs (URL: `?tab=<id>`)

| Tab id         | Label          | Component                      | File |
|----------------|----------------|--------------------------------|------|
| `dashboard`    | Tablero        | DashboardScreen                | `screens/DashboardScreen.jsx` |
| `sessions`     | Sesiones       | SessionsScreen                 | `screens/SessionsScreen.jsx` |
| `people`       | Personas       | PeopleScreen                   | `screens/PeopleScreen.jsx` |
| `history`      | Historial      | EmployeeTrainingHistoryScreen  | `screens/EmployeeTrainingHistoryScreen.jsx` |
| `reports`      | Reportes       | ReportsScreen                  | `screens/ReportsScreen.jsx` |
| `compliance`   | Cumplimiento   | ComplianceScreen               | `screens/ComplianceScreen.jsx` |
| `configuration`| Configuración  | ConfigurationScreen           | `screens/ConfigurationScreen.jsx` |

- **Tab state:** `useTrainingTabState.js` reads `tab` and `section` from `useSearchParams()`. Default tab: `dashboard`. Configuration tab is restricted to `role === 'admin' || role === 'superdev'`.
- **References to tabs:** `QuickActionsBar` navigates to `people` ("Ver empleados") and `reports` ("Ver vencimientos"); no direct navigation to `history` in the codebase.
- **Other route:** `/training/plans/:planId` → `PlanItemsPage` (standalone route; not a tab).

### Configuration subsections

- `?tab=configuration&section=catalog` → CatalogScreenAdapter → CatalogScreen  
- `?tab=configuration&section=plans` → AnnualPlansScreenAdapter → AnnualPlansPage (+ PlanDetailDrawer, PlanEditDialog)

---

## 2. UX duplication analysis

### PeopleScreen vs EmployeeTrainingHistoryScreen

| Aspect | PeopleScreen | EmployeeTrainingHistoryScreen |
|--------|-------------|-------------------------------|
| **Entry** | Same pattern: employee selector (EmployeeAutocomplete) then content for selected employee. | Same. |
| **Data – employee list** | `empleadoService.getEmpleadosBySucursales(ownerId, sucursalIds)` | Same. |
| **Data – per employee** | `employeeTrainingRecordService.listByEmployee` + catalog + `trainingCertificateService.listByEmployee` | `trainingAttendanceService.listAttendanceByEmployee` + `trainingReportingService.buildEmployeePeriodHistory` + catalog |
| **Display** | PeopleTrainingHistoryView: "Ficha del empleado" (summary + compliance chips) + EmployeeTrainingTimeline (table: capacitación, fechas, vigencia, estado, certificado). | EmployeeAutocomplete + "Resultados consolidados por periodo" (tabla) + "Registros de realizaciones" (tabla: capacitación, vigencia desde/hasta, estado, certificado, evidencias). |

**Conclusion:**

- **Conceptual overlap:** Both screens are "select employee → see training-related data for that employee." People focuses on **training records** (compliance-oriented) and a timeline with certificate links; History focuses on **attendances** and **period history** (more granular/session-oriented).
- **Data model difference:** People uses **employee training records** (aggregated/computed); History uses **attendance** documents and a **period history** report. No backend change required to show both in one place: we only change where we render the same service responses.
- **Merge feasibility:** Yes. A single **People** screen can host:
  - **Summary:** Current "Ficha" + compliance chips (and optionally a short summary of records count). Uses existing PeopleScreen data (records + complianceSummary).
  - **History:** Current EmployeeTrainingHistoryScreen content (period results + attendances tables). Uses `trainingAttendanceService.listAttendanceByEmployee` and `trainingReportingService.buildEmployeePeriodHistory` when this sub-tab is active (or when employee is selected).
  - **Certificates:** Dedicated list/cards for certificates for the selected employee. Uses `trainingCertificateService.listByEmployee` (already used in PeopleScreen for enriching records).

No service or Firestore changes are required; only which component calls which service and how the UI is split into sub-tabs.

### References to "History" tab

- **TrainingModule.jsx:** Renders `EmployeeTrainingHistoryScreen` when `activeTab === 'history'`.
- **useTrainingTabState:** Includes `history` in `MODULE_TABS` (via `visibleTabs`). No other code navigates to `tab=history` (grep: no `setTab('history')` or `onNavigate('history')` elsewhere).
- **Risk:** Removing the top-level "Historial" tab only affects users who open it from the tab bar or a bookmarked URL. No in-app links need updating.

---

## 3. Proposed tab structure

### Target top-level tabs

| Tab id         | Label          | Content |
|----------------|----------------|--------|
| `dashboard`    | Tablero        | Sin cambios. |
| `sessions`     | Sesiones       | Sin cambios. |
| `people`       | Personas       | **PeopleScreen** con sub-tabs: Resumen, Historial, Certificados. |
| `compliance`   | Cumplimiento   | Sin cambios. |
| `reports`      | Reportes       | Sin cambios. |
| `configuration`| Configuración  | Sin cambios (Catalog + Plans). |

**Removed:** Top-level tab `history` (Historial). Its functionality moves under People → Historial.

### PeopleScreen internal structure (proposed)

```
PeopleScreen (container)
  ├─ Employee selector (shared: EmployeeAutocomplete)
  ├─ Sub-tabs (Tabs MUI): Resumen | Historial | Certificados
  │
  ├─ SummaryTab (Resumen)
  │   ├─ Ficha del empleado (current from PeopleTrainingHistoryView)
  │   └─ Estado general de cumplimiento (chips) + optional short summary
  │
  ├─ HistoryTab (Historial)
  │   ├─ Resultados consolidados por periodo (from EmployeeTrainingHistoryScreen)
  │   └─ Registros de realizaciones (attendances table)
  │
  └─ CertificatesTab (Certificados)
      └─ List/cards of certificates for selected employee (trainingCertificateService.listByEmployee)
```

- **Resumen:** Reuses current PeopleScreen data and layout (records + complianceSummary); can keep using `EmployeeTrainingTimeline` or a slimmer "summary" view.
- **Historial:** Reuses EmployeeTrainingHistoryScreen logic and UI (period results + attendances); data loaded when employee is selected (and optionally when Historial tab is active to avoid loading both at once).
- **Certificados:** New tab component that lists certificates for the selected employee; data already available via `trainingCertificateService.listByEmployee`.

---

## 4. Component restructuring plan

### New / refactored components

| Component | Purpose | Data source |
|-----------|---------|-------------|
| **PeopleScreen** | Container: employee selector + sub-tabs (Resumen, Historial, Certificados). Manages `selectedEmployee` and which sub-tab is active. | — |
| **PeopleSummaryTab** | Ficha + compliance chips + (optionally) compact timeline/summary. | `employeeTrainingRecordService.listByEmployee`, `trainingCatalogService.listAll`, `trainingCertificateService.listByEmployee` (same as current PeopleScreen). |
| **PeopleHistoryTab** | Period results table + attendances table. | `trainingAttendanceService.listAttendanceByEmployee`, `trainingReportingService.buildEmployeePeriodHistory`, `trainingCatalogService.listAll`. |
| **PeopleCertificatesTab** | List of certificates for selected employee. | `trainingCertificateService.listByEmployee`. |

### Reuse

- **EmployeeAutocomplete:** Keep; used once at top of PeopleScreen.
- **PeopleTrainingHistoryView:** Can be reduced to "summary" content only and used inside **PeopleSummaryTab**, or inlined into SummaryTab (Ficha + chips + optional table).
- **EmployeeTrainingTimeline:** Keep for Summary tab (or move into PeopleSummaryTab as the "history" table there); both Summary and History tabs can show complementary views (records vs attendances).
- **EmployeeTrainingHistoryScreen:** Its body (autocomplete + two tables) becomes **PeopleHistoryTab**; the screen file can be deprecated or kept only as a thin wrapper for backward compatibility if we support `?tab=history` redirecting to `?tab=people&section=history` (see migration).

### State and URL

- **People sub-section in URL (optional):** To support deep-links and "back" behavior, extend URL with a people section, e.g. `?tab=people&section=summary|history|certificates`. Default `section=summary`. `useTrainingTabState` can be extended with a `peopleSections` array and `activePeopleSection` / `setPeopleSection` when `activeTab === 'people'` (same pattern as Configuration).

---

## 5. Files to modify

| File | Change |
|------|--------|
| **TrainingModule.jsx** | Remove `history` from `MODULE_TABS`. Remove import and `case 'history'` for `EmployeeTrainingHistoryScreen`. Render only `PeopleScreen` for `people`. |
| **useTrainingTabState.js** | Optional: add support for `tab=people` + `section=summary|history|certificates` (e.g. read/write `section` when tab is people) so sub-tab is bookmarkable. If not adding URL for people section, no change. |
| **screens/PeopleScreen.jsx** | Refactor into container: employee selector + MUI Tabs (Resumen, Historial, Certificados). Load data for Summary (and Certificates) as today; load History data when Historial tab is selected (or on employee change). Render PeopleSummaryTab, PeopleHistoryTab, PeopleCertificatesTab. |
| **components/people/PeopleSummaryTab.jsx** | **New.** Content of current PeopleTrainingHistoryView (Ficha + compliance chips + EmployeeTrainingTimeline or summary table). Receives `selectedEmployee`, `records`, `complianceSummary`, `employees`, `onSelectEmployee`, loading flags. |
| **components/people/PeopleHistoryTab.jsx** | **New.** Content taken from EmployeeTrainingHistoryScreen: "Resultados consolidados por periodo" + "Registros de realizaciones". Receives `selectedEmployee`, `ownerId`; loads attendances and period history internally (or receives them as props from PeopleScreen). Uses `trainingAttendanceService`, `trainingReportingService`, `trainingCatalogService`. |
| **components/people/PeopleCertificatesTab.jsx** | **New.** List/cards of certificates for selected employee. Calls `trainingCertificateService.listByEmployee(ownerId, selectedEmployee.id)`. |
| **components/people/PeopleTrainingHistoryView.jsx** | Either remove (logic inlined into PeopleSummaryTab) or keep and use only as the content of PeopleSummaryTab (rename to reflect "summary" if desired). |
| **screens/EmployeeTrainingHistoryScreen.jsx** | Stop using as top-level screen. Option A: Delete after moving logic to PeopleHistoryTab. Option B: Keep as thin redirect: if ever opened (e.g. old bookmark), redirect to `?tab=people&section=history`. |

### Files not to change (for this UX change)

- All services under `services/training` (no contract changes).
- Firestore collections and security.
- Dashboard, Sessions, Reports, Compliance, Configuration screens and their children.
- Router (no new route; optional new query param `section` for people only).
- **QuickActionsBar:** Already navigates to `people`; no change.

---

## 6. Migration steps

1. **Add People sub-tabs (non-breaking)**  
   - Create `PeopleSummaryTab.jsx` with current summary/ficha + compliance + timeline content (from PeopleTrainingHistoryView + EmployeeTrainingTimeline).  
   - Create `PeopleHistoryTab.jsx` with period results + attendances tables (extract from EmployeeTrainingHistoryScreen).  
   - Create `PeopleCertificatesTab.jsx` that lists certificates for selected employee.  
   - In `PeopleScreen.jsx`, add internal Tabs (Resumen, Historial, Certificados). When no employee is selected, show a single message and optionally the selector only. When an employee is selected, show the selected sub-tab content.  
   - Keep loading Summary (and Certificates) data in PeopleScreen as today; load History data only when Historial is selected (or when employee is selected, to avoid double load).  
   - Do not remove the top-level Historial tab yet; both People and History tabs remain. **Result:** People gains sub-tabs; behavior of existing tabs unchanged.

2. **Optional: URL for people section**  
   - In `useTrainingTabState`, when `tab === 'people'`, read `section` from search params (e.g. `summary`, `history`, `certificates`); default `summary`.  
   - Expose `activePeopleSection` and `setPeopleSection` from the hook; PeopleScreen sets the active sub-tab from `activePeopleSection` and calls `setPeopleSection` when user changes tab.  
   - This allows links like `?tab=people&section=history` for support/docs.

3. **Remove top-level Historial tab**  
   - In `TrainingModule.jsx`, remove `{ id: 'history', label: 'Historial' }` from `MODULE_TABS`.  
   - Remove import of `EmployeeTrainingHistoryScreen` and the `case 'history': return <EmployeeTrainingHistoryScreen />` branch.  
   - **Result:** Tab bar no longer shows "Historial"; all employee-level history is under Personas → Historial.

4. **Redirect old bookmarks (optional)**  
   - If we keep `EmployeeTrainingHistoryScreen.jsx`, add a single-use redirect: when the app detects `tab=history` (e.g. in a wrapper or in TrainingModule before removing the case), replace with `tab=people` and `section=history` and render PeopleScreen. After that, remove the `history` case and the screen file.

5. **Cleanup**  
   - Delete or repurpose `EmployeeTrainingHistoryScreen.jsx` if no longer used.  
   - Optionally rename or slim `PeopleTrainingHistoryView` to reflect that it is the "summary" view only.

---

## 7. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Users have bookmarked `?tab=history` | Optional redirect in TrainingModule or router: `tab=history` → `tab=people&section=history`. If we add people section to URL, same experience. |
| Different data in History (attendances) vs Summary (records) | No backend change. Summary tab keeps using `employeeTrainingRecordService.listByEmployee`; History tab uses `trainingAttendanceService.listAttendanceByEmployee` and `trainingReportingService.buildEmployeePeriodHistory`. Both are read-only; no conflict. |
| More data loaded when switching People sub-tabs | Load History data only when "Historial" is selected (lazy per tab). Summary and Certificates can stay loaded when employee is selected to keep Resumen/Certificados instant. |
| Regression in People screen | Keep Summary tab content identical to current PeopleScreen (same components and data). Move History content as-is into PeopleHistoryTab. Add Certificates tab without removing any existing certificate access from the timeline (Summary still shows "Ver certificado" per record). |
| useTrainingTabState and tab list | `visibleTabs` is derived from `MODULE_TABS`; removing `history` is a single change. No other code depends on the `history` tab id except the render switch. |

---

## Summary

- **PeopleScreen** is in `screens/PeopleScreen.jsx`; **EmployeeTrainingHistoryScreen** is in `screens/EmployeeTrainingHistoryScreen.jsx` and is only used when `activeTab === 'history'`. There are no other references to the `history` tab.
- Merging **EmployeeTrainingHistoryScreen** into **PeopleScreen** as an internal **Historial** sub-tab is feasible without changing backend or services: same APIs, different place of use.
- Proposed structure: **PeopleScreen** with sub-tabs **Resumen**, **Historial**, **Certificados** (Summary = current People + ficha + compliance + timeline; History = current EmployeeTrainingHistoryScreen; Certificates = new tab with certificate list).
- **Files to modify:** TrainingModule.jsx, PeopleScreen.jsx; new: PeopleSummaryTab, PeopleHistoryTab, PeopleCertificatesTab; optional useTrainingTabState and optional redirect for `tab=history`; then remove or repurpose EmployeeTrainingHistoryScreen.
- Migration: add sub-tabs under People first (non-breaking), then remove top-level Historial tab and optionally add redirect and URL support for people section.
