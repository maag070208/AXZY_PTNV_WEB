import { test, expect } from "./support/fixtures";
import { route } from "./support/env";

/**
 * Pantalla NÓMINA (`/schedules/payroll`, grupo Recursos Humanos).
 *
 * El reporte semanal de asistencia para RH: se monta con `payroll.view` y
 * expone los filtros de semana/búsqueda, el conmutador Resumida/Detallada y el
 * export a PDF.
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
    // Conmutador Resumida / Detallada.
    await expect(page.getByText("Resumida")).toBeVisible();
    await expect(page.getByText("Detallada")).toBeVisible();

    // El reporte termina de cargar: la tabla o el estado vacío.
    await expect(
      page.locator("table").or(page.getByText("No hay personal para esta semana y filtros"))
    ).toBeVisible({ timeout: 15_000 });

    // Vista detallada: una fila por persona/día con estado y turno.
    await page.getByText("Detallada").click();
    await expect(page.getByText("Estado").first()).toBeVisible();
    await expect(page.getByText("Turno").first()).toBeVisible();

    // Los avisos de la semana viven en un ícono con contador (se abre al final
    // porque su diálogo bloquea el resto de la pantalla).
    const noticesBtn = page.getByTitle("Avisos de la semana");
    if (await noticesBtn.count()) {
      await noticesBtn.click();
      await expect(page.getByText("Avisos de la semana").first()).toBeVisible();
    }
  });
});
