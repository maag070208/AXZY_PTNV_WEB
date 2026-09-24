import { expect, type Locator, type Page } from "@playwright/test";
import { boton, campo, irARuta, panelBuscador } from "./componentes";

/**
 * Page Object del módulo de tickets: lista, alta/edición, detalle, tablero
 * kanban, tareas y la pestaña de categorías de `/catalogos`.
 *
 * Aquí viven los selectores frágiles del módulo (el kit no expone
 * `data-testid` y varios botones son icon-only). El botón "ver detalle" de la
 * lista es el PRIMERO de la celda de acciones; el de borrar es el único con
 * `title`, por eso se localiza por ese atributo.
 */

const ORDEN_COLUMNAS = ["PENDIENTE", "EN_PROGRESO", "EN_REVISION", "COMPLETADA"] as const;

export class TicketsPage {
  constructor(readonly page: Page) {}

  async ir(): Promise<void> {
    await irARuta(this.page, "/tickets");
  }

  async irNuevo(): Promise<void> {
    await irARuta(this.page, "/tickets/nuevo");
  }

  async irDetalle(id: string): Promise<void> {
    await irARuta(this.page, `/tickets/${id}`);
  }

  async irEditar(id: string): Promise<void> {
    await irARuta(this.page, `/tickets/${id}/editar`);
  }

  async irKanban(ticketId?: string): Promise<void> {
    await irARuta(this.page, ticketId ? `/tickets/kanban?ticketId=${ticketId}` : "/tickets/kanban");
  }

  async irMisTareas(): Promise<void> {
    await irARuta(this.page, "/tickets/mis-tareas");
  }

  async irTareas(): Promise<void> {
    await irARuta(this.page, "/tickets/tareas");
  }

  async irCatalogos(): Promise<void> {
    await irARuta(this.page, "/catalogos");
  }

  // ── Lista ────────────────────────────────────────────────────────────────

  fila(titulo: string): Locator {
    return this.page.locator("table tbody tr", { hasText: titulo }).first();
  }

  /** Botón "ver detalle" (icon-only `FaEye`, el primero de la celda de acciones). */
  verDetalleDe(titulo: string): Locator {
    return this.fila(titulo).getByRole("button").first();
  }

  /** Botón de borrar de la fila (icon-only, el único con `title`). */
  borrarDeFila(titulo: string): Locator {
    return this.fila(titulo).locator("button[title]");
  }

  async filtrarTitulo(q: string): Promise<void> {
    await this.page.locator('input[name="filter-titulo"]').fill(q);
  }

  async filtrarEstado(valor: string): Promise<void> {
    await this.page.locator('select[name="filter-status"]').selectOption(valor);
  }

  async filtrarPrioridad(valor: string): Promise<void> {
    await this.page.locator('select[name="filter-priority"]').selectOption(valor);
  }

  pagina(n: number): Locator {
    return this.page.locator(`[title="Page ${n}"]`);
  }

  get sinResultados(): Locator {
    return this.page.getByText("No se encontraron resultados").first();
  }

  // ── Alta / edición ───────────────────────────────────────────────────────

  async escribirTitulo(titulo: string): Promise<void> {
    await campo(this.page, "Título").fill(titulo);
  }

  async escribirDescripcion(texto: string): Promise<void> {
    await campo(this.page, "Descripción").fill(texto);
  }

  async elegirCategoria(nombre: string): Promise<void> {
    await this.page.locator('select[name="category"]').selectOption({ label: nombre });
  }

  async elegirPrioridad(nombre: string): Promise<void> {
    await this.page.getByRole("button", { name: nombre, exact: true }).click();
  }

  get botonGuardar(): Locator {
    return this.page.getByRole("button", { name: /Crear ticket|Guardar cambios/ });
  }

  async guardar(): Promise<void> {
    await this.botonGuardar.click();
  }

  // ── Detalle ──────────────────────────────────────────────────────────────

  async comentar(texto: string): Promise<void> {
    await this.page.locator('textarea[name="comment"]').fill(texto);
    await boton(this.page, "Comentar").click();
  }

  async cambiarEstadoTicket(valor: string): Promise<void> {
    await this.page.locator('select[name="status"]').selectOption(valor);
  }

  async finalizar(): Promise<void> {
    await boton(this.page, "Finalizar").click();
  }

  /** Diálogo modal de confirmación (el último montado). */
  get dialogo(): Locator {
    return this.page.locator("div.fixed.inset-0").last();
  }

  async confirmarDialogo(label: string): Promise<void> {
    await this.dialogo.getByRole("button", { name: label }).click();
  }

  // ── Kanban / tareas ──────────────────────────────────────────────────────

  get columnas(): Locator {
    return this.page.locator("div.overflow-x-auto.items-start").locator(":scope > div");
  }

  columna(status: (typeof ORDEN_COLUMNAS)[number]): Locator {
    return this.columnas.nth(ORDEN_COLUMNAS.indexOf(status));
  }

  tarjeta(titulo: string): Locator {
    return this.page.locator("div[draggable]").filter({ hasText: titulo }).first();
  }

  /**
   * Alta de tarea desde el diálogo del tablero (2 buscadores + título).
   *
   * Las opciones del `ITSearchSelect` se montan por portal FUERA del `ITDialog`,
   * y el diálogo cierra al detectar un `mousedown` externo. Por eso se elige con
   * `dispatchEvent("click")` (sin `mousedown`): mantiene el diálogo abierto. Es
   * una limitación de producto documentada, no del test.
   */
  async nuevaTarea(ticketTitulo: string, empleado: string, tituloTarea: string): Promise<void> {
    await boton(this.page, "Nueva tarea").click();
    await this.elegirEnBuscadorDelDialogo("Buscar ticket...", ticketTitulo);
    await this.elegirEnBuscadorDelDialogo("Buscar empleado...", empleado);
    await campo(this.page, "Título de la tarea").fill(tituloTarea);
    await boton(this.page, "Asignar tarea").click();
  }

  private async elegirEnBuscadorDelDialogo(placeholder: string, opcion: string): Promise<void> {
    const input = this.page.getByPlaceholder(placeholder);
    await input.click();
    await input.fill(opcion);

    const panel = panelBuscador(this.page);
    const candidata = panel.getByText(opcion).first();
    await expect(candidata).toBeVisible();
    await candidata.dispatchEvent("click");
    await expect(panel).toHaveCount(0);
  }

  selectEstadoTarea(assignmentId: string): Locator {
    return this.page.locator(`select[name="status-${assignmentId}"]`);
  }

  // ── Catálogo de categorías (`/catalogos`) ────────────────────────────────

  async abrirTabCategorias(): Promise<void> {
    await this.page.getByRole("button", { name: "Categorías de ticket", exact: true }).click();
  }

  async crearCategoria(nombre: string): Promise<void> {
    await this.page.getByRole("button", { name: "Nuevo", exact: true }).click();
    await this.page.locator('input[name="nombre"]').fill(nombre);
    await this.page.getByRole("button", { name: "Guardar", exact: true }).click();
  }

  filaCatalogo(nombre: string): Locator {
    return this.page.locator("table tbody tr", { hasText: nombre }).first();
  }

  async desactivarCategoria(nombre: string): Promise<void> {
    await this.filaCatalogo(nombre).locator('button[title="Desactivar"]').click();
  }

  async eliminarCategoriaDefinitivo(nombre: string): Promise<void> {
    await this.filaCatalogo(nombre).locator('button[title="Eliminar definitivamente"]').click();
    await this.confirmarDialogo("Eliminar definitivamente");
  }
}
