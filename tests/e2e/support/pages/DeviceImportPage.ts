import { expect, type Download, type Page } from "@playwright/test";
import { button, goToRoute } from "./components";

/** Un archivo en memoria para el `<input type="file">` de la pantalla. */
export interface UploadFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

/**
 * CARGA MASIVA — `/inventory/devices/import`.
 *
 * Tres pasos sobre el mismo archivo: subirlo, revisar lo que va a pasar y
 * confirmar. El archivo se arma como texto plano con las columnas de la
 * plantilla: la API lo lee con SheetJS, que detecta el formato por contenido,
 * así que el recorrido de la pantalla es el mismo. El parseo del .xlsx binario
 * lo cubre la suite del paquete `api/`, que sí genera libros de verdad.
 */
export class DeviceImportPage {
  constructor(private readonly page: Page) {}

  async go(): Promise<void> {
    await goToRoute(this.page, "/inventory/devices/import");
    await expect(button(this.page, "Descargar plantilla")).toBeVisible();
  }

  /** Encabezados + filas, tal como se capturan en la plantilla. */
  static file(rows: (string | number)[][], name = "carga-e2e.xlsx"): UploadFile {
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    return {
      name,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from(csv, "utf-8"),
    };
  }

  /** El `<input type="file">` está oculto detrás del botón "Elegir archivo Excel". */
  async upload(file: UploadFile): Promise<void> {
    await this.page.locator('input[type="file"]').setInputFiles(file);
    // Al elegir el archivo la pantalla pasa sola al paso de revisión.
    await expect(this.page.getByText("Esto es lo que se va a cargar")).toBeVisible();
  }

  /** Descarga la plantilla y devuelve el archivo para inspeccionarlo. */
  async downloadTemplate(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      button(this.page, "Descargar plantilla").click(),
    ]);
    return download;
  }

  get rows() {
    return this.page.locator("table tbody tr");
  }

  get confirmButton() {
    return this.page.getByRole("button", { name: /Confirmar carga/ });
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
    await expect(this.page.getByText("Carga completada")).toBeVisible();
  }
}
