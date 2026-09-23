import { expect, type Page } from "@playwright/test";
import { boton, campo, elegirEnBuscador, irARuta } from "./componentes";

/**
 * PRÉSTAMO (carta responsiva) — `/inventario/prestamos/nuevo`.
 *
 * La pantalla filtra los dispositivos por tipo, así que hay que elegir el tipo
 * antes que el dispositivo.
 */
export class NuevoPrestamoPage {
  constructor(private readonly page: Page) {}

  async ir(): Promise<void> {
    await irARuta(this.page, "/inventario/prestamos/nuevo");
    await expect(this.page.getByPlaceholder("Seleccionar tipo...")).toBeVisible();
  }

  async asignarADepartamento(nombre: string): Promise<void> {
    await boton(this.page, /A un departamento/).click();
    await elegirEnBuscador(this.page, "Seleccionar departamento...", nombre);
  }

  async asignarAEmpleado(nombre: string): Promise<void> {
    await boton(this.page, /A un empleado/).click();
    await elegirEnBuscador(this.page, "Buscar responsable...", nombre);
  }

  async elegirRecurso(tipo: string, dispositivo: string): Promise<void> {
    await elegirEnBuscador(this.page, "Seleccionar tipo...", tipo);
    await elegirEnBuscador(this.page, "Seleccionar dispositivo...", dispositivo);
  }

  async fijarCantidad(cantidad: number): Promise<void> {
    await campo(this.page, "Cantidad de piezas").fill(String(cantidad));
  }

  async escribirObservaciones(texto: string): Promise<void> {
    await campo(this.page, "Observaciones").fill(texto);
  }

  /** El indicador "Disponible: N" que la pantalla consulta a la API. */
  get disponible() {
    return this.page.getByText(/Disponible:/).first();
  }

  /**
   * Fila "Área:" del bloque "Recurso TIC:" del preview de la carta responsiva.
   * El nombre del departamento también aparece en el encabezado, en el párrafo
   * del reglamento y en la firma, así que se ancla al testid para no dar falso
   * positivo.
   */
  get areaPreview() {
    return this.page.getByTestId("carta-area");
  }

  get alertaSobreStock() {
    return this.page.getByText("La cantidad no puede superar el disponible");
  }

  get botonGuardar() {
    return boton(this.page, "Guardar");
  }

  async guardar(): Promise<void> {
    await this.botonGuardar.click();
  }
}
