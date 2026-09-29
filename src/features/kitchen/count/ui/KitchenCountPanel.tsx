import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  kitchenApi,
  fmtQty,
  useKitchenCategoryOptions,
  type KitchenLotRow,
} from "@entities/kitchen";
import { useRequestKey } from "@shared/lib/useRequestKey";

/** Conteo físico: captura lo que hay por lote; la diferencia se ajusta. */
export default function KitchenCountPanel() {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const requestKey = useRequestKey();
  const categories = useKitchenCategoryOptions();
  const [categoryId, setCategoryId] = useState("");
  const [lots, setLots] = useState<KitchenLotRow[]>([]);
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    kitchenApi
      .lotsTable({ page: 1, limit: 200, filters: { ...(categoryId ? { categoryId } : {}), status: "VALID" } })
      .then((res) => active && setLots(res.data.filter((l) => l.onHand > 0)))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [categoryId]);

  const diffs = useMemo(
    () =>
      lots
        .map((l) => {
          const raw = counted[l.id];
          if (raw === undefined || raw === "") return null;
          const value = Number(raw);
          if (Number.isNaN(value)) return null;
          const diff = Math.round((value - l.onHand) * 1000) / 1000;
          return diff === 0 ? null : { lot: l, diff };
        })
        .filter((d): d is { lot: KitchenLotRow; diff: number } => d !== null),
    [lots, counted]
  );

  const submit = async () => {
    if (diffs.length === 0) {
      setError(t("count.noChanges"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const ups = diffs.filter((d) => d.diff > 0);
      const downs = diffs.filter((d) => d.diff < 0);
      const base = { notes: null, reference: null };
      if (ups.length) {
        const input = {
          ...base,
          type: "ADJUSTMENT_IN" as const,
          lines: ups.map((d) => ({ itemId: d.lot.item.id, lotId: d.lot.id, quantity: d.diff })),
        };
        await kitchenApi.adjust(input, requestKey(input));
      }
      if (downs.length) {
        const input = {
          ...base,
          type: "ADJUSTMENT_OUT" as const,
          lines: downs.map((d) => ({ itemId: d.lot.item.id, lotId: d.lot.id, quantity: -d.diff })),
        };
        await kitchenApi.adjust(input, requestKey(input));
      }
      setToast(t("count.success"));
      setTimeout(() => navigate("/kitchen/movements"), 600);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="end" justify="between" wrap="wrap" gap={3}>
        <ITSearchSelect
          name="kitchenCountCategory"
          label={t("count.category")}
          options={[{ value: "", label: t("count.allCategories") }, ...categories.data.map((c) => ({ value: c.id, label: c.name }))]}
          value={categoryId}
          onChange={(v) => setCategoryId(String(v))}
          className="min-w-[240px]"
        />
        <ITButton variant="filled" color="primary" disabled={saving} onClick={() => void submit()}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{t("count.submit")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="!p-5 border border-slate-200">
        {lots.length === 0 ? (
          <ITText className="text-[11px] text-slate-400">{t("count.empty")}</ITText>
        ) : (
          <ITFlex direction="column" gap={3}>
            <ITGrid container columns={12} spacing={3} className="border-b border-slate-100 pb-2">
              <ITGrid item xs={5}><ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("count.item")}</ITText></ITGrid>
              <ITGrid item xs={3}><ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("count.lot")}</ITText></ITGrid>
              <ITGrid item xs={2}><ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("count.system")}</ITText></ITGrid>
              <ITGrid item xs={2}><ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("count.counted")}</ITText></ITGrid>
            </ITGrid>
            {lots.map((l) => (
              <ITGrid key={l.id} container columns={12} spacing={3} className="items-center">
                <ITGrid item xs={5}>
                  <ITFlex direction="column" gap={0}>
                    <ITText className="text-[12px] font-black text-slate-800">{l.item.name}</ITText>
                    <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{l.item.code}</ITText>
                  </ITFlex>
                </ITGrid>
                <ITGrid item xs={3}>
                  <ITText className="text-[11px] font-mono text-slate-500">
                    {l.lotCode} {l.expiresAt ? `· ${l.expiresAt}` : ""}
                  </ITText>
                </ITGrid>
                <ITGrid item xs={2}>
                  <ITText className="text-[11px] font-bold text-slate-600">
                    {fmtQty(l.onHand)} {l.item.unit.name}
                  </ITText>
                </ITGrid>
                <ITGrid item xs={2}>
                  <ITInput
                    name={`count-${l.id}`}
                    type="number"
                    value={counted[l.id] ?? ""}
                    onChange={(e) => setCounted((c) => ({ ...c, [l.id]: e.target.value }))}
                  />
                </ITGrid>
              </ITGrid>
            ))}
          </ITFlex>
        )}
      </ITCard>

      {toast && <ITToast message={toast} type="success" position="bottom-center" duration={2000} onClose={() => setToast(null)} />}
    </ITFlex>
  );
}
