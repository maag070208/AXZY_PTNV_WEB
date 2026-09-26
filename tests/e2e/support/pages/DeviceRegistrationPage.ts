import { expect, type Page } from "@playwright/test";
import { button, field, selectInSearch, goToRoute } from "./components";

/**
 * ALTA — `/inventario/dispositivos/nuevo`.
 *
 * Ojo con el orden: la pantalla sólo arma los renglones de unidades cuando ya
 * hay un tipo elegido, así que el tipo va primero y la cantidad después.
 */
export class DeviceRegistrationPage {
  constructor(private readonly page: Page) {}

  async go(): Promise<void> {
    await goToRoute(this.page, "/inventory/devices/new");
    await expect(this.page.getByPlaceholder("Buscar tipo...")).toBeVisible();
  }

  async selectType(typeName: string): Promise<void> {
    await selectInSearch(this.page, "Buscar tipo...", typeName);
  }

  async fill(data: {
    name: string;
    brand: string;
    model: string;
    description?: string;
    quantity?: number;
  }): Promise<void> {
    await field(this.page, "Nombre / Modelo").fill(data.name);
    await field(this.page, "Marca").fill(data.brand);
    await field(this.page, "Modelo").fill(data.model);
    if (data.description !== undefined) {
      await field(this.page, /Descripción/).fill(data.description);
    }
    if (data.quantity !== undefined) {
      await this.setQuantity(data.quantity);
    }
  }

  async setQuantity(quantity: number): Promise<void> {
    await field(this.page, "Cantidad inicial").fill(String(quantity));
    await expect(this.unitsPromise(quantity)).toBeVisible();
  }

  /**
   * Lo que la pantalla le promete al usuario: "Al guardar se crearán N
   * unidades físicas (activo fijo) y se registrará la ENTRADA."
   */
  unitsPromise(quantity: number) {
    return this.page.getByText(new RegExp(`se crear[aá]n ${quantity} unidades f[ií]sicas`, "i"));
  }

  /** Renglones de unidad desplegados en el panel lateral. */
  get unitRows() {
    return this.page.getByRole("button", { name: /^Unidad \d+/ });
  }

  get saveButton() {
    return button(this.page, "Guardar");
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  /** Abre el renglón de una unidad para capturar su serie, MAC, IP o nombre. */
  async openUnit(index: number): Promise<void> {
    await this.page.getByRole("button", { name: new RegExp(`Unidad\\s+${index}\\b`, "i") }).click();
  }

  async captureUnit(
    index: number,
    data: { serialNumber?: string; mac?: string; ip?: string; hostname?: string }
  ): Promise<void> {
    await this.openUnit(index);
    if (data.serialNumber !== undefined) await field(this.page, "No. serie").fill(data.serialNumber);
    if (data.mac !== undefined) await field(this.page, "MAC").fill(data.mac);
    if (data.ip !== undefined) await field(this.page, "IP").fill(data.ip);
    if (data.hostname !== undefined) {
      await field(this.page, "Nombre equipo").fill(data.hostname);
    }
  }
}
