import { test, expect } from "./support/fixtures";
import { goToRoute } from "./support/pages/components";

/**
 * Descuadres de inventario (`/inventory/audit/mismatches`): pantalla propia para
 * resolver los movimientos cuya cantidad no cuadra con sus piezas. Aquí se
 * comprueba que la ruta exista, que la pantalla cargue con sus dos columnas y
 * que el detalle enseñe la comparación "cómo está y cómo queda" con una salida
 * marcable — el error de "Route fuera de Routes" no lo ve el typecheck, esto sí.
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

    // Con los descuadres de mentira puestos, el primer renglón abre su detalle.
    const filas = page.getByTestId("fila-descuadre");
    if ((await filas.count()) > 0) {
      await filas.first().click();

      // La comparación: cómo está hoy el movimiento y el inventario del
      // dispositivo, y en blanco el "después" hasta marcar una salida.
      await expect(page.getByText("Cómo está y cómo queda", { exact: true })).toBeVisible();
      await expect(page.getByText("El movimiento dice", { exact: true })).toBeVisible();
      await expect(page.getByText("Piezas registradas", { exact: true })).toBeVisible();
      await expect(page.getByText("Disponible en inventario", { exact: true })).toBeVisible();
      await expect(page.getByText("Marca una opción para ver el «Después».", { exact: true })).toBeVisible();

      // Al menos una salida aplicable (darlo por revisado siempre está) y sin
      // marcar ninguna no se puede aplicar.
      const salidas = page.getByRole("button", {
        name: /Ligar las \d+ piezas|Cuadrar el movimiento a lo que hay|Marcarlo como revisado/,
      });
      await expect(salidas.first()).toBeVisible();
      const aplicar = page.getByRole("button", { name: "Aplicar cambio" });
      await expect(aplicar).toBeDisabled();

      await salidas.first().click();
      await expect(page.getByText("Se aplicará la opción marcada.", { exact: true })).toBeVisible();
      await expect(page.getByText("Marca una opción para ver el «Después».", { exact: true })).toHaveCount(0);
      await expect(aplicar).toBeEnabled();
    }
  });
});
