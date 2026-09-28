import { expect, type Locator, type Page } from "@playwright/test";
import { button, selectInSearch, goToRoute } from "./components";
import type { ConditionUi } from "./NewMovementPage";

const CONDITION_LABEL: Record<ConditionUi, string> = {
  GOOD: "Bueno",
  FAIR: "Aceptable",
  POOR: "Malo",
  BROKEN: "Roto",
};

/**
 * DEVOLUCIÓN — `/inventario/devoluciones/nueva`.
 *
 * Al elegir el préstamo, la pantalla arma un bloque por cada detalle pendiente
 * con sus contadores prestado / devuelto / pendiente. La devolución es **por
 * unidad exacta**: cada pieza pendiente trae su casilla y, al marcarla, su
 * condición y su comentario.
 */
export class NewLoanReturnPage {
  constructor(private readonly page: Page) {}

  async go(): Promise<void> {
    await goToRoute(this.page, "/inventory/returns/new");
    await expect(this.page.getByPlaceholder("Seleccionar préstamo activo...")).toBeVisible();
  }

  async selectLoan(number: string): Promise<void> {
    await selectInSearch(this.page, "Seleccionar préstamo activo...", number);
    await expect(this.page.getByText(/Pendiente:/).first()).toBeVisible();
  }

  /**
   * Bloque de un dispositivo dentro del préstamo elegido: el ancestro más
   * cercano del título que además contiene las casillas de sus unidades
   * (`name="return-…"`). Se ata a la estructura del formulario, no a clases.
   */
  block(deviceName: string): Locator {
    return this.page
      .getByText(deviceName, { exact: true })
      .locator("xpath=ancestor::div[.//input[starts-with(@name,'return-')]][1]");
  }

  /** Las piezas que la pantalla ofrece devolver (una casilla por unidad pendiente). */
  units(deviceName: string): Locator {
    return this.block(deviceName).locator('input[type="checkbox"][name^="return-"]');
  }

  /**
   * Deja seleccionadas exactamente las primeras `quantity` piezas pendientes
   * (la pantalla las marca TODAS por defecto) y, en cada una, fija su condición
   * (y el comentario, si se pide: la pantalla lo exige para POOR/ROTO).
   */
  async returnLoan(
    deviceName: string,
    quantity: number,
    condition: ConditionUi,
    comment?: string
  ): Promise<void> {
    const boxes = this.units(deviceName);
    const total = await boxes.count();
    for (let i = 0; i < total; i++) {
      if (i < quantity) await boxes.nth(i).check({ force: true });
      else await boxes.nth(i).uncheck({ force: true });
    }
    for (let i = 0; i < quantity; i++) {
      const box = boxes.nth(i);
      // Los botones de condición viven en el encabezado de la unidad (hermanos
      // de la casilla); el comentario, en el cuerpo del bloque de la unidad.
      const headerRow = box.locator("xpath=ancestor::div[.//button][1]");
      await button(headerRow, CONDITION_LABEL[condition]).click();
      if (comment !== undefined) {
        const unitRow = box.locator("xpath=ancestor::div[.//input[starts-with(@name,'notes-')]][1]");
        await unitRow.locator('input[name^="notes-"]').fill(comment);
      }
    }
  }

  /** Badge "Prestado: N" / "Devuelto: N" / "Pendiente: N" del bloque. */
  counter(deviceName: string, label: "Prestado" | "Devuelto" | "Pendiente"): Locator {
    return this.block(deviceName)
      .locator(`xpath=.//*[contains(normalize-space(.), '${label}:')][not(.//*[contains(normalize-space(.), '${label}:')])]`)
      .first();
  }

  /** Totales del panel lateral de la carta. */
  summary(label: "Pendiente total" | "A devolver"): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=..");
  }

  get noticeAutomaticRetirement() {
    return this.page.getByText("Esta(s) unidad(es) se dará(n) de baja automáticamente");
  }

  get registerButton() {
    return button(this.page, "Registrar devolución");
  }

  async register(): Promise<void> {
    await this.registerButton.click();
  }
}
