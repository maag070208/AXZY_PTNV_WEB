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
 * El tipo se crea con prefix `A…` (no el `E2E…` de `escenario`) para que su
 * unidad quede PRIMERA en el orden `activoFijo asc` del reporte: en una suite
 * completa otros tests dejan tipos `E2E…` que ordenan antes del nuestro y lo
 * sacarían de la primera página de la tabla (10 renglones/página).
 */
test.describe("REPORTE de dispositivos desde la web", () => {
  test("la fila del dispositivo prestado muestra responsable, depto, días y folio", async ({
    page,
    departamento,
    api,
  }) => {
    const marca = `A${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    const tipo = await api.crearTipo({
      code: marca,
      name: `Tipo UI ${marca}`,
      folioPrefix: marca,
      useSerie: true,
    });
    const dispositivo = await api.crearDispositivo({
      tipoId: tipo.id,
      nombre: `Equipo ${marca}`,
      marca: "MarcaPrueba",
      modelo: "ModeloPrueba",
      cantidadInicial: 1,
    });
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

    const fila = page.locator("tr", { hasText: unidad.activoFijo });
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