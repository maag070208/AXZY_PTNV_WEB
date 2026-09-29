import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  kitchenApi,
  useKitchenItemOptions,
  useSupplierOptions,
  type KitchenStockInInput,
} from "@entities/kitchen";
import { useRequestKey } from "@shared/lib/useRequestKey";
import { emptyStockInLine, isStockInLineComplete, localDay, type StockInLine } from "./types";

/**
 * Estado y acciones del alta de una entrada de almacén: datos generales,
 * renglones (cada uno crea un lote), validación y envío. La UI vive en `ui/`.
 */
export const useStockIn = () => {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const requestKey = useRequestKey();

  const items = useKitchenItemOptions();
  const suppliers = useSupplierOptions();
  const itemById = useMemo(() => new Map(items.data.map((item) => [item.id, item])), [items.data]);

  const [supplierId, setSupplierId] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState<StockInLine[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [draft, setDraft] = useState<StockInLine>(emptyStockInLine(0));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const draftItem = itemById.get(draft.itemId);
  const draftReady =
    Boolean(draftItem) &&
    Number(draft.quantity) > 0 &&
    (!draftItem?.tracksExpiry || Boolean(draft.expiresAt));

  const allComplete =
    lines.length > 0 && lines.every((line) => isStockInLineComplete(line, itemById.get(line.itemId)));

  const totalUnits = useMemo(
    () => lines.reduce((total, line) => total + (Number(line.quantity) || 0), 0),
    [lines]
  );

  const totalCost = useMemo(
    () =>
      lines.reduce(
        (total, line) => total + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0),
        0
      ),
    [lines]
  );

  const updateDraft = (patch: Partial<StockInLine>) => setDraft((current) => ({ ...current, ...patch }));

  const addLine = () => {
    if (!draftReady) return;
    setLines((current) => [...current, { ...draft, key: nextKey }]);
    setNextKey((current) => current + 1);
    setDraft(emptyStockInLine(nextKey + 1));
    setError(null);
  };

  const patchLine = (key: number, patch: Partial<StockInLine>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const removeLine = (key: number) => setLines((current) => current.filter((line) => line.key !== key));

  const cancel = () => navigate("/kitchen/movements");

  const submit = async () => {
    if (!allComplete) {
      setError(t("stockIn.incomplete"));
      return;
    }
    const input: KitchenStockInInput = {
      date: date.toISOString(),
      reference: reference || null,
      notes: notes || null,
      supplierId: supplierId || null,
      lines: lines.map((line) => ({
        itemId: line.itemId,
        quantity: Number(line.quantity),
        ...(line.lotCode ? { lotCode: line.lotCode } : {}),
        expiresAt: line.expiresAt ? localDay(line.expiresAt) : null,
        unitCost: line.unitCost === "" ? null : Number(line.unitCost),
      })),
    };
    setSaving(true);
    setError(null);
    try {
      await kitchenApi.stockIn(input, requestKey(input));
      setToast(t("stockIn.success"));
      setTimeout(() => navigate("/kitchen/movements"), 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  return {
    t,
    items: items.data,
    suppliers: suppliers.data,
    itemById,
    supplierId,
    setSupplierId,
    reference,
    setReference,
    date,
    setDate,
    notes,
    setNotes,
    lines,
    draft,
    draftItem,
    draftReady,
    allComplete,
    totalUnits,
    totalCost,
    updateDraft,
    addLine,
    patchLine,
    removeLine,
    cancel,
    submit,
    saving,
    error,
    setError,
    toast,
    setToast,
  };
};

export type UseStockIn = ReturnType<typeof useStockIn>;
