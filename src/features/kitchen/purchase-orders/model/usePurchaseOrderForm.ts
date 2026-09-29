import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  kitchenApi,
  useKitchenItemOptions,
  useSupplierOptions,
  type PurchaseOrderInput,
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

  useEffect(() => {
    if (id) {
      kitchenApi
        .purchaseOrder(id)
        .then((order) => {
          setSupplierId(order.supplier.id);
          setExpectedAt(order.expectedAt ? new Date(`${order.expectedAt}T12:00:00`) : null);
          setNotes(order.notes ?? "");
          setLines(
            order.lines.map((line, i) => ({
              key: i + 1,
              itemId: line.item.id,
              quantity: String(line.quantity),
              unitCost: line.unitCost == null ? "" : String(line.unitCost),
            }))
          );
          setNextKey(order.lines.length + 1);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
      return;
    }
    const prefill = (location.state as { items?: Array<{ itemId: string; quantity: number }> } | null)?.items;
    if (prefill?.length) {
      setLines(prefill.map((p, i) => ({ key: i + 1, itemId: p.itemId, quantity: String(p.quantity), unitCost: "" })));
      setNextKey(prefill.length + 1);
    }
  }, [id, location.state]);

  const addLine = () => {
    setLines((current) => [...current, emptyOrderDraftLine(nextKey)]);
    setNextKey((k) => k + 1);
  };
  const patchLine = (key: number, patch: Partial<OrderDraftLine>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  const removeLine = (key: number) => setLines((current) => current.filter((line) => line.key !== key));

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
