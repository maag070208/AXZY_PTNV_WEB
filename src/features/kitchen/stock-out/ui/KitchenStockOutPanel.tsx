import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITInputNumber,
  ITSearchSelect,
  ITSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  kitchenApi,
  fmtQty,
  useKitchenItemOptions,
  KITCHEN_WASTE_REASONS,
  type FefoPreview,
  type KitchenStockOutInput,
  numOrNull,
  numText,
  type KitchenWasteReason,
} from "@entities/kitchen";
import { useRequestKey } from "@shared/lib/useRequestKey";
import { dyn } from "@shared/i18n/dyn";

interface Line {
  key: number;
  itemId: string;
  quantity: string;
}

const HEAD = "text-[10px] font-black uppercase tracking-widest text-slate-400";
const emptyDraft = (key: number): Line => ({ key, itemId: "", quantity: "" });

/**
 * Consumo o merma en una sola pantalla: Datos, artículos y el reparto FEFO real
 * (los lotes exactos que se van a descontar) antes de registrar. El botón se
 * deshabilita si falta existencia, para no dejar el inventario en error.
 */
export default function KitchenStockOutPanel() {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const requestKey = useRequestKey();
  const items = useKitchenItemOptions();
  const itemById = useMemo(() => new Map(items.data.map((i) => [i.id, i])), [items.data]);

  const [type, setType] = useState<"CONSUMPTION" | "WASTE">("CONSUMPTION");
  const [wasteReason, setWasteReason] = useState<KitchenWasteReason>("EXPIRED");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState<Line[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [draft, setDraft] = useState<Line>(emptyDraft(0));

  const [preview, setPreview] = useState<FefoPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const draftItem = itemById.get(draft.itemId);
  const draftReady = !!draftItem && Number(draft.quantity) > 0;
  const complete = lines.filter((l) => l.itemId && Number(l.quantity) > 0);
  const allComplete = lines.length > 0 && complete.length === lines.length;
  const missing = preview?.lines.reduce((acc, l) => acc + l.missing, 0) ?? 0;

  const addLine = () => {
    if (!draftReady) return;
    setLines((ls) => [...ls, { ...draft, key: nextKey }]);
    setNextKey((k) => k + 1);
    setDraft(emptyDraft(nextKey + 1));
  };
  const patchLine = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const removeLine = (key: number) => setLines((ls) => ls.filter((l) => l.key !== key));

  // Vista previa FEFO en vivo (con un respiro para no pedir en cada tecla).
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshPreview = useCallback(() => {
    const ready = lines.filter((l) => l.itemId && Number(l.quantity) > 0);
    if (ready.length === 0) {
      setPreview(null);
      return;
    }
    void kitchenApi
      .fefoPreview({ type, lines: ready.map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) })) })
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [lines, type]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(refreshPreview, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refreshPreview]);

  const submit = async () => {
    if (!allComplete) {
      setError(t("stockOut.incomplete"));
      return;
    }
    if (missing > 0) {
      setError(t("stockOut.insufficient"));
      return;
    }
    const input: KitchenStockOutInput = {
      date: date.toISOString(),
      notes: notes || null,
      type,
      ...(type === "WASTE" ? { wasteReason } : {}),
      lines: complete.map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) })),
    };
    setSaving(true);
    setError(null);
    try {
      await kitchenApi.stockOut(input, requestKey(input));
      setToast(t("stockOut.success"));
      setTimeout(() => navigate("/kitchen/items"), 600);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard title={t("stockOut.dataTitle")} className="!p-5 border border-slate-200">
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={3}>
            <ITSelect
              name="kitchenOutType"
              label={t("stockOut.type")}
              value={type}
              options={[
                { value: "CONSUMPTION", label: t("stockOut.CONSUMPTION") },
                { value: "WASTE", label: t("stockOut.WASTE") },
              ]}
              onChange={(e) => setType(e.target.value as "CONSUMPTION" | "WASTE")}
            />
          </ITGrid>
          {type === "WASTE" && (
            <ITGrid item xs={12} md={3}>
              <ITSelect
                name="kitchenWasteReason"
                label={t("stockOut.wasteReason")}
                value={wasteReason}
                options={KITCHEN_WASTE_REASONS.map((r) => ({ value: r, label: dyn(t)(`wasteReasons.${r}`) }))}
                onChange={(e) => setWasteReason(e.target.value as KitchenWasteReason)}
              />
            </ITGrid>
          )}
          <ITGrid item xs={12} md={3}>
            <ITDatePicker
              name="kitchenOutDate"
              label={t("stockOut.date")}
              value={date}
              onChange={(e) => {
                const v = e.target.value;
                if (v instanceof Date) setDate(v);
              }}
              className="w-full"
            />
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITInput name="kitchenOutNotes" label={t("stockOut.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </ITGrid>
        </ITGrid>
      </ITCard>

      <ITCard title={t("stockOut.itemsTitle")} className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={4}>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <ITText className={`${HEAD} block mb-3`}>{t("stockOut.addTitle")}</ITText>
            <ITGrid container columns={12} spacing={3} className="items-end">
              <ITGrid item xs={12} md={8}>
                <ITSearchSelect
                  name="outDraftItem"
                  label={t("stockOut.item")}
                  options={items.data.map((it) => ({ value: it.id, label: `${it.code} · ${it.name}` }))}
                  value={draft.itemId}
                  onChange={(v) => setDraft((d) => ({ ...d, itemId: String(v) }))}
                />
              </ITGrid>
              <ITGrid item xs={6} md={2}>
                <ITInputNumber decimals={2}
                  name="outDraftQty"
                  label={draftItem ? `${t("stockOut.quantity")} (${draftItem.unit.name})` : t("stockOut.quantity")}
                  value={numOrNull(draft.quantity)}
                  onChange={(v) => setDraft((d) => ({ ...d, quantity: numText(v) }))}
                />
              </ITGrid>
              <ITGrid item xs={6} md={2}>
                <ITButton variant="filled" color="primary" disabled={!draftReady} onClick={addLine} className="w-full">
                  <ITFlex align="center" gap={1} justify="center">
                    <FaPlus size={11} />
                    <ITText className="font-bold text-[11px]">{t("stockOut.addButton")}</ITText>
                  </ITFlex>
                </ITButton>
              </ITGrid>
              {draftItem && (
                <ITGrid item xs={12}>
                  <ITFlex gap={3} wrap="wrap">
                    <ITText className="text-[11px] text-slate-500">
                      {t("stockOut.available", { qty: fmtQty(draftItem.available), unit: draftItem.unit.name })}
                    </ITText>
                    {type === "WASTE" && draftItem.expired > 0 && (
                      <ITText className="text-[11px] text-rose-600">
                        {t("stockOut.expired", { qty: fmtQty(draftItem.expired), unit: draftItem.unit.name })}
                      </ITText>
                    )}
                  </ITFlex>
                </ITGrid>
              )}
            </ITGrid>
          </div>

          {lines.length === 0 ? (
            <ITFlex direction="column" align="center" gap={2} className="py-8 text-slate-400">
              <FaBoxOpen size={26} />
              <ITText className="text-[12px]">{t("stockOut.itemsEmpty")}</ITText>
            </ITFlex>
          ) : (
            <ITFlex direction="column" gap={2}>
              <ITGrid container columns={12} spacing={3} className="hidden border-b border-slate-100 pb-2 md:grid">
                <ITGrid item md={6}><ITText className={HEAD}>{t("stockOut.item")}</ITText></ITGrid>
                <ITGrid item md={4}><ITText className={HEAD}>{t("stockOut.quantity")}</ITText></ITGrid>
                <ITGrid item md={2} />
              </ITGrid>
              {lines.map((l) => {
                const item = itemById.get(l.itemId);
                const qty = Number(l.quantity);
                const tooMuch = !!item && type === "CONSUMPTION" && qty > 0 && qty > item.available + 1e-6;
                const incomplete = !l.itemId || !(qty > 0);
                return (
                  <ITGrid
                    key={l.key}
                    container
                    columns={12}
                    spacing={3}
                    className={`items-center rounded-xl border p-3 md:border-0 md:p-0 ${tooMuch || incomplete ? "border-amber-300 bg-amber-50/40 md:bg-transparent" : "border-slate-100 md:border-0"}`}
                  >
                    <ITGrid item xs={12} md={6}>
                      <ITFlex align="center" gap={2} wrap="wrap">
                        <ITText className="text-[12px] font-black text-slate-800">{item?.name ?? "—"}</ITText>
                        {item && (
                          <ITBadget color="gray" size="sm">
                            {item.unit.name}
                          </ITBadget>
                        )}
                        {item && (
                          <ITText className="text-[11px] text-slate-400">
                            {t("stockOut.availableShort", { qty: fmtQty(item.available) })}
                          </ITText>
                        )}
                      </ITFlex>
                    </ITGrid>
                    <ITGrid item xs={9} md={4}>
                      <ITInputNumber decimals={2} name={`q-${l.key}`} label={t("stockOut.quantity")} value={numOrNull(l.quantity)} onChange={(v) => patchLine(l.key, { quantity: numText(v) })} />
                    </ITGrid>
                    <ITGrid item xs={3} md={2}>
                      <ITFlex justify="end">
                        <ITButton variant="text" color="error" size="sm" onClick={() => removeLine(l.key)}>
                          <FaTrash size={12} />
                        </ITButton>
                      </ITFlex>
                    </ITGrid>
                    {tooMuch && (
                      <ITGrid item xs={12}>
                        <ITText className="text-[11px] font-bold text-rose-600">{t("stockOut.tooMuch")}</ITText>
                      </ITGrid>
                    )}
                  </ITGrid>
                );
              })}
            </ITFlex>
          )}

          {preview && preview.lines.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4">
              <ITText className={`${HEAD} block mb-2`}>{t("stockOut.previewTitle")}</ITText>
              <ITFlex direction="column" gap={2}>
                {preview.lines.map((l) => (
                  <ITFlex key={l.itemId} direction="column" gap={1}>
                    <ITText className="text-[12px] font-black text-slate-800">
                      {l.code} · {l.name} — {fmtQty(l.quantity)} {l.unit.name}
                    </ITText>
                    {l.allocations.length === 0 ? (
                      <ITText className="text-[11px] text-rose-600">{t("stockOut.noLots")}</ITText>
                    ) : (
                      l.allocations.map((a) => (
                        <ITText key={a.lotId} className="text-[11px] text-slate-600">
                          {a.lotCode} {a.expiresOn ? `· ${a.expiresOn}` : ""} → {fmtQty(a.quantity)} {l.unit.name}
                        </ITText>
                      ))
                    )}
                    {l.missing > 0 && (
                      <ITText className="text-[11px] font-bold text-rose-600">
                        {t("stockOut.missing", { qty: fmtQty(l.missing) })}
                      </ITText>
                    )}
                  </ITFlex>
                ))}
              </ITFlex>
            </div>
          )}
        </ITFlex>
      </ITCard>

      <ITFlex align="center" justify="between" wrap="wrap" gap={3}>
        <ITText className="text-[12px] font-bold text-slate-500">{t("stockOut.itemsCount", { count: lines.length })}</ITText>
        <ITButton variant="filled" color="primary" disabled={!allComplete || saving || missing > 0} onClick={() => void submit()}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{t("stockOut.submit")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      {toast && <ITToast message={toast} type="success" position="bottom-center" duration={2000} onClose={() => setToast(null)} />}
    </ITFlex>
  );
}
