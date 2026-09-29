import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  kitchenApi,
  useKitchenItemOptions,
  useSupplierOptions,
  type SupplierInvoiceInput,
} from "@entities/kitchen";
import { emptyInvoiceDraftLine, localDay, type InvoiceDraftLine } from "./types";

/**
 * Formulario de una factura de proveedor. Si llega `purchaseOrderId` por estado
 * de navegación, precarga proveedor y conceptos con lo recibido de esa OC.
 */
export const useInvoiceForm = () => {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const location = useLocation();
  const items = useKitchenItemOptions();
  const suppliers = useSupplierOptions();
  const itemById = useMemo(() => new Map(items.data.map((item) => [item.id, item])), [items.data]);

  const [supplierId, setSupplierId] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState<string | null>(null);
  const [number, setNumber] = useState("");
  const [uuid, setUuid] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceDraftLine[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const prefillPoId = (location.state as { purchaseOrderId?: string } | null)?.purchaseOrderId ?? null;

  useEffect(() => {
    if (!prefillPoId) return;
    setLoading(true);
    kitchenApi
      .purchaseOrder(prefillPoId)
      .then((po) => {
        setSupplierId(po.supplier.id);
        setPurchaseOrderId(po.id);
        const received = po.lines.filter((l) => l.receivedQuantity > 0);
        setLines(
          received.map((line, i) => ({
            key: i + 1,
            itemId: line.item.id,
            quantity: String(line.receivedQuantity),
            unitCost: line.unitCost == null ? "" : String(line.unitCost),
            purchaseOrderLineId: line.id,
          }))
        );
        setNextKey(received.length + 1);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [prefillPoId]);

  const addLine = () => {
    setLines((current) => [...current, emptyInvoiceDraftLine(nextKey)]);
    setNextKey((k) => k + 1);
  };
  const patchLine = (key: number, patch: Partial<InvoiceDraftLine>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  const removeLine = (key: number) => setLines((current) => current.filter((line) => line.key !== key));

  const total = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0);
  const validLines = lines.filter((l) => l.itemId && Number(l.quantity) > 0 && l.unitCost !== "" && Number(l.unitCost) >= 0);
  const canSave = Boolean(supplierId) && number.trim() !== "" && validLines.length > 0;

  const save = async () => {
    if (!canSave) {
      setError(t("invoices.form.emptyItems"));
      return;
    }
    const input: SupplierInvoiceInput = {
      supplierId,
      purchaseOrderId,
      number: number.trim(),
      uuid: uuid || null,
      date: localDay(date),
      total: Math.round(total * 100) / 100,
      notes: notes || null,
      lines: validLines.map((line) => ({
        itemId: line.itemId,
        purchaseOrderLineId: line.purchaseOrderLineId,
        quantity: Number(line.quantity),
        unitCost: Number(line.unitCost),
      })),
    };
    setSaving(true);
    setError(null);
    try {
      await kitchenApi.createInvoice(input);
      setToast(t("invoices.registered"));
      setTimeout(() => navigate("/kitchen/invoices"), 600);
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
    purchaseOrderId,
    number,
    setNumber,
    uuid,
    setUuid,
    date,
    setDate,
    notes,
    setNotes,
    lines,
    patchLine,
    addLine,
    removeLine,
    total,
    loading,
    saving,
    error,
    setError,
    toast,
    setToast,
    save,
    canSave,
    cancel: () => navigate("/kitchen/invoices"),
  };
};

export type UseInvoiceForm = ReturnType<typeof useInvoiceForm>;
