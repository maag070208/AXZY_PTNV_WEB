import { expect, type Page } from "@playwright/test";
import { boton, campo, elegirEnBuscador, irARuta } from "./componentes";

/**
 * ALTA — `/inventario/dispositivos/nuevo`.
 *
 * Ojo con el orden: la pantalla sólo arma los renglones de unidades cuando ya
 * hay un tipo elegido, así que el tipo va primero y la cantidad después.
 */
export class AltaDispositivoPage {
  constructor(private readonly page: Page) {}

  async ir(): Promise<void> {
    await irARuta(this.page, "/inventario/dispositivos/nuevo");
    await expect(this.page.getByPlaceholder("Buscar tipo...")).toBeVisible();
  }

  async elegirTipo(nombreTipo: string): Promise<void> {
    await elegirEnBuscador(this.page, "Buscar tipo...", nombreTipo);
  }

  async llenar(datos: {
    nombre: string;
    marca: string;
    modelo: string;
    descripcion?: string;
    cantidad?: number;
  }): Promise<void> {
    await campo(this.page, "Nombre / Modelo").fill(datos.nombre);
    await campo(this.page, "Marca").fill(datos.marca);
    await campo(this.page, "Modelo").fill(datos.modelo);
    if (datos.descripcion !== undefined) {
      await campo(this.page, /Descripción/).fill(datos.descripcion);
    }
    if (datos.cantidad !== undefined) {
      await this.fijarCantidad(datos.cantidad);
    }
  }

  async fijarCantidad(cantidad: number): Promise<void> {
    await campo(this.page, "Cantidad inicial").fill(String(cantidad));
    await expect(this.promesaDeUnidades(cantidad)).toBeVisible();
  }

  /**
   * Lo que la pantalla le promete al usuario: "Al guardar se crearán N
   * unidades físicas (activo fijo) y se registrará la ENTRADA."
   */
  promesaDeUnidades(cantidad: number) {
    return this.page.getByText(new RegExp(`se crear[aá]n ${cantidad} unidades f[ií]sicas`, "i"));
  }

  /** Renglones de unidad desplegados en el panel lateral. */
  get renglonesDeUnidad() {
    return this.page.getByRole("button", { name: /^Unidad \d+/ });
  }

  get botonGuardar() {
    return boton(this.page, "Guardar");
  }

  async guardar(): Promise<void> {
    await this.botonGuardar.click();
  }

  /** Abre el renglón de una unidad para capturar su serie, MAC, IP o nombre. */
  async abrirUnidad(indice: number): Promise<void> {
    await this.page.getByRole("button", { name: new RegExp(`Unidad\\s+${indice}\\b`, "i") }).click();
  }

  async capturarUnidad(
    indice: number,
    datos: { numeroSerie?: string; mac?: string; ip?: string; nombreEquipo?: string }
  ): Promise<void> {
    await this.abrirUnidad(indice);
    if (datos.numeroSerie !== undefined) await campo(this.page, "No. serie").fill(datos.numeroSerie);
    if (datos.mac !== undefined) await campo(this.page, "MAC").fill(datos.mac);
    if (datos.ip !== undefined) await campo(this.page, "IP").fill(datos.ip);
    if (datos.nombreEquipo !== undefined) {
      await campo(this.page, "Nombre equipo").fill(datos.nombreEquipo);
    }
  }
}
