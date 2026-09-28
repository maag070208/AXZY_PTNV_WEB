import { test, expect } from "./support/fixtures";
import { route } from "./support/env";

/**
 * Pantalla NÓMINA (`/schedules/payroll`, grupo Recursos Humanos).
 *
 * El reporte semanal de asistencia para RH: se monta con `payroll.view` y
 * expone los filtros de semana/búsqueda y los exports PDF/Excel.
 */
test.describe("Nómina (pantalla)", () => {
  test("se monta en Recursos Humanos y muestra su panel", async ({ page }) => {
    await page.goto(route("/schedules/payroll"));

    // Título de la pantalla y ubicación en Recursos Humanos (breadcrumb).
    await expect(page.getByRole("heading", { name: "Nómina", level: 1 })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("button", { name: "Recursos Humanos" })
    ).toBeVisible();

    // Filtros del panel.
    await expect(page.locator('input[name="weeklyAttendanceWeek"]')).toBeVisible();
    await expect(page.locator('input[name="weeklyAttendanceSearch"]')).toBeVisible();

    // Exportaciones (se deshabilitan si la semana no tiene filas, pero existen).
    await expect(page.getByRole("button", { name: /PDF/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Excel/i })).toBeVisible();

    // El reporte termina de cargar: la cuadrícula o el estado vacío.
    await expect(
      page.locator("table").or(page.getByText("No hay personal para esta semana y filtros"))
    ).toBeVisible({ timeout: 15_000 });
  });
});
