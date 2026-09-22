import { test, expect } from "./support/fixtures";
import { esperarToast } from "./support/pages/componentes";
import { ruta } from "./support/env";

/**
 * Flujo MOVIMIENTOS DE MANTENIMIENTO por pantalla — `/inventario/movimientos/nuevo`.
 *
 * A diferencia de la API, la pantalla trabaja por unidad física: cada renglón
 * mueve una pieza concreta, elegida por su activo fijo.
 */
test.describe("MANTENIMIENTO desde la web", () => {
  test("manda una unidad a mantenimiento", async ({ page, movimientoPage, escenario, api }) => {
    const dispositivo = await escenario.dispositivo(4);
    const [unidad] = await api.unidades(dispositivo.id);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("A mantenimiento");
    await movimientoPage.escribirMotivo("Revisión preventiva");
    await movimientoPage.registrar();

    await esperarToast(page, "Movimiento registrado");
    await page.waitForURL(`**${ruta("/inventario/movimientos")}`);

    await api.esperarExistencias(dispositivo.id, { DISPONIBLE: 3, MANTENIMIENTO: 1 });

    // Se movió exactamente la unidad elegida.
    const unidades = await api.unidades(dispositivo.id);
    expect(unidades.find((u) => u.id === unidad.id)?.estado).toBe("MANTENIMIENTO");
  });

  test("regresa una unidad de mantenimiento en buen estado", async ({
    page,
    movimientoPage,
    escenario,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(3);
    const [unidad] = await api.unidades(dispositivo.id);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("A mantenimiento");
    await movimientoPage.escribirMotivo("Cambio de batería");
    await movimientoPage.registrar();
    await esperarToast(page, "Movimiento registrado");
    await api.esperarExistencias(dispositivo.id, { MANTENIMIENTO: 1 });

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("De mantenimiento");
    await movimientoPage.elegirCondicion("BUENO");
    await movimientoPage.registrar();
    await esperarToast(page, "Movimiento registrado");

    await api.esperarExistencias(dispositivo.id, { DISPONIBLE: 3, MANTENIMIENTO: 0 });
  });

  test("una unidad que vuelve en mal estado queda dañada", async ({
    page,
    movimientoPage,
    escenario,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(3);
    const [unidad] = await api.unidades(dispositivo.id);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("A mantenimiento");
    await movimientoPage.escribirMotivo("Diagnóstico");
    await movimientoPage.registrar();
    await esperarToast(page, "Movimiento registrado");
    await api.esperarExistencias(dispositivo.id, { MANTENIMIENTO: 1 });

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("De mantenimiento");
    await movimientoPage.elegirCondicion("MALO");
    await movimientoPage.escribirComentario("Teclado intermitente");
    await movimientoPage.registrar();
    await esperarToast(page, "Movimiento registrado");

    await api.esperarExistencias(dispositivo.id, { DISPONIBLE: 2, DANADO: 1, MANTENIMIENTO: 0 });
  });

  test("una unidad que vuelve ROTA avisa y se da de baja sola", async ({
    page,
    movimientoPage,
    escenario,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(3);
    const [unidad] = await api.unidades(dispositivo.id);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("A mantenimiento");
    await movimientoPage.escribirMotivo("Revisión");
    await movimientoPage.registrar();
    await esperarToast(page, "Movimiento registrado");
    await api.esperarExistencias(dispositivo.id, { MANTENIMIENTO: 1 });

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("De mantenimiento");
    await movimientoPage.elegirCondicion("ROTO");

    await expect(movimientoPage.avisoBajaAutomatica).toBeVisible();
    await movimientoPage.registrar();
    await esperarToast(page, "Movimiento registrado");

    await api.esperarExistencias(dispositivo.id, { DISPONIBLE: 2, BAJA: 1, MANTENIMIENTO: 0 });
    const bajas = await api.movimientos({ dispositivoId: dispositivo.id, tipo: "BAJA" });
    expect(bajas[0].motivo).toBe("Baja automática por estado ROTO");
  });

  test("sólo ofrece los movimientos que caben según el estado de la unidad", async ({
    movimientoPage,
    escenario,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(2);
    const [unidad] = await api.unidades(dispositivo.id);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);

    // Unidad disponible: se puede dar de baja o mandar a mantenimiento, no traerla de vuelta.
    const renglon = movimientoPage.renglon();
    await expect(renglon.getByRole("button", { name: "Baja" })).toBeVisible();
    await expect(renglon.getByRole("button", { name: "A mantenimiento" })).toBeVisible();
    await expect(renglon.getByRole("button", { name: "De mantenimiento" })).toBeHidden();
  });

  test("no ofrece unidades que no estén en el estado que pide el movimiento", async ({
    movimientoPage,
    escenario,
  }) => {
    const dispositivo = await escenario.dispositivo(2);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    // Sin unidad elegida, los tres tipos están disponibles: al pedir "De
    // mantenimiento" no hay ninguna pieza en taller que ofrecer.
    await movimientoPage.elegirTipo("De mantenimiento");

    await expect(movimientoPage.avisoSinUnidades).toBeVisible();
    await expect(movimientoPage.botonRegistrar).toBeDisabled();
  });

  test("exige motivo para mandar a mantenimiento", async ({
    movimientoPage,
    escenario,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(2);
    const [unidad] = await api.unidades(dispositivo.id);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("A mantenimiento");

    await expect(movimientoPage.botonRegistrar).toBeDisabled();
    await movimientoPage.escribirMotivo("Ya con motivo");
    await expect(movimientoPage.botonRegistrar).toBeEnabled();
  });

  test("exige condición al regresar de mantenimiento", async ({
    page,
    movimientoPage,
    escenario,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(2);
    const [unidad] = await api.unidades(dispositivo.id);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("A mantenimiento");
    await movimientoPage.escribirMotivo("Revisión");
    await movimientoPage.registrar();
    await esperarToast(page, "Movimiento registrado");
    await api.esperarExistencias(dispositivo.id, { MANTENIMIENTO: 1 });

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("De mantenimiento");

    await expect(movimientoPage.botonRegistrar).toBeDisabled();
    await movimientoPage.elegirCondicion("ACEPTABLE");
    await expect(movimientoPage.botonRegistrar).toBeEnabled();
  });
});
