import { readFile } from "node:fs/promises";
import { test, expect } from "./support/fixtures";
import { irARuta } from "./support/pages/componentes";
import { E2E } from "./support/env";
import type { ApiInventario, Usuario } from "./support/api";
import type { Locator, Page } from "@playwright/test";

/**
 * Credencial de empleado desde la web — `#/empleados/:id`.
 *
 * La credencial se dibuja en el navegador como una imagen PNG de tamaño INE
 * (8.6 × 5.4 cm a 300 DPI), sin API ni DB de por medio. Aquí se prueba la
 * pantalla: el botón, el diálogo con la vista previa y la descarga. El empleado
 * se resuelve por API para navegar directo a su detalle.
 */

const empleadoPorUsername = async (api: ApiInventario, username: string): Promise<Usuario> => {
  const usuarios = await api.usuarios();
  const usuario = usuarios.find((u) => u.username === username);
  expect(usuario, `el usuario ${username} debe existir (auth.setup lo provisiona)`).toBeDefined();
  return usuario!;
};

const abrirCredencial = async (page: Page) => {
  await page.getByRole("button", { name: "Credencial" }).click();
  const dialog = page.locator('[data-it-dialog="true"]');
  await expect(dialog).toBeVisible();
  return dialog;
};

/** La imagen de la credencial se distingue por su `alt`, que sale de i18n. */
const credencialImg = (dialog: Locator): Locator =>
  dialog.getByRole("img", { name: "Credencial de empleado" });

const esperarDescargaCredencial = (page: Page) =>
  page.waitForEvent("download", {
    predicate: (d) => d.suggestedFilename().startsWith("credencial-"),
  });

test.describe("Credencial de empleado", () => {
  test("el detalle abre la credencial con vista previa en imagen (sin PDF)", async ({
    page,
    api,
  }) => {
    const admin = await empleadoPorUsername(api, E2E.admin.username);

    await irARuta(page, `/empleados/${admin.id}`);
    await expect(page.getByText(E2E.admin.name).first()).toBeVisible();

    const dialog = await abrirCredencial(page);
    await expect(dialog.getByText("Credencial de empleado")).toBeVisible();

    // Ya no hay visor de PDF incrustado.
    await expect(dialog.locator("iframe")).toHaveCount(0);

    const img = credencialImg(dialog);
    await expect(img).toBeVisible();

    const src = await img.getAttribute("src");
    expect(src?.startsWith("data:image/png")).toBe(true);

    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBe(1016);
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalHeight))
      .toBe(638);
  });

  test("descarga la credencial como PNG con el nombre esperado", async ({ page, api }) => {
    const admin = await empleadoPorUsername(api, E2E.admin.username);

    await irARuta(page, `/empleados/${admin.id}`);
    const dialog = await abrirCredencial(page);

    const descarga = esperarDescargaCredencial(page);
    await dialog.getByRole("button", { name: "Descargar imagen" }).click();
    const download = await descarga;

    expect(download.suggestedFilename()).toMatch(/^credencial-.+\.png$/);
  });

  test("el PNG descargado mide 1016 × 638 px y declara 300 DPI", async ({ page, api }) => {
    const admin = await empleadoPorUsername(api, E2E.admin.username);

    await irARuta(page, `/empleados/${admin.id}`);
    const dialog = await abrirCredencial(page);

    const descarga = esperarDescargaCredencial(page);
    await dialog.getByRole("button", { name: "Descargar imagen" }).click();
    const download = await descarga;

    const rutaDescarga = await download.path();
    expect(rutaDescarga, "Playwright debe exponer el archivo descargado").not.toBeNull();
    const bytes = await readFile(rutaDescarga!);

    // Firma PNG.
    expect(bytes.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
    // Ancho y alto del IHDR.
    expect(bytes.readUInt32BE(16)).toBe(1016);
    expect(bytes.readUInt32BE(20)).toBe(638);

    // Chunk pHYs: 11811 px/metro = 300 DPI.
    const phys = bytes.indexOf(Buffer.from("pHYs"));
    expect(phys).toBeGreaterThan(0);
    expect(bytes.readUInt32BE(phys + 4)).toBe(11811);
  });

  test("un empleado sin foto ni número de empleado abre la credencial con iniciales", async ({
    page,
    api,
  }) => {
    const empleado = await empleadoPorUsername(api, E2E.empleado.username);
    expect(empleado.numeroEmpleado, "el empleado E2E no tiene número (caso fallback)").toBeFalsy();

    await irARuta(page, `/empleados/${empleado.id}`);
    await expect(page.getByText(E2E.empleado.name).first()).toBeVisible();

    const dialog = await abrirCredencial(page);
    await expect(credencialImg(dialog)).toBeVisible();
    await expect(dialog.getByText(/No se pudo generar/i)).toHaveCount(0);
  });

  test("si no se puede dibujar la credencial, avisa y no ofrece descarga", async ({
    page,
    api,
  }) => {
    // Anula el contexto 2D sólo para el canvas de la credencial (1016×638):
    // el QR se dibuja en su propio canvas de origen (`modules.size * 12`) y el
    // resto de la app sigue funcionando. Fuerza el borde en que
    // `imagenDataUrl` queda en `null`.
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        tipo: string,
        ...args: any[]
      ) {
        if (tipo === "2d" && this.width === 1016 && this.height === 638) return null;
        return (original as any).apply(this, [tipo, ...args]);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });

    const admin = await empleadoPorUsername(api, E2E.admin.username);

    await irARuta(page, `/empleados/${admin.id}`);
    const dialog = await abrirCredencial(page);

    await expect(dialog.getByText(/No se pudo generar la credencial/i)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Descargar imagen" })).toHaveCount(0);
  });
});
