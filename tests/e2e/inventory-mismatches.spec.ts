import { test, expect } from "./support/fixtures";
import { goToRoute } from "./support/pages/components";

/**
 * Descuadres de inventario (`/inventory/audit/mismatches`): pantalla propia para
 * resolver los movimientos cuya cantidad no cuadra con sus piezas. Se comprueba
 * que la ruta exista y que la pantalla cargue con sus dos columnas (el error de
 * "Route fuera de Routes" no lo ve el typecheck, esto sí) y, cuando la base
 * trae descuadres, el detalle con la comparación "cómo está y cómo queda".
 */
test.describe("Descuadres de inventario", () => {
  test("la pantalla carga con la lista y, si hay descuadres, con su detalle", async ({ page }) => {
    await goToRoute(page, "/inventory/audit/mismatches");
    await expect(
      page.getByRole("heading", { level: 1, name: "Descuadres de inventario" })
    ).toBeVisible();
    await expect(page.getByText("Movimientos por resolver", { exact: true })).toBeVisible();
    await expect(page.getByText("Elige un movimiento de la lista.")).toBeVisible();

    const filas = page.getByTestId("fila-descuadre");
    if ((await filas.count()) === 0) {
      // Sin descuadres heredados la pantalla lo dice y no hay nada que aplicar.
      await expect(page.getByText("Todo cuadra: no hay movimientos descuadrados.")).toBeVisible();
      return;
    }

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
  });

  test("el tablero lleva a la pantalla cuando hay movimientos por resolver", async ({ page }) => {
    await goToRoute(page, "/inventory");
    await expect(page.getByRole("heading", { level: 1, name: "Inventario" })).toBeVisible();

    // El atajo solo aparece si hay renglones que esta pantalla sabe resolver:
    // las otras reglas (kardex, préstamos) se corrigen en su propia pantalla.
    const atajo = page.getByRole("button", { name: "Descuadres de inventario" });
    if ((await atajo.count()) === 0) {
      await expect(page.getByText("Auditoría de inventario")).toBeVisible();
      return;
    }

    await atajo.click();
    await expect(page).toHaveURL(/#\/inventory\/audit\/mismatches/);
  });
});
