import { test, expect } from "./support/fixtures";
import { E2E, E2E_PREFIX, newRunId } from "./support/env";
import { button, selectInSearch, waitForToast } from "./support/pages/components";
import { ApiTickets, createContextApiAs } from "./support/ticketsApi";

/**
 * Tablero kanban y tareas por pantalla.
 *
 * Las transiciones de estado se ejercitan preferentemente por el `TasksGraph`
 * del detalle (controles accesibles y deterministas). El arrastre HTML5 del
 * tablero se cubre una vez, con el camino de respaldo documentado en el README.
 *
 * GERENTE queda fuera de la Fase 1 (no se provisiona `e2e_gerente`): ADMIN
 * cubre los caminos privilegiados y EMPLEADO las restricciones.
 */

const RUN = newRunId();
let seq = 0;
const newTitle = (label: string): string => `${E2E_PREFIX} ${RUN}-${++seq} ${label}`;

test.describe("Tickets — tablero kanban", () => {
  test("renderiza las cuatro columnas con la tarjeta en la suya", async ({
    page,
    ticketsPage,
    ticketScenario,
  }) => {
    const taskTitle = `Tarea ${ticketScenario.title}`;
    await ticketScenario.assignA(E2E.admin.username, taskTitle);

    await ticketsPage.goKanban();

    for (const column of ["Pendiente", "En progreso", "En revisión", "Completada"]) {
      await expect(page.getByText(column, { exact: true }).first()).toBeVisible();
    }
    await expect(
      ticketsPage.column("PENDING").locator("div[draggable]", { hasText: taskTitle })
    ).toHaveCount(1);
  });

  test("crea una tarea desde el diálogo del tablero", async ({
    page,
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    const taskTitle = `Tarea ${ticketScenario.title}`;

    await ticketsPage.goKanban();
    await ticketsPage.newTask(ticketScenario.title, E2E.employee.name, taskTitle);
    await waitForToast(page, "Tarea asignada");

    const kanban = await tickets.kanban(ticketScenario.ticket.id);
    expect(kanban.data.some((a) => a.title === taskTitle)).toBe(true);
  });

  test("la tarjeta se mueve de columna al cambiar el estado de la tarea", async ({
    page,
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    // El arrastre HTML5 del tablero no es automatizable de forma estable en
    // Chromium headless; se cubre el mismo comportamiento de negocio moviendo
    // el estado desde el detalle y comprobando la columna al recargar (ver README).
    const taskTitle = `Tarea ${ticketScenario.title}`;
    const assignment = await ticketScenario.assignA(E2E.admin.username, taskTitle);

    await ticketsPage.goItem(ticketScenario.ticket.id);
    await page.getByRole("button", { name: "Abrir", exact: true }).click();
    await ticketsPage.selectTaskStatus(assignment.id).selectOption("IN_PROGRESS");
    await tickets.waitForTicket(
      ticketScenario.ticket.id,
      (t) => t.assignments.find((a) => a.id === assignment.id)?.status === "IN_PROGRESS"
    );

    await ticketsPage.goKanban();
    await expect(
      ticketsPage.column("IN_PROGRESS").locator("div[draggable]", { hasText: taskTitle })
    ).toHaveCount(1);
  });

  test("abre el detalle completo desde el modal de la tarjeta", async ({
    page,
    ticketsPage,
    ticketScenario,
  }) => {
    const taskTitle = `Tarea ${ticketScenario.title}`;
    await ticketScenario.assignA(E2E.admin.username, taskTitle);

    await ticketsPage.goKanban();
    await ticketsPage.card(taskTitle).click();
    await button(page, "Abrir detalle completo").click();

    await page.waitForURL(new RegExp(`#/tickets/${ticketScenario.ticket.id}$`), {
      timeout: 15_000,
    });
  });
});

test.describe("Tickets — tareas (TasksGraph)", () => {
  test("ADMIN avanza la tarea por todos sus estados", async ({
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    const assignment = await ticketScenario.assignA(E2E.admin.username, `Tarea ${ticketScenario.title}`);

    await ticketsPage.goItem(ticketScenario.ticket.id);
    await ticketsPage.page.getByRole("button", { name: "Abrir", exact: true }).click();

    const select = () => ticketsPage.selectTaskStatus(assignment.id);
    const status = (s: string) =>
      tickets.waitForTicket(
        ticketScenario.ticket.id,
        (t) => t.assignments.find((a) => a.id === assignment.id)?.status === s
      );

    await select().selectOption("IN_PROGRESS");
    await status("IN_PROGRESS");

    await select().selectOption("IN_REVIEW");
    await status("IN_REVIEW");

    await select().selectOption("COMPLETED");
    await status("COMPLETED");
  });

  test("agrega una tarea desde el detalle", async ({
    page,
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    const taskTitle = `Tarea ${ticketScenario.title}`;

    await ticketsPage.goItem(ticketScenario.ticket.id);
    await page.getByRole("button", { name: "Abrir formulario", exact: true }).click();
    await selectInSearch(
      page,
      "Buscar por nombre o no. empleado...",
      E2E.employee.name,
      E2E.employee.name
    );
    await page.locator('input[name="taskTitle"]').fill(taskTitle);
    await page.getByRole("button", { name: "Asignar", exact: true }).click();

    await waitForToast(page, "Tarea asignada");
    const kanban = await tickets.kanban(ticketScenario.ticket.id);
    expect(kanban.data.some((a) => a.title === taskTitle)).toBe(true);
  });
});

test.describe("Tickets — tareas por rol (EMPLEADO)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("un EMPLEADO no puede completar su tarea", async ({
    page,
    login,
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    const assignment = await ticketScenario.assignA(
      E2E.employee.username,
      `Tarea ${ticketScenario.title}`
    );

    await login.enterAs(E2E.employee.username);
    await ticketsPage.goItem(ticketScenario.ticket.id);
    await page.getByRole("button", { name: "Abrir", exact: true }).click();

    const select = ticketsPage.selectTaskStatus(assignment.id);
    await expect(select.locator('option[value="COMPLETADA"]')).toHaveCount(0);
    await expect(select.locator('option[value="EN_REVISION"]')).toHaveCount(1);

    // La API también rechaza: completar exige ADMIN/GERENTE y no hay retroceso.
    const ctx = await createContextApiAs(E2E.employee.username);
    const api = new ApiTickets(ctx);
    await tickets.updateAssignment(ticketScenario.ticket.id, assignment.id, {
      status: "IN_PROGRESS",
    });
    await expect(
      api.updateAssignment(ticketScenario.ticket.id, assignment.id, { status: "COMPLETED" })
    ).rejects.toThrow(/403/);
    await expect(
      api.updateAssignment(ticketScenario.ticket.id, assignment.id, { status: "PENDING" })
    ).rejects.toThrow(/400/);
    await ctx.dispose();
  });

  test("MIS TAREAS muestra sólo las del empleado", async ({
    login,
    tickets,
    ticketsPage,
    ticketScenario,
  }) => {
    const mineTitle = `Mia ${ticketScenario.title}`;
    const othersTitle = newTitle("Ajena");
    await ticketScenario.assignA(E2E.employee.username, mineTitle);

    const otherTicket = await tickets.create({
      title: newTitle("OtroTicket"),
      description: "Ticket de otra persona",
    });
    const adminId = await tickets.userByUsername(E2E.admin.username);
    await tickets.assign(otherTicket.id, { userId: adminId, title: othersTitle });

    await login.enterAs(E2E.employee.username);
    await ticketsPage.goMyTasks();

    await expect(ticketsPage.page.getByText(mineTitle).first()).toBeVisible();
    await expect(ticketsPage.page.getByText(othersTitle)).toHaveCount(0);
  });

  test("un EMPLEADO no accede a la administración de tareas", async ({ page, login }) => {
    await login.enterAs(E2E.employee.username);
    await page.goto("/#/tickets/tasks");

    await expect(page).not.toHaveURL(/#\/tickets\/tasks/);
  });
});

test.describe("Tickets — administración de tareas", () => {
  test("ADMIN ve todas las tareas con la columna Empleado", async ({
    page,
    ticketsPage,
    ticketScenario,
  }) => {
    const taskTitle = `Tarea ${ticketScenario.title}`;
    await ticketScenario.assignA(E2E.admin.username, taskTitle);

    await ticketsPage.goTasks();
    await expect(page.getByText("Empleado", { exact: true }).first()).toBeVisible();

    // La tabla de tareas no filtra por servidor: se amplía la página para que
    // la tarea recién creada entre en el primer lote.
    await page.locator('select[name="itemsPerPage"]').selectOption("50");
    await expect(page.getByText(taskTitle).first()).toBeVisible();
  });

  test.skip("GERENTE gestiona las tareas de su área en /tickets/tareas (requiere e2e_gerente)", () => {
    // D2: la Fase 1 no provisiona `e2e_gerente`. ADMIN cubre los caminos
    // privilegiados y EMPLEADO las restricciones; este caso se retoma cuando
    // exista la cuenta (ver README).
  });
});

