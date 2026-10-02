import fs from "node:fs";
import type { APIRequestContext, Page } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { E2E_PREFIX, newRunId, route } from "./support/env";

/**
 * Pantallas de la Fase 1 de compras de cocina (NEXT_STEPS_PLAN):
 *  - Enviar la OC al proveedor (diálogo + PDF adjunto),
 *  - IVA por renglón al registrar la factura,
 *  - Centros de costo (catálogo, formulario de OC y reporte de gasto).
 *
 * El escenario se siembra por API; lo que se prueba es la pantalla. La petición
 * de `send-email` se intercepta con `page.route` para no depender de S3.
 */
const RUN = newRunId();
const TAX16 = "tax_rate_iva_16";
const TAX8 = "tax_rate_iva_8";

let api: APIRequestContext;
let unitId: string;
let categoryId: string;
let supplierId: string;
let supplierEmail: string;
let supplierName: string;
let supplierNoEmailId: string;
let supplierNoEmailName: string;
let itemId: string;
let itemCode: string;
let itemName: string;

const call = async <T>(method: "get" | "post" | "patch", path: string, data?: unknown): Promise<T> => {
  const res =
    method === "get" ? await api.get(path) : method === "post" ? await api.post(path, { data }) : await api.patch(path, { data });
  const body = (await res.json().catch(() => null)) as T;
  if (res.status() >= 400) throw new Error(`${method} ${path} → ${res.status()}: ${JSON.stringify(body)}`);
  return body;
};

/** Crea una OC, la aprueba y (opcionalmente) la recibe (total o parcial). */
const seededOrder = async (
  seedSupplierId: string,
  quantity: number,
  unitCost: number,
  extra: { taxRateId?: string; costCenterId?: string; receiveQuantity?: number } = {}
): Promise<{ id: string; number: string; lineId: string }> => {
  const created = await call<{ id: string; number: string; lines: Array<{ id: string }> }>("post", "kitchen/purchase-orders", {
    supplierId: seedSupplierId,
    ...(extra.costCenterId ? { costCenterId: extra.costCenterId } : {}),
    lines: [{ itemId, quantity, unitCost, ...(extra.taxRateId ? { taxRateId: extra.taxRateId } : {}) }],
  });
  await call("post", `kitchen/purchase-orders/${created.id}/approve`, {});
  if (extra.receiveQuantity) {
    await call("post", `kitchen/purchase-orders/${created.id}/receive`, {
      lines: [{ lineId: created.lines[0].id, quantity: extra.receiveQuantity }],
    });
  }
  return { id: created.id, number: created.number, lineId: created.lines[0].id };
};

/** Elige una opción de un `ITSearchSelect` por el `name` del input. */
const pick = async (page: Page, inputName: string, label: string): Promise<void> => {
  await page.locator(`input[name="${inputName}"]`).click();
  await page.getByText(label, { exact: true }).last().click();
};

test.describe("Almacén de cocina — compras Fase 1 (pantalla)", () => {
  test.beforeAll(async ({ ctxApi }) => {
    api = ctxApi;
    const suffix = RUN.slice(-6);
    const unit = await call<{ id: string }>("post", "kitchen/units", { code: `${E2E_PREFIX}P${suffix}`, name: `Unidad fase1 E2E ${RUN}` });
    unitId = unit.id;
    const category = await call<{ id: string }>("post", "kitchen/categories", { name: `${E2E_PREFIX} Fase1 ${RUN}` });
    categoryId = category.id;

    supplierName = `${E2E_PREFIX} Prov fase1 ${RUN}`;
    supplierEmail = `${E2E_PREFIX.toLowerCase()}-fase1-${RUN}@example.com`;
    const supplier = await call<{ id: string }>("post", "kitchen/suppliers", {
      name: supplierName,
      contacts: [{ name: `Contacto ${RUN}`, email: supplierEmail, isPrimary: true }],
    });
    supplierId = supplier.id;

    supplierNoEmailName = `${E2E_PREFIX} Prov sin correo ${RUN}`;
    const supplierNoEmail = await call<{ id: string }>("post", "kitchen/suppliers", { name: supplierNoEmailName });
    supplierNoEmailId = supplierNoEmail.id;

    itemCode = `${E2E_PREFIX}-${RUN}-F1`;
    itemName = `Insumo fase1 ${RUN}`;
    const item = await call<{ id: string }>("post", "kitchen/items", {
      code: itemCode,
      name: itemName,
      categoryId,
      kind: "CONSUMABLE",
      unitId,
      tracksExpiry: false,
      minStock: 0,
    });
    itemId = item.id;
  });

  test("envía la OC al proveedor: vista previa, FormData con el PDF y queda Enviada", async ({ page }) => {
    const order = await seededOrder(supplierId, 2, 50);
    const detail = await call<Record<string, unknown>>("get", `kitchen/purchase-orders/${order.id}`);

    let emailed = false;
    let contentType = "";
    let body = "";

    // Detalle: tras enviar, responde SENT (el POST se intercepta, la API real no cambia).
    await page.route("**/kitchen/purchase-orders/*", async (r) => {
      if (r.request().method() !== "GET" || !r.request().url().endsWith(order.id)) return r.continue();
      const payload = emailed ? { ...detail, status: "SENT", sentAt: new Date().toISOString() } : detail;
      await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
    });
    await page.route("**/kitchen/purchase-orders/*/send-email", async (r) => {
      contentType = r.request().headers()["content-type"] ?? "";
      body = r.request().postDataBuffer()?.toString("latin1") ?? "";
      emailed = true;
      await r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...detail, status: "SENT", sentAt: new Date().toISOString() }),
      });
    });

    await page.goto(route(`/kitchen/purchase-orders/${order.id}`));
    await expect(page.getByRole("button", { name: "Enviar al proveedor" })).toBeVisible();
    await page.getByRole("button", { name: "Enviar al proveedor" }).click();

    // Diálogo: destinatarios por defecto (contacto principal) y vista previa del PDF.
    await expect(page.locator('input[name="poEmailTo"]')).toHaveValue(supplierEmail);
    await expect(page.getByTitle("Vista previa del PDF")).toBeVisible({ timeout: 15_000 });

    const send = page.getByRole("button", { name: "Enviar", exact: true });
    await expect(send).toBeEnabled();
    await send.click();

    // Se envió el multipart con el PDF adjunto y el destinatario.
    await expect.poll(() => contentType).toContain("multipart/form-data");
    await expect.poll(() => body).toContain('name="file"');
    await expect.poll(() => body).toContain("application/pdf");
    await expect.poll(() => body).toContain(supplierEmail);

    await expect(page.getByText("Orden enviada por correo").first()).toBeVisible();
    await expect(page.getByText("Enviada", { exact: true }).first()).toBeVisible();
  });

  test("avisa cuando el proveedor no tiene correo", async ({ page }) => {
    const order = await seededOrder(supplierNoEmailId, 1, 10);
    await page.goto(route(`/kitchen/purchase-orders/${order.id}`));
    await page.getByRole("button", { name: "Enviar al proveedor" }).click();

    await expect(page.locator('input[name="poEmailTo"]')).toHaveValue("");
    await expect(page.getByText("Agrega un correo al proveedor o a su contacto")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar", exact: true })).toBeDisabled();
  });

  test("registra la factura por pantalla con IVA por renglón y marca la diferencia en ámbar", async ({ page }) => {
    const order = await seededOrder(supplierId, 5, 100, { taxRateId: TAX16, receiveQuantity: 5 });
    const invoiceNumber = `${E2E_PREFIX}-FAC-UI-${RUN}`;

    await page.goto(route(`/kitchen/purchase-orders/${order.id}`));
    await page.getByRole("button", { name: "Registrar factura" }).click();
    await expect(page).toHaveURL(/#\/kitchen\/invoices\/new/);

    // El renglón precargado propone el IVA de la OC (16%).
    const taxSelect = page.locator('select[name="invTax-1"]');
    await expect(taxSelect).toHaveValue(TAX16);

    // Se cambia a 8% y se captura el CFDI con una diferencia de IVA.
    await taxSelect.selectOption(TAX8);
    await expect(page.getByText("IVA 8%", { exact: true }).first()).toBeVisible();

    await page.locator('input[name="invNumber"]').fill(invoiceNumber);
    await page.locator('input[name="invUuid"]').fill(`E2E-UUID-${RUN}`);
    await page.locator('input[name="invCapturedSubtotal"]').fill("500");
    await page.locator('input[name="invCapturedTax"]').fill("999");
    await page.locator('input[name="invCapturedTotal"]').fill("540");
    await expect(page.locator(".text-amber-600").first()).toBeVisible();

    await page.getByRole("button", { name: "Registrar factura", exact: true }).click();
    await expect(page.getByText("Factura registrada").first()).toBeVisible();
    await expect(page).toHaveURL(/#\/kitchen\/invoices/, { timeout: 15_000 });

    // Verificación cruzada con la API: la factura guardó la tasa y el cotejo.
    const table = await call<{ data: Array<{ id: string; number: string }> }>("post", "kitchen/invoices/table", {
      page: 1,
      limit: 10,
      filters: { number: invoiceNumber },
      sort: [],
    });
    const saved = table.data.find((i) => i.number === invoiceNumber);
    expect(saved).toBeTruthy();
    const full = await call<{ lines: Array<{ taxRate: number }>; taxTotals: { order: unknown; taxDiff: number | null } }>(
      "get",
      `kitchen/invoices/${saved!.id}`
    );
    expect(full.lines[0].taxRate).toBeCloseTo(0.08);
    expect(full.taxTotals.order).not.toBeNull();
    expect(Math.abs(full.taxTotals.taxDiff ?? 0)).toBeGreaterThan(0);
  });

  test("crea un centro de costo y lo usa en la orden de compra", async ({ page }) => {
    const code = `${E2E_PREFIX}-CCUI-${RUN}`;
    const name = `${E2E_PREFIX} Centro UI ${RUN}`;

    await page.goto(route("/kitchen/catalog"));
    await page.getByText("Centros de costo", { exact: true }).first().click();
    await page.getByRole("button", { name: "Nuevo centro de costo" }).click();
    await page.locator('input[name="costCenterCode"]').fill(code);
    await page.locator('input[name="costCenterName"]').fill(name);
    await page.getByRole("button", { name: "Guardar", exact: true }).click();

    await expect(page.getByText("Guardado").first()).toBeVisible();
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    // Se usa en el formulario de la OC.
    await page.goto(route("/kitchen/purchase-orders/new"));
    await pick(page, "poSupplier", supplierName);
    await page.locator('select[name="poCostCenter"]').selectOption({ label: `${code} · ${name}` });
    await page.getByRole("button", { name: "Agregar artículo" }).click();
    await pick(page, "poItem-1", `${itemCode} · ${itemName}`);
    await page.locator('input[name="poQty-1"]').fill("10");
    await page.locator('input[name="poCost-1"]').fill("25");
    await page.getByRole("button", { name: "Guardar orden" }).click();

    await expect(page.getByText("Orden creada").first()).toBeVisible();
    await expect(page).toHaveURL(/#\/kitchen\/purchase-orders$/, { timeout: 15_000 });

    // La orden quedó ligada al centro de costo.
    const centers = await call<Array<{ id: string; code: string }>>("get", "kitchen/cost-centers?includeInactive=true");
    const center = centers.find((c) => c.code === code);
    expect(center).toBeTruthy();
  });

  test("reporte de gasto por centro de costo: suma lo recibido y export CSV", async ({ page }) => {
    // Se piden 10 y se reciben 4: el gasto es 4 × 25 = 100, no 250.
    const code = `${E2E_PREFIX}-CCREP-${RUN}`;
    const name = `${E2E_PREFIX} Centro reporte UI ${RUN}`;
    const center = await call<{ id: string }>("post", "kitchen/cost-centers", { name, code });
    await seededOrder(supplierId, 10, 25, { costCenterId: center.id, receiveQuantity: 4 });

    await page.goto(route("/kitchen/cost-centers"));
    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15_000 });

    const row = page.locator("div.items-center", { hasText: code }).last();
    await expect(row).toContainText("$100.00");
    await expect(row).not.toContainText("$250.00");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "CSV" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
    const path = await download.path();
    expect(path).toBeTruthy();
    const csv = fs.readFileSync(path!, "utf-8");
    const line = csv.split(/\r?\n/).find((l) => l.includes(code));
    expect(line).toBeTruthy();
    expect(line).toContain("100");
    expect(line).not.toContain("250");
  });
});
