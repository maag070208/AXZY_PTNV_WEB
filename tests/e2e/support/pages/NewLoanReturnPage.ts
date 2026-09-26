import { expect, type Locator, type Page } from "@playwright/test";
import { button, field, selectInSearch, goToRoute } from "./components";
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
 * con sus contadores prestado / devuelto / pendiente.
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
   * cercano del título que además contiene su campo "Devolver". Se ata a la
   * estructura del formulario, no a clases de Tailwind.
   */
  block(deviceName: string): Locator {
    return this.page
      .getByText(deviceName, { exact: true })
      .locator("xpath=ancestor::div[.//input[starts-with(@name,'devolver')]][1]");
  }

  async returnLoan(
    deviceName: string,
    quantity: number,
    condition: ConditionUi,
    comment?: string
  ): Promise<void> {
    const block = this.block(deviceName);
    await field(block, "Devolver").fill(String(quantity));
    await button(block, CONDITION_LABEL[condition]).click();
    if (comment !== undefined) {
      await field(block, "Comentario").fill(comment);
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
