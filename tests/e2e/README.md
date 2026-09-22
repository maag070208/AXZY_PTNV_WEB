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
placeholder. Todo eso vive en `pages/componentes.ts`: si el kit gana testids o
cambian los textos, se ajusta ahí y ningún spec se entera.

**Sesión una sola vez.** El proyecto `setup` entra por la pantalla de acceso
real, guarda `storageState` y los demás proyectos lo reutilizan. `sesion.spec.ts`
es la excepción: corre sin sesión, porque prueba justamente la puerta de entrada.

**Aislamiento y limpieza.** Cada test crea su propio tipo de dispositivo con
prefijo `E2E`, así que nadie mueve las existencias de nadie y los datos reales
del cliente no se tocan. La limpieza la hace el paquete `api/`, que es el dueño
de la base: esta suite invoca sus scripts `test:e2e:provision` y
`test:e2e:clean` en vez de duplicar Prisma y el `.env` en el frontend.

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
