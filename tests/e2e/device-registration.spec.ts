import { test, expect } from "./support/fixtures";
import { esperarToast } from "./support/pages/componentes";
import { ruta } from "./support/env";

/**
 * Flujo ALTA por pantalla — `/inventario/dispositivos/nuevo`.
 *
 * Se opera el formulario como lo haría una persona y después se verifica el
 * efecto real contra la API: unidades creadas, folios y movimiento de ENTRADA.
 */
test.describe("ALTA desde la web", () => {
  test("da de alta un dispositivo con sus unidades y lo confirma en el backend", async ({
    page,
    altaPage,
    escenario,
    api,
  }) => {
    const nombre = escenario.nombreNuevo("Samsung A9");

    await altaPage.ir();
    await altaPage.elegirTipo(escenario.tipo.name);
    await altaPage.llenar({ nombre, marca: "Samsung", modelo: "SM-X115", cantidad: 4 });
    await altaPage.guardar();

    await esperarToast(page, "Dispositivo dado de alta");
    await page.waitForURL(`**${ruta("/inventario/dispositivos")}`);

    // Lo que quedó en la base, no sólo lo que dijo la pantalla.
    const dispositivo = await api.buscarDispositivo(escenario.tipo.id, nombre);
    const unidades = await api.unidades(dispositivo.id);
    expect(unidades).toHaveLength(4);
    expect(unidades.every((u) => u.estado === "DISPONIBLE")).toBe(true);
    expect(unidades[0].activoFijo).toBe(`${escenario.tipo.folioPrefix}-0001`);
    expect(unidades[3].activoFijo).toBe(`${escenario.tipo.folioPrefix}-0004`);
  });

  test("el alta queda respaldada por un movimiento de ENTRADA", async ({
    page,
    altaPage,
    escenario,
    api,
  }) => {
    const nombre = escenario.nombreNuevo("Con entrada");

    await altaPage.ir();
    await altaPage.elegirTipo(escenario.tipo.name);
    await altaPage.llenar({ nombre, marca: "Dell", modelo: "Latitude", cantidad: 2 });
    await altaPage.guardar();
    await esperarToast(page, "Dispositivo dado de alta");

    const { id: dispositivoId } = await api.buscarDispositivo(escenario.tipo.id, nombre);
    const movimientos = await api.movimientos({ dispositivoId });
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]).toMatchObject({ tipo: "ENTRADA", motivo: "Alta inicial" });
    expect(movimientos[0].detalles[0].cantidad).toBe(2);
  });

  test("captura los datos de una unidad y los guarda", async ({
    page,
    altaPage,
    escenario,
    api,
  }) => {
    const nombre = escenario.nombreNuevo("Con serie");
    const serie = `SN-${escenario.tipo.code}-1`;

    await altaPage.ir();
    await altaPage.elegirTipo(escenario.tipo.name);
    await altaPage.llenar({ nombre, marca: "Lenovo", modelo: "T14", cantidad: 2 });
    await altaPage.capturarUnidad(1, { numeroSerie: serie });
    await altaPage.guardar();
    await esperarToast(page, "Dispositivo dado de alta");

    const dispositivo = await api.buscarDispositivo(escenario.tipo.id, nombre);
    const unidades = await api.unidades(dispositivo.id);
    expect(unidades).toHaveLength(2);
    expect(unidades.map((u) => u.numeroSerie)).toContain(serie);
  });

  test("la cantidad gobierna cuántas unidades se van a crear", async ({ altaPage, escenario }) => {
    await altaPage.ir();
    await altaPage.elegirTipo(escenario.tipo.name);

    await altaPage.fijarCantidad(6);
    await expect(altaPage.renglonesDeUnidad).toHaveCount(6);

    await altaPage.fijarCantidad(2);
    await expect(altaPage.renglonesDeUnidad).toHaveCount(2);
    await expect(altaPage.promesaDeUnidades(2)).toBeVisible();
  });

  test("no deja guardar hasta que el formulario está completo", async ({
    altaPage,
    escenario,
  }) => {
    await altaPage.ir();
    await expect(altaPage.botonGuardar).toBeDisabled();

    await altaPage.elegirTipo(escenario.tipo.name);
    await expect(altaPage.botonGuardar).toBeDisabled();

    await altaPage.llenar({ nombre: escenario.nombreNuevo("Incompleto"), marca: "", modelo: "" });
    await expect(altaPage.botonGuardar).toBeDisabled();

    await altaPage.llenar({
      nombre: escenario.nombreNuevo("Completo"),
      marca: "Acme",
      modelo: "X1",
    });
    await expect(altaPage.botonGuardar).toBeEnabled();
  });

  test("pide elegir el tipo antes de capturar unidades", async ({ page, altaPage }) => {
    await altaPage.ir();
    await expect(
      page.getByText("Selecciona un tipo de dispositivo para generar las unidades.")
    ).toBeVisible();
  });

  test("avisa cuando el alta choca con un dispositivo ya registrado", async ({
    page,
    altaPage,
    escenario,
  }) => {
    const repetido = await escenario.dispositivo(1);

    await altaPage.ir();
    await altaPage.elegirTipo(escenario.tipo.name);
    await altaPage.llenar({
      nombre: repetido.nombreVisible,
      marca: repetido.marca,
      modelo: repetido.modelo,
      cantidad: 1,
    });
    await altaPage.guardar();

    await esperarToast(page, /duplicado/i);
    // Sigue en el formulario: no navegó como si hubiera guardado.
    await expect(page).toHaveURL(new RegExp(`${ruta("/inventario/dispositivos/nuevo")}$`));
  });
});
