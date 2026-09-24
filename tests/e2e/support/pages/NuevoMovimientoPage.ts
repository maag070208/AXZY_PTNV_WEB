import { expect, type Locator, type Page } from "@playwright/test";
import {
  boton,
  campo,
  chip,
  elegirEnBuscador,
  irARuta,
  opcionesBuscador,
  panelBuscador,
} from "./componentes";

export type TipoMovimientoUI = "Baja" | "A mantenimiento" | "De mantenimiento";
export type CondicionUI = "BUENO" | "ACEPTABLE" | "MALO" | "ROTO";

/**
 * BAJA y MOVIMIENTOS DE MANTENIMIENTO — `/inventario/movimientos/nuevo`.
 *
 * La pantalla trabaja por renglones y, a diferencia de la API, **exige elegir
 * la unidad física exacta**: cada renglón mueve una sola pieza. También pide
 * motivo para "A mantenimiento", que la API no exige.
 */
export class NuevoMovimientoPage {
  constructor(private readonly page: Page) {}

  async ir(): Promise<void> {
    await irARuta(this.page, "/inventario/movimientos/nuevo");
    await expect(this.page.getByPlaceholder("Buscar dispositivo...").first()).toBeVisible();
  }

  /**
   * Cada renglón se acota desde su encabezado "Renglón N" hacia el ancestro más
   * cercano que contiene sus propios campos, para no cruzarse con los demás.
   */
  renglon(indice = 1): Locator {
    return this.page
      .getByText(new RegExp(`^Renglón ${indice}$`))
      .locator("xpath=ancestor::div[.//input[@placeholder='Buscar dispositivo...']][1]");
  }

  async agregarRenglon(): Promise<void> {
    await boton(this.page, /Agregar renglón/).click();
  }

  async elegirDispositivo(nombre: string, indice = 1): Promise<void> {
    await elegirEnBuscador(this.renglon(indice), "Buscar dispositivo...", nombre);
  }

  /** Elige una unidad por su activo fijo; el desplegable ya viene filtrado por estado. */
  async elegirUnidad(activoFijo: string, indice = 1): Promise<void> {
    await elegirEnBuscador(this.renglon(indice), "Buscar unidad...", activoFijo);
  }

  /** Las unidades que la pantalla ofrece para el tipo de movimiento elegido. */
  async unidadesOfrecidas(indice = 1): Promise<string[]> {
    const renglon = this.renglon(indice);
    const input = renglon.getByPlaceholder("Buscar unidad...");
    await input.click();
    await input.fill("");
    const opciones = opcionesBuscador(renglon);
    await expect(opciones.first()).toBeVisible();
    const textos = await opciones.allInnerTexts();

    // Escape y blur NO cierran el panel del kit: sólo el `mousedown` fuera.
    await this.page.getByRole("heading", { level: 1 }).click();
    await expect(panelBuscador(renglon)).toHaveCount(0);
    return textos;
  }

  async elegirTipo(tipo: TipoMovimientoUI, indice = 1): Promise<void> {
    await chip(this.renglon(indice), tipo).click();
  }

  async escribirMotivo(motivo: string, indice = 1): Promise<void> {
    await campo(this.renglon(indice), "Motivo").fill(motivo);
  }

  async elegirCondicion(condicion: CondicionUI, indice = 1): Promise<void> {
    await chip(this.renglon(indice), condicion).click();
  }

  async escribirComentario(texto: string, indice = 1): Promise<void> {
    await campo(this.renglon(indice), "Comentario").fill(texto);
  }

  get avisoSinUnidades() {
    return this.page.getByText("No hay unidades en este estado para el dispositivo seleccionado");
  }

  get avisoBajaAutomatica() {
    return this.page.getByText("Esta(s) unidad(es) se dará(n) de baja automáticamente");
  }

  get botonRegistrar() {
    return boton(this.page, "Registrar");
  }

  async registrar(): Promise<void> {
    await this.botonRegistrar.click();
  }
}
