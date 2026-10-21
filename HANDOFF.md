# HANDOFF — Mi Bolsillo

Documento de traspaso para que cualquier agente (o persona) continúe el trabajo.
Reglas del proyecto: **`AGENTS.md`** (léelo antes de tocar nada). Aquí solo hay estado, decisiones tomadas y pendientes.

Fecha de este traspaso: **2026-10-20**.

---

## 1. Estado de las fases (numeración de AGENTS.md §14)

| Fase | Descripción | Estado | Commit |
|---|---|---|---|
| 1 | Preparación (Vite react-ts, deps) | cerrada | `a4ab787` |
| 2 | Base técnica (tipos, Dexie, seed, servicios) | cerrada | `a4ab787` |
| 3 | Gastos (CRUD, validaciones, filtros) | cerrada | `a4ab787` |
| 4 | Presupuestos (cálculos, alertas 80/100 %) | cerrada | `35f4eb4` |
| 5 | Dashboard + gráficas Recharts | cerrada | `a03c3df` |
| 6 | Categorías (RF-03) | cerrada | `a03c3df` + fix pendiente de commit en `CategoryIcon.tsx` |
| **7** | **Respaldo JSON (RF-07) + pantalla de Ajustes** | **implementada y verificada por este agente** | **sin commit (ver §5)** |
| 8 | Entrega: build, PWA, docs | pendiente | — |

---

## 2. Qué hizo este agente (Fase 7 — Ajustes / copias de seguridad)

### Archivos creados

| Ruta | Función |
|---|---|
| `src/services/backupService.ts` | Exportar, validar e importar copias JSON. Punto único de acceso a las tablas para este flujo. |
| `src/pages/Settings.tsx` | Pantalla de Ajustes: cuenta y datos, copias de seguridad, privacidad. |
| `src/pages/Settings.module.css` | Estilos de la pantalla (CSS Modules + tokens). |
| `tests/backupService.test.ts` | 19 pruebas del servicio (export, validación, restauración atómica, contadores). |
| `tests/pages/Settings.test.tsx` | 6 pruebas de la pantalla (render, export, archivos inválidos, confirmación, restauración). |

### Archivos modificados

| Ruta | Cambio |
|---|---|
| `src/services/messages.ts` | +8 mensajes de error de respaldo (`backupInvalidJson`, `backupInvalidStructure`, `backupVersionIncompatible`, `backupCategoryInvalid`, `backupExpenseInvalid`, `backupBudgetInvalid`, `backupDuplicateId`, `backupMissingCategory`). |
| `src/i18n/es.ts` | + bloque `settings` (textos de la pantalla); − bloque `comingSoon` (ya sin uso). |
| `src/App.tsx` | `#/ajustes` → `<SettingsPage onNotify={notify} />` (antes `ComingSoonPage`). |
| `tests/App.test.tsx` | +1 prueba de integración: desde la navegación se llega a Ajustes. |
| `src/pages/ComingSoon.tsx` | **eliminado** (código muerto tras el cambio de ruta). |

### API de `backupService.ts`

```ts
BACKUP_APP_ID = 'mi-bolsillo'          // identificador del formato
BACKUP_FORMAT_VERSION = 1              // versión del formato (independiente del esquema Dexie)

interface BackupFile  { app, version, exportedAt, data: { expenses, categories, budgets } }
interface BackupSummary { expenses, categories, budgets }

validateBackup(value: unknown): BackupFile   // valida estructura, versión, cada registro, ids únicos y referencias
parseBackup(text: string): BackupFile        // JSON.parse + validateBackup; lanza ServiceError('validation')
collectBackup(): Promise<BackupFile>         // lee las 3 tablas
serializeBackup(backup): string              // JSON pretty
backupFileName(date?): string                // mi-bolsillo-copia-YYYY-MM-DD.json
collectStats(): Promise<BackupSummary>       // contadores para la pantalla
restoreBackup(value: unknown): Promise<BackupSummary>   // restauración atómica
```

### Decisiones tomadas (no cambiar sin consultar)

1. **Validación antes de escribir**: `restoreBackup` valida todo el archivo *y luego* escribe dentro de **una única transacción Dexie** (`expenses`, `categories`, `budgets`, `meta`). Si algo falla, no se modifica nada (all-or-nothing). Cubierto por la prueba *"does not modify any table when the backup is invalid"*.
2. **Integridad referencial**: todo `expense.categoryId` y `budget.categoryId` debe existir **dentro del propio archivo**; si no → `backupMissingCategory`. El `Budget.id` debe ser exactamente `${categoryId}_${yearMonth}`.
3. **Semilla**: la restauración escribe `meta.defaultCategoriesSeeded = true` para que `seedDefaultCategories()` no vuelva a crear duplicados en un navegador limpio. Probado.
4. **IDs duplicados** en cualquiera de las tres tablas → rechazo (`backupDuplicateId`).
5. **Confirmación de sobrescritura en la UI**: importar un archivo abre `ConfirmDialog` (foco inicial en *Cancelar*); solo entonces se restaura. La app no pide confirmación extra porque la carpeta de descargas no la controla.
6. **Errores en la UI**: los de importación se muestran en un `<p role="alert">` persistente bajo el input (no en avisos que desaparecen); éxitos van al `NoticeHost` global.
7. La pantalla **no accede a `db` directamente**: usa `collectStats()` vía `useLiveQuery` (sigue la regla de capas de AGENTS.md §5).

### Textos de UI añadidos (`src/i18n/es.ts → es.settings`)

`pageTitle`, `account.*` (descripción + resumen de contadores), `backup.*` (aviso de que IndexedDB no es copia de seguridad, exportar, importar, confirmación, éxitos), `privacy.local`, `privacy.encryption` (los dos mensajes obligatorios de AGENTS.md §9).

---

## 3. Comandos ejecutados y resultados reales

Desde la raíz `mi-bolsillo/`:

| Comando | Resultado | Cuándo |
|---|---|---|
| `npm run test:run` | **20 archivos, 288 pruebas, todas pasan** (3,9 s) | tras terminar la Fase 7, antes de la intervención concurrente (ver §5) |
| `npm run build` | **OK** (`tsc -b && vite build`, sin errores de tipos) | tras terminar la Fase 7 |
| `npm run lint` | **1 error**, y **no es mío**: `src/contexts/AuthContext.tsx:81 react-refresh/only-export-components` | igual |
| `npm run dev` + `curl` | servidor arranca, **HTTP 200** | igual |

Lint limpio sobre los archivos de la Fase 7:
`npx eslint src/pages/Settings.tsx src/services/backupService.ts src/App.tsx src/i18n/es.ts src/services/messages.ts tests/backupService.test.ts tests/pages/Settings.test.tsx` → **sin problemas**.

### Verificaciones hechas y NO hechas (honestidad)

- **Probado en memoria/jsdom**: servicios, validaciones, restauración atómica, flujo completo de la pantalla (subir archivo → confirmar → datos reemplazados), navegación a `#/ajustes`.
- **NO probado en navegador real**: no abrí la app en un navegador a 390 px; la exportación usa `Blob`/`URL.createObjectURL` simulados en jsdom. **Comprobar a mano**: `npm run dev` → Ajustes → "Exportar copia (JSON)" → debe descargarse el archivo; y reimportarlo.
- Las gráficas Recharts no se verifican en jsdom (limitación conocida, AGENTS.md §11).

---

## 4. Trabajo concurrente en curso: Firebase / login (⚠️ no iniciado por este agente)

Durante la Fase 7 **otro agente introdujo autenticación y sincronización en la nube** en el mismo working tree:

```
src/services/firebase.ts          (initializeApp, auth, firestore)  ← NUEVO
src/services/syncService.ts       (sync*ToCloud / delete*FromCloud) ← NUEVO
src/contexts/AuthContext.tsx      (login con Google, signOut)       ← NUEVO
src/components/auth/              AuthGate.tsx, LoginView.tsx/.css  ← NUEVO
src/components/layout/AppShell.*  (usa useAuth() en la barra)       ← MODIFICADO
src/services/{expense,category,budget}Service.ts  (llaman a sync*)  ← MODIFICADO
package.json                      (+ "firebase": "^13.0.0")
```

**Advertencias para quien continúe:**

1. **Contradice AGENTS.md**: §2 "fuera de alcance: backend, autenticación, sincronización en la nube"; §3 "prohibido: backend, base de datos remota, servicios externos"; §9 "los datos no salen del navegador". También obliga a avisar antes de añadir dependencias (§3) — `firebase` apareció sin confirmación. **Decisión del dueño del proyecto requerida** antes de seguir por aquí.
2. **`npm run test:run` está roto ahora**: fallan los 3 tests de `tests/App.test.tsx` (los 2 previos + el nuevo de Ajustes) con `useAuth must be used within AuthProvider`, porque `AppShell` llama a `useAuth()` pero `App`/`main` todavía no montan `AuthProvider`. **Son 3 errores del flujo de auth, no de la Fase 7.**
3. **`npm run lint` falla** por `AuthContext.tsx` (exporta componente + hook en el mismo archivo → `react-refresh/only-export-components`; mover `useAuth` a otro archivo o separar exports).
4. **El bundle pasó de ~400 kB a ~915 kB** (aviso de chunk > 500 kB) porque `syncService` está importado desde los servicios de negocio.
5. `src/services/firebase.ts` contiene la config de Firebase (la API key de Firebase es pública por diseño, pero hay que restringir dominios autorizados y reglas de Firestore en la consola; el proyecto `finanzas-77a26` usa `measurementId`, ojo con Analytics/privacidad).
6. Los servicios de negocio ya no son "solo Dexie": cualquier prueba que use `createExpense`/`createCategory`/`setBudget` ejecuta hoy llamadas a `sync*`. Revisar si van a mockear `syncService` en los tests o a aislarlo.

---

## 5. Commits

**No se hizo commit de la Fase 7.** Motivos: (a) el working tree está compartido con el trabajo de Firebase en pleno desarrollo, (b) `tests/App.test.tsx` está roto por ese trabajo, y AGENTS.md exige cerrar con build+lint+tests en verde.

Para commitear la Fase 7 de forma aislada, una vez estabilizado el árbol:

```bash
git add src/services/backupService.ts src/pages/Settings.tsx src/pages/Settings.module.css \
        src/services/messages.ts src/i18n/es.ts src/App.tsx \
        tests/backupService.test.ts tests/pages/Settings.test.tsx tests/App.test.tsx
git rm src/pages/ComingSoon.tsx   # ya borrado, solo si git no lo detecta
git commit -m "Fase 7 completada: copias de seguridad y pantalla de Ajustes (RF-07)"
```

Ojo: `src/App.tsx` y `tests/App.test.tsx` también contienen cambios de la rama de auth si ese agente siguió trabajando; revisar `git diff` antes de añadir.

Queda además **sin commitear** el fix de `src/components/categories/CategoryIcon.tsx` (mapeo completo de iconos permitidos + alias legacy), de la Fase 6.

---

## 6. Pendiente / siguiente paso

1. **Resolver la contradicción Firebase vs. AGENTS.md** con el dueño del proyecto (§4.1). Es la decisión bloqueante.
2. Cerrar Fase 7 con commit (§5) una vez verde el árbol.
3. **Fase 8 — Entrega**: build de producción, PWA (`vite-plugin-pwa` **solo con confirmación previa**), documentación de instalación, uso y limitaciones.
4. Verificación manual pendiente de la Fase 7 en navegador a 390 px (§3).
5. Deuda conocida de fases anteriores (no bloqueante):
   - Clases "Tailwind" inline sin Tailwind instalado (no aplican): `CategoryFormDialog.tsx`, `DashboardCharts.tsx`, chip de `Expenses.tsx` → migrar a CSS Modules.
   - Textos hardcodeados fuera de `i18n/es.ts` en `Categories.tsx`, KPIs de `Dashboard.tsx`, `DashboardCharts.tsx`.
   - `DEFAULT_ROUTE` sigue en `gastos` pese a existir el Panel (`hooks/useHashRoute.ts`, comentario obsoleto).
   - `Dashboard.tsx` y `Budgets.tsx` acceden a `db` directamente (excepción a la regla de capas).
   - `CategoryBadge` usa un mapa de iconos distinto y con claves legacy (`bus`, `house`, `shopping-bag`).
