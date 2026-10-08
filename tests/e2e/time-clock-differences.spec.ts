import { test, expect } from "./support/fixtures";
import { goToRoute } from "./support/pages/components";

/**
 * Conciliación (`/hr/time-clock/employees/differences`): los números del reloj a
 * la izquierda, las personas del sistema a la derecha y la barra que confirma.
 *
 * Es de SOLO LECTURA a propósito: no se pulsa "Asignar" para no tocar los
 * vínculos reales del cliente (misma regla que la pantalla de vínculos). Lo que
 * se prueba es que la pantalla cargue y que la selección de las dos columnas
 * arme la confirmación.
 */
test.describe("Reloj checador — diferencias", () => {
  test("abre con sus dos columnas y arma la confirmación con un clic de cada lado", async ({
    page,
  }) => {
    await goToRoute(page, "/hr/time-clock/employees/differences");

    await expect(page.getByRole("heading", { level: 1, name: "Diferencias" })).toBeVisible();
    // Cada columna dice cuántos renglones está mostrando.
    await expect(page.getByText(/^Del reloj · \d+$/)).toBeVisible();
    await expect(page.getByText(/^Del sistema · \d+$/)).toBeVisible();
    // Y arriba, el resumen de lo que falta.
    await expect(
      page.getByText(/\d+ sin vincular · \d+ personas sin número en el reloj/)
    ).toBeVisible();

    // La barra arranca pidiendo las dos cosas.
    await expect(page.getByText("Elige un número del reloj")).toBeVisible();

    // Un clic de cada lado la completa. Se omite si la base no tuviera renglones
    // (con la base local, que es la del cliente, siempre los hay).
    const filasReloj = page.getByTestId("fila-reloj");
    const filasPersona = page.getByTestId("fila-persona");
    if ((await filasReloj.count()) > 0 && (await filasPersona.count()) > 0) {
      await filasReloj.first().click();
      await filasPersona.first().click();

      await expect(page.getByText("Elige un número del reloj")).toBeHidden();
      // El número elegido queda en la barra, y el botón listo para confirmar.
      await expect(page.getByText(/^#\d+ · /)).toBeVisible();
      await expect(page.getByRole("button", { name: /^(Asignar|Cambiar)$/ })).toBeEnabled();
    }

    // El botón de la pantalla de vínculos lleva aquí.
    await goToRoute(page, "/hr/time-clock/employees");
    await page.getByRole("button", { name: "Ver diferencias" }).click();
    await expect(page).toHaveURL(/#\/hr\/time-clock\/employees\/differences$/);
  });
});
