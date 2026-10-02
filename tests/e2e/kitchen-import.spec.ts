import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { API_ROOT, E2E_PREFIX, newRunId, route } from "./support/env";
import { goToRoute } from "./support/pages/components";

/**
 * CARGA MASIVA DEL INVENTARIO DE COCINA por pantalla.
 *
 * El flujo es subir → revisar → confirmar. Lo que se prueba aquí es lo que la
 * pantalla aporta: que la previsualización diga exactamente qué va a pasar
 * (incluidos los artículos que ya existen, con su existencia actual), que la
 * decisión «sumar» o «poner esa cantidad» cambie la previsualización, y que la
 * confirmación deje la bodega cuadrada —verificado contra la API, no contra la
 * pantalla—.
 *
 * El archivo .xlsx se arma con el lector de Excel del paquete `api/`: es el dueño
 * del formato de la carga (esta suite no tiene escritor de Excel y no vale la
 * pena tener dos).
 */
const RUN = newRunId();
const CODE = (name: string) => `${E2E_PREFIX}-${name}-${RUN}`.toUpperCase();
const NAMED = (kind: string) => `${E2E_PREFIX} ${kind} ${RUN}`;

type XlsxModule = {
  utils: {
    aoa_to_sheet: (rows: unknown[][]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (book: unknown, sheet: unknown, name: string) => void;
  };
  write: (book: unknown, options: { type: "buffer"; bookType: "xlsx" }) => Buffer;
};
const apiRequire = createRequire(path.join(API_ROOT, "package.json"));
const XLSX = apiRequire("xlsx") as XlsxModule;

const HEADERS = [
  "CÓDIGO",
  "ARTÍCULO",
  "CATEGORÍA",
  "UNIDAD",
  "CANTIDAD",
  "CADUCIDAD",
  "LOTE",
  "COSTO",
  "MÍNIMO",
  "MÁXIMO",
  "TIPO",
  "ALMACÉN",
  "PERECEDERO",
  "IVA",
];

/** Escribe un .xlsx temporal (una sola hoja) y regresa su ruta. */
const writeWorkbook = (name: string, rows: unknown[][]): string => {
  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Artículos");
  const file = path.join(os.tmpdir(), `${name}-${RUN}.xlsx`);
  fs.writeFileSync(file, XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
  return file;
};

let api: APIRequestContext;

/** Llamada a la API que falla ruidosamente: es la verificación, no el objeto de prueba. */
const call = async <T>(method: "post" | "get", url: string, data?: unknown): Promise<T> => {
  const res = method === "post" ? await api.post(url, { data }) : await api.get(url);
  const body = (await res.json().catch(() => null)) as T;
  if (res.status() >= 400) throw new Error(`${method} ${url} → ${res.status()}: ${JSON.stringify(body)}`);
  return body;
};

interface ItemRow {
  id: string;
  code: string;
  name: string;
  available: number;
}

const itemByCode = async (code: string): Promise<ItemRow | null> => {
  const table = await call<{ data: ItemRow[]; total: number }>("post", "kitchen/items/table", {
    page: 1,
    limit: 10,
    filters: { code },
  });
  return table.data[0] ?? null;
};

test.describe("Almacén de cocina — carga masiva desde Excel", () => {
  test.beforeAll(async ({ ctxApi }) => {
    api = ctxApi;
  });

  test("carga el inventario desde cero y lo verifica contra la API", async ({ page }) => {
    const category = NAMED("LÁCTEOS");
    const unit = NAMED("GARRAFA");
    const perishableCode = CODE("LECHE");
    const durableCode = CODE("PLATO");
    const file = writeWorkbook("cocina-cero", [
      [perishableCode, "LECHE ENTERA 1 L", category, unit, 24, "2026-12-20", "", 22.5, 10, 40, "CONSUMIBLE", "REFRIGERADO", "SÍ", "16"],
      [durableCode, "PLATO LLANO", category, "PIEZA", 120, "", "", 45, 24, 200, "DURADERO", "SECO", "NO", ""],
    ]);

    // Se llega por el botón de Artículos, no sólo por la URL.
    await goToRoute(page, "/kitchen/items");
    await page.getByRole("button", { name: "Cargar Excel" }).click();
    await page.waitForURL(`**${route("/kitchen/items/import")}`);
    await expect(page.getByRole("heading", { name: "Carga masiva del inventario" })).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(file);

    // Paso 2: la previsualización dice lo que va a pasar y avisa del catálogo nuevo.
    await expect(page.getByText("Lo que va a pasar")).toBeVisible();
    await expect(page.getByText("LECHE ENTERA 1 L")).toBeVisible();
    await expect(page.getByText("PLATO LLANO")).toBeVisible();
    await expect(page.getByText(/Se van a crear catálogos nuevos/)).toBeVisible();
    await expect(page.locator("tbody").getByText("Artículo nuevo").first()).toBeVisible();
    // Todavía no existe nada en la base.
    expect(await itemByCode(perishableCode)).toBeNull();

    await page.getByRole("button", { name: /Cargar 2 fila/ }).click();

    // Paso 3: el resultado y la verificación real.
    await expect(page.getByText("Carga registrada")).toBeVisible();
    await expect(page.getByText(/2 artículo\(s\) creado\(s\)/)).toBeVisible();

    const milk = await itemByCode(perishableCode);
    expect(milk?.available).toBe(24);
    const plate = await itemByCode(durableCode);
    expect(plate?.available).toBe(120);

    const detail = await call<{ lots: Array<{ onHand: number }> }>("get", `kitchen/items/${milk!.id}`);
    expect(detail.lots).toHaveLength(1);
    expect(detail.lots[0].onHand).toBe(24);
  });

  test("con artículos existentes se elige sumar o poner esa cantidad", async ({ page }) => {
    const category = NAMED("CARNES");
    const code = CODE("POLLO");

    // Un artículo con 10 kg ya en la bodega.
    const created = await call<{ id: string }>("post", "kitchen/items", {
      code,
      name: "PECHUGA DE POLLO",
      categoryId: (await call<{ id: string }>("post", "kitchen/categories", { name: category })).id,
      unitId: (await call<Array<{ id: string; code: string }>>("get", "kitchen/units")).find((u) => u.code === "KG")!.id,
      kind: "CONSUMABLE",
      storage: "FROZEN",
      tracksExpiry: true,
      minStock: 5,
      maxStock: 30,
    });
    await call("post", "kitchen/movements/stock-in", {
      lines: [{ itemId: created.id, quantity: 10, expiresAt: "2026-11-30" }],
    });

    // El archivo dice que en realidad hay 6: con "poner esa cantidad" baja a 6.
    const file = writeWorkbook("cocina-existente", [
      [code, "PECHUGA DE POLLO", category, "KILOGRAMO", 6, "", "", 95, 5, 30, "CONSUMIBLE", "CONGELADO", "NO", "0"],
    ]);

    await goToRoute(page, "/kitchen/items/import");
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.getByText("Artículos que ya existen en la bodega")).toBeVisible();
    // Por defecto suma: 10 + 6.
    await expect(page.locator("tbody").getByText("Suma existencia")).toBeVisible();
    await expect(page.getByText("hoy 10")).toBeVisible();

    // Al elegir "poner esa cantidad" la previsualización se vuelve a resolver.
    await page.getByRole("button", { name: /Poner esa cantidad/ }).click();
    await expect(page.locator("tbody").getByText("Baja a la cantidad")).toBeVisible();
    await expect(page.getByText("hoy 10")).toBeVisible();

    await page.getByRole("button", { name: /Cargar 1 fila/ }).click();
    await expect(page.getByText("Carga registrada")).toBeVisible();

    // La bodega quedó exactamente en lo que decía el archivo.
    expect((await itemByCode(code))?.available).toBe(6);
  });

  test("descarga la plantilla y rechaza un archivo con errores", async ({ page }) => {
    await goToRoute(page, "/kitchen/items/import");

    const download = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Descargar plantilla" }).click(),
    ]).then(([dl]) => dl);
    expect(download.suggestedFilename()).toBe("plantilla-inventario-cocina.xlsx");

    // Un archivo con errores no se puede confirmar y no escribe nada.
    const bad = writeWorkbook("cocina-malo", [
      [CODE("SINCADUCIDAD"), "QUESO", NAMED("ERRORES"), "KILOGRAMO", 5, "", "", 10, 0, 0, "CONSUMIBLE", "REFRIGERADO", "SÍ", ""],
    ]);
    await page.locator('input[type="file"]').setInputFiles(bad);

    await expect(page.getByText("El artículo es perecedero y le falta la caducidad")).toBeVisible();
    await expect(page.getByText(/El archivo tiene 1 fila\(s\) con errores/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Cargar/ })).toBeDisabled();
    expect(await itemByCode(CODE("SINCADUCIDAD"))).toBeNull();
  });
});
