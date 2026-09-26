import { expect, type Locator, type Page } from "@playwright/test";
import { button, field, goToRoute, searchPanel } from "./components";

/**
 * Page Object del módulo de tickets: lista, alta/edición, detalle, tablero
 * kanban, tareas y la pestaña de categorías de `/catalogos`.
 *
 * Aquí viven los selectores frágiles del módulo (el kit no expone
 * `data-testid` y varios botones son icon-only). El botón "ver detalle" de la
 * lista es el PRIMERO de la celda de acciones; el de borrar es el único con
 * `title`, por eso se localiza por ese atributo.
 */

const COLUMN_ORDER = ["PENDING", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"] as const;

export class TicketsPage {
  constructor(readonly page: Page) {}

  async go(): Promise<void> {
    await goToRoute(this.page, "/tickets");
  }

  async goNew(): Promise<void> {
    await goToRoute(this.page, "/tickets/new");
  }

  async goItem(id: string): Promise<void> {
    await goToRoute(this.page, `/tickets/${id}`);
  }

  async goEdit(id: string): Promise<void> {
    await goToRoute(this.page, `/tickets/${id}/edit`);
  }

  async goKanban(ticketId?: string): Promise<void> {
    await goToRoute(this.page, ticketId ? `/tickets/kanban?ticketId=${ticketId}` : "/tickets/kanban");
  }

  async goMyTasks(): Promise<void> {
    await goToRoute(this.page, "/tickets/my-tasks");
  }

  async goTasks(): Promise<void> {
    await goToRoute(this.page, "/tickets/tasks");
  }

  async goCatalogs(): Promise<void> {
    await goToRoute(this.page, "/catalogs");
  }

  // ── Lista ────────────────────────────────────────────────────────────────

  row(title: string): Locator {
    return this.page.locator("table tbody tr", { hasText: title }).first();
  }

  /** Botón "ver detalle" (icon-only `FaEye`, el primero de la celda de acciones). */
  viewDetailOf(title: string): Locator {
    return this.row(title).getByRole("button").first();
  }

  /** Botón de borrar de la fila (icon-only, el único con `title`). */
  deleteFromRow(title: string): Locator {
    return this.row(title).locator("button[title]");
  }

  async filterTitle(q: string): Promise<void> {
    await this.page.locator('input[name="filter-titulo"]').fill(q);
  }

  async filterStatus(value: string): Promise<void> {
    await this.page.locator('select[name="filter-status"]').selectOption(value);
  }

  async filterPriority(value: string): Promise<void> {
    await this.page.locator('select[name="filter-priority"]').selectOption(value);
  }

  pageButton(n: number): Locator {
    return this.page.locator(`[title="Page ${n}"]`);
  }

  get withoutResults(): Locator {
    return this.page.getByText("No se encontraron resultados").first();
  }

  // ── Alta / edición ───────────────────────────────────────────────────────

  async writeTitle(title: string): Promise<void> {
    await field(this.page, "Título").fill(title);
  }

  async writeDescription(text: string): Promise<void> {
    await field(this.page, "Descripción").fill(text);
  }

  async selectCategory(name: string): Promise<void> {
    await this.page.locator('select[name="category"]').selectOption({ label: name });
  }

  async selectPriority(name: string): Promise<void> {
    await this.page.getByRole("button", { name: name, exact: true }).click();
  }

  get saveButton(): Locator {
    return this.page.getByRole("button", { name: /Crear ticket|Guardar cambios/ });
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  // ── Detalle ──────────────────────────────────────────────────────────────

  async comment(text: string): Promise<void> {
    await this.page.locator('textarea[name="comment"]').fill(text);
    await button(this.page, "Comentar").click();
  }

  async changeStatusTicket(value: string): Promise<void> {
    await this.page.locator('select[name="status"]').selectOption(value);
  }

  async finish(): Promise<void> {
    await button(this.page, "Finalizar").click();
  }

  /** Diálogo modal de confirmación (el último montado). */
  get dialog(): Locator {
    return this.page.locator("div.fixed.inset-0").last();
  }

  async confirmDialog(label: string): Promise<void> {
    await this.dialog.getByRole("button", { name: label }).click();
  }

  // ── Kanban / tareas ──────────────────────────────────────────────────────

  get columns(): Locator {
    return this.page.locator("div.overflow-x-auto.items-start").locator(":scope > div");
  }

  column(status: (typeof COLUMN_ORDER)[number]): Locator {
    return this.columns.nth(COLUMN_ORDER.indexOf(status));
  }

  card(title: string): Locator {
    return this.page.locator("div[draggable]").filter({ hasText: title }).first();
  }

  /**
   * Alta de tarea desde el diálogo del tablero (2 buscadores + título).
   *
   * Las opciones del `ITSearchSelect` se montan por portal FUERA del `ITDialog`,
   * y el diálogo cierra al detectar un `mousedown` externo. Por eso se elige con
   * `dispatchEvent("click")` (sin `mousedown`): mantiene el diálogo abierto. Es
   * una limitación de producto documentada, no del test.
   */
  async newTask(ticketTitle: string, employee: string, taskTitle: string): Promise<void> {
    await button(this.page, "Nueva tarea").click();
    await this.selectInDialogSearch("Buscar ticket...", ticketTitle);
    await this.selectInDialogSearch("Buscar empleado...", employee);
    await field(this.page, "Título de la tarea").fill(taskTitle);
    await button(this.page, "Asignar tarea").click();
  }

  private async selectInDialogSearch(placeholder: string, option: string): Promise<void> {
    const input = this.page.getByPlaceholder(placeholder);
    await input.click();
    await input.fill(option);

    const panel = searchPanel(this.page);
    const candidate = panel.getByText(option).first();
    await expect(candidate).toBeVisible();
    await candidate.dispatchEvent("click");
    await expect(panel).toHaveCount(0);
  }

  selectTaskStatus(assignmentId: string): Locator {
    return this.page.locator(`select[name="status-${assignmentId}"]`);
  }

  // ── Catálogo de categorías (`/catalogos`) ────────────────────────────────

  async openCategoriesTab(): Promise<void> {
    await this.page.getByRole("button", { name: "Categorías de ticket", exact: true }).click();
  }

  async createCategory(name: string): Promise<void> {
    await this.page.getByRole("button", { name: "Nuevo", exact: true }).click();
    await this.page.locator('input[name="nombre"]').fill(name);
    await this.page.getByRole("button", { name: "Guardar", exact: true }).click();
  }

  catalogRow(name: string): Locator {
    return this.page.locator("table tbody tr", { hasText: name }).first();
  }

  async deactivateCategory(name: string): Promise<void> {
    await this.catalogRow(name).locator('button[title="Desactivar"]').click();
  }

  async deleteCategoryPermanently(name: string): Promise<void> {
    await this.catalogRow(name).locator('button[title="Eliminar definitivamente"]').click();
    await this.confirmDialog("Eliminar definitivamente");
  }
}
