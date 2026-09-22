import { expect, type Locator, type Page } from "@playwright/test";
import { boton, campo, elegirEnBuscador, irARuta } from "./componentes";
import type { CondicionUI } from "./NuevoMovimientoPage";

const CONDICION_LABEL: Record<CondicionUI, string> = {
  BUENO: "Bueno",
  ACEPTABLE: "Aceptable",
  MALO: "Malo",
  ROTO: "Roto",
};

/**
 * DEVOLUCIÓN — `/inventario/devoluciones/nueva`.
 *
 * Al elegir el préstamo, la pantalla arma un bloque por cada detalle pendiente
 * con sus contadores prestado / devuelto / pendiente.
 */
export class NuevaDevolucionPage {
  constructor(private readonly page: Page) {}

  async ir(): Promise<void> {
    await irARuta(this.page, "/inventario/devoluciones/nueva");
    await expect(this.page.getByPlaceholder("Seleccionar préstamo activo...")).toBeVisible();
  }

  async elegirPrestamo(consecutivo: string): Promise<void> {
    await elegirEnBuscador(this.page, "Seleccionar préstamo activo...", consecutivo);
    await expect(this.page.getByText(/Pendiente:/).first()).toBeVisible();
  }

  /**
   * Bloque de un dispositivo dentro del préstamo elegido: el ancestro más
   * cercano del título que además contiene su campo "Devolver". Se ata a la
   * estructura del formulario, no a clases de Tailwind.
   */
  bloque(nombreDispositivo: string): Locator {
    return this.page
      .getByText(nombreDispositivo, { exact: true })
      .locator("xpath=ancestor::div[.//input[starts-with(@name,'devolver')]][1]");
  }

  async devolver(
    nombreDispositivo: string,
    cantidad: number,
    condicion: CondicionUI,
    comentario?: string
  ): Promise<void> {
    const bloque = this.bloque(nombreDispositivo);
    await campo(bloque, "Devolver").fill(String(cantidad));
    await boton(bloque, CONDICION_LABEL[condicion]).click();
    if (comentario !== undefined) {
      await campo(bloque, "Comentario").fill(comentario);
    }
  }

  /** Badge "Prestado: N" / "Devuelto: N" / "Pendiente: N" del bloque. */
  contador(nombreDispositivo: string, etiqueta: "Prestado" | "Devuelto" | "Pendiente"): Locator {
    return this.bloque(nombreDispositivo)
      .locator(`xpath=.//*[contains(normalize-space(.), '${etiqueta}:')][not(.//*[contains(normalize-space(.), '${etiqueta}:')])]`)
      .first();
  }

  /** Totales del panel lateral de la carta. */
  resumen(etiqueta: "Pendiente total" | "A devolver"): Locator {
    return this.page.getByText(etiqueta, { exact: true }).locator("xpath=..");
  }

  get avisoBajaAutomatica() {
    return this.page.getByText("Esta(s) unidad(es) se dará(n) de baja automáticamente");
  }

  get botonRegistrar() {
    return boton(this.page, "Registrar devolución");
  }

  async registrar(): Promise<void> {
    await this.botonRegistrar.click();
  }
}
