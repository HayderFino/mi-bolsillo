# AGENTS.md — Mi Bolsillo

Guía para agentes de código (y personas) que trabajen en este repositorio. Léela completa antes de modificar archivos. Si algo aquí contradice una petición puntual, avisa y pregunta antes de actuar.

## 1. Qué es el proyecto

**Mi Bolsillo** es una aplicación web de finanzas personales centrada **exclusivamente en gastos**. Debe responder:

- ¿Cuánto he gastado este mes?
- ¿En qué categorías gasto más?
- ¿Cómo han evolucionado mis gastos?
- ¿Cuánto presupuesto me queda por categoría?
- ¿Qué categorías están cerca de superar su límite?

Prioridades: **sencillez, privacidad, rapidez de registro y claridad de datos**.

## 2. Decisiones confirmadas (no cambiar sin consultar)

| Tema | Decisión |
|---|---|
| Nombre | Mi Bolsillo (provisional; debe ser fácil de cambiar → constante única `APP_NAME`) |
| Plataforma | Web, navegadores modernos |
| Idioma UI | Español |
| Moneda | COP, importes como **enteros** (sin decimales) |
| Registro | Manual |
| Almacenamiento | Local en el navegador (IndexedDB vía Dexie) |
| Movimientos | Gastos **e ingresos**, en tablas separadas (`expenses` / `incomes`) |
| Categorías | 8 predeterminadas de gasto + 6 predeterminadas de ingreso, editables, se pueden crear nuevas |
| Presupuestos | Independientes por categoría **y** por mes |
| Alertas | Advertencia ≥ 80 %, excedido > 100 % |
| Estilo | Bancario, sobrio, profesional |
| Costos | Cero infraestructura obligatoria |

> **Cambio de alcance (confirmado por el usuario):** los **ingresos** forman parte de la app (registro manual, listado propio, categorías propias de ingreso y KPIs de *Ingresado* y *Balance* en el Panel). Están en una tabla separada de los gastos, **no** se mezclan con el presupuesto de gasto y **no se sincronizan con Firebase** (pendiente; ver §15). El resto de exclusiones de abajo siguen vigentes.

### Fuera de alcance del MVP (NO implementar)

Conexiones bancarias, IA, servicios de pago, multimoneda, cifrado del almacenamiento local.

## 3. Stack obligatorio

- **React** + **TypeScript** + **Vite**
- **Dexie** sobre **IndexedDB**
- **Recharts** (gráficas)
- **Lucide React** (iconos)
- CSS Modules (o equivalente consistente)
- Pruebas: Vitest + Testing Library + `@testing-library/user-event` + `jsdom` (componentes) + `fake-indexeddb` (persistencia)
- PWA: `vite-plugin-pwa` **solo en la Fase 8** y con confirmación previa

Reglas sobre dependencias:

- No añadir bibliotecas sin explicar su utilidad y pedir confirmación.
- Prohibido: backend, base de datos remota, servicios de pago.

## 4. Comandos

Ejecutar desde la raíz del proyecto (`mi-bolsillo/`):

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo
npm run build        # compilación de producción (incluye type-check)
npm run preview      # previsualizar build
npm run lint         # linter
npm run test         # pruebas unitarias
```

Creación inicial (solo Fase 1):

```bash
npm create vite@latest mi-bolsillo -- --template react-ts
cd mi-bolsillo
npm install
npm install dexie recharts lucide-react
npm run dev
```

## 5. Arquitectura

Frontend organizado por responsabilidades. Evitar sobreingeniería; ajustar la estructura solo con justificación técnica.

```
mi-bolsillo/
├── public/
├── src/
│   ├── components/{layout,expenses,budgets,charts}/
│   ├── pages/        Dashboard, Expenses, Budgets, Categories, Settings
│   ├── db/           database.ts, seed.ts
│   ├── services/     expenseService, incomeService, budgetService, categoryService, incomeCategoryService, statisticsService, backupService
│   ├── utils/        currency.ts, dates.ts
│   ├── types/        index.ts
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
└── tests/
```

Separación de capas (estricta):

- **components/pages**: solo presentación y estado de UI. Nunca acceden a Dexie directamente.
- **services**: lógica de negocio, validación e integridad. Único punto de acceso a `db`.
- **db**: esquema Dexie, versiones y migraciones.
- **utils**: funciones puras (formato de moneda, fechas).

### Navegación

1. Panel principal · 2. Gastos · 3. Ingresos · 4. Presupuestos · 5. Categorías · 6. Configuración y copias de seguridad

## 6. Modelo de datos

```ts
Expense  { id, amount, description, date, categoryId, paymentMethod, createdAt, updatedAt }
Category { id, name, icon, color, active }
Budget   { id, categoryId, yearMonth, limitAmount }
IncomeCategory { id, name, icon, color, active }
Income   { id, amount, description, date, incomeCategoryId, paymentMethod, createdAt, updatedAt }
```

Convenciones:

- `amount` y `limitAmount`: **enteros positivos** en COP.
- `date`: string `YYYY-MM-DD` (fecha local, sin zona horaria). `yearMonth`: `YYYY-MM`.
- `paymentMethod`: `"efectivo" | "tarjeta" | "transferencia"`.
- `createdAt` / `updatedAt`: ISO 8601.
- `Budget.id` **determinista y único** por categoría+mes (p. ej. `${categoryId}_${yearMonth}`).
- **No persistir totales derivados** (totales, porcentajes, restantes): se calculan desde los gastos.
- Todo cambio de esquema → nueva versión de Dexie con migración.

## 7. Reglas de negocio

### Gastos

- Importe entero > 0. Descripción no vacía (tras `trim`). Fecha obligatoria y válida.
- Categoría existente y **activa** al crear un gasto nuevo.
- Método de pago dentro de los valores permitidos.
- Se permiten fechas pasadas.
- Validar **en la UI y en la capa de servicios** (la UI no es la fuente de verdad).

### Historial

- Orden por defecto: fecha descendente.
- Búsqueda por descripción; filtros por periodo, categoría y método de pago.
- Editar y eliminar; **eliminar requiere confirmación**.
- Cualquier cambio actualiza totales, gráficas y presupuestos.

### Categorías

- Predeterminadas: Alimentación, Transporte, Vivienda y servicios, Compras personales, Salud, Educación, Ocio y entretenimiento, Otros.
- Crear, renombrar, cambiar icono/color, activar/desactivar.
- Desactivar **no** borra gastos históricos. Una categoría con gastos **no se elimina** (solo se desactiva).

### Ingresos

- Mismas reglas de validación que los gastos (importe entero > 0, descripción no vacía, fecha válida, método de pago permitido, fecha pasada permitida).
- Categoría de ingreso existente y **activa** al crear; al editar se permite una categoría desactivada.
- Tabla `incomes` separada; **no** afecta a presupuestos ni a las estadísticas de gasto.
- Categorías de ingreso predeterminadas: Salario, Freelance, Negocio propio, Regalo, Reembolso, Otros.
- Al editar se conserva `createdAt` y se refresca `updatedAt`.
- `deleteIncome` requiere confirmación en la UI.
- **No se sincronizan con Firebase** (pendiente): `syncService` solo refleja gastos y categorías de gasto.

### Presupuestos

- Límite mensual por categoría; se crea, modifica y consulta.
- Cálculo: límite, gastado, restante, % consumido, estado.
- Estados: `< 80 %` normal · `80 %–100 % (inclusive)` advertencia · `> 100 %` excedido.
- **Nunca bloquear** el registro de gastos por exceder un presupuesto.
- El gasto cuenta en el mes de su `date`, no en el de captura.
- Sin presupuesto definido → mostrar solo el gasto, sin inventar límite.
- Los ejemplos de montos del prompt original son ilustrativos: **no precargarlos**.

### Dashboard y gráficas

- Total del mes, nº de movimientos, categoría con mayor gasto, resumen de presupuesto, distribución por categoría, evolución temporal, últimos movimientos, acceso rápido a "Registrar gasto".
- KPIs adicionales de ingresos del mes: **Ingresado** y **Balance** (ingresos − gastos). El balance nunca altera presupuestos.
- Selector de mes compartido por Panel y Presupuestos.
- Gráficas e indicadores usan **los mismos filtros y periodo** (misma función de consulta).
- **Todas las gráficas se hacen con Recharts.** No usar CSS/SVG manual ni otras bibliotecas.
- RF-06 exige: distribución por categoría, evolución por día o mes, comparación entre categorías y resúmenes del periodo.
- Los cálculos viven en `statisticsService.ts` como funciones puras; los componentes solo presentan.
- No inventar datos. Datos ficticios solo en demos claramente rotuladas.
- No sobrecargar: prioridad = total mensual, gasto por categoría, presupuestos.

### Copias de seguridad

- Exportar a JSON con `version` del formato; restaurar desde JSON.
- Importar: validar estructura, rechazar datos malformados/incompatibles, **confirmar antes de sobrescribir**, informar éxito o error, preservar relaciones gasto–categoría–presupuesto, operación atómica (todo o nada).

## 8. Diseño visual

- Fondo claro y neutro; color principal verde oscuro o azul marino.
- Tipografía limpia, tarjetas discretas, tablas ordenadas, gráficas minimalistas, iconos consistentes, espaciado uniforme.
- Estados vacíos útiles. Mensajes claros de error y éxito.

### Mobile-first (decisión confirmada)

- Diseñar primero para 360–430 px y adaptar hacia pantallas grandes con `min-width`.
- Navegación inferior en móvil; barra lateral en escritorio.
- Botón flotante "+" para registrar un gasto.
- Historial: lista de tarjetas en móvil, tabla en escritorio.
- Input de importe con `inputMode="numeric"`; se muestra con formato COP y se guarda como entero.
- Áreas táctiles mínimas de 44 px.
- Metaetiquetas `viewport` y `theme-color`; respetar `env(safe-area-inset-*)`.
- Objetivo final: app instalable (PWA) y funcional sin conexión.
- Indicadores de estado (presupuestos) nunca solo con color: incluir texto y `role="progressbar"` con `aria-valuenow/min/max`.
- Tokens de diseño (colores, espaciado) en variables CSS centralizadas.

## 9. Requisitos no funcionales

- **Privacidad**: los datos no salen del navegador. Sin analítica ni peticiones externas con datos del usuario.
- **Persistencia**: los datos sobreviven al cerrar/reabrir el navegador.
- **Accesibilidad**: etiquetas en formularios, navegación por teclado, contraste suficiente.
- **Rendimiento**: fluido con miles de movimientos (consultas indexadas, evitar renders innecesarios).
- **Mantenibilidad**: componentes pequeños, lógica fuera de la UI, sin código muerto.

### Mensajes obligatorios al usuario / documentación

- IndexedDB **no es una copia de seguridad**: borrar datos del navegador o cambiar de dispositivo puede perder todo. Recomendar exportar JSON periódicamente.
- El almacenamiento local **no está cifrado automáticamente**; cualquiera con acceso al perfil del navegador podría leerlo. No afirmar lo contrario.

## 10. Convenciones de código

- TypeScript `strict`. Sin `any` salvo justificación comentada.
- `@types/node` solo en la configuración de TypeScript de las pruebas, nunca en `tsconfig.app.json`.
- Nombres de código en inglés; textos de UI en español (centralizados, no dispersos).
- Formato de moneda con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`.
- Fechas: utilidades en `utils/dates.ts`; evitar `new Date('YYYY-MM-DD')` sin cuidar la zona horaria.
- Funciones de cálculo puras y testeables.
- Errores de servicio: lanzar errores tipados con mensaje legible; la UI los muestra.

## 11. Pruebas

Cobertura mínima requerida:

- Cálculos presupuestarios (umbrales 79 %, 80 %, 100 %, 101 %, sin presupuesto).
- Validaciones de gasto (importe 0/negativo/decimal, descripción vacía, fecha inválida, categoría inactiva).
- Persistencia y CRUD (con `fake-indexeddb`).
- Asignación de gastos al mes correcto (límites de mes, fin de año).
- Exportación/importación (archivo válido, malformado, versión incompatible, rechazo de sobrescritura).
- Integridad: no eliminar categorías con gastos.
- Limitación conocida: jsdom no calcula tamaños de layout, así que `ResponsiveContainer`/Recharts **no se verifican en pruebas**. Las gráficas y el diseño a 390 px se comprueban a mano en el navegador y así se reporta.
- Componentes (`.test.tsx`, jsdom + user-event): crear y editar gasto, errores de validación, eliminar con confirmación, filtros, selector de mes y estados de presupuesto.

## 12. Reglas de trabajo para el agente

1. Avanzar **de forma incremental**, por fases (sección 14). No generar toda la app de una vez.
2. Antes de crear/modificar archivos, explicar brevemente su función.
3. Trabajar archivo por archivo o en grupos pequeños y coherentes.
4. Al entregar un archivo, dar su **ruta exacta** y su **contenido completo** (sin `...` cuando deba copiarse entero).
5. Indicar desde qué directorio se ejecuta cada comando.
6. Con terminal disponible: ejecutar build, lint y tests y **reportar resultados reales**. Sin terminal: dar instrucciones para que el usuario verifique y pedir el resultado.
7. **No afirmar** que algo compila, funciona o está probado si no se comprobó.
8. Si hay errores, diagnosticarlos y corregirlos antes de continuar.
9. No cambiar decisiones funcionales confirmadas sin consultar.
10. Decisión no esencial pendiente → proponer una opción razonable y explícita. Decisión bloqueante → una pregunta concreta.
11. No añadir dependencias ni funcionalidades innecesarias.
12. No crear funcionalidades ficticias que aparenten estar conectadas a datos reales.
13. Prioridad: seguridad, integridad de datos y mantenibilidad.
14. No asumir que algo está implementado si solo fue diseñado o descrito.
15. **No asumir requisitos**: leer RF-05 y RF-06 de este documento (o del prompt original) antes de implementar o reportar faltantes.
16. **Honestidad sobre las pruebas**: prohibido escribir "100 % probado", "garantizo" o "exhaustivo". Marcar `probado` solo lo realmente ejecutado y distinguir *probado en memoria/jsdom* de *probado en navegador*. No afirmar mobile-first por haber leído el CSS: verificarlo en un ancho de 390 px.
17. Ejecutar siempre `npm run test:run`, `npm run build` y `npm run lint` antes de cerrar una tarea y mostrar la salida real.
18. Respetar la numeración de fases de la sección 14. No renombrar ni saltarse fases.
19. Antes de instalar una dependencia (aunque sea de desarrollo) o cambiar configuración global, avisar y justificar.
20. Un commit de git por fase cerrada.

## 13. Definición de "terminado" (por tarea)

- [ ] Cumple el requisito y las reglas de negocio de este documento.
- [ ] Validado en UI y servicios.
- [ ] `npm run build` y `npm run lint` sin errores.
- [ ] Pruebas relevantes escritas y pasando.
- [ ] Accesible por teclado y con etiquetas.
- [ ] Sin dependencias ni código sobrante.
- [ ] Seguimiento actualizado (sección 15).

## 14. Plan por fases (numeración oficial)

1. **Preparación**: verificar Node/npm, crear proyecto Vite react-ts, instalar dependencias, comprobar que arranca. *(Empezar solo aquí.)*
2. **Base técnica**: tipos, Dexie, seed de categorías, servicios base, verificar persistencia.
3. **Gastos**: formulario, CRUD, validaciones, filtros y búsqueda.
4. **Presupuestos**: CRUD por categoría/mes, cálculos, alertas 80 % y 100 %.
5. **Dashboard**: indicadores (total, nº de movimientos, categoría top, presupuesto usado), gráficas con Recharts, últimos movimientos, acceso rápido a registrar gasto, selector de mes, consistencia de datos.
6. **Categorías (RF-03)**: pantalla de gestión (crear, renombrar, icono y color, activar/desactivar, consultar el historial de gastos de cada categoría). Reutiliza `categoryService`; no se elimina una categoría con gastos. No incluye "preferencias" ni ajustes que no estén en los requisitos.
7. **Respaldo y calidad**: pantalla de Configuración con export/import JSON (RF-07), pruebas de casos límite, persistencia al recargar, accesibilidad.
8. **Ingresos** (ampliación de alcance confirmada): tipos, tablas `incomes`/`incomeCategories` (Dexie v2), servicios, seed de categorías de ingreso, pantalla CRUD con filtros, KPIs de *Ingresado*/*Balance* en el Panel y backup v2 (compatible con v1). No se sincroniza con Firebase.
9. **Entrega**: build de producción, PWA (`vite-plugin-pwa`, con confirmación previa), documentación de instalación, uso y limitaciones.

No pasar a la siguiente fase sin cerrar la anterior.

## 15. Formato de seguimiento (al final de cada fase)

Mantener una lista de tareas con estados: `pendiente` · `en desarrollo` · `implementado` · `probado`.

Al cerrar cada fase reportar:

- **Estado**
- **Archivos creados o modificados**
- **Comandos ejecutados**
- **Pruebas realizadas y resultados reales**
- **Problemas conocidos**
- **Siguiente paso**