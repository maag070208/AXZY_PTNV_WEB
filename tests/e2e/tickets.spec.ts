import { test, expect } from "./support/fixtures";
import { E2E, E2E_PREFIX, nuevoRunId, ruta } from "./support/env";
import { campo, esperarToast } from "./support/pages/componentes";

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

const RUN = nuevoRunId();
let seq = 0;
const nuevoTitulo = (etiqueta: string): string => `${E2E_PREFIX} ${RUN}-${++seq} ${etiqueta}`;

test.describe("Tickets — lista y filtros", () => {
  test("la lista renderiza las columnas y una fila sembrada", async ({
    page,
    ticketsPage,
    ticketEscenario,
  }) => {
    await ticketsPage.ir();
    await ticketsPage.filtrarTitulo(ticketEscenario.titulo);

    const fila = ticketsPage.fila(ticketEscenario.titulo);
    await expect(fila).toBeVisible();

    for (const columna of ["Título", "Estado", "Prioridad", "Creado por", "Asignado a"]) {
      await expect(page.getByText(columna, { exact: true }).first()).toBeVisible();
    }

    await expect(fila.getByText("Abierto").first()).toBeVisible();
    await expect(fila.getByText("Media").first()).toBeVisible();
    await expect(fila.getByText(E2E.admin.name).first()).toBeVisible();
    await expect(fila.getByText("Sin asignar").first()).toBeVisible();
  });

  test("filtra por título en el servidor", async ({ page, ticketsPage, ticketEscenario }) => {
    await ticketsPage.ir();

    const peticion = page.waitForRequest(
      (r) =>
        r.url().includes("/tickets/query") &&
        r.method() === "POST" &&
        (r.postData() ?? "").includes(ticketEscenario.titulo)
    );
    await ticketsPage.filtrarTitulo(ticketEscenario.titulo);
    await peticion;

    await expect(ticketsPage.fila(ticketEscenario.titulo)).toBeVisible();

    const coincidentes = await ticketEscenario.tickets.query({
      filters: { titulo: ticketEscenario.titulo },
    });
    expect(coincidentes.data.every((t) => t.titulo.includes(ticketEscenario.titulo))).toBe(true);
  });

  test("filtra por estado en el servidor", async ({ ticketsPage, ticketEscenario }) => {
    await ticketsPage.ir();
    await ticketsPage.filtrarTitulo(ticketEscenario.titulo);
    await expect(ticketsPage.fila(ticketEscenario.titulo)).toBeVisible();

    await ticketsPage.filtrarEstado("CERRADO");
    await expect(ticketsPage.sinResultados).toBeVisible();

    await ticketsPage.filtrarEstado("ABIERTO");
    await expect(ticketsPage.fila(ticketEscenario.titulo)).toBeVisible();
  });

  test("filtra por prioridad en el servidor", async ({ tickets, ticketsPage }) => {
    const titulo = nuevoTitulo("Prioridad");
    await tickets.crear({ titulo, descripcion: "Ticket con prioridad ALTA", priority: "ALTA" });

    await ticketsPage.ir();
    await ticketsPage.filtrarTitulo(titulo);
    await expect(ticketsPage.fila(titulo)).toBeVisible();

    await ticketsPage.filtrarPrioridad("URGENTE");
    await expect(ticketsPage.sinResultados).toBeVisible();

    await ticketsPage.filtrarPrioridad("ALTA");
    await expect(ticketsPage.fila(titulo)).toBeVisible();
  });

  test("pagina en el servidor", async ({ page, tickets, ticketsPage }) => {
    const token = `${E2E_PREFIX} ${RUN}-PAG`;
    for (let i = 0; i < 6; i += 1) {
      await tickets.crear({ titulo: `${token} ${i}`, descripcion: `Relleno de paginación ${i}` });
    }

    await ticketsPage.ir();
    await ticketsPage.filtrarTitulo(token);

    const filas = page.locator("table tbody tr");
    await expect(filas).toHaveCount(5);

    const peticionPagina2 = page.waitForRequest(
      (r) =>
        r.url().includes("/tickets/query") &&
        r.method() === "POST" &&
        (r.postData() ?? "").includes('"page":2')
    );
    await ticketsPage.pagina(2).click();
    await peticionPagina2;

    await expect(filas).toHaveCount(1);
  });

  test("muestra el vacío cuando no hay coincidencias", async ({ ticketsPage }) => {
    await ticketsPage.ir();
    await ticketsPage.filtrarTitulo(`SIN-COINCIDENCIA-${RUN}`);
    await expect(ticketsPage.sinResultados).toBeVisible();
  });
});

test.describe("Tickets — alta y edición", () => {
  test("crea un ticket y lo refleja en la API", async ({ page, tickets, ticketsPage }) => {
    const titulo = nuevoTitulo("Crear");
    const categoria = await tickets.crearCategoria(nuevoTitulo("Cat"));

    await ticketsPage.irNuevo();
    await ticketsPage.escribirTitulo(titulo);
    await ticketsPage.escribirDescripcion("Descripción creada desde la pantalla E2E");
    await ticketsPage.elegirCategoria(categoria.nombre);
    await ticketsPage.elegirPrioridad("Alta");
    await ticketsPage.guardar();

    await esperarToast(page, "Ticket creado correctamente");
    await page.waitForURL(/#\/tickets$/, { timeout: 15_000 });

    const creado = await tickets.buscarPorTitulo(titulo);
    expect(creado, "el ticket debió crearse").toBeTruthy();
    expect(creado!.status).toBe("ABIERTO");
    expect(creado!.priority).toBe("ALTA");
    expect(creado!.categoryId).toBe(categoria.id);
  });

  test("bloquea el guardado hasta que el título tiene 3 caracteres", async ({ ticketsPage }) => {
    await ticketsPage.irNuevo();

    const guardar = ticketsPage.botonGuardar;
    await expect(guardar).toBeDisabled();

    await ticketsPage.escribirTitulo("AB");
    await expect(guardar).toBeDisabled();

    await ticketsPage.escribirTitulo("ABC");
    await expect(guardar).toBeEnabled();
  });

  test("sin descripción la API rechaza y no queda ticket", async ({ page, tickets, ticketsPage }) => {
    const titulo = nuevoTitulo("SinDesc");

    await ticketsPage.irNuevo();
    await ticketsPage.escribirTitulo(titulo);
    await ticketsPage.guardar();

    await esperarToast(page, "Error al crear ticket");
    expect(await tickets.buscarPorTitulo(titulo)).toBeNull();
  });

  test("edita la prioridad de un ticket", async ({
    page,
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    await ticketsPage.irEditar(ticketEscenario.ticket.id);
    await expect(campo(page, "Título")).toHaveValue(ticketEscenario.titulo);

    await ticketsPage.elegirPrioridad("Alta");
    await ticketsPage.guardar();

    await esperarToast(page, "Ticket actualizado correctamente");
    await page.waitForURL(new RegExp(`#/tickets/${ticketEscenario.ticket.id}$`), {
      timeout: 15_000,
    });

    const actualizado = await tickets.esperarTicket(
      ticketEscenario.ticket.id,
      (t) => t.priority === "ALTA"
    );
    expect(actualizado.priority).toBe("ALTA");
  });
});

test.describe("Tickets — detalle", () => {
  test("abre el detalle desde la lista y agrega un comentario", async ({
    page,
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    // El botón "ver detalle" es icon-only y va primero en la celda de acciones.
    await ticketsPage.ir();
    await ticketsPage.filtrarTitulo(ticketEscenario.titulo);
    await ticketsPage.verDetalleDe(ticketEscenario.titulo).click();
    await page.waitForURL(new RegExp(`#/tickets/${ticketEscenario.ticket.id}$`), {
      timeout: 15_000,
    });

    const texto = `Comentario E2E ${RUN}`;
    await ticketsPage.comentar(texto);
    await esperarToast(page, "Comentario agregado");

    await expect(page.getByText(texto).first()).toBeVisible();
    const ticket = await tickets.esperarTicket(ticketEscenario.ticket.id, (t) =>
      t.comments.some((c) => c.texto === texto)
    );
    expect(ticket.comments.length).toBeGreaterThanOrEqual(1);
  });

  test("cambia el estado del ticket desde el panel de administración", async ({
    page,
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    await ticketsPage.irDetalle(ticketEscenario.ticket.id);

    await ticketsPage.cambiarEstadoTicket("EN_SEGUIMIENTO");
    await esperarToast(page, "Estado cambiado a En seguimiento");

    const ticket = await tickets.esperarTicket(
      ticketEscenario.ticket.id,
      (t) => t.status === "EN_SEGUIMIENTO"
    );
    expect(ticket.status).toBe("EN_SEGUIMIENTO");
  });

  test("finaliza el ticket: cierra, fecha y completa sus tareas", async ({
    page,
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    await ticketEscenario.asignarA(E2E.admin.username);

    await ticketsPage.irDetalle(ticketEscenario.ticket.id);
    await ticketsPage.finalizar();
    await esperarToast(page, "Estado cambiado a Cerrado");

    const cerrado = await tickets.esperarTicket(
      ticketEscenario.ticket.id,
      (t) => t.status === "CERRADO"
    );
    expect(cerrado.closedAt).toBeTruthy();
    expect(cerrado.assignments.length).toBe(1);
    expect(cerrado.assignments[0].status).toBe("COMPLETADA");
  });

  test("un ticket cerrado queda en solo lectura", async ({ page, ticketsPage, ticketEscenario }) => {
    await ticketEscenario.tickets.actualizar(ticketEscenario.ticket.id, { status: "CERRADO" });

    await ticketsPage.irDetalle(ticketEscenario.ticket.id);
    await expect(page.locator('select[name="status"]')).toBeDisabled();
    await expect(page.locator('textarea[name="comment"]')).toBeDisabled();
  });
});

test.describe("Tickets — borrado", () => {
  test("mueve a papelera desde la lista y desaparece", async ({
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    await ticketsPage.ir();
    await ticketsPage.filtrarTitulo(ticketEscenario.titulo);
    await expect(ticketsPage.fila(ticketEscenario.titulo)).toBeVisible();

    await ticketsPage.borrarDeFila(ticketEscenario.titulo).click();
    await ticketsPage.confirmarDialogo("Mover a papelera");

    await expect(ticketsPage.sinResultados).toBeVisible();
    const borrado = await tickets.obtener(ticketEscenario.ticket.id);
    expect(borrado.deletedAt).toBeTruthy();
  });

  test("elimina definitivamente desde el detalle de un ticket en papelera", async ({
    page,
    tickets,
    ticketsPage,
    ticketEscenario,
  }) => {
    // Primera eliminación por API (soft): deja el ticket en papelera.
    const soft = await tickets.borrar(ticketEscenario.ticket.id);
    expect(soft.soft).toBe(true);

    await ticketsPage.irDetalle(ticketEscenario.ticket.id);
    await page.locator('button[title="Eliminar definitivamente"]').click();
    await ticketsPage.confirmarDialogo("Eliminar definitivamente");

    await page.waitForURL(/#\/tickets$/, { timeout: 15_000 });
    expect(await tickets.obtenerOpcional(ticketEscenario.ticket.id)).toBeNull();
  });
});

test.describe("Categorías de ticket", () => {
  test("crea, desactiva y elimina definitivamente una categoría", async ({ tickets, ticketsPage }) => {
    const nombre = nuevoTitulo("Cat");

    await ticketsPage.irCatalogos();
    await ticketsPage.abrirTabCategorias();
    await ticketsPage.crearCategoria(nombre);

    const fila = ticketsPage.filaCatalogo(nombre);
    await expect(fila).toBeVisible();
    await expect(fila.getByText("Activo").first()).toBeVisible();

    await ticketsPage.desactivarCategoria(nombre);
    await expect(fila.getByText("Inactivo").first()).toBeVisible();

    await ticketsPage.eliminarCategoriaDefinitivo(nombre);
    await expect(ticketsPage.filaCatalogo(nombre)).toHaveCount(0);

    const categorias = await tickets.categorias(true);
    expect(categorias.some((c) => c.nombre === nombre)).toBe(false);
  });
});

test.describe("Tickets — gate por rol (EMPLEADO)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("un empleado no accede a la edición de tickets", async ({ page, login, ticketEscenario }) => {
    await login.entrarComo(E2E.empleado.username);
    await page.goto(ruta(`/tickets/${ticketEscenario.ticket.id}/editar`));

    await page.waitForURL(/#\/tickets$/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(new RegExp(`/tickets/${ticketEscenario.ticket.id}/editar`));
  });

  test("un empleado no ve el botón de borrar en la lista", async ({
    login,
    ticketsPage,
    ticketEscenario,
  }) => {
    await ticketEscenario.asignarA(E2E.empleado.username);

    await login.entrarComo(E2E.empleado.username);
    await ticketsPage.ir();
    await ticketsPage.filtrarTitulo(ticketEscenario.titulo);

    const fila = ticketsPage.fila(ticketEscenario.titulo);
    await expect(fila).toBeVisible();
    await expect(fila.locator("button[title]")).toHaveCount(0);
  });

  test("un empleado no accede a los catálogos", async ({ page, login }) => {
    await login.entrarComo(E2E.empleado.username);
    await page.goto(ruta("/catalogos"));

    await expect(page).not.toHaveURL(/#\/catalogos/);
  });
});
