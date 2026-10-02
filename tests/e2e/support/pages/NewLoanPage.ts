import { expect, type Page } from "@playwright/test";
import { button, field, selectInSearch, goToRoute } from "./components";

/**
 * PRÉSTAMO (carta responsiva) — `/inventario/prestamos/nuevo`.
 *
 * La pantalla filtra los dispositivos por tipo, así que hay que elegir el tipo
 * antes que el dispositivo.
 */
export class NewLoanPage {
  constructor(private readonly page: Page) {}

  async go(): Promise<void> {
    await goToRoute(this.page, "/inventory/loans/new");
    await expect(this.page.getByPlaceholder("Seleccionar tipo...")).toBeVisible();
  }

  async assignToDepartment(name: string): Promise<void> {
    await this.pickAssignment("A un departamento / subárea");
    await selectInSearch(this.page, "Seleccionar departamento...", name);
  }

  async assignToEmployee(name: string): Promise<void> {
    await this.pickAssignment("A un empleado");
    await selectInSearch(this.page, "Buscar responsable...", name);
  }

  /** El destino es un `ITSearchSelect` (antes era un segmented control). */
  private async pickAssignment(label: string): Promise<void> {
    await this.page.locator('input[name="loanAssignment"]').click();
    await this.page.getByText(label, { exact: true }).last().click();
  }

  async selectResource(type: string, device: string): Promise<void> {
    await selectInSearch(this.page, "Seleccionar tipo...", type);
    await selectInSearch(this.page, "Seleccionar dispositivo...", device);
  }

  /** Las piezas físicas que ofrece el selector (solo las disponibles). */
  get unitOptions() {
    return this.page.getByTestId("unit-option");
  }

  /** Contador "N de M seleccionada(s)" del selector de unidades. */
  get unitsCounter() {
    return this.page.getByText(/seleccionada\(s\)/);
  }

  /** Marca las primeras `count` unidades disponibles. */
  async selectUnits(count: number): Promise<void> {
    await expect(this.unitOptions.first()).toBeVisible();
    for (let i = 0; i < count; i++) {
      await this.unitOptions.nth(i).click();
    }
  }

  async writeNotes(text: string): Promise<void> {
    await field(this.page, "Observaciones").fill(text);
  }

  /**
   * Fila "Área:" del bloque "Recurso TIC:" del preview de la carta responsiva.
   * El nombre del departamento también aparece en el encabezado, en el párrafo
   * del reglamento y en la firma, así que se ancla al testid para no dar falso
   * positivo.
   */
  get areaPreview() {
    return this.page.getByTestId("custody-letter-area");
  }

  get saveButton() {
    return button(this.page, "Guardar");
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }
}
