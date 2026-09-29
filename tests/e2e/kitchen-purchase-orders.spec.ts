import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { E2E_PREFIX, newRunId, route } from "./support/env";

/**
 * Pantallas del almacén de cocina: Órdenes de compra y Facturas (grupo Compras).
 *
 * Los datos se siembran por API (lo que se prueba es la pantalla); todo lleva
 * prefijo `E2E` y lo limpia el teardown de la suite.
 */
const RUN = newRunId();
const today = new Date().toISOString().slice(0, 10);

let api: APIRequestContext;
let itemLowName: string;
let itemLowId: string;
let orderId: string;
let orderNumber: string;
let invoiceId: string;
let invoiceNumber: string;
let receivedItemName: string;

const call = async <T>(method: "post" | "patch", path: string, data?: unknown): Promise<T> => {
  const res = method === "post" ? await api.post(path, { data }) : await api.patch(path, { data });
  const body = (await res.json().catch(() => null)) as T;
  if (res.status() >= 400) throw new Error(`${method} ${path} → ${res.status()}: ${JSON.stringify(body)}`);
  return body;
};

test.describe("Almacén de cocina — compras (pantalla)", () => {
  test.beforeAll(async ({ ctxApi }) => {
    api = ctxApi;
    const unit = await call<{ id: string }>("post", "kitchen/units", { code: `${E2E_PREFIX}U${RUN.slice(-6)}`, name: `Unidad E2E ${RUN}` });
    const category = await call<{ id: string }>("post", "kitchen/categories", { name: `${E2E_PREFIX} Cat ${RUN}` });
    const supplier = await call<{ id: string }>("post", "kitchen/suppliers", { name: `${E2E_PREFIX} Prov ${RUN}` });

    itemLowName = `Insumo bajo ${RUN}`;
    const itemLow = await call<{ id: string }>("post", "kitchen/items", {
      code: `${E2E_PREFIX}-${RUN}-LOW`,
      name: itemLowName,
      categoryId: category.id,
      kind: "CONSUMABLE",
      unitId: unit.id,
      tracksExpiry: false,
      minStock: 10,
      maxStock: 50,
    });
    itemLowId = itemLow.id;

    receivedItemName = `Insumo recibido ${RUN}`;
    const itemRecv = await call<{ id: string }>("post", "kitchen/items", {
      code: `${E2E_PREFIX}-${RUN}-REC`,
      name: receivedItemName,
      categoryId: category.id,
      kind: "CONSUMABLE",
      unitId: unit.id,
      tracksExpiry: true,
      minStock: 0,
    });

    // OC enviada (para lista/detalle).
    const order = await call<{ id: string; number: string }>("post", "kitchen/purchase-orders", {
      supplierId: supplier.id,
      expectedAt: today,
      lines: [{ itemId: itemLowId, quantity: 30, unitCost: 100 }],
    });
    orderId = order.id;
    orderNumber = order.number;
    await call("post", `kitchen/purchase-orders/${orderId}/approve`, {});
    await call("post", `kitchen/purchase-orders/${orderId}/send`, {});

    // OC recibida + factura (para el cotejo).
    const order2 = await call<{ id: string; lines: Array<{ id: string }> }>("post", "kitchen/purchase-orders", {
      supplierId: supplier.id,
      lines: [{ itemId: itemRecv.id, quantity: 10, unitCost: 100 }],
    });
    await call("post", `kitchen/purchase-orders/${order2.id}/approve`, {});
    await call("post", `kitchen/purchase-orders/${order2.id}/send`, {});
    await call("post", `kitchen/purchase-orders/${order2.id}/receive`, {
      lines: [{ lineId: order2.lines[0].id, quantity: 10, lotCode: `${E2E_PREFIX}-LOT-${RUN}`, expiresAt: "2027-06-01" }],
    });
    invoiceNumber = `${E2E_PREFIX}-F-${RUN}`;
    const invoice = await call<{ id: string }>("post", "kitchen/invoices", {
      supplierId: supplier.id,
      purchaseOrderId: order2.id,
      number: invoiceNumber,
      date: today,
      total: 1200,
      lines: [{ itemId: itemRecv.id, purchaseOrderLineId: order2.lines[0].id, quantity: 10, unitCost: 120 }],
    });
    invoiceId = invoice.id;
  });

  test("el menú de Compras muestra Órdenes de compra y Facturas; la lista trae el folio", async ({ page }) => {
    await page.goto(route("/kitchen/purchase-orders"));
    await expect(page.getByRole("heading", { name: "Órdenes de compra", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nueva orden" })).toBeVisible();
    await expect(page.locator("table").getByText(orderNumber)).toBeVisible();

    await page.locator("aside").hover();
    await expect(page.locator("aside").getByText("Órdenes de compra", { exact: true }).first()).toBeVisible();
    await expect(page.locator("aside").getByText("Facturas", { exact: true }).first()).toBeVisible();
  });

  test("el detalle de la OC muestra las líneas y sus acciones", async ({ page }) => {
    await page.goto(route(`/kitchen/purchase-orders/${orderId}`));
    await expect(page.getByRole("heading", { name: "Orden de compra", level: 1 })).toBeVisible();
    await expect(page.getByText(orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText(itemLowName).first()).toBeVisible();
    await expect(page.getByText("Enviada").first()).toBeVisible();
    // Pendiente y recibo disponibles.
    await expect(page.getByRole("button", { name: "Recibir" })).toBeVisible();
  });

  test("el reabastecimiento permite crear una orden precargada", async ({ page }) => {
    await page.goto(route("/kitchen/restock"));
    await expect(page.getByText(itemLowName).first()).toBeVisible();

    await page.locator(`input[name="restock-${itemLowId}"]`).check({ force: true });
    await page.getByRole("button", { name: /Crear orden de compra/ }).click();

    await expect(page).toHaveURL(/#\/kitchen\/purchase-orders\/new/);
    await expect(page.getByText("Agregar artículo").first()).toBeVisible();
    // El renglón llega precargado (cantidad sugerida).
    await expect(page.locator('input[name^="poQty-"]').first()).not.toHaveValue("");
  });

  test("facturas: la lista y el detalle muestran el cotejo", async ({ page }) => {
    await page.goto(route("/kitchen/invoices"));
    await expect(page.getByRole("heading", { name: "Facturas", level: 1 })).toBeVisible();
    await expect(page.locator("table").getByText(invoiceNumber)).toBeVisible();

    await page.goto(route(`/kitchen/invoices/${invoiceId}`));
    await expect(page.getByText(invoiceNumber, { exact: true })).toBeVisible();
    await expect(page.getByText("Cotejo", { exact: false }).first()).toBeVisible();
    await expect(page.getByText(receivedItemName).first()).toBeVisible();
  });
});
