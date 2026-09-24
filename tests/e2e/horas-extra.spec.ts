import { test, expect } from "./support/fixtures";
import { nuevoRunId } from "./support/env";
import { limpiarOvertime, sembrarOvertime } from "./support/overtimeSeed";
import { campo, irARuta } from "./support/pages/componentes";

/**
 * Reporte de horas extra (`/horarios/horas-extra`) — exportación a PDF.
 *
 * El tiempo extra se calcula con las CHECADAS del reloj (no con la bitácora del
 * guardia), así que el escenario se siembra con checadas + vínculo reloj ↔
 * usuario del día de hoy en la zona del navegador (`America/Mazatlan`). La
 * siembra la hace el paquete `api/` (dueño de la base) vía su CLI de pruebas.
 */

const RUN = nuevoRunId();
let NOMBRE = "";

test.describe("Reporte de horas extra — exportación PDF", () => {
  test.beforeAll(() => {
    const users = sembrarOvertime(RUN);
    NOMBRE = users.find((u) => u.role === "EMPLEADO")!.name;
  });

  test.afterAll(() => limpiarOvertime(RUN));

  test("descarga el PDF con el nombre esperado cuando hay filas", async ({ page }) => {
    await irARuta(page, "/horarios/horas-extra");

    const botonPdf = page.getByRole("button", { name: "PDF" });
    const cuerpo = page.locator("table tbody");
    await campo(page, "Empleado").fill(NOMBRE);
    await expect(cuerpo.getByText(NOMBRE).first()).toBeVisible();

    await expect(botonPdf).toBeEnabled();
    const descarga = page.waitForEvent("download");
    await botonPdf.click();
    const download = await descarga;
    expect(download.suggestedFilename()).toMatch(
      /^reporte_horas_extra_(day|week|month)_\d{8}\.pdf$/
    );
  });

  test("el botón PDF queda deshabilitado cuando no hay filas", async ({ page }) => {
    await irARuta(page, "/horarios/horas-extra");

    const botonPdf = page.getByRole("button", { name: "PDF" });
    await campo(page, "Empleado").fill(NOMBRE);
    await expect(botonPdf).toBeEnabled();

    await campo(page, "Empleado").fill(`E2E Inexistente ${RUN}`);
    await expect(botonPdf).toBeDisabled();
  });

  test("el botón CSV sigue disponible con filas (no regresión)", async ({ page }) => {
    await irARuta(page, "/horarios/horas-extra");

    const botonCsv = page.getByRole("button", { name: "CSV" });
    await campo(page, "Empleado").fill(NOMBRE);
    await expect(page.locator("table tbody").getByText(NOMBRE).first()).toBeVisible();
    await expect(botonCsv).toBeEnabled();
  });
});
