import { test, expect } from "./support/fixtures";
import { goToRoute } from "./support/pages/components";

/**
 * Inicio (`/`): el tablero por rol. Con todo lo que ve un ADMIN la pantalla se
 * parte en pestañas por tema (antes era una lista larguísima de tarjetas), así
 * que aquí se comprueba que estén, que la primera traiga el panel en vivo y que
 * al cambiar de pestaña cambie el tablero.
 */
test.describe("Inicio", () => {
  test("el ADMIN ve el tablero por pestañas y puede cambiar entre ellas", async ({ page }) => {
    await goToRoute(page, "/");

    await expect(page.getByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();

    // Las pestañas del ADMIN: tiene permiso para todos los tableros.
    // `exact` porque el menú lateral también tiene "Almacén de cocina".
    for (const grupo of ["Operación", "Personal", "Reloj y accesos", "Sistema", "Cocina"]) {
      await expect(page.getByRole("button", { name: grupo, exact: true })).toBeVisible();
    }

    // La primera trae el panel de operación en vivo.
    await expect(page.getByText("Panel en tiempo real")).toBeVisible();

    // El panel ya NO repite lo que muestran los tableros de Tickets y Tareas
    // (salía dos y tres veces: los contadores, el donut por estado y la lista de
    // los más viejos). Si alguien lo vuelve a meter, esto se pone rojo.
    // Todo acotado a `main`: el kit trae un `nav` oculto con textos parecidos.
    const contenido = page.getByRole("main");
    for (const repetido of ["Tickets por estado", "Tickets antiguos", "Tickets abiertos"]) {
      await expect(contenido.getByText(repetido, { exact: true })).toHaveCount(0);
    }

    // En su lugar quedan los números que solo viven aquí.
    for (const kpi of ["Dispositivos", "Cartas activas", "Salidas dañadas", "Resolución promedio", "Tareas resueltas"]) {
      await expect(contenido.getByText(kpi, { exact: true })).toBeVisible();
    }
    // Y el equipo y la actividad, que tampoco están en otro lado.
    await expect(contenido.getByText("Eficiencia del equipo", { exact: true })).toBeVisible();
    await expect(contenido.getByText("Actividad reciente", { exact: true })).toBeVisible();

    // Al cambiar de pestaña cambia el tablero (y el anterior se desmonta).
    await page.getByRole("button", { name: "Personal", exact: true }).click();
    await expect(page.getByText("Asistencia de hoy")).toBeVisible();
    await expect(page.getByText("Panel en tiempo real")).toBeHidden();

    // Y se puede volver.
    await page.getByRole("button", { name: "Operación", exact: true }).click();
    await expect(page.getByText("Panel en tiempo real")).toBeVisible();
  });
});
