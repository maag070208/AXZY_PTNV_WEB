import { test, expect } from "./support/fixtures";
import { esperarToast } from "./support/pages/componentes";
import { ruta } from "./support/env";

/**
 * Flujo BAJA por pantalla — `/inventario/movimientos/nuevo`.
 *
 * La pantalla sólo ofrece unidades disponibles o en mantenimiento, así que las
 * piezas prestadas quedan fuera de alcance por construcción (§17 del doc).
 */
test.describe("BAJA desde la web", () => {
  test("da de baja una unidad con su motivo", async ({
    page,
    movimientoPage,
    escenario,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(5);
    const [unidad] = await api.unidades(dispositivo.id);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("Baja");
    await movimientoPage.escribirMotivo("Daño irreparable");
    await movimientoPage.registrar();

    await esperarToast(page, "Movimiento registrado");
    await page.waitForURL(`**${ruta("/inventario/movimientos")}`);

    // La baja sale de la existencia activa pero permanece en la histórica.
    const existencias = await api.esperarExistencias(dispositivo.id, {
      DISPONIBLE: 4,
      BAJA: 1,
    });
    expect(existencias.activa).toBe(4);
    expect(existencias.historica).toBe(5);

    const unidades = await api.unidades(dispositivo.id);
    expect(unidades.find((u) => u.id === unidad.id)?.estado).toBe("BAJA");
  });

  test("exige motivo para dar de baja", async ({ movimientoPage, escenario, api }) => {
    const dispositivo = await escenario.dispositivo(3);
    const [unidad] = await api.unidades(dispositivo.id);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirUnidad(unidad.activoFijo);
    await movimientoPage.elegirTipo("Baja");

    await expect(movimientoPage.botonRegistrar).toBeDisabled();
    await movimientoPage.escribirMotivo("Obsoleto");
    await expect(movimientoPage.botonRegistrar).toBeEnabled();
  });

  test("las unidades prestadas no se ofrecen para dar de baja", async ({
    movimientoPage,
    escenario,
    departamento,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(4);
    const unidades = await api.unidades(dispositivo.id);
    await api.prestar({
      departamentoId: departamento.id,
      detalles: [{ dispositivoId: dispositivo.id, cantidad: 3 }],
    });

    const prestadas = (await api.unidades(dispositivo.id))
      .filter((u) => u.estado === "PRESTADO")
      .map((u) => u.activoFijo);
    expect(prestadas).toHaveLength(3);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirTipo("Baja");

    // Sólo la pieza que quedó disponible aparece en el desplegable.
    const ofrecidas = await movimientoPage.unidadesOfrecidas();
    expect(ofrecidas).toHaveLength(1);
    for (const activoFijo of prestadas) {
      expect(ofrecidas.join(" ")).not.toContain(activoFijo);
    }
    expect(unidades.map((u) => u.activoFijo)).toContain(
      ofrecidas[0].split(" ")[0].replace(/\s.*$/, "")
    );
  });

  test("una unidad ya dada de baja deja de ofrecerse", async ({
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
    await movimientoPage.elegirTipo("Baja");
    await movimientoPage.escribirMotivo("Robo");
    await movimientoPage.registrar();
    await esperarToast(page, "Movimiento registrado");
    await api.esperarExistencias(dispositivo.id, { BAJA: 1, DISPONIBLE: 1 });

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(dispositivo.nombreVisible);
    await movimientoPage.elegirTipo("Baja");

    const ofrecidas = await movimientoPage.unidadesOfrecidas();
    expect(ofrecidas).toHaveLength(1);
    expect(ofrecidas.join(" ")).not.toContain(unidad.activoFijo);
  });

  test("da de baja dos dispositivos en un mismo movimiento", async ({
    page,
    movimientoPage,
    escenario,
    api,
  }) => {
    const uno = await escenario.dispositivo(3);
    const otro = await escenario.dispositivo(3);
    const [unidadUno] = await api.unidades(uno.id);
    const [unidadOtro] = await api.unidades(otro.id);

    await movimientoPage.ir();
    await movimientoPage.elegirDispositivo(uno.nombreVisible, 1);
    await movimientoPage.elegirUnidad(unidadUno.activoFijo, 1);
    await movimientoPage.elegirTipo("Baja", 1);
    await movimientoPage.escribirMotivo("Retiro de lote", 1);

    await movimientoPage.agregarRenglon();
    await movimientoPage.elegirDispositivo(otro.nombreVisible, 2);
    await movimientoPage.elegirUnidad(unidadOtro.activoFijo, 2);
    await movimientoPage.elegirTipo("Baja", 2);
    await movimientoPage.escribirMotivo("Retiro de lote", 2);

    await movimientoPage.registrar();
    await esperarToast(page, "Movimiento registrado");

    await api.esperarExistencias(uno.id, { DISPONIBLE: 2, BAJA: 1 });
    await api.esperarExistencias(otro.id, { DISPONIBLE: 2, BAJA: 1 });

    // Los dos renglones viajaron en un solo movimiento de BAJA.
    const bajas = await api.movimientos({ dispositivoId: uno.id, tipo: "BAJA" });
    expect(bajas).toHaveLength(1);
    expect(bajas[0].detalles).toHaveLength(2);
  });

  test("la baja queda registrada en el historial de movimientos", async ({
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
    await movimientoPage.elegirTipo("Baja");
    await movimientoPage.escribirMotivo("Daño por agua");
    await movimientoPage.registrar();
    await esperarToast(page, "Movimiento registrado");

    await page.goto(ruta("/inventario/movimientos"));
    await expect(page.getByText("Daño por agua").first()).toBeVisible();
    await expect(page.getByText(dispositivo.nombreVisible).first()).toBeVisible();
  });
});
