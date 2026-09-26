import type { Locator, Page } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { irARuta } from "./support/pages/componentes";
import { E2E } from "./support/env";

/**
 * REPORTE de dispositivos desde la web — `/reportes`, tab Dispositivos.
 *
 * El dispositivo y el préstamo se siembran por API; la pantalla debe mostrar
 * responsable, depto, días y folio (nada de "—") porque el backend normaliza
 * `PRESTADO → ASIGNADO`.
 *
 * El escenario sale del fixture `escenario` (prefijo `E2E`), así que el teardown
 * de `api/` lo borra y no queda residuo entre corridas. La tabla lista TODAS las
 * unidades ordenadas `activoFijo asc` y pagina en el cliente (10 renglones por
 * página), así que la fila no cae necesariamente en la primera: se la busca
 * recorriendo las páginas, sin depender del volumen de datos.
 */
test.describe("REPORTE de dispositivos desde la web", () => {
  /**
   * Recorre las páginas de la tabla hasta encontrar la fila que contiene `texto`.
   *
   * La tabla pagina en el cliente, así que no hay filtro por columna: se avanza
   * con el control de paginación y se espera a que el cuerpo cambie de página.
   * Es estable ante el volumen de datos: si la fila estuviera más allá, se sigue
   * paginando hasta agotar las páginas.
   */
  const ubicarFila = async (page: Page, texto: string): Promise<Locator> => {
    const fila = page.locator("tr", { hasText: texto }).first();
    const cuerpo = page.locator("table tbody");
    const paginador = page.locator('nav[aria-label="Pagination"]');
    const resumen = paginador.locator("xpath=preceding-sibling::div[1]");
    const siguiente = page.locator('nav[aria-label="Pagination"] > div > div:last-child');
    const leerResumen = async () => (await resumen.innerText()).replace(/\s+/g, " ").trim();

    // El reporte trae TODAS las unidades y pagina en el cliente. Se espera a que
    // lleguen: el resumen del paginador pasa de "de 0" al total real. Después se
    // ensancha la página al máximo ofrecido para reducir los saltos.
    await expect.poll(leerResumen).toMatch(/de [1-9]\d*/);
    const total = Number((await leerResumen()).match(/de (\d+)$/)?.[1] ?? 0);
    await page.locator('select[name="itemsPerPage"]').selectOption("50");
    await expect.poll(() => cuerpo.locator("tr").count()).toBe(Math.min(50, total));

    for (let pagina = 0; pagina < 200; pagina += 1) {
      if (await fila.isVisible().catch(() => false)) return fila;
      if ((await siguiente.getAttribute("aria-disabled")) === "true") break;
      const antes = await cuerpo.innerText();
      await siguiente.click();
      // La tabla re-renderiza la página en el cliente: esperar a que cambie.
      await expect.poll(() => cuerpo.innerText()).not.toBe(antes);
    }
    return fila;
  };

  test("la fila del dispositivo prestado muestra responsable, depto, días y folio", async ({
    page,
    departamento,
    api,
    escenario,
  }) => {
    const dispositivo = await escenario.dispositivo(1);
    const [unidad] = await api.unidades(dispositivo.id);
    const admin = (await api.usuarios()).find((u) => u.username === E2E.admin.username);
    expect(admin, "el usuario e2e_admin debe existir (auth.setup lo provisiona)").toBeDefined();

    const prestamo = await api.prestar({
      responsableId: admin!.id,
      departamentoId: departamento.id,
      detalles: [{ dispositivoId: dispositivo.id, cantidad: 1 }],
    });

    await irARuta(page, "/reportes");
    await page.getByRole("button", { name: "Dispositivos" }).click();

    const fila = await ubicarFila(page, unidad.activoFijo);
    await expect(fila).toBeVisible();
    await expect(fila).toContainText(admin!.name); // responsable
    await expect(fila).toContainText(departamento.name); // depto
    await expect(fila).toContainText(prestamo.consecutivo); // folio
    await expect(fila).toContainText("Asignado"); // badge de estado con i18n
    // Ninguno de los cuatro campos queda como "—".
    await expect(fila).not.toContainText("—");

    // Stats: la tarjeta Asignados refleja el préstamo E2E (no 0) …
    const valorAsignados = page.locator(".tab-content .text-amber-700").first();
    await expect(valorAsignados).not.toHaveText("0");
    // … y la de +30 días existe con un número (0 con préstamo recién creado).
    const valorMas30 = page.locator(".tab-content .text-red-600").first();
    await expect(valorMas30).toBeVisible();
    await expect(valorMas30).toHaveText(/^\d+$/);
  });

  test("exporta el PDF de dispositivos con el nombre esperado", async ({
    page,
    escenario,
    departamento,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(1);
    const admin = (await api.usuarios()).find((u) => u.username === E2E.admin.username);
    expect(admin).toBeDefined();

    await api.prestar({
      responsableId: admin!.id,
      departamentoId: departamento.id,
      detalles: [{ dispositivoId: dispositivo.id, cantidad: 1 }],
    });

    await irARuta(page, "/reportes");
    await page.getByRole("button", { name: "Dispositivos" }).click();

    const descarga = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar PDF" }).click();
    const download = await descarga;
    expect(download.suggestedFilename()).toMatch(/^reporte_dispositivos_\d{8}\.pdf$/);
  });
});
