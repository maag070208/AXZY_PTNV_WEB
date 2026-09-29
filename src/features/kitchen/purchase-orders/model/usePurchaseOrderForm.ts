import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { useTranslation } from "react-i18next";
import {
  kitchenApi,
  useKitchenItemOptions,
  useSupplierOptions,
  useTaxRateOptions,
  type PurchaseOrderInput,
  type SupplierDetail,
  type SupplierItem,
} from "@entities/kitchen";
import { emptyOrderDraftLine, localDay, type OrderDraftLine } from "./types";

/**
 * Formulario de una orden de compra (crear o editar en borrador). Se puede
 * precargar desde Reabastecimiento (`location.state.items`).
 */
export const usePurchaseOrderForm = (id?: string) => {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const location = useLocation();
  const items = useKitchenItemOptions();
  const suppliers = useSupplierOptions();
  const taxRates = useTaxRateOptions();
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const [header, setHeader] = useState<{ number: string | null; createdAt: string | null; createdBy: string | null; status: string }>({
    number: null,
    createdAt: null,
    createdBy: null,
    status: "DRAFT",
  });
  const itemById = useMemo(() => new Map(items.data.map((item) => [item.id, item])), [items.data]);

  const [supplierId, setSupplierId] = useState("");
  const [expectedAt, setExpectedAt] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<OrderDraftLine[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);

  // Proveedor elegido: su contacto principal y las presentaciones en que surte.
  useEffect(() => {
    if (!supplierId) {
      setSupplier(null);
      return;
    }
    let active = true;
    kitchenApi
      .supplier(supplierId)
      .then((s) => active && setSupplier(s))
      .catch(() => active && setSupplier(null));
    return () => {
      active = false;
    };
  }, [supplierId]);
  const presentationOf = useMemo(() => {
    const map = new Map<string, SupplierItem>((supplier?.items ?? []).map((i) => [i.item.id, i]));
    return (itemId: string) => map.get(itemId);
  }, [supplier]);

  useEffect(() => {
    if (id) {
      kitchenApi
        .purchaseOrder(id)
        .then((order) => {
          setSupplierId(order.supplier.id);
          setHeader({ number: order.number, createdAt: order.createdAt, createdBy: order.createdBy.name, status: order.status });
          setExpectedAt(order.expectedAt ? new Date(`${order.expectedAt}T12:00:00`) : null);
          setNotes(order.notes ?? "");
          setLines(
            order.lines.map((line, i) => {
              // Pedida en presentación: se edita en esa misma unidad.
              const inPack = line.purchaseUnit != null && line.purchaseFactor != null && line.purchaseQuantity != null;
              const cost = line.unitCost == null ? null : inPack ? Math.round(line.unitCost * line.purchaseFactor! * 10000) / 10000 : line.unitCost;
              return {
                key: i + 1,
                itemId: line.item.id,
                quantity: String(inPack ? line.purchaseQuantity : line.quantity),
                unitCost: cost == null ? "" : String(cost),
                usePurchaseUnit: inPack,
                taxRateId: line.taxRateId ?? "",
              };
            })
          );
          setNextKey(order.lines.length + 1);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
      return;
    }
    const prefill = (location.state as { items?: Array<{ itemId: string; quantity: number }> } | null)?.items;
    if (prefill?.length) {
      setLines(prefill.map((p, i) => ({ key: i + 1, itemId: p.itemId, quantity: String(p.quantity), unitCost: "", usePurchaseUnit: false, taxRateId: null })));
      setNextKey(prefill.length + 1);
    }
  }, [id, location.state]);

  const addLine = () => {
    setLines((current) => [...current, emptyOrderDraftLine(nextKey)]);
    setNextKey((k) => k + 1);
  };
  const patchLine = (key: number, patch: Partial<OrderDraftLine>) =>
    setLines((current) =>
      current.map((line) => {
        if (line.key !== key) return line;
        // Al elegir un artículo que el proveedor vende en presentación, se pide en ella.
        const itemChanged = patch.itemId !== undefined && patch.itemId !== line.itemId;
        // Nuevo artículo: vuelve al IVA automático (el del artículo).
        return { ...line, ...patch, ...(itemChanged && { usePurchaseUnit: Boolean(presentationOf(patch.itemId!)), taxRateId: null }) };
      })
    );
  const removeLine = (key: number) => setLines((current) => current.filter((line) => line.key !== key));

  const rateById = useMemo(() => new Map(taxRates.data.map((r) => [r.id, r])), [taxRates.data]);
  /** Tasa efectiva del renglón (id o "" sin IVA) y su valor en fracción. */
  const taxOf = (line: OrderDraftLine) => {
    const id = line.taxRateId ?? itemById.get(line.itemId)?.defaultTaxRateId ?? "";
    return { id, rate: id ? Number(rateById.get(id)?.rate ?? 0) : 0 };
  };
  const amountsOf = (line: OrderDraftLine) => {
    const subtotal = Math.round((Number(line.quantity) || 0) * (Number(line.unitCost) || 0) * 100) / 100;
    const tax = Math.round(subtotal * taxOf(line).rate * 100) / 100;
    return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
  };
  const totals = useMemo(() => {
    const byRate = new Map<number, number>();
    let subtotal = 0;
    let tax = 0;
    for (const line of lines) {
      const a = amountsOf(line);
      subtotal += a.subtotal;
      tax += a.tax;
      const rate = taxOf(line).rate;
      byRate.set(rate, (byRate.get(rate) ?? 0) + a.tax);
    }
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round((subtotal + tax) * 100) / 100,
      taxes: [...byRate.entries()].sort(([a], [b]) => a - b).map(([rate, amount]) => ({ rate, amount: Math.round(amount * 100) / 100 })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, rateById, itemById]);

  const validLines = lines.filter((line) => line.itemId && Number(line.quantity) > 0);
  const canSave = Boolean(supplierId) && validLines.length > 0;

  const save = async () => {
    if (!canSave) {
      setError(t("purchaseOrders.form.emptyItems"));
      return;
    }
    const input: PurchaseOrderInput = {
      supplierId,
      expectedAt: expectedAt ? localDay(expectedAt) : null,
      notes: notes || null,
      lines: validLines.map((line) => ({
        itemId: line.itemId,
        quantity: Number(line.quantity),
        unitCost: line.unitCost === "" ? null : Number(line.unitCost),
        ...(line.usePurchaseUnit && presentationOf(line.itemId) ? { usePurchaseUnit: true } : {}),
        // null = automático (lo decide la API con el IVA del artículo); "" = sin IVA.
        ...(line.taxRateId === null ? {} : { taxRateId: line.taxRateId || null }),
      })),
    };
    setSaving(true);
    setError(null);
    try {
      if (id) await kitchenApi.updatePurchaseOrder(id, input);
      else await kitchenApi.createPurchaseOrder(input);
      setToast(t(id ? "purchaseOrders.saved" : "purchaseOrders.created"));
      setTimeout(() => navigate("/kitchen/purchase-orders"), 600);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return {
    t,
    items: items.data,
    itemById,
    suppliers: suppliers.data,
    taxRates: taxRates.data,
    taxOf,
    amountsOf,
    totals,
    header,
    currentUserName: currentUser?.name ?? "",
    supplier,
    presentationOf,
    supplierId,
    setSupplierId,
    expectedAt,
    setExpectedAt,
    notes,
    setNotes,
    lines,
    patchLine,
    addLine,
    removeLine,
    loading,
    saving,
    error,
    setError,
    toast,
    setToast,
    save,
    canSave,
    cancel: () => navigate("/kitchen/purchase-orders"),
  };
};

export type UsePurchaseOrderForm = ReturnType<typeof usePurchaseOrderForm>;
