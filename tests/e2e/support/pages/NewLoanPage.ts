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
    await button(this.page, /A un departamento/).click();
    await selectInSearch(this.page, "Seleccionar departamento...", name);
  }

  async assignToEmployee(name: string): Promise<void> {
    await button(this.page, /A un empleado/).click();
    await selectInSearch(this.page, "Buscar responsable...", name);
  }

  async selectResource(type: string, device: string): Promise<void> {
    await selectInSearch(this.page, "Seleccionar tipo...", type);
    await selectInSearch(this.page, "Seleccionar dispositivo...", device);
  }

  async setQuantity(quantity: number): Promise<void> {
    await field(this.page, "Cantidad de piezas").fill(String(quantity));
  }

  async writeNotes(text: string): Promise<void> {
    await field(this.page, "Observaciones").fill(text);
  }

  /** El indicador "Disponible: N" que la pantalla consulta a la API. */
  get available() {
    return this.page.getByText(/Disponible:/).first();
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

  get overstockAlert() {
    return this.page.getByText("La cantidad no puede superar el disponible");
  }

  get saveButton() {
    return button(this.page, "Guardar");
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }
}
