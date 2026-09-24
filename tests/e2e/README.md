# Suite E2E de la web (Playwright)

Pruebas de navegador **reales**: Chromium abre la app servida por Vite, opera
los formularios como una persona y todo pega contra la API de verdad en
`localhost:4001`, que escribe en Postgres de verdad. No hay mocks de red.

Cubre los cuatro flujos del ciclo de vida de un dispositivo por pantalla,
contra la especificación funcional de [`DISPOSITIVOS.md`](../../../DISPOSITIVOS.md):

| Archivo | Pantalla | Flujo |
|---|---|---|
| `sesion.spec.ts` | `/login` | Acceso, credenciales inválidas, rutas protegidas |
| `alta.spec.ts` | `/inventario/dispositivos/nuevo` | ALTA de dispositivos y unidades |
| `prestamos.spec.ts` | `/inventario/prestamos/nuevo`, `/inventario/devoluciones/nueva` | PRÉSTAMOS y devoluciones |
| `mantenimiento.spec.ts` | `/inventario/movimientos/nuevo` | MOVIMIENTOS DE MANTENIMIENTO |
| `baja.spec.ts` | `/inventario/movimientos/nuevo` | BAJA |
| `ciclo-completo.spec.ts` | todas | El recorrido completo, sólo por pantalla |
| `tickets.spec.ts` | `/tickets`, `/tickets/nuevo`, `/tickets/:id`, `/catalogos` | Tickets: lista server-side, alta/edición, detalle, borrado y categorías |
| `tickets-tablero.spec.ts` | `/tickets/kanban`, `/tickets/tareas`, `/tickets/mis-tareas` | Tablero kanban, tareas y administración de tareas |

## Cómo correrlas

```bash
cd web
npm test
```

Playwright levanta lo que falte —la API (`../api`) y Vite— y reutiliza lo que ya
esté corriendo. Postgres sí tiene que estar arriba (`docker compose up -d postgres`
desde la raíz).

```bash
npm test -- prestamos.spec.ts     # un solo flujo
npm test -- -g "devoluciones"     # por nombre
npm run test:e2e:headed           # viendo el navegador
npm run test:e2e:ui               # modo interactivo
npm run test:e2e:report           # abrir el último reporte HTML
```

## Cómo están armadas

**Se prueba la pantalla; el escenario se siembra por API.** Dar de alta un tipo
y un dispositivo son varios formularios, y ya tienen su propio spec: para los
demás flujos eso se prepara con una llamada (`support/api.ts`) y la prueba se
concentra en la pantalla del flujo en cuestión.

**Se verifica contra el backend, no contra la propia pantalla.** Después de
operar la UI, las aserciones leen las existencias, las unidades y los
movimientos reales por API. Que la pantalla diga que guardó no prueba que haya
guardado.

**Page Objects con los selectores frágiles adentro** (`support/pages/`). El kit
`@axzydev/axzy_ui_system` no expone `data-testid`, y su `ITSearchSelect` ni
siquiera liga el `<label>` con su input, así que ese control se maneja por
placeholder. Desde el kit 1.3.0 el panel de `ITSearchSelect`/`ITMultiSelect` se
monta por **portal** en `document.body` (no dentro del control): los selectores
del panel viven en `pages/componentes.ts` (`panelBuscador`/`opcionesBuscador`).
Todo eso vive ahí: si el kit gana testids o cambian los textos, se ajusta en un
solo lugar y ningún spec se entera.

**Ticket de producto pendiente (bitácora `/access`).** La página arma `start`/
`end` como `YYYY-MM-DD` en la TZ del **navegador** y **no envía `tz`**; la API
resuelve el rango con `ACCESS_REPORT_TIMEZONE`/`TZ`/`America/Mexico_City`. Entre
las 23:00 y las 23:59 locales (navegador detrás de la TZ de la API) el día del
navegador y el de la API no coinciden y los eventos recién creados caen fuera
del rango. Mitigado en los tests ampliando el rango; el arreglo real es que la
pantalla mande su `tz` (o alinee la TZ con la de la API).

**Sesión una sola vez.** El proyecto `setup` entra por la pantalla de acceso
real, guarda `storageState` y los demás proyectos lo reutilizan. `sesion.spec.ts`
es la excepción: corre sin sesión, porque prueba justamente la puerta de entrada.

**Aislamiento y limpieza.** Cada test crea su propio tipo de dispositivo con
prefijo `E2E`, así que nadie mueve las existencias de nadie y los datos reales
del cliente no se tocan. La limpieza la hace el paquete `api/`, que es el dueño
de la base: esta suite invoca sus scripts `test:e2e:provision` y
`test:e2e:clean` en vez de duplicar Prisma y el `.env` en el frontend.

### Tickets (Fase 1 de cobertura)

`tickets.spec.ts` y `tickets-tablero.spec.ts` cubren el módulo de tickets por
pantalla: lista server-side (filtros de título/estado/prioridad y paginación),
alta y edición, detalle (comentario, cambio de estado, cierre en cascada),
ciclo de borrado (papelera → físico), catálogo de categorías y el tablero de
tareas (alta, cambio de estado, mis tareas y administración), con el gate por
rol de EMPLEADO.

**Criterio de limpieza.** Todo ticket se crea con título `E2E …` y toda
categoría con nombre `E2E …`. La limpieza del paquete `api/`
(`limpiarTicketsE2E`) barre por ese prefijo, en orden FK-safe: notificaciones y
correos de ticket → tickets (cascadea asignaciones/comentarios/historial) →
categorías `E2E` sin tickets. Los correos se resuelven por `entityId` y, como
respaldo, por asunto `E2E ` para tickets ya borrados físicamente.

**Exclusiones justificadas.**

- **Adjuntos / S3.** Fuera de la Fase 1 por completo (ni happy path ni error):
  los adjuntos van a S3 y sin credenciales la API responde 503, así que la
  prueba dependería del entorno. No se monta S3.
- **GERENTE.** No se provisiona `e2e_gerente`; el caso "GERENTE en
  `/tickets/tareas`" queda como un `test.skip` nombrado (`requiere
  e2e_gerente`). ADMIN cubre los caminos privilegiados y EMPLEADO las
  restricciones.
- **Arrastrar y soltar del tablero.** El DnD HTML5 nativo no es automatizable
  de forma estable en Chromium headless. El mismo comportamiento de negocio se
  cubre moviendo el estado de la tarea desde el detalle (`TasksGraph`) y
  verificando la columna al recargar el tablero.

**Limitación de producto (documentada, no se toca).** El diálogo "Nueva tarea"
del tablero (`CreateTaskDialog`) usa `ITDialog`, que cierra al detectar un
`mousedown` fuera de su caja; como el panel de `ITSearchSelect` se monta por
portal en `document.body`, elegir una opción con un click normal cerraría el
diálogo. El page object elige las opciones con `dispatchEvent("click")` (sin
`mousedown`) para mantenerlo abierto. El arreglo real es que el kit no cierre el
diálogo cuando el click cae dentro del panel portado.

### Residuos persistentes (inventario real)

La suite **no debe dejar residuos que crezcan entre corridas**. Lo que crea
(con prefijo `E2E`) lo borra el teardown de `api/`: tipos, dispositivos, unidades,
préstamos, eventos de acceso y también tickets/categorías de ticket. Lo único que
**sí** sobrevive, a propósito, son
las cuentas de usuario de prueba, porque las referencian FKs (`Restrict`) de
eventos o porque el `provision` las deja fijas (el residuo legado, que **no** es
intencional, se detalla más abajo). El inventario estable es:

| Cuenta | Origen | Por qué queda |
|---|---|---|
| `e2e_admin`, `e2e_empleado`, `e2e_guard` | `test:e2e:provision` (api) | Usuarios base de la suite; se reutilizan |
| `e2e_bitacora_relleno_1..3` | `access.spec.ts` | Alta idempotente (`asegurarUsuario`) |
| `e2e_report_con` | `access-report.spec.ts` | Alta idempotente; tiene eventos ligados |
| `e2e_horas_extra` | `horas-extra.spec.ts` | Alta idempotente; tiene eventos ligados |
| `e2e_report_sin` | `access-report.spec.ts` | Se crea y se borra en cada corrida (no persiste) |

Son **inocuos**: el universo del reporte de acceso es el personal activo
(`GERENTE`/`JEFE_DE_AREA`/`EMPLEADO`) ∪ quien tenga eventos; las cuentas de
relleno y de reporte son `GUARD`, así que sin eventos (los borra el teardown) no
aparecen en ningún reporte, y ninguna se reutiliza por nombre en las aserciones.

#### Residuo legado (medido 2026-09-24, **NO barrido**)

Además de las cuentas de arriba, la base arrastra residuo de las corridas
**previas al arreglo**, que el cleanup no alcanzaba y que **sigue sin barrerse**:
borrarlo es una operación destructiva que requiere autorización explícita, y
todavía no la hay. Los volúmenes medidos hoy son:

| Residuo | Cantidad | Firma |
|---|---|---|
| Tipos de dispositivo | **62** | `code`/`name` `Tipo UI A…`; `code NOT LIKE 'E2E%'` |
| Dispositivos | **62** | `nombre` `Equipo A…` |
| Unidades físicas | **62** | ligadas a esos dispositivos |
| Préstamos | **57** | con detalle sobre esos dispositivos |
| Cuentas `e2e_report_<run>_con` | **36** | una por corrida de `access-report.spec` viejo |
| Cuentas `e2e_horas_extra_<run>` | **13** | una por corrida de `horas-extra.spec` viejo |

Totales de la base: `tipos_dispositivo` 97 (35 reales + 62 residuo),
`dispositivos` 139 (77 + 62), `unidades_fisicas` 400 (338 + 62) y `prestamos`
84 (27 + 57).

- **Prefijo real, no `AA…`.** El `reportes.spec` buggy generaba el escenario con
  `marca = 'A' + Date.now().toString(36).toUpperCase() + 4 aleatorios`. En 2026 el
  base36 del timestamp arranca con `M` (`MJUOHS00`…`MYC87PC0`), así que el prefijo
  observable es **`AM…`**, nunca `AA…`.
- **Por qué `LIKE 'AA%'` daba falso verde.** El chequeo se hizo con el prefijo
  equivocado: `SELECT count(*) … WHERE code LIKE 'AA%'` devuelve **0** aunque el
  residuo exista (62 filas). El filtro correcto es por el nombre:
  `name LIKE 'Tipo UI %' AND code NOT LIKE 'E2E%'`.
- **Cuentas de QA manual.** `e2e_qa_mudumn23` (`GUARD`, 2026-09-23) **no** la crea
  la suite — no hay ninguna referencia `e2e_qa` en `tests/e2e` —; es residuo de
  una corrida manual de QA. No crece ni interfiere, pero se lista para que el
  inventario sea completo.

El barrido (una vez autorizado) es un `DELETE` acotado por esos patrones
—`code LIKE 'A%' AND name LIKE 'Tipo UI %' AND code NOT LIKE 'E2E%'` y sus
dependientes— y el conteo de la tabla es el que debe cuadrar antes y después.
**Procedimiento pendiente de autorización: no se ejecutó.** El código ya no
genera este residuo (el escenario sale del fixture `escenario` con prefijo `E2E`,
que el teardown borra), así que la deuda no crece entre corridas.

**Serie, no paralelo.** `workers: 1` a propósito: los tests comparten la base
real y el consecutivo de préstamo del backend se calcula con `count() + 1` bajo
aislamiento Serializable, así que dos préstamos concurrentes chocan.

## Un detalle del HashRouter

La app usa `HashRouter`, así que navegar de `#/a` a `#/b` no recarga el
documento. Las pantallas hacen `setTimeout(navigate, 1s)` después de guardar
para que se alcance a ver el toast, y ese `navigate` tardío desmontaría el
formulario al que el test acaba de llegar. Por eso `irARuta` (en
`pages/componentes.ts`) añade un `reload`: corta esa herencia y cada pantalla
arranca limpia.

## Variables de entorno

Salen del mismo `web/.env` que consume la app.

| Variable | Default | Para qué |
|---|---|---|
| `E2E_WEB_URL` | `http://localhost:5006` | Apuntar a otra instancia de la app |
| `E2E_API_URL` | `VITE_API_URL` | Apuntar a otra API |
| `E2E_PASSWORD` | `e2e-Test-2026!` | Contraseña de los usuarios de prueba |
