import { execFileSync } from "node:child_process";
import { test, expect } from "./support/fixtures";
import { API_ROOT, newRunId } from "./support/env";
import { goToRoute } from "./support/pages/components";

/**
 * Timeline de sincronización de un reloj: el botón de info de cada reloj en la
 * pantalla de Reloj checador (`/hr/time-clock`). Es el caso de soporte: "falló →
 * reintentó → conectó → volvió a fallar", con el motivo tal cual.
 *
 * El reloj y sus intentos se siembran desde el CLI de `api/` (es el dueño de la
 * base: los intentos los crea la sincronización real, que aquí no se dispara),
 * igual que el tiempo extra.
 */
const RUN = newRunId();
const CAIDA = "connect ECONNREFUSED 127.0.0.1:9";

const runCli = (action: string): string =>
  execFileSync("npx", ["ts-node", "tests/e2e/support/cli.ts", action, RUN], {
    cwd: API_ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });

let reloj: { serial: string; name: string };

test.beforeAll(() => {
  const salida = runCli("seed-clock-timeline");
  const linea = salida.split("\n").find((l) => l.startsWith("__E2E_SEED__"));
  if (!linea) throw new Error(`No se pudo sembrar el timeline:\n${salida}`);
  reloj = JSON.parse(linea.replace("__E2E_SEED__", "")) as { serial: string; name: string };
});

test.afterAll(() => {
  runCli("clean-clock-timeline");
});

test.describe("Reloj checador — historial de sincronización", () => {
  test("el reloj muestra su último intento y el botón de info abre el timeline", async ({ page }) => {
    await goToRoute(page, "/hr/time-clock");

    // El card del reloj toma el último intento guardado: estado "Con error" y su motivo.
    await expect(page.getByText(reloj.name).first()).toBeVisible(); // también sale en el filtro de reloj
    await expect(page.getByText("Con error").first()).toBeVisible();
    await expect(page.getByText(CAIDA).first()).toBeVisible();

    await page.getByRole("button", { name: "Ver historial de sincronización" }).first().click();

    // El diálogo: tres intentos (el más reciente primero) con su resumen.
    await expect(page.getByText(`Historial de ${reloj.name}`)).toBeVisible();
    await expect(page.getByText("Fallos seguidos")).toBeVisible();
    await expect(page.getByText("Falló").first()).toBeVisible();
    await expect(page.getByText("Conectó").first()).toBeVisible();
    await expect(page.getByText("7 checadas nuevas de 24 eventos revisados")).toBeVisible();
    await expect(page.getByText("Último error")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByText(`Historial de ${reloj.name}`)).toBeHidden();
  });
});
