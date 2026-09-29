import type { APIRequestContext, Page } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { E2E_PREFIX, newRunId, route } from "./support/env";

/**
 * Pantallas del almacén de cocina F1/F2 por navegador: artículos (alta),
 * entradas, consumos/mermas (con reparto FEFO), kardex, conteo físico y
 * catálogos. Los datos se siembran por API; la acción que se prueba es la de la
 * pantalla.
 */
const RUN = newRunId();
const day = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

let api: APIRequestContext;
let unitCode: string;
let unitName: string;
let categoryName: string;
let itemInName: string;
let itemInCode: string;
let itemInId: string;
let itemOutName: string;
let itemOutCode: string;
let itemOutLot: string;
let itemOutId: string;
let itemCountId: string;
let itemCountLot: string;

const call = async <T>(method: "post" | "patch", path: string, data?: unknown): Promise<T> => {
  const res = method === "post" ? await api.post(path, { data }) : await api.patch(path, { data });
  const body = (await res.json().catch(() => null)) as T;
  if (res.status() >= 400) throw new Error(`${method} ${path} → ${res.status()}: ${JSON.stringify(body)}`);
  return body;
};

/** Elige una opción de un `ITSearchSelect`/`ITSelect` por el `name` del input. */
const pick = async (page: Page, inputName: string, label: string): Promise<void> => {
  await page.locator(`input[name="${inputName}"]`).click();
  await page.getByText(label, { exact: true }).last().click();
};

test.describe("Almacén de cocina — pantallas F1/F2", () => {
  test.beforeAll(async ({ ctxApi }) => {
    api = ctxApi;
    const unit = await call<{ id: string; code: string; name: string }>("post", "kitchen/units", {
      code: `${E2E_PREFIX}S${RUN.slice(-6)}`,
      name: `Unidad stock E2E ${RUN}`,
    });
    unitCode = unit.code;
    unitName = unit.name;
    const category = await call<{ id: string; name: string }>("post", "kitchen/categories", { name: `${E2E_PREFIX} Stock ${RUN}` });
    categoryName = category.name;
    const supplier = await call<{ id: string }>("post", "kitchen/suppliers", { name: `${E2E_PREFIX} Stock Prov ${RUN}` });

    // Artículo sin existencias: se usa para el alta desde la pantalla y la entrada.
    itemInName = `Insumo entrada ${RUN}`;
    itemInCode = `${E2E_PREFIX}-${RUN}-IN`;
    const itemIn = await call<{ id: string }>("post", "kitchen/items", {
      code: itemInCode,
      name: itemInName,
      categoryId: category.id,
      kind: "CONSUMABLE",
      unitId: unit.id,
      tracksExpiry: false,
      minStock: 0,
    });
    itemInId = itemIn.id;

    // Artículo con existencia y lote: consumos y conteo.
    itemOutName = `Insumo salida ${RUN}`;
    itemOutCode = `${E2E_PREFIX}-${RUN}-OUT`;
    itemOutLot = `${E2E_PREFIX}-LOTOUT-${RUN}`;
    const itemOut = await call<{ id: string }>("post", "kitchen/items", {
      code: itemOutCode,
      name: itemOutName,
      categoryId: category.id,
      kind: "CONSUMABLE",
      unitId: unit.id,
      tracksExpiry: true,
      minStock: 0,
    });
    itemOutId = itemOut.id;
    await call("post", "kitchen/movements/stock-in", {
      supplierId: supplier.id,
      lines: [{ itemId: itemOutId, quantity: 10, lotCode: itemOutLot, expiresAt: day(120) }],
    });

    // El conteo se captura por LOTE; guardamos el id del lote.
    const outDetail = (await (await api.get(`kitchen/items/${itemOutId}`)).json()) as { lots: Array<{ id: string }> };
    itemCountId = outDetail.lots[0].id;
    itemCountLot = itemOutLot;
  });

  test("Artículos: el alta desde el diálogo guarda y aparece en la tabla", async ({ page }) => {
    await page.goto(route("/kitchen/items"));
    await expect(page.getByRole("heading", { name: "Artículos", level: 1 })).toBeVisible();

    const uiName = `Insumo UI ${RUN}`;
    const uiCode = `${E2E_PREFIX}-${RUN}-UI`;
    await page.getByRole("button", { name: "Nuevo artículo" }).click();
    await page.locator('input[name="kitchenItemCode"]').fill(uiCode);
    await page.locator('input[name="kitchenItemName"]').fill(uiName);
    await page.locator('select[name="kitchenItemCategory"]').selectOption({ label: categoryName });
    await page.locator('select[name="kitchenItemUnit"]').selectOption({ label: `${unitName} (${unitCode})` });
    await page.getByRole("button", { name: "Guardar", exact: true }).click();

    await expect(page.getByText("Artículo guardado")).toBeVisible();
    await page.locator('input[name="filter-code"]').fill(uiCode);
    await expect(page.locator("table").getByText(uiName)).toBeVisible();
  });

  test("Entradas: agrega un renglón y registra la entrada", async ({ page }) => {
    await page.goto(route("/kitchen/stock-in"));
    await expect(page.getByRole("heading", { name: "Entradas", level: 1 })).toBeVisible();

    await pick(page, "draftItem", `${itemInCode} · ${itemInName}`);
    await page.locator('input[name="draftQty"]').fill("4");
    await page.getByRole("button", { name: "Agregar a la entrada" }).click();
    await page.getByRole("button", { name: "Registrar entrada" }).click();

    await expect(page).toHaveURL(/#\/kitchen\/movements/, { timeout: 15_000 });

    // Verificación cruzada: la entrada sumó la existencia.
    const detail = (await (await api.get(`kitchen/items/${itemInId}`)).json()) as { available: number };
    expect(detail.available).toBe(4);
  });

  test("Consumos y mermas: previsualiza el reparto FEFO y registra la salida", async ({ page }) => {
    await page.goto(route("/kitchen/stock-out"));
    await expect(page.getByRole("heading", { name: "Consumos y mermas", level: 1 })).toBeVisible();

    await pick(page, "outDraftItem", `${itemOutCode} · ${itemOutName}`);
    await page.locator('input[name="outDraftQty"]').fill("3");
    await page.getByRole("button", { name: "Agregar a la salida" }).click();

    // La vista previa FEFO muestra el lote exacto antes de confirmar.
    await expect(page.getByText(itemOutLot)).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Registrar salida" }).click();

    await expect(page).toHaveURL(/#\/kitchen\/movements/, { timeout: 15_000 });

    // Verificación cruzada: el consumo descontó el lote (10 − 3 = 7).
    const detail = (await (await api.get(`kitchen/items/${itemOutId}`)).json()) as { available: number };
    expect(detail.available).toBe(7);
  });

  test("Kardex: lista los movimientos del almacén", async ({ page }) => {
    await page.goto(route("/kitchen/movements"));
    await expect(page.getByRole("heading", { name: "Kardex", level: 1 })).toBeVisible();
    // Filtra por artículo y tipo (STOCK_IN = entrada) y verifica que aparezca.
    await page.locator('input[name="filter-item"]').fill(itemOutName);
    await page.locator('select[name="filter-type"]').selectOption("STOCK_IN");
    await expect(page.locator("table").getByText(itemOutName).first()).toBeVisible();
  });

  test("Conteo físico: registra la diferencia", async ({ page }) => {
    await page.goto(route("/kitchen/count"));
    await expect(page.getByRole("heading", { name: "Conteo físico", level: 1 })).toBeVisible();

    // El lote con saldo aparece con su saldo en sistema; se captura 7.
    await expect(page.getByText(itemCountLot).first()).toBeVisible({ timeout: 10_000 });
    const input = page.locator(`input[name="count-${itemCountId}"]`);
    await expect(input).toBeVisible();
    // El sistema tiene 7 (tras el consumo); se captura 5 → ajuste de −2.
    await input.fill("5");
    await page.getByRole("button", { name: "Registrar conteo" }).click();

    await expect(page).toHaveURL(/#\/kitchen\/movements/, { timeout: 15_000 });

    const detail = (await (await api.get(`kitchen/items/${itemOutId}`)).json()) as { available: number };
    expect(detail.available).toBe(5);
  });

  test("Catálogos: crea una categoría", async ({ page }) => {
    await page.goto(route("/kitchen/catalog"));
    await expect(page.getByRole("heading", { name: "Catálogos de cocina", level: 1 })).toBeVisible();

    const newCategory = `${E2E_PREFIX} Cat UI ${RUN}`;
    await page.getByRole("button", { name: "Nueva categoría" }).click();
    await page.locator('input[name="kitchenCategoryName"]').fill(newCategory);
    await page.getByRole("button", { name: "Guardar", exact: true }).click();

    await expect(page.getByText("Guardado")).toBeVisible();
    await expect(page.getByText(newCategory, { exact: true })).toBeVisible();
  });
});
