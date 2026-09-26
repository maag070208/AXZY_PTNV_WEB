import { test, expect } from "./support/fixtures";
import { E2E, E2E_PREFIX, nuevoRunId } from "./support/env";
import { boton, elegirEnBuscador, esperarToast } from "./support/pages/componentes";
import { ApiTickets, crearContextoApiComo } from "./support/ticketsApi";

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

const RUN = nuevoRunId();
let seq = 0;
const nuevoTitulo = (etiqueta: string): string => `${E2E_PREFIX} ${RUN}-${++seq} ${etiqueta}`;

test.describe("Tickets — tablero kanban", () => {
  test("renderiza las cuatro columnas con la tarjeta en la suya", async ({
    page,
    ticketsPage,
    ticketEscenario,
  }) => {
    const tituloTarea = `Tarea ${ticketEscenario.titulo}`;
    await ticketEscenario.asignarA(E2E.admin.username, tituloTarea);

    await ticketsPage.irKanban();

    for (const columna of ["Pendiente", "En progreso", "En revisión", "Completada"]) {
      await expect(page.getByText(columna, { exact: true }).first()).toBeVisible();
    }
    await expect(
      ticketsPage.columna("PENDIENTE").locator("div[draggable]", { hasText: tituloTarea })
    ).toHaveCount(1);
  });

  test("crea una tarea desde el diálogo del tablero", async ({
    page,
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    const tituloTarea = `Tarea ${ticketEscenario.titulo}`;

    await ticketsPage.irKanban();
    await ticketsPage.nuevaTarea(ticketEscenario.titulo, E2E.empleado.name, tituloTarea);
    await esperarToast(page, "Tarea asignada");

    const kanban = await tickets.kanban(ticketEscenario.ticket.id);
    expect(kanban.data.some((a) => a.title === tituloTarea)).toBe(true);
  });

  test("la tarjeta se mueve de columna al cambiar el estado de la tarea", async ({
    page,
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    // El arrastre HTML5 del tablero no es automatizable de forma estable en
    // Chromium headless; se cubre el mismo comportamiento de negocio moviendo
    // el estado desde el detalle y comprobando la columna al recargar (ver README).
    const tituloTarea = `Tarea ${ticketEscenario.titulo}`;
    const asignacion = await ticketEscenario.asignarA(E2E.admin.username, tituloTarea);

    await ticketsPage.irDetalle(ticketEscenario.ticket.id);
    await page.getByRole("button", { name: "Abrir", exact: true }).click();
    await ticketsPage.selectEstadoTarea(asignacion.id).selectOption("EN_PROGRESO");
    await tickets.esperarTicket(
      ticketEscenario.ticket.id,
      (t) => t.assignments.find((a) => a.id === asignacion.id)?.status === "EN_PROGRESO"
    );

    await ticketsPage.irKanban();
    await expect(
      ticketsPage.columna("EN_PROGRESO").locator("div[draggable]", { hasText: tituloTarea })
    ).toHaveCount(1);
  });

  test("abre el detalle completo desde el modal de la tarjeta", async ({
    page,
    ticketsPage,
    ticketEscenario,
  }) => {
    const tituloTarea = `Tarea ${ticketEscenario.titulo}`;
    await ticketEscenario.asignarA(E2E.admin.username, tituloTarea);

    await ticketsPage.irKanban();
    await ticketsPage.tarjeta(tituloTarea).click();
    await boton(page, "Abrir detalle completo").click();

    await page.waitForURL(new RegExp(`#/tickets/${ticketEscenario.ticket.id}$`), {
      timeout: 15_000,
    });
  });
});

test.describe("Tickets — tareas (TasksGraph)", () => {
  test("ADMIN avanza la tarea por todos sus estados", async ({
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    const asignacion = await ticketEscenario.asignarA(E2E.admin.username, `Tarea ${ticketEscenario.titulo}`);

    await ticketsPage.irDetalle(ticketEscenario.ticket.id);
    await ticketsPage.page.getByRole("button", { name: "Abrir", exact: true }).click();

    const select = () => ticketsPage.selectEstadoTarea(asignacion.id);
    const estado = (s: string) =>
      tickets.esperarTicket(
        ticketEscenario.ticket.id,
        (t) => t.assignments.find((a) => a.id === asignacion.id)?.status === s
      );

    await select().selectOption("EN_PROGRESO");
    await estado("EN_PROGRESO");

    await select().selectOption("EN_REVISION");
    await estado("EN_REVISION");

    await select().selectOption("COMPLETADA");
    await estado("COMPLETADA");
  });

  test("agrega una tarea desde el detalle", async ({
    page,
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    const tituloTarea = `Tarea ${ticketEscenario.titulo}`;

    await ticketsPage.irDetalle(ticketEscenario.ticket.id);
    await page.getByRole("button", { name: "Abrir formulario", exact: true }).click();
    await elegirEnBuscador(
      page,
      "Buscar por nombre o no. empleado...",
      E2E.empleado.name,
      E2E.empleado.name
    );
    await page.locator('input[name="taskTitle"]').fill(tituloTarea);
    await page.getByRole("button", { name: "Asignar", exact: true }).click();

    await esperarToast(page, "Tarea asignada");
    const kanban = await tickets.kanban(ticketEscenario.ticket.id);
    expect(kanban.data.some((a) => a.title === tituloTarea)).toBe(true);
  });
});

test.describe("Tickets — tareas por rol (EMPLEADO)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("un EMPLEADO no puede completar su tarea", async ({
    page,
    login,
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    const asignacion = await ticketEscenario.asignarA(
      E2E.empleado.username,
      `Tarea ${ticketEscenario.titulo}`
    );

    await login.entrarComo(E2E.empleado.username);
    await ticketsPage.irDetalle(ticketEscenario.ticket.id);
    await page.getByRole("button", { name: "Abrir", exact: true }).click();

    const select = ticketsPage.selectEstadoTarea(asignacion.id);
    await expect(select.locator('option[value="COMPLETADA"]')).toHaveCount(0);
    await expect(select.locator('option[value="EN_REVISION"]')).toHaveCount(1);

    // La API también rechaza: completar exige ADMIN/GERENTE y no hay retroceso.
    const ctx = await crearContextoApiComo(E2E.empleado.username);
    const api = new ApiTickets(ctx);
    await tickets.actualizarAsignacion(ticketEscenario.ticket.id, asignacion.id, {
      status: "EN_PROGRESO",
    });
    await expect(
      api.actualizarAsignacion(ticketEscenario.ticket.id, asignacion.id, { status: "COMPLETADA" })
    ).rejects.toThrow(/403/);
    await expect(
      api.actualizarAsignacion(ticketEscenario.ticket.id, asignacion.id, { status: "PENDIENTE" })
    ).rejects.toThrow(/400/);
    await ctx.dispose();
  });

  test("MIS TAREAS muestra sólo las del empleado", async ({
    login,
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    const tituloMia = `Mia ${ticketEscenario.titulo}`;
    const tituloAjena = nuevoTitulo("Ajena");
    await ticketEscenario.asignarA(E2E.empleado.username, tituloMia);

    const otroTicket = await tickets.crear({
      titulo: nuevoTitulo("OtroTicket"),
      descripcion: "Ticket de otra persona",
    });
    const adminId = await tickets.usuarioPorUsername(E2E.admin.username);
    await tickets.asignar(otroTicket.id, { userId: adminId, title: tituloAjena });

    await login.entrarComo(E2E.empleado.username);
    await ticketsPage.irMisTareas();

    await expect(ticketsPage.page.getByText(tituloMia).first()).toBeVisible();
    await expect(ticketsPage.page.getByText(tituloAjena)).toHaveCount(0);
  });

  test("un EMPLEADO no accede a la administración de tareas", async ({ page, login }) => {
    await login.entrarComo(E2E.empleado.username);
    await page.goto("/#/tickets/tareas");

    await expect(page).not.toHaveURL(/#\/tickets\/tareas/);
  });
});

test.describe("Tickets — administración de tareas", () => {
  test("ADMIN ve todas las tareas con la columna Empleado", async ({
    page,
    ticketsPage,
    ticketEscenario,
  }) => {
    const tituloTarea = `Tarea ${ticketEscenario.titulo}`;
    await ticketEscenario.asignarA(E2E.admin.username, tituloTarea);

    await ticketsPage.irTareas();
    await expect(page.getByText("Empleado", { exact: true }).first()).toBeVisible();

    // La tabla de tareas no filtra por servidor: se amplía la página para que
    // la tarea recién creada entre en el primer lote.
    await page.locator('select[name="itemsPerPage"]').selectOption("50");
    await expect(page.getByText(tituloTarea).first()).toBeVisible();
  });

  test.skip("GERENTE gestiona las tareas de su área en /tickets/tareas (requiere e2e_gerente)", () => {
    // D2: la Fase 1 no provisiona `e2e_gerente`. ADMIN cubre los caminos
    // privilegiados y EMPLEADO las restricciones; este caso se retoma cuando
    // exista la cuenta (ver README).
  });
});

