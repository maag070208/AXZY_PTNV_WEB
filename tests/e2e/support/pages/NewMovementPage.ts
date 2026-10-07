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

export type MovementTypeUi = "Entrada" | "Baja" | "A mantenimiento" | "De mantenimiento";
export type ConditionUi = "GOOD" | "FAIR" | "POOR" | "BROKEN";

/** Etiqueta en pantalla de cada condición (i18n `inventory:loanReturn.conditionLabels`). */
const CONDITION_LABELS: Record<ConditionUi, string> = {
  GOOD: "Bueno",
  FAIR: "Aceptable",
  POOR: "Malo",
  BROKEN: "Roto",
};

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

  /**
   * Una ENTRADA no elige unidad física: crea piezas nuevas, así que el renglón
   * pide una cantidad en su lugar.
   */
  async writeQuantity(quantity: number, index = 1): Promise<void> {
    // OJO: `fill` no sirve aquí. El campo es controlado y su `onChange` convierte
    // el vacío en 1, así que mientras Playwright limpia, React vuelve a poner el
    // "1" por defecto y lo que se teclea queda pegado: escribir 2 registraba 12
    // unidades. Se selecciona todo y se teclea, y se VERIFICA el valor para que
    // un cambio así falle aquí y no en las existencias.
    const input = field(this.row(index), "Cantidad");
    await input.click();
    await input.press("ControlOrMeta+a");
    await input.pressSequentially(String(quantity));
    await expect(input).toHaveValue(String(quantity));
  }

  /**
   * Identificación OPCIONAL de una pieza nueva de la entrada: el tipo del
   * dispositivo decide si se pide (serie, MAC, IP o hostname).
   */
  async writePieceSerial(serial: string, piece = 1, index = 1): Promise<void> {
    const row = this.row(index);
    // El renglón es un acordeón: se acota a la pieza pedida y, si está cerrada,
    // se abre con su encabezado antes de escribir.
    const box = row.locator(
      `xpath=.//*[normalize-space(text())="Pieza ${piece}"]/ancestor::div[contains(@class,"rounded-xl")][1]`
    );
    const input = box.getByLabel("No. serie");
    if (!(await input.isVisible().catch(() => false))) {
      await box.getByText(new RegExp(`^Pieza ${piece}$`)).click();
    }
    await input.fill(serial);
  }

  async writeReason(reason: string, index = 1): Promise<void> {
    await field(this.row(index), "Motivo").fill(reason);
  }

  async selectCondition(condition: ConditionUi, index = 1): Promise<void> {
    await chip(this.row(index), CONDITION_LABELS[condition]).click();
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
