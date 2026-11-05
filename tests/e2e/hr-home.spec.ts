import { test, expect } from "./support/fixtures";
import { route } from "./support/env";

/**
 * Inicio de RH (`/hr`, grupo Recursos Humanos): lo pendiente de hoy, las
 * acciones rápidas, el cierre de la semana de pre-nómina (revisión por
 * departamento y cierre en el API) y los reportes principales.
 */
test.describe("Inicio de RH (pantalla)", () => {
  test("se monta con lo pendiente, el cierre de la semana y los reportes", async ({ page }) => {
    await page.goto(route("/hr"));

    // Título, breadcrumb y el selector de semana del encabezado.
    await expect(page.getByRole("heading", { name: "Inicio de RH", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Semana anterior" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Semana siguiente" })).toBeVisible();

    // «Pendiente hoy»: las cuatro tarjetas (cargan con los widgets del tablero).
    for (const label of ["Faltas hoy", "Retardos hoy", "Tiempo extra por aprobar", "Expedientes incompletos"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible({ timeout: 15_000 });
    }

    // Acciones rápidas y los pasos del cierre de la semana.
    await expect(page.getByText("Acciones rápidas")).toBeVisible();
    await expect(page.getByText("Alta de empleado")).toBeVisible();
    await expect(page.getByText("Cierre de la semana")).toBeVisible();
    for (const step of ["Revisar asistencia", "Aprobar tiempo extra", "Revisar pre-nómina por departamento", "Cerrar y exportar"]) {
      await expect(page.getByText(step, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    }

    // Reportes principales: las cinco filas con sus dos exportaciones.
    await expect(page.getByText("Reportes principales")).toBeVisible();
    for (const report of ["Pre-nómina semanal", "Asistencia semanal", "Faltas y retrasos", "Tiempo extra", "Plantilla activa"]) {
      await expect(page.getByText(report, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /PDF/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /CSV/ }).first()).toBeVisible();

    // El menú lo muestra arriba de la sección PERSONAL.
    await page.locator("aside").hover();
    await expect(page.getByText("Inicio de RH", { exact: true }).first()).toBeVisible();
  });

  test("abre el diálogo de revisión por departamento", async ({ page }) => {
    await page.goto(route("/hr"));

    await expect(page.getByText("Cierre de la semana")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("Marcar todo como revisado")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cerrar semana" }).first()).toBeVisible();
  });
});
