import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITCheckbox, ITDialog, ITFlex, ITGrid, ITInputNumber, ITSearchSelect, ITSelect, ITTextarea } from "@axzydev/axzy_ui_system";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  LAUNDRY_STAGES,
  hotelLinenApi,
  laundryApi,
  type HotelLot,
  type HotelProduct,
  type HotelWarehouse,
  type LaundryBoard,
  type LaundryStage,
} from "@entities/hotel-linen";
import { newId } from "@shared/lib/newId";
import { useRequestKey } from "@shared/lib/useRequestKey";
import { dyn } from "@shared/i18n/dyn";

export type LinesMode = "firstWash" | "supplierReturn";

interface LineDraft {
  id: string;
  productId: string;
  quantity: number | null;
  lotId: string;
  stage: LaundryStage;
}
const emptyLine = (): LineDraft => ({ id: newId(), productId: "", quantity: null, lotId: "", stage: "QUARANTINE" });

interface Props {
  mode: LinesMode | null;
  board: LaundryBoard | null;
  requestCosign: (title: string) => Promise<string | null>;
  onClose: () => void;
  onDone: () => void;
}

/**
 * "Primera lavada (desde nuevos)" y "Devolver a almacén por defecto de fábrica": ambos son traspasos
 * de varios renglones. La devolución exige notas y sale de la etapa elegida de lavandería.
 */
export default function LaundryLinesDialog({ mode, board, requestCosign, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-laundry");
  const tt = dyn(t);
  const requestKey = useRequestKey();
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [warehouses, setWarehouses] = useState<HotelWarehouse[]>([]);
  const [lots, setLots] = useState<Record<string, HotelLot[]>>({});
  const [fromId, setFromId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [notes, setNotes] = useState("");
  const [cosign, setCosign] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mode) return;
    setLines([emptyLine()]);
    setNotes("");
    setCosign(false);
    setFromId("");
    setError(null);
    setLots({});
    let active = true;
    Promise.all([hotelLinenApi.products(), hotelLinenApi.warehouses()])
      .then(([p, w]) => {
        if (!active) return;
        setProducts(p.filter((x) => x.kind === "LINEN"));
        setWarehouses(w);
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [mode]);

  const newLinenWarehouses = warehouses.filter((w) => w.kind === "NEW_LINEN");
  const patchLine = (id: string, patch: Partial<LineDraft>) => setLines((list) => list.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const pickProduct = (id: string, productId: string) => {
    patchLine(id, { productId, lotId: "" });
    if (mode === "firstWash" && productId && !lots[productId]) {
      hotelLinenApi
        .lots(productId)
        .then((list) => setLots((m) => ({ ...m, [productId]: list })))
        .catch(() => setLots((m) => ({ ...m, [productId]: [] })));
    }
  };

  const lotOptions = (l: LineDraft) => {
    if (mode === "supplierReturn") {
      const row = board?.products.find((p) => p.product.id === l.productId);
      return (row?.lots ?? []).filter((x) => (x.stages[l.stage] ?? 0) > 0).map((x) => ({ value: x.lotId, label: `${x.code} (${x.stages[l.stage]})` }));
    }
    return (lots[l.productId] ?? [])
      .filter((lot) => lot.warehouses.some((w) => (!fromId ? newLinenWarehouses.some((n) => n.id === w.warehouseId) : w.warehouseId === fromId) && w.quantity > 0))
      .map((lot) => ({ value: lot.id, label: `${lot.code} (${lot.balance})` }));
  };

  const valid =
    lines.every((l) => l.productId && l.quantity !== null && l.quantity > 0) && (mode !== "supplierReturn" || notes.trim().length > 0);

  const submit = async () => {
    if (!mode || !valid) return;
    setBusy(true);
    setError(null);
    try {
      let cosignToken: string | null = null;
      if (cosign) {
        cosignToken = await requestCosign(t("cosign.titleDelivers"));
        if (!cosignToken) return;
      }
      if (mode === "firstWash") {
        const body = {
          fromWarehouseId: fromId || null,
          lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity as number, lotId: l.lotId || null })),
          notes: notes.trim() || null,
          cosignToken,
        };
        await laundryApi.firstWash(body, requestKey(body));
      } else {
        const body = {
          lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity as number, lotId: l.lotId || null, fromStage: l.stage })),
          notes: notes.trim(),
          cosignToken,
        };
        await laundryApi.supplierReturn(body, requestKey(body));
      }
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }));

  return (
    <ITDialog isOpen={mode !== null} onClose={onClose} title={mode ? t(`laundry.${mode}.title`) : ""}>
      <ITFlex direction="column" gap={3} className="min-w-[640px]">
        {mode && <ITAlert variant="info">{t(`laundry.${mode}.hint`)}</ITAlert>}
        {error && <ITAlert variant="error">{error}</ITAlert>}
        {mode === "firstWash" && newLinenWarehouses.length > 1 && (
          <ITSelect
            name="linesFrom"
            label={t("laundry.firstWash.from")}
            options={[{ value: "", label: t("laundry.firstWash.fromDefault") }, ...newLinenWarehouses.map((w) => ({ value: w.id, label: w.name }))]}
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
          />
        )}
        {lines.map((l, index) => (
          <ITGrid key={l.id} container columns={12} spacing={3}>
            <ITGrid item xs={12} md={mode === "supplierReturn" ? 4 : 5}>
              <ITSearchSelect name={`linesProduct${index}`} label={t("laundry.lines.item")} options={productOptions} value={l.productId} onChange={(v) => pickProduct(l.id, String(v))} />
            </ITGrid>
            {mode === "supplierReturn" && (
              <ITGrid item xs={6} md={2}>
                <ITSelect
                  name={`linesStage${index}`}
                  label={t("laundry.lines.stage")}
                  options={LAUNDRY_STAGES.map((s) => ({ value: s, label: tt(`laundry.stage.${s}`) }))}
                  value={l.stage}
                  onChange={(e) => patchLine(l.id, { stage: e.target.value as LaundryStage, lotId: "" })}
                />
              </ITGrid>
            )}
            <ITGrid item xs={6} md={2}>
              <ITInputNumber name={`linesQty${index}`} label={t("laundry.lines.quantity")} decimals={0} min={0} value={l.quantity} onChange={(v) => patchLine(l.id, { quantity: v ?? null })} />
            </ITGrid>
            <ITGrid item xs={9} md={3}>
              <ITSelect
                name={`linesLot${index}`}
                label={t("laundry.move.lot")}
                options={[{ value: "", label: t("laundry.move.lotAuto") }, ...lotOptions(l)]}
                value={l.lotId}
                disabled={!l.productId}
                onChange={(e) => patchLine(l.id, { lotId: e.target.value })}
              />
            </ITGrid>
            <ITGrid item xs={3} md={1}>
              <ITButton variant="outlined" color="secondary" size="lg" title={t("laundry.lines.remove")} disabled={lines.length === 1} onClick={() => setLines((list) => list.filter((x) => x.id !== l.id))}>
                <FaTrash size={12} />
              </ITButton>
            </ITGrid>
          </ITGrid>
        ))}
        <ITFlex>
          <ITButton variant="outlined" color="primary" icon={<FaPlus size={12} />} label={t("laundry.lines.add")} onClick={() => setLines((list) => [...list, emptyLine()])} />
        </ITFlex>
        <ITTextarea
          name="linesNotes"
          label={mode === "supplierReturn" ? t("laundry.supplierReturn.notes") : t("form.notes")}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e)}
        />
        <ITCheckbox name="linesCosign" label={t("laundry.lines.cosign")} checked={cosign} onChange={setCosign} />
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onClose} />
          <ITButton variant="filled" color="primary" label={t("laundry.lines.confirm")} disabled={busy || !valid} onClick={() => void submit()} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
