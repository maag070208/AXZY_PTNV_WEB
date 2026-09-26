import { expect, type Locator, type Page } from "@playwright/test";
import {
  button,
  field,
  chip,
  selectInSearch,
  goToRoute,
  searchOptions,
  searchPanel,
} from "./components";

export type MovementTypeUi = "Baja" | "A mantenimiento" | "De mantenimiento";
export type ConditionUi = "GOOD" | "FAIR" | "POOR" | "BROKEN";

/**
 * BAJA y MOVIMIENTOS DE MANTENIMIENTO — `/inventario/movimientos/nuevo`.
 *
 * La pantalla trabaja por renglones y, a diferencia de la API, **exige elegir
 * la unidad física exacta**: cada renglón mueve una sola pieza. También pide
 * motivo para "A mantenimiento", que la API no exige.
 */
export class NewMovementPage {
  constructor(private readonly page: Page) {}

  async go(): Promise<void> {
    await goToRoute(this.page, "/inventory/movements/new");
    await expect(this.page.getByPlaceholder("Buscar dispositivo...").first()).toBeVisible();
  }

  /**
   * Cada renglón se acota desde su encabezado "Renglón N" hacia el ancestro más
   * cercano que contiene sus propios campos, para no cruzarse con los demás.
   */
  row(index = 1): Locator {
    return this.page
      .getByText(new RegExp(`^Renglón ${index}$`))
      .locator("xpath=ancestor::div[.//input[@placeholder='Buscar dispositivo...']][1]");
  }

  async addRow(): Promise<void> {
    await button(this.page, /Agregar renglón/).click();
  }

  async selectDevice(name: string, index = 1): Promise<void> {
    await selectInSearch(this.row(index), "Buscar dispositivo...", name);
  }

  /** Elige una unidad por su activo fijo; el desplegable ya viene filtrado por estado. */
  async selectUnit(assetTag: string, index = 1): Promise<void> {
    await selectInSearch(this.row(index), "Buscar unidad...", assetTag);
  }

  /** Las unidades que la pantalla ofrece para el tipo de movimiento elegido. */
  async offeredUnits(index = 1): Promise<string[]> {
    const row = this.row(index);
    const input = row.getByPlaceholder("Buscar unidad...");
    await input.click();
    await input.fill("");
    const options = searchOptions(row);
    await expect(options.first()).toBeVisible();
    const texts = await options.allInnerTexts();

    // Escape y blur NO cierran el panel del kit: sólo el `mousedown` fuera.
    await this.page.getByRole("heading", { level: 1 }).click();
    await expect(searchPanel(row)).toHaveCount(0);
    return texts;
  }

  async selectType(type: MovementTypeUi, index = 1): Promise<void> {
    await chip(this.row(index), type).click();
  }

  async writeReason(reason: string, index = 1): Promise<void> {
    await field(this.row(index), "Motivo").fill(reason);
  }

  async selectCondition(condition: ConditionUi, index = 1): Promise<void> {
    await chip(this.row(index), condition).click();
  }

  async writeComment(text: string, index = 1): Promise<void> {
    await field(this.row(index), "Comentario").fill(text);
  }

  get noticeWithoutUnits() {
    return this.page.getByText("No hay unidades en este estado para el dispositivo seleccionado");
  }

  get noticeAutomaticRetirement() {
    return this.page.getByText("Esta(s) unidad(es) se dará(n) de baja automáticamente");
  }

  get registerButton() {
    return button(this.page, "Registrar");
  }

  async register(): Promise<void> {
    await this.registerButton.click();
  }
}
