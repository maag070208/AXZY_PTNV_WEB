import { useEffect, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITInput,
  ITInputNumber,
  ITSearchSelect,
  ITSegmentedControl,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import {
  KITCHEN_WASTE_REASONS,
  fmtQty,
  kitchenApi,
  useSupplierOptions,
  type FefoAllocation,
  type KitchenItemRow,
  type KitchenWasteReason,
} from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";
import { useRequestKey } from "@shared/lib/useRequestKey";

export type QuickMode = "in" | "out";

interface Props {
  item: KitchenItemRow | null;
  mode: QuickMode;
  onClose: () => void;
  onDone: (message: string) => void;
}

const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Movimiento rápido de UN artículo desde su renglón: entrada (crea un lote) o
 * salida (consumo o merma, repartida por FEFO). Es el flujo corto del día a
 * día; para varios artículos a la vez están las pantallas completas.
 */
export default function QuickMovementDialog({ item, mode, onClose, onDone }: Props) {
  const { t } = useTranslation("kitchen");
  const requestKey = useRequestKey();
  const suppliers = useSupplierOptions();
  const [quantity, setQuantity] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [lotCode, setLotCode] = useState("");
  const [unitCost, setUnitCost] = useState<number | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [outType, setOutType] = useState<"CONSUMPTION" | "WASTE">("CONSUMPTION");
  const [wasteReason, setWasteReason] = useState<KitchenWasteReason>("EXPIRED");
  const [plan, setPlan] = useState<{ allocations: FefoAllocation[]; missing: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre, formulario limpio. Un duradero solo sale como merma.
  useEffect(() => {
    if (!item) return;
    setQuantity(null);
    setExpiresAt(null);
    setLotCode("");
    setUnitCost(null);
    setSupplierId("");
    setOutType(item.kind === "DURABLE" ? "WASTE" : "CONSUMPTION");
    setWasteReason(item.kind === "DURABLE" ? "BREAKAGE" : "EXPIRED");
    setPlan(null);
    setError(null);
  }, [item, mode]);

  // Salida: de qué lotes se tomaría (FEFO), mientras se escribe la cantidad.
  useEffect(() => {
    if (!item || mode !== "out" || !quantity || quantity <= 0) {
      setPlan(null);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      kitchenApi
        .fefoPreview({ type: outType, lines: [{ itemId: item.id, quantity }] })
        .then((p) => active && setPlan(p.lines[0] ?? null))
        .catch(() => active && setPlan(null));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [item, mode, quantity, outType]);

  if (!item) return null;
  const unit = item.unit.name;
  const needsExpiry = mode === "in" && item.tracksExpiry;
  const canSave =
    Boolean(quantity && quantity > 0) && (!needsExpiry || Boolean(expiresAt)) && (mode === "in" || (plan !== null && plan.missing === 0));

  const save = async () => {
    if (!quantity) return;
    setSaving(true);
    setError(null);
    try {
      if (mode === "in") {
        const input = {
          supplierId: supplierId || null,
          lines: [
            {
              itemId: item.id,
              quantity,
              ...(lotCode.trim() ? { lotCode: lotCode.trim() } : {}),
              expiresAt: expiresAt ? localDay(expiresAt) : null,
              unitCost,
            },
          ],
        };
        await kitchenApi.stockIn(input, requestKey(input));
        onDone(t("items.quick.savedIn"));
      } else {
        const input = {
          type: outType,
          ...(outType === "WASTE" ? { wasteReason } : {}),
          lines: [{ itemId: item.id, quantity }],
        };
        await kitchenApi.stockOut(input, requestKey(input));
        onDone(t("items.quick.savedOut"));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITDialog
      isOpen={Boolean(item)}
      onClose={onClose}
      title={mode === "in" ? t("items.quick.inTitle", { item: item.name }) : t("items.quick.outTitle", { item: item.name })}
    >
      <ITFlex direction="column" gap={4} className="min-w-[320px] md:min-w-[440px]">
        <ITFlex align="center" justify="between" gap={2} className="rounded-xl bg-slate-50 px-4 py-3">
          <ITText className="text-[12px] text-slate-500">{mode === "in" ? t("items.quick.inHint") : t("items.quick.outHint")}</ITText>
          <ITText className="whitespace-nowrap text-[12px] font-black text-slate-800">
            {t("items.quick.available", { qty: fmtQty(item.available), unit })}
          </ITText>
        </ITFlex>

        {error && <ITAlert variant="error">{error}</ITAlert>}

        {mode === "out" && item.kind !== "DURABLE" && (
          <ITSegmentedControl
            options={[
              { value: "CONSUMPTION", label: t("stockOut.CONSUMPTION") },
              { value: "WASTE", label: t("stockOut.WASTE") },
            ]}
            value={outType}
            onChange={(v) => setOutType(v as "CONSUMPTION" | "WASTE")}
          />
        )}

        <ITInputNumber
          name="quickQuantity"
          label={t("items.quick.quantity", { unit })}
          decimals={item.unit.whole ? 0 : 3}
          min={0}
          value={quantity}
          onChange={(v) => setQuantity(v ?? null)}
        />

        {mode === "in" && (
          <>
            {item.tracksExpiry && (
              <ITDatePicker
                name="quickExpiresAt"
                label={t("items.quick.expiresAt")}
                value={expiresAt ?? undefined}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v instanceof Date) setExpiresAt(v);
                }}
                className="w-full"
              />
            )}
            <ITFlex gap={3} wrap="wrap">
              <div className="min-w-[180px] flex-1">
                <ITInputNumber name="quickCost" label={t("items.quick.unitCost", { unit })} decimals={2} prefix="$" min={0} value={unitCost} onChange={(v) => setUnitCost(v ?? null)} />
              </div>
              <div className="min-w-[180px] flex-1">
                <ITInput name="quickLot" label={t("items.quick.lotCode")} value={lotCode} onChange={(e) => setLotCode(e.target.value)} />
              </div>
            </ITFlex>
            <ITSearchSelect
              name="quickSupplier"
              label={t("items.quick.supplier")}
              options={[{ value: "", label: "—" }, ...suppliers.data.map((s) => ({ value: s.id, label: s.name }))]}
              value={supplierId}
              onChange={(v) => setSupplierId(String(v))}
            />
            {needsExpiry && !expiresAt && <ITText className="text-[11px] text-amber-600">{t("items.quick.needExpiry")}</ITText>}
          </>
        )}

        {mode === "out" && outType === "WASTE" && (
          <ITSearchSelect
            name="quickWasteReason"
            label={t("stockOut.wasteReason")}
            options={KITCHEN_WASTE_REASONS.map((r) => ({ value: r, label: dyn(t)(`wasteReasons.${r}`) }))}
            value={wasteReason}
            onChange={(v) => setWasteReason(v as KitchenWasteReason)}
          />
        )}

        {mode === "out" && plan && (
          <div className="rounded-xl border border-slate-200 p-3">
            {plan.allocations.length === 0 ? (
              <ITText className="text-[12px] text-rose-600">{t("items.quick.noStock")}</ITText>
            ) : (
              <>
                <ITText className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">{t("items.quick.willTake")}</ITText>
                {plan.allocations.map((a) => (
                  <ITFlex key={a.lotId} justify="between" className="py-0.5">
                    <ITText className="font-mono text-[11px] text-slate-600">
                      {a.lotCode}
                      {a.expiresOn ? ` · ${a.expiresOn}` : ""}
                    </ITText>
                    <ITText className="text-[12px] font-black text-slate-800">
                      {fmtQty(a.quantity)} {unit}
                    </ITText>
                  </ITFlex>
                ))}
                {plan.missing > 0 && <ITText className="mt-1 block text-[11px] font-bold text-rose-600">{t("stockOut.missing", { qty: fmtQty(plan.missing) })}</ITText>}
              </>
            )}
          </div>
        )}

        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onClose} />
          <ITButton
            variant="filled"
            color={mode === "in" ? "primary" : outType === "WASTE" ? "danger" : "primary"}
            label={mode === "in" ? t("items.quick.saveIn") : t("items.quick.saveOut")}
            disabled={!canSave || saving}
            onClick={() => void save()}
          />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
