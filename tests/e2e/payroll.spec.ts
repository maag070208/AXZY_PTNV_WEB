import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { route } from "./support/env";
import { createContextApi } from "./support/api";

/**
 * Pantalla PRE NÓMINA (`/schedules/payroll`, grupo Recursos Humanos).
 *
 * La maqueta del cierre: píldora de la semana en el encabezado, los pasos del
 * cierre, las cifras de la semana, la tabla por departamento ("Ver detalle"
 * abre las personas del departamento en un modal, donde se marca el
 * departamento como revisado) y el pie con las exportaciones y el botón de
 * cierre (se habilita cuando todos los departamentos están revisados).
 *
 * La revisión y el cierre se guardan en el API (`/schedules/payroll/*`): el
 * spec deja la semana vigente como la encontró (reabierta y sin revisiones).
 */

interface ReviewState {
  closed: boolean;
  reviews: { departmentId: string | null }[];
}

/** Primer día de la semana vigente, según el reporte del API. */
const weekStartOf = async (api: APIRequestContext): Promise<string> => {
  const today = new Date().toISOString().slice(0, 10);
  const reportRes = await api.post("schedules/weekly-attendance", { data: { date: today } });
  return ((await reportRes.json()) as { range: { days: string[] } }).range.days[0];
};

/** Resetea la revisión/cierre de la semana vigente por el API (determinismo). */
const resetCurrentWeek = async () => {
  const api = await createContextApi();
  try {
    const weekStart = await weekStartOf(api);

    const stateRes = await api.get(`schedules/payroll/review-state?weekStart=${weekStart}`);
    const state = (await stateRes.json()) as ReviewState;

    if (state.closed) {
      await api.post("schedules/payroll/reopen", { data: { weekStart } });
    }
    for (const review of state.reviews) {
      await api.put("schedules/payroll/reviews", {
        data: { weekStart, departmentId: review.departmentId, reviewed: false },
      });
    }
  } finally {
    await api.dispose();
  }
};

test.describe("Nómina (pantalla)", () => {
  test.beforeEach(async () => {
    await resetCurrentWeek();
  });

  test("se monta en Recursos Humanos y muestra su panel", async ({ page }) => {
    await page.goto(route("/schedules/payroll"));

    // Título de la pantalla y ubicación en Recursos Humanos (breadcrumb).
    await expect(page.getByRole("heading", { name: "Nómina", level: 1 })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: /Breadcrumb|Ruta de navegación/ }).getByRole("button", { name: "Recursos Humanos" })
    ).toBeVisible();

    // La píldora de la semana con sus flechas.
    await expect(page.getByText(/Semana .+/).first()).toBeVisible();
    await expect(page.getByTitle("Semana anterior")).toBeVisible();
    await expect(page.getByTitle("Semana siguiente")).toBeVisible();

    // Los pasos del cierre y las cifras de la semana (cargan con el reporte).
    await expect(page.getByText("Revisar departamentos")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Personas con checadas")).toBeVisible();
    await expect(page.getByText("Horas extra aprobadas")).toBeVisible();

    // La tabla por departamento, toda por revisar.
    await expect(page.getByRole("columnheader", { name: "Departamento" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Horas extra" })).toBeVisible();
    await expect(page.getByText("Revisado", { exact: true })).toHaveCount(0);

    // "Ver detalle" abre el modal con las personas del departamento y el
    // botón para marcarlo como revisado; al marcarlo se cierra el modal y el
    // renglón pasa a "Revisado".
    await page.getByRole("button", { name: "Ver detalle" }).first().click();
    await expect(page.getByRole("columnheader", { name: "Empleado" })).toBeVisible();
    await page.getByRole("button", { name: "Marcar como revisado" }).click();
    await expect(page.getByText("Revisado", { exact: true })).toHaveCount(1);
    // El badge dice quién y cómo revisó (una por una).
    await expect(page.locator('[title*="Revisado por E2E Admin"][title*="una por una"]')).toHaveCount(1);

    // El pie: exportaciones y el cierre, que sigue deshabilitado mientras
    // falten departamentos por revisar.
    await expect(page.getByRole("button", { name: /Exportar PDF/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Exportar Excel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cerrar pre-nómina/i })).toBeDisabled();

    // "Marcar todo como revisado" pide confirmación y marca toda la tabla.
    await page.getByRole("button", { name: "Marcar todo como revisado" }).click();
    await expect(page.getByText("¿Marcar todos como revisados?")).toBeVisible();
    await page.getByRole("button", { name: "Sí, marcar todo" }).click();

    // Con todo revisado el cierre se habilita; al cerrar, el pie ofrece
    // reabrir y dice quién cerró la semana.
    await expect(page.getByRole("button", { name: /Cerrar pre-nómina/i })).toBeEnabled();
    await page.getByRole("button", { name: /Cerrar pre-nómina/i }).click();
    await expect(page.getByRole("button", { name: "Reabrir" })).toBeVisible();
    await expect(page.getByText(/Pre-nómina cerrada por E2E Admin/)).toBeVisible();

    // La fotografía guardada en el API incluye el detalle por persona.
    const api = await createContextApi();
    try {
      const weekStart = await weekStartOf(api);
      const stateRes = await api.get(`schedules/payroll/review-state?weekStart=${weekStart}`);
      const state = (await stateRes.json()) as {
        closure: { snapshot: { people?: unknown[]; departments?: unknown[] } | null };
      };
      expect(state.closure.snapshot?.departments?.length ?? 0).toBeGreaterThan(0);
      expect(state.closure.snapshot?.people?.length ?? 0).toBeGreaterThan(0);
    } finally {
      await api.dispose();
    }

    // La pestaña de historial lista la semana recién cerrada, y su renglón
    // abre la fotografía por departamento en un modal.
    await page.getByRole("tab", { name: "Historial de cierres" }).click();
    await expect(page.getByRole("columnheader", { name: "Cerrada por" })).toBeVisible();
    await expect(page.getByText("E2E Admin").first()).toBeVisible();
    await expect(page.getByText("Cerrada", { exact: true }).first()).toBeVisible();

    // Los botones del renglón descargan sin abrir el modal.
    const row = page.getByRole("row").filter({ hasText: "E2E Admin" }).first();
    const rowCsvPromise = page.waitForEvent("download");
    await row.getByRole("button", { name: /Exportar Excel/i }).click();
    expect((await rowCsvPromise).suggestedFilename()).toMatch(/_cierre_.+\.csv$/);
    const rowPdfPromise = page.waitForEvent("download");
    await row.getByRole("button", { name: /Exportar PDF/i }).click();
    expect((await rowPdfPromise).suggestedFilename()).toMatch(/_cierre_.+\.pdf$/);

    await row.click();
    await expect(page.getByRole("columnheader", { name: "Horas normales" })).toBeVisible();
    await expect(page.getByText(/Cerrada por E2E Admin/)).toBeVisible();

    // El cierre se descarga con las cifras de la fotografía (CSV y PDF). El
    // modal va por portal al final del DOM: `.last()` es su botón (el del
    // renglón queda antes y tiene el mismo nombre accesible).
    const csvPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Exportar Excel/i }).last().click();
    expect((await csvPromise).suggestedFilename()).toMatch(/_cierre_.+\.csv$/);
    const pdfPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Exportar PDF/i }).last().click();
    expect((await pdfPromise).suggestedFilename()).toMatch(/_cierre_.+\.pdf$/);
    await page.keyboard.press("Escape");
  });
});
