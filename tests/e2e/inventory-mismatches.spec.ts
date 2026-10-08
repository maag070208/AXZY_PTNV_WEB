import { test, expect } from "./support/fixtures";
import { goToRoute } from "./support/pages/components";

/**
 * Descuadres de inventario (`/inventory/audit/mismatches`): pantalla propia para
 * resolver los movimientos cuya cantidad no cuadra con sus piezas. Aquí se
 * comprueba que la ruta exista y que la pantalla cargue con sus dos columnas —
 * el error de "Route fuera de Routes" no lo ve el typecheck, esto sí.
 */
test.describe("Descuadres de inventario", () => {
  test("el ADMIN entra desde el tablero y ve la lista y el detalle", async ({ page }) => {
    await goToRoute(page, "/inventory");
    await expect(page.getByRole("heading", { level: 1, name: "Inventario" })).toBeVisible();

    await page.getByRole("button", { name: "Descuadres de inventario" }).click();
    await expect(page).toHaveURL(/#\/inventory\/audit\/mismatches/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Descuadres de inventario" })
    ).toBeVisible();
    await expect(page.getByText("Movimientos por resolver", { exact: true })).toBeVisible();
    await expect(page.getByText("Elige un movimiento de la lista.")).toBeVisible();

    // Con los descuadres de mentira puestos, el primer renglón abre su detalle
    // con las tres salidas.
    const filas = page.getByTestId("fila-descuadre");
    if ((await filas.count()) > 0) {
      await filas.first().click();
      await expect(page.getByRole("button", { name: /Registrar las piezas que faltan/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /Dejar la cantidad/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /Darlo por revisado/ })).toBeVisible();
    }
  });
});
