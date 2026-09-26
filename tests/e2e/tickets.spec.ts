import { test, expect } from "./support/fixtures";
import { E2E, E2E_PREFIX, newRunId, route } from "./support/env";
import { field, waitForToast } from "./support/pages/components";

/**
 * Tickets por pantalla: lista server-side (filtros + paginación), alta, edición,
 * detalle (comentario, estados, cierre) y el ciclo de borrado (papelera →
 * físico), más el catálogo de categorías.
 *
 * Lo que se prueba es la **pantalla**; el escenario se siembra por API. Todo
 * ticket/categoría se nombra con el prefijo `E2E `, que es el criterio con el
 * que la limpieza del paquete `api/` barre los residuos.
 *
 * Los adjuntos (S3) quedan fuera a propósito: sin credenciales la API responde
 * 503 y la prueba dependería del entorno.
 */

const RUN = newRunId();
let seq = 0;
const newTitle = (label: string): string => `${E2E_PREFIX} ${RUN}-${++seq} ${label}`;

test.describe("Tickets — lista y filtros", () => {
  test("la lista renderiza las columnas y una fila sembrada", async ({
    page,
    ticketsPage,
    ticketScenario,
  }) => {
    await ticketsPage.go();
    await ticketsPage.filterTitle(ticketScenario.title);

    const row = ticketsPage.row(ticketScenario.title);
    await expect(row).toBeVisible();

    for (const column of ["Título", "Estado", "Prioridad", "Creado por", "Asignado a"]) {
      await expect(page.getByText(column, { exact: true }).first()).toBeVisible();
    }

    await expect(row.getByText("Abierto").first()).toBeVisible();
    await expect(row.getByText("Media").first()).toBeVisible();
    await expect(row.getByText(E2E.admin.name).first()).toBeVisible();
    await expect(row.getByText("Sin asignar").first()).toBeVisible();
  });

  test("filtra por título en el servidor", async ({ page, ticketsPage, ticketScenario }) => {
    await ticketsPage.go();

    const request = page.waitForRequest(
      (r) =>
        r.url().includes("/tickets/query") &&
        r.method() === "POST" &&
        (r.postData() ?? "").includes(ticketScenario.title)
    );
    await ticketsPage.filterTitle(ticketScenario.title);
    await request;

    await expect(ticketsPage.row(ticketScenario.title)).toBeVisible();

    const matching = await ticketScenario.tickets.query({
      filters: { title: ticketScenario.title },
    });
    expect(matching.data.every((t) => t.title.includes(ticketScenario.title))).toBe(true);
  });

  test("filtra por estado en el servidor", async ({ ticketsPage, ticketScenario }) => {
    await ticketsPage.go();
    await ticketsPage.filterTitle(ticketScenario.title);
    await expect(ticketsPage.row(ticketScenario.title)).toBeVisible();

    await ticketsPage.filterStatus("CLOSED");
    await expect(ticketsPage.withoutResults).toBeVisible();

    await ticketsPage.filterStatus("OPEN");
    await expect(ticketsPage.row(ticketScenario.title)).toBeVisible();
  });

  test("filtra por prioridad en el servidor", async ({ tickets, ticketsPage }) => {
    const title = newTitle("Prioridad");
    await tickets.create({ title, description: "Ticket con prioridad ALTA", priority: "HIGH" });

    await ticketsPage.go();
    await ticketsPage.filterTitle(title);
    await expect(ticketsPage.row(title)).toBeVisible();

    await ticketsPage.filterPriority("URGENT");
    await expect(ticketsPage.withoutResults).toBeVisible();

    await ticketsPage.filterPriority("HIGH");
    await expect(ticketsPage.row(title)).toBeVisible();
  });

  test("pagina en el servidor", async ({ page, tickets, ticketsPage }) => {
    const token = `${E2E_PREFIX} ${RUN}-PAG`;
    for (let i = 0; i < 6; i += 1) {
      await tickets.create({ title: `${token} ${i}`, description: `Relleno de paginación ${i}` });
    }

    await ticketsPage.go();
    await ticketsPage.filterTitle(token);

    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(5);

    const requestPage2 = page.waitForRequest(
      (r) =>
        r.url().includes("/tickets/query") &&
        r.method() === "POST" &&
        (r.postData() ?? "").includes('"page":2')
    );
    await ticketsPage.pageButton(2).click();
    await requestPage2;

    await expect(rows).toHaveCount(1);
  });

  test("muestra el vacío cuando no hay coincidencias", async ({ ticketsPage }) => {
    await ticketsPage.go();
    await ticketsPage.filterTitle(`SIN-COINCIDENCIA-${RUN}`);
    await expect(ticketsPage.withoutResults).toBeVisible();
  });
});

test.describe("Tickets — alta y edición", () => {
  test("crea un ticket y lo refleja en la API", async ({ page, tickets, ticketsPage }) => {
    const title = newTitle("Crear");
    const category = await tickets.createCategory(newTitle("Cat"));

    await ticketsPage.goNew();
    await ticketsPage.writeTitle(title);
    await ticketsPage.writeDescription("Descripción creada desde la pantalla E2E");
    await ticketsPage.selectCategory(category.name);
    await ticketsPage.selectPriority("Alta");
    await ticketsPage.save();

    await waitForToast(page, "Ticket creado correctamente");
    await page.waitForURL(/#\/tickets$/, { timeout: 15_000 });

    const created = await tickets.searchByTitle(title);
    expect(created, "el ticket debió crearse").toBeTruthy();
    expect(created!.status).toBe("OPEN");
    expect(created!.priority).toBe("HIGH");
    expect(created!.categoryId).toBe(category.id);
  });

  test("bloquea el guardado hasta que el título tiene 3 caracteres", async ({ ticketsPage }) => {
    await ticketsPage.goNew();

    const save = ticketsPage.saveButton;
    await expect(save).toBeDisabled();

    await ticketsPage.writeTitle("AB");
    await expect(save).toBeDisabled();

    await ticketsPage.writeTitle("ABC");
    await expect(save).toBeEnabled();
  });

  test("sin descripción la API rechaza y no queda ticket", async ({ page, tickets, ticketsPage }) => {
    const title = newTitle("SinDesc");

    await ticketsPage.goNew();
    await ticketsPage.writeTitle(title);
    await ticketsPage.save();

    await waitForToast(page, "Error al crear ticket");
    expect(await tickets.searchByTitle(title)).toBeNull();
  });

  test("edita la prioridad de un ticket", async ({
    page,
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    await ticketsPage.goEdit(ticketScenario.ticket.id);
    await expect(field(page, "Título")).toHaveValue(ticketScenario.title);

    await ticketsPage.selectPriority("Alta");
    await ticketsPage.save();

    await waitForToast(page, "Ticket actualizado correctamente");
    await page.waitForURL(new RegExp(`#/tickets/${ticketScenario.ticket.id}$`), {
      timeout: 15_000,
    });

    const updated = await tickets.waitForTicket(
      ticketScenario.ticket.id,
      (t) => t.priority === "HIGH"
    );
    expect(updated.priority).toBe("HIGH");
  });
});

test.describe("Tickets — detalle", () => {
  test("abre el detalle desde la lista y agrega un comentario", async ({
    page,
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    // El botón "ver detalle" es icon-only y va primero en la celda de acciones.
    await ticketsPage.go();
    await ticketsPage.filterTitle(ticketScenario.title);
    await ticketsPage.viewDetailOf(ticketScenario.title).click();
    await page.waitForURL(new RegExp(`#/tickets/${ticketScenario.ticket.id}$`), {
      timeout: 15_000,
    });

    const text = `Comentario E2E ${RUN}`;
    await ticketsPage.comment(text);
    await waitForToast(page, "Comentario agregado");

    await expect(page.getByText(text).first()).toBeVisible();
    const ticket = await tickets.waitForTicket(ticketScenario.ticket.id, (t) =>
      t.comments.some((c) => c.text === text)
    );
    expect(ticket.comments.length).toBeGreaterThanOrEqual(1);
  });

  test("cambia el estado del ticket desde el panel de administración", async ({
    page,
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    await ticketsPage.goItem(ticketScenario.ticket.id);

    await ticketsPage.changeStatusTicket("IN_PROGRESS");
    await waitForToast(page, "Estado cambiado a En seguimiento");

    const ticket = await tickets.waitForTicket(
      ticketScenario.ticket.id,
      (t) => t.status === "IN_PROGRESS"
    );
    expect(ticket.status).toBe("IN_PROGRESS");
  });

  test("finaliza el ticket: cierra, fecha y completa sus tareas", async ({
    page,
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    await ticketScenario.assignA(E2E.admin.username);

    await ticketsPage.goItem(ticketScenario.ticket.id);
    await ticketsPage.finish();
    await waitForToast(page, "Estado cambiado a Cerrado");

    const closed = await tickets.waitForTicket(
      ticketScenario.ticket.id,
      (t) => t.status === "CLOSED"
    );
    expect(closed.closedAt).toBeTruthy();
    expect(closed.assignments.length).toBe(1);
    expect(closed.assignments[0].status).toBe("COMPLETED");
  });

  test("un ticket cerrado queda en solo lectura", async ({ page, ticketsPage, ticketScenario }) => {
    await ticketScenario.tickets.update(ticketScenario.ticket.id, { status: "CLOSED" });

    await ticketsPage.goItem(ticketScenario.ticket.id);
    await expect(page.locator('select[name="status"]')).toBeDisabled();
    await expect(page.locator('textarea[name="comment"]')).toBeDisabled();
  });
});

test.describe("Tickets — borrado", () => {
  test("mueve a papelera desde la lista y desaparece", async ({
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    await ticketsPage.go();
    await ticketsPage.filterTitle(ticketScenario.title);
    await expect(ticketsPage.row(ticketScenario.title)).toBeVisible();

    await ticketsPage.deleteFromRow(ticketScenario.title).click();
    await ticketsPage.confirmDialog("Mover a papelera");

    await expect(ticketsPage.withoutResults).toBeVisible();
    const deleted = await tickets.get(ticketScenario.ticket.id);
    expect(deleted.deletedAt).toBeTruthy();
  });

  test("elimina definitivamente desde el detalle de un ticket en papelera", async ({
    page,
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    // Primera eliminación por API (soft): deja el ticket en papelera.
    const soft = await tickets.remove(ticketScenario.ticket.id);
    expect(soft.soft).toBe(true);

    await ticketsPage.goItem(ticketScenario.ticket.id);
    await page.locator('button[title="Eliminar definitivamente"]').click();
    await ticketsPage.confirmDialog("Eliminar definitivamente");

    await page.waitForURL(/#\/tickets$/, { timeout: 15_000 });
    expect(await tickets.getOptional(ticketScenario.ticket.id)).toBeNull();
  });
});

test.describe("Categorías de ticket", () => {
  test("crea, desactiva y elimina definitivamente una categoría", async ({ tickets, ticketsPage }) => {
    const name = newTitle("Cat");

    await ticketsPage.goCatalogs();
    await ticketsPage.openCategoriesTab();
    await ticketsPage.createCategory(name);

    const row = ticketsPage.catalogRow(name);
    await expect(row).toBeVisible();
    await expect(row.getByText("Activo").first()).toBeVisible();

    await ticketsPage.deactivateCategory(name);
    await expect(row.getByText("Inactivo").first()).toBeVisible();

    await ticketsPage.deleteCategoryPermanently(name);
    await expect(ticketsPage.catalogRow(name)).toHaveCount(0);

    const categories = await tickets.categories(true);
    expect(categories.some((c) => c.name === name)).toBe(false);
  });
});

test.describe("Tickets — gate por rol (EMPLEADO)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("un empleado no accede a la edición de tickets", async ({ page, login, ticketScenario }) => {
    await login.enterAs(E2E.employee.username);
    await page.goto(route(`/tickets/${ticketScenario.ticket.id}/edit`));

    await page.waitForURL(/#\/tickets$/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(new RegExp(`/tickets/${ticketScenario.ticket.id}/edit`));
  });

  test("un empleado no ve el botón de borrar en la lista", async ({
    login,
    ticketsPage,
    ticketScenario,
  }) => {
    await ticketScenario.assignA(E2E.employee.username);

    await login.enterAs(E2E.employee.username);
    await ticketsPage.go();
    await ticketsPage.filterTitle(ticketScenario.title);

    const row = ticketsPage.row(ticketScenario.title);
    await expect(row).toBeVisible();
    await expect(row.locator("button[title]")).toHaveCount(0);
  });

  test("un empleado no accede a los catálogos", async ({ page, login }) => {
    await login.enterAs(E2E.employee.username);
    await page.goto(route("/catalogs"));

    await expect(page).not.toHaveURL(/#\/catalogs/);
  });
});
