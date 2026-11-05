import { test, expect } from "./support/fixtures";
import { route } from "./support/env";

/**
 * Pantalla EXPEDIENTES (`/employees/records`, grupo Recursos Humanos).
 *
 * Documentos obligatorios, expediente y datos personales por empleado: los
 * indicadores de arriba (estilo Pre-nómina: plantilla en tinta, lo que falta
 * en rojo), la tabla con líneas finas y el detalle de la persona elegida.
 */
test.describe("Expedientes (pantalla)", () => {
  test("se monta con sus indicadores, su tabla y el detalle de la persona", async ({ page }) => {
    await page.goto(route("/employees/records"));

    // Título de la pantalla y el botón de avisos del encabezado.
    await expect(page.getByRole("heading", { name: "Expedientes de empleados", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /Avisar a pendientes/i })).toBeVisible();

    // Los indicadores (cargan con el tablero; "Faltan obligatorios" también es
    // pastilla de filtro, así que se toma la primera, que es la tarjeta).
    await expect(page.getByText("Plantilla activa")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Expediente completo")).toBeVisible();
    await expect(page.getByText("Faltan obligatorios").first()).toBeVisible();
    await expect(page.getByText("Expediente incompleto")).toBeVisible();

    // Los filtros: búsqueda, pastillas de estado y área.
    await expect(page.locator('input[name="employee_records_search"]')).toBeVisible();
    await expect(page.getByText("Todos", { exact: true })).toBeVisible();
    await expect(page.getByText("Incompletos", { exact: true })).toBeVisible();
    await expect(page.locator('input[name="employee_records_department"]')).toBeVisible();

    // La tabla (divs con roles ARIA, sin fondo de encabezado).
    for (const columna of ["Empleado", "Obligatorios", "Expediente", "Datos personales", "Estado"]) {
      await expect(page.getByRole("columnheader", { name: columna })).toBeVisible();
    }

    // Al elegir una persona se abre su detalle con el total del expediente.
    const primeraFila = page.locator('[role="row"]').nth(1);
    await expect(primeraFila).toBeVisible();
    await primeraFila.click();
    await expect(page.getByText("Expediente total")).toBeVisible();

    // La pastilla "Completos" filtra: hay filas o el estado vacío.
    await page.getByText("Completos", { exact: true }).click();
    await expect(
      page.getByText("Nadie coincide con los filtros").or(page.locator('[role="row"]').nth(1))
    ).toBeVisible();
  });
});
