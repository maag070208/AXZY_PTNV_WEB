import { test, expect } from "./support/fixtures";
import { E2E, route } from "./support/env";
import { goToRoute } from "./support/pages/components";

/**
 * Reloj checador (`/access/checador`): submódulo de Control de acceso con las
 * checadas copiadas de los relojes Hikvision (ver CHECADOR.md en la raíz).
 *
 * Las checadas solo entran por la sincronización con los relojes, así que aquí
 * no se siembran: se prueba la pantalla (estado de la sincronización, filtros y
 * la petición server-side a `POST /checador/query`) sin depender del volumen
 * real. No se pulsan "Sincronizar todo" ni "Importar de los relojes": leerían de los
 * relojes de verdad.
 */
test.describe("Reloj checador", () => {
  test("ADMIN ve el estado de la sincronización y la tabla pide al servidor", async ({
    page,
  }) => {
    const query = page.waitForResponse(
      (r) => r.url().includes("/time-clock/query") && r.request().method() === "POST"
    );
    await goToRoute(page, "/access/time-clock");

    await expect(page.getByRole("heading", { level: 1, name: "Reloj checador" })).toBeVisible();
    await expect(page.getByText("Sincronización con los relojes", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Solo lectura: la API nunca modifica la configuración de los relojes.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sincronizar todo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Importar de los relojes" })).toBeVisible();
    await expect(page.locator("table thead").getByText("Fecha y hora")).toBeVisible();
    await expect(page.locator("table thead").getByText("Reloj", { exact: true })).toBeVisible();

    // El día lo resuelve la API con su TZ de empresa (la web no manda `tz`).
    const res = await query;
    expect(res.status()).toBe(200);
    const { filters } = res.request().postDataJSON() as { filters: Record<string, unknown> };
    expect(filters.tz).toBeUndefined();
    expect(filters.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // ADMIN administra los relojes (en Configuración) desde aquí.
    await page.getByRole("button", { name: "Administrar relojes" }).click();
    await expect(page).toHaveURL(/#\/time-clocks$/);
  });

  test("el subitem de menú 'Reloj checador' es visible para ADMIN", async ({ page }) => {
    await goToRoute(page, "/access/time-clock");

    // La barra lateral arranca colapsada; al pasar el mouse se expande y el
    // padre (auto-expandido por el subitem activo) muestra sus hijos.
    await page.locator("aside").hover();
    await expect(page.getByText("Reloj checador", { exact: true }).first()).toBeVisible();
  });
});

test.describe("Reloj checador — entradas/salidas y vínculos", () => {
  // Solo lectura: no se vincula nada, para no tocar los datos reales.
  test("el reporte de entradas/salidas del reloj reutiliza el de acceso con su propia fuente", async ({
    page,
  }) => {
    const query = page.waitForResponse(
      (r) => r.url().endsWith("/time-clock/report") && r.request().method() === "POST"
    );
    await goToRoute(page, "/access/time-clock/entries-exits");

    await expect(
      page.getByRole("heading", { level: 1, name: "Entradas/salidas del reloj" })
    ).toBeVisible();
    await expect(page.getByText(/empleados del reloj vinculados/)).toBeVisible();

    const res = await query;
    expect(res.status()).toBe(200);
    const { filters } = res.request().postDataJSON() as { filters: Record<string, unknown> };
    expect(filters).toMatchObject({ period: "DAY" });

    await page.getByRole("button", { name: "Vincular empleados" }).click();
    await expect(page).toHaveURL(/#\/access\/time-clock\/employees/);
  });

  test("la pantalla de vínculos lista los empleados del reloj con sus sugerencias", async ({ page }) => {
    const query = page.waitForResponse((r) => r.url().includes("/time-clock/employees/query"));
    await goToRoute(page, "/access/time-clock/employees");

    await expect(page.getByRole("heading", { level: 1, name: "Empleados del reloj" })).toBeVisible();
    expect((await query).status()).toBe(200);
    await expect(page.getByText("En el reloj", { exact: true })).toBeVisible();
    await expect(page.getByText("Sugerencias seguras", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Vincular \d+ sugerencias seguras/ })).toBeVisible();
  });
});

/**
 * Relojes (`/relojes`, en Configuración, solo ADMIN): alta, baja y configuración
 * leída en vivo. Para no depender de los equipos, el estado y la configuración
 * se simulan con `page.route`; el alta sí pega a la API, con una dirección
 * inválida que se rechaza antes de conectarse a nada.
 */
test.describe("Reloj checador — relojes", () => {
  const SERIAL = "E2E-CLOCK-WEB";
  const CLOCK = {
    clockSerial: SERIAL,
    name: "E2E Puerta de personal",
    url: "https://10.0.0.99",
    countsAttendance: true,
    model: "DS-K1T320MFWX-B",
    lastSerialNo: 4_321,
    syncedAt: "2026-09-24T20:00:00.000Z",
    punches: 1_234,
    lastPunch: "2026-09-24T19:55:00.000Z",
    inProgress: null,
    lastRun: null,
    pausedByCredentials: false,
  };

  test("ADMIN ve cada reloj con su sincronización y su configuración en vivo", async ({ page }) => {
    await page.route("**/time-clock/status", (route) =>
      route.fulfill({
        json: { configured: true, inProgress: null, importJob: null, devices: [CLOCK] },
      })
    );
    await page.route(`**/time-clock/clocks/${SERIAL}/settings`, (route) =>
      route.fulfill({
        json: {
          clockSerial: SERIAL,
          readAt: "2026-09-24T20:01:00.000Z",
          device: {
            name: "Administracion",
            model: "DS-K1T320MFWX-B",
            firmware: "V3.5.20",
            mac: "88:de:39:62:84:fb",
          },
          hour: {
            localTime: "2026-09-24T13:01:00-07:00",
            mode: "manual",
            zone: "CST+7:00:00",
            driftSeconds: 150,
          },
          people: { total: 38, withFace: 37, withFingerprint: 35, withCard: 0 },
        },
      })
    );
    await goToRoute(page, "/time-clocks");

    await expect(page.getByRole("heading", { level: 1, name: "Relojes checadores" })).toBeVisible();
    await expect(page.getByText(/Solo lectura: el sistema se conecta a los relojes/)).toBeVisible();
    await expect(page.getByText(CLOCK.name, { exact: true })).toBeVisible();
    await expect(page.getByText(CLOCK.url, { exact: true })).toBeVisible();
    await expect(page.getByText("Al día", { exact: true })).toBeVisible();
    await expect(page.getByText("Cuenta para entradas/salidas", { exact: true })).toBeVisible();
    // Configuración del reloj, tal como la reporta el equipo.
    await expect(page.getByText("Administracion", { exact: true })).toBeVisible();
    await expect(page.getByText("24/09/2026 13:01:00 (UTC-07:00)")).toBeVisible();
    await expect(page.getByText("37 con rostro · 35 con huella · 0 con tarjeta")).toBeVisible();
    // 150 s de diferencia con el servidor: se avisa.
    await expect(page.getByText("Va 2 min 30 s adelantado")).toBeVisible();
  });

  test("editar cambia si cuenta para entradas/salidas (solo el registro del sistema)", async ({ page }) => {
    await page.route("**/time-clock/status", (route) =>
      route.fulfill({
        json: { configured: true, inProgress: null, importJob: null, devices: [CLOCK] },
      })
    );
    await page.route(`**/time-clock/clocks/${SERIAL}/settings`, (route) =>
      route.fulfill({ status: 502, json: { code: "TIME_CLOCK_UNREACHABLE", message: "Sin conexión" } })
    );
    let sent: unknown = null;
    await page.route(`**/time-clock/clocks/${SERIAL}`, (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      sent = route.request().postDataJSON();
      return route.fulfill({ json: { ...CLOCK, countsAttendance: false } });
    });
    await goToRoute(page, "/time-clocks");

    await page.getByRole("button", { name: "Editar", exact: true }).click();
    await page.getByText("Cuenta para entradas/salidas", { exact: true }).last().click();
    await page.getByRole("button", { name: "Guardar", exact: true }).click();

    await expect(page.getByText(`${CLOCK.name} actualizado`)).toBeVisible();
    expect(sent).toEqual({ name: CLOCK.name, countsAttendance: false });
  });

  test("el alta muestra el motivo si la dirección no sirve", async ({ page }) => {
    await goToRoute(page, "/time-clocks");
    await page.getByRole("button", { name: "Dar de alta un reloj" }).click();

    await page.getByRole("textbox", { name: "Dirección del reloj" }).fill("ftp://10.0.0.99");
    const registration = page.waitForResponse(
      (r) => r.url().endsWith("/time-clock/clocks") && r.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Dar de alta", exact: true }).click();
    expect((await registration).status()).toBe(400);
    await expect(page.getByText(/no es una dirección válida/)).toBeVisible();
  });

  test("el subitem 'Relojes checadores' está en Configuración para ADMIN", async ({ page }) => {
    await goToRoute(page, "/time-clocks");
    const menu = page.locator("aside");
    await menu.hover();
    // Configuración se auto-expande por el subitem activo.
    await expect(menu.getByText("Configuración", { exact: true })).toBeVisible();
    await expect(menu.getByText("Relojes checadores", { exact: true })).toBeVisible();
  });
});

test.describe("Reloj checador — gate por rol", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("un EMPLEADO no accede al checador", async ({ page, login }) => {
    await login.enterAs(E2E.employee.username);

    await page.goto(route("/access/time-clock"));

    await expect(page).not.toHaveURL(/#\/access\/time-clock/);
    await expect(page.getByRole("heading", { name: "Reloj checador" })).toHaveCount(0);

    for (const destination of ["/access/time-clock/entries-exits", "/access/time-clock/employees"]) {
      await page.goto(route(destination));
      await expect(page).not.toHaveURL(/#\/access\/time-clock/);
    }
    // Relojes (Configuración) es solo de ADMIN.
    await page.goto(route("/time-clocks"));
    await expect(page).not.toHaveURL(/#\/time-clocks/);
    await expect(page.getByRole("heading", { name: "Relojes checadores" })).toHaveCount(0);
  });
});
