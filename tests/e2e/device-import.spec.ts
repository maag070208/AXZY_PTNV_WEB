import { test, expect } from "./support/fixtures";
import { DeviceImportPage } from "./support/pages/DeviceImportPage";
import { button, goToRoute } from "./support/pages/components";
import { route } from "./support/env";

/**
 * CARGA MASIVA por pantalla — `/inventory/devices/import`.
 *
 * Lo que se verifica aquí es el recorrido del usuario: que la plantilla se
 * descargue, que el archivo suba, que la previsualización diga lo que va a
 * pasar, que la confirmación quede bloqueada mientras haya errores y que al
 * confirmar el inventario quede como dice la pantalla (verificado contra la
 * API, no contra el mensaje de la pantalla).
 *
 * El archivo que se sube lleva las columnas de la plantilla como texto: la API
 * lo lee con SheetJS, que detecta el formato por contenido. El parseo del .xlsx
 * binario lo cubre la suite del paquete `api/`.
 */

const HEADER = ["TIPO", "NOMBRE", "MARCA", "MODELO", "CANTIDAD"];

test.describe("Carga masiva de dispositivos por pantalla", () => {
  test("el botón Cargar Excel lleva a la pantalla de carga", async ({ page }) => {
    await goToRoute(page, "/inventory/devices");
    await button(page, "Cargar Excel").click();
    await page.waitForURL(`**${route("/inventory/devices/import")}`);
    await expect(page.getByText("Plantilla de Excel")).toBeVisible();
  });

  test("descarga la plantilla como un .xlsx real", async ({ page, deviceImportPage }) => {
    await deviceImportPage.go();
    const download = await deviceImportPage.downloadTemplate();

    expect(download.suggestedFilename()).toBe("plantilla-dispositivos.xlsx");

    // Un .xlsx es un ZIP: empieza con la firma "PK".
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");
    expect(buffer.length).toBeGreaterThan(1000);
  });

  test("previsualiza la carga y no crea nada hasta confirmar", async ({
    page,
    deviceImportPage,
    scenario,
    api,
  }) => {
    const name = scenario.newName("Carga masiva");
    await deviceImportPage.go();
    await deviceImportPage.upload(
      DeviceImportPage.file([
        HEADER,
        [scenario.type.name, name, "Dell", "Latitude 5540", 3],
      ])
    );

    // Resumen y renglón revisado: alta nueva, tipo del catálogo y folios.
    // El renglón se busca DENTRO de la tabla: el filtro de la columna "Acción"
    // también contiene el texto, en un `<option>` oculto.
    await expect(page.getByText("Filas leídas")).toBeVisible();
    const row = page.locator("table tbody tr").first();
    await expect(row.getByText("Alta nueva")).toBeVisible();
    await expect(row.getByText(scenario.type.name)).toBeVisible();
    await expect(
      row.getByText(`${scenario.type.assetTagPrefix}-0001`)
    ).toBeVisible();

    // Nada se ha escrito todavía.
    await expect(deviceImportPage.confirmButton).toBeEnabled();
    await expect
      .poll(async () => api.listDevices({ typeId: scenario.type.id }).then((d) => d.length))
      .toBe(0);
  });

  test("confirma la carga y las unidades quedan en el inventario", async ({
    page,
    deviceImportPage,
    scenario,
    api,
  }) => {
    const name = scenario.newName("Carga confirmada");
    await deviceImportPage.go();
    await deviceImportPage.upload(
      DeviceImportPage.file([
        HEADER,
        [scenario.type.name, name, "Lenovo", "ThinkPad T14", 4],
      ])
    );
    await deviceImportPage.confirm();

    // Lo que dice la pantalla…
    await expect(page.getByText("Carga completada")).toBeVisible();
    await expect(page.getByText("1 dispositivo(s) nuevo(s)")).toBeVisible();

    // …y lo que quedó en el backend.
    const device = await api.searchDevice(scenario.type.id, name);
    const units = await api.units(device.id);
    expect(units).toHaveLength(4);
    expect(units.every((unit) => unit.status === "AVAILABLE")).toBe(true);
    expect(units[0].assetTag).toBe(`${scenario.type.assetTagPrefix}-0001`);
    expect(units[3].assetTag).toBe(`${scenario.type.assetTagPrefix}-0004`);

    const movements = await api.movements({ deviceId: device.id });
    expect(movements).toHaveLength(1);
    expect(movements[0].type).toBe("STOCK_IN");
    // La razón del movimiento guarda el archivo de origen: es el rastro que
    // permite identificar y corregir una carga equivocada.
    expect(movements[0].reason).toContain("carga-e2e.xlsx");
  });

  test("bloquea la confirmación si el archivo tiene filas con error", async ({
    page,
    deviceImportPage,
    scenario,
    api,
  }) => {
    const name = scenario.newName("Con error");
    await deviceImportPage.go();
    await deviceImportPage.upload(
      DeviceImportPage.file([
        HEADER,
        [scenario.type.name, name, "Dell", "X1", 2],
        [scenario.type.name, name, "Dell", "X1", ""],
      ])
    );

    await expect(page.getByText(/fila\(s\) con errores/)).toBeVisible();
    await expect(page.getByText("Cantidad inválida: debe ser un número entero mayor a 0")).toBeVisible();
    await expect(deviceImportPage.confirmButton).toBeDisabled();

    // Y de verdad no se creó nada.
    expect(await api.listDevices({ typeId: scenario.type.id })).toHaveLength(0);
  });

  test("las filas con un tipo que no existe se previsualizan en el tipo genérico", async ({
    page,
    deviceImportPage,
  }) => {
    await deviceImportPage.go();
    await deviceImportPage.upload(
      DeviceImportPage.file([
        HEADER,
        ["TIPO INEXISTENTE E2E", "Equipo raro E2E", "Genérico", "G1", 1],
      ])
    );

    await expect(page.getByText(/se darán de alta con el tipo GENÉRICO/)).toBeVisible();
    await expect(page.getByText("«TIPO INEXISTENTE E2E» no está en el catálogo")).toBeVisible();
    // Se puede confirmar: el genérico es una salida válida, no un error.
    await expect(deviceImportPage.confirmButton).toBeEnabled();
  });

  test("un archivo sin filas no se puede confirmar", async ({ page, deviceImportPage }) => {
    await deviceImportPage.go();
    await page.locator('input[type="file"]').setInputFiles(DeviceImportPage.file([HEADER]));
    await expect(page.getByText("Esto es lo que se va a cargar")).toBeVisible();
    await expect(deviceImportPage.confirmButton).toBeDisabled();
  });
});
