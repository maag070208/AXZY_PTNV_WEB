import { test, expect } from "./support/fixtures";
import { E2E_PREFIX, newRunId } from "./support/env";
import { createContextApi } from "./support/api";
import { goToRoute, selectInSearch } from "./support/pages/components";
import type { APIRequestContext } from "@playwright/test";

/**
 * Flujos que hace **Langostín desde su panel** (sin salir de la pantalla y sin
 * modales): alta de ticket, alta de acta administrativa y alta de horario.
 *
 * Se prueba la pantalla; lo creado se borra por API al terminar para no dejar
 * basura en la base real. Todos los nombres llevan el prefijo `E2E`.
 */

const RUN = newRunId();

/** Toca el globo de oferta del bot (p. ej. «Nuevo ticket»). */
const useOffer = async (page: import("@playwright/test").Page, label: string) => {
  await page.getByRole("button", { name: label, exact: true }).first().click();
  return page.locator('[role="dialog"]');
};

test.describe("Langostín crea un ticket desde el panel", () => {
  test("sin formulario aparte: el panel lo arma y la lista se actualiza", async ({ page, tickets }) => {
    // Foto de los últimos tickets: lo que aparezca y no esté aquí es el del bot.
    const before = await tickets.query({ page: 1, limit: 20 });
    const beforeIds = new Set(before.data.map((t) => t.id));

    await goToRoute(page, "/tickets");
    const panel = await useOffer(page, "Nuevo ticket");

    // Participa el flujo completo del agente: categoría, síntoma, área (se
    // omite), urgencia, evidencia (se omite) y nota (se omite).
    await panel.getByRole("button", { name: /Mantenimiento|Red|Equipo|Otro|Impresora|Audio/i }).first().click();
    await panel.getByRole("button", { name: /No funciona|No enciende|Lento|Otro problema|No imprime|Ruido|Sin internet/i }).first().click();
    await panel.getByRole("button", { name: "Omitir" }).first().click();
    await panel.getByRole("button", { name: /Baja|Media|Alta|Urgente/ }).first().click();
    await panel.getByRole("button", { name: "No tengo evidencia" }).first().click();
    await panel.getByRole("button", { name: "Sin nota" }).first().click();
    // Último paso (ADMIN): ¿el ticket es a nombre de otra persona?
    await panel.getByRole("button", { name: "No, es mío" }).first().click();

    // El bot avisa y cierra su panel; seguimos en la misma pantalla.
    await expect(page.locator('[role="dialog"]')).toHaveCount(0, { timeout: 30_000 });
    await expect(page).toHaveURL(/#\/tickets$/);

    // Y el alta está en la API (la tabla se recarga con el aviso del bot).
    await expect
      .poll(async () => (await tickets.query({ page: 1, limit: 20 })).data.filter((t) => !beforeIds.has(t.id)).length, {
        timeout: 20_000,
      })
      .toBe(1);

    // Limpieza: solo el ticket que no existía antes de la prueba.
    const after = await tickets.query({ page: 1, limit: 20 });
    for (const ticket of after.data) {
      if (!beforeIds.has(ticket.id)) await tickets.remove(ticket.id);
    }
  });
});

test.describe("Langostín levanta un acta desde el panel", () => {
  test("pregunta persona, motivo, fecha y hechos, y la deja registrada", async ({ page }) => {
    const ctx: APIRequestContext = await createContextApi();
    const before = (await (await ctx.post("hr/disciplinary-reports/query", {
      data: { page: 1, limit: 1, filters: {}, sort: {} },
    })).json()) as { total: number };

    await goToRoute(page, "/employees/disciplinary-reports");
    const panel = await useOffer(page, "Nueva acta aquí");

    // Persona: buscador del paso 1.
    await selectInSearch(panel, "Busca por nombre o número de empleado…", "E2E");

    // Motivo (primer chip del catálogo), fecha (Continuar con hoy), hechos y sin sanción.
    await panel.getByRole("button", { name: /Inasistencia|Retardo|Conducta|Otro/ }).first().click();
    await panel.getByRole("button", { name: "Continuar" }).first().click();
    await panel.locator("textarea").last().fill(`Acta E2E ${RUN}: prueba automatizada del bot.`);
    await panel.getByRole("button", { name: "Continuar" }).first().click();
    await panel.getByRole("button", { name: "Sin sanción por ahora" }).first().click();

    await expect(panel.getByText(/el acta quedó registrada|Listo/i)).toBeVisible({ timeout: 30_000 });

    const after = (await (await ctx.post("hr/disciplinary-reports/query", {
      data: { page: 1, limit: 1, filters: {}, sort: {} },
    })).json()) as { total: number };
    expect(after.total).toBe(before.total + 1);

    // Limpieza del acta creada.
    const list = (await (await ctx.post("hr/disciplinary-reports/query", {
      data: { page: 1, limit: 5, filters: {}, sort: { key: "createdAt", direction: "desc" } },
    })).json()) as { data: Array<{ id: string; description: string }> };
    for (const row of list.data) {
      if (row.description.includes(`Acta E2E ${RUN}`)) {
        await ctx.delete(`hr/disciplinary-reports/${row.id}`);
      }
    }
    await ctx.dispose();
  });
});

test.describe("Langostín crea un horario desde el panel", () => {
  test("arma el horario en el chat y la tabla lo muestra", async ({ page }) => {
    const ctx: APIRequestContext = await createContextApi();
    const name = `E2E ${RUN} Horario bot`;

    await goToRoute(page, "/schedules");
    const panel = await useOffer(page, "Crear horario");

    await panel.getByPlaceholder(/Recepción mañana|Ej\./).fill(name);
    await panel.getByRole("button", { name: "Siguiente" }).click();
    await panel.getByRole("button", { name: "Lunes a viernes" }).click();
    await panel.getByRole("button", { name: "09:00 – 18:00" }).click();
    await panel.getByRole("button", { name: "No, corrido" }).click();
    await panel.getByRole("button", { name: "Usar estos" }).first().click();
    await panel.getByRole("button", { name: "Guardar" }).first().click();

    await expect(panel.getByText(/el horario quedó creado|Listo/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 });

    // Limpieza del horario creado.
    const list = (await (await ctx.get("schedules?includeInactive=true")).json()) as Array<{ id: string; name: string }>;
    for (const schedule of list) {
      if (schedule.name === name) await ctx.delete(`schedules/${schedule.id}`);
    }
    await ctx.dispose();
  });
});
