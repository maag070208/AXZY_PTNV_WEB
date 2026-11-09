import { useEffect, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITInputNumber,
  ITSearchSelect,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, laundryApi, type HotelProduct, type HotelWarehouse } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { AREA_KINDS, SHIFTS, dateStrToLocal, fmt, localToDateStr, todayStr } from "../lib";

interface LineDraft {
  productId: string;
  name: string;
  code: string;
  delivered: number;
  receivedDirty: number | null;
  stillInUse: number | null;
  good: number | null;
  stained: number | null;
  damaged: number | null;
}

const n = (v: number | null) => v ?? 0;
/** Faltante en vivo: entregado a piso − sucio recibido − sigue en uso (nunca negativo). */
const shortageOf = (l: LineDraft) => Math.max(0, l.delivered - n(l.receivedDirty) - n(l.stillInUse));
const splitOk = (l: LineDraft) => Math.abs(n(l.good) + n(l.stained) + n(l.damaged) - n(l.receivedDirty)) < 1e-9;

const blank = (productId: string, name: string, code: string, delivered: number): LineDraft => ({
  productId,
  name,
  code,
  delivered,
  receivedDirty: null,
  stillInUse: null,
  good: null,
  stained: null,
  damaged: null,
});

interface Props {
  /** Pide la firma de quien entrega (obligatoria); `null` = cancelada. */
  requestCosign: (title: string) => Promise<string | null>;
  onDone: (id: string) => void;
  onCancel: () => void;
}

/** Nueva recepción de sucios: formato por carro con faltante en vivo y desglose bueno/mancha/roto. */
export default function DirtyReceiptForm({ requestCosign, onDone, onCancel }: Props) {
  const { t } = useTranslation("hotel-linen-laundry");
  const tt = dyn(t);
  const [areas, setAreas] = useState<HotelWarehouse[]>([]);
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [areaId, setAreaId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [cart, setCart] = useState("");
  const [shift, setShift] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([hotelLinenApi.warehouses(), hotelLinenApi.products()])
      .then(([w, p]) => {
        if (!active) return;
        setAreas(w.filter((x) => AREA_KINDS.includes(x.kind)));
        setProducts(p.filter((x) => x.kind === "LINEN"));
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  // Al elegir área o fecha se precarga lo entregado a piso ese día.
  useEffect(() => {
    if (!areaId) {
      setLines([]);
      return;
    }
    let active = true;
    laundryApi
      .dirtyPrefill(areaId, date)
      .then((p) => {
        if (!active) return;
        setLines(p.lines.map((l) => blank(l.productId, l.product.name + (l.product.size ? ` · ${l.product.size}` : ""), l.product.code, l.deliveredToFloor)));
        setError(null);
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [areaId, date]);

  const patch = (productId: string, change: Partial<LineDraft>) =>
    setLines((list) => list.map((l) => (l.productId === productId ? { ...l, ...change } : l)));

  // Lo recibido sucio se asume en buen estado hasta que se capture mancha o roto.
  const setReceived = (l: LineDraft, v: number | null) =>
    patch(l.productId, { receivedDirty: v, good: Math.max(0, n(v) - n(l.stained) - n(l.damaged)) });
  const setStained = (l: LineDraft, v: number | null) =>
    patch(l.productId, { stained: v, good: Math.max(0, n(l.receivedDirty) - n(v) - n(l.damaged)) });
  const setDamaged = (l: LineDraft, v: number | null) =>
    patch(l.productId, { damaged: v, good: Math.max(0, n(l.receivedDirty) - n(l.stained) - n(v)) });

  const addable = products.filter((p) => !lines.some((l) => l.productId === p.id));
  const addLine = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (p) setLines((list) => [...list, blank(p.id, p.name, p.code, 0)]);
  };

  const valid = !!areaId && lines.some((l) => n(l.receivedDirty) > 0 || n(l.stillInUse) > 0) && lines.every(splitOk);
  const totalShortage = lines.reduce((s, l) => s + shortageOf(l), 0);

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const cosignToken = await requestCosign(t("cosign.titleDelivers"));
      if (!cosignToken) return;
      const created = await laundryApi.createDirtyReceipt({
        originWarehouseId: areaId,
        cartNumber: cart.trim() || null,
        shift: shift || null,
        date,
        notes: notes.trim() || null,
        cosignToken,
        lines: lines.map((l) => ({
          productId: l.productId,
          receivedDirty: n(l.receivedDirty),
          stillInUse: n(l.stillInUse),
          good: n(l.good),
          stained: n(l.stained),
          damaged: n(l.damaged),
        })),
      });
      onDone(created.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelCard title={t("dirty.form.title")} description={t("dirty.form.description")}>
      <ITFlex direction="column" gap={4}>
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITSelect
              name="dirtyArea"
              label={t("dirty.form.origin")}
              options={areas.map((a) => ({ value: a.id, label: a.name }))}
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={6} md={2}>
            <ITDatePicker
              name="dirtyDate"
              label={t("dirty.form.date")}
              value={dateStrToLocal(date)}
              onChange={(e) => {
                const v = e.target.value;
                if (v instanceof Date) setDate(localToDateStr(v));
              }}
            />
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITInput name="dirtyCart" label={t("dirty.form.cart")} value={cart} onChange={(e) => setCart(e.target.value)} />
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITSelect
              name="dirtyShift"
              label={t("form.shift")}
              options={[{ value: "", label: t("form.noShift") }, ...SHIFTS.map((s) => ({ value: s, label: tt(`shift.${s}`) }))]}
              value={shift}
              onChange={(e) => setShift(e.target.value)}
            />
          </ITGrid>
        </ITGrid>

        {areaId && lines.length === 0 && <ITText muted>{t("dirty.form.noPrefill")}</ITText>}
        {lines.map((l, index) => {
          const shortage = shortageOf(l);
          return (
            <ITFlex key={l.productId} direction="column" gap={2}>
              <ITFlex justify="between" align="center">
                <ITFlex direction="column">
                  <ITText className="text-[12px] font-bold">{l.name}</ITText>
                  <ITText muted className="font-mono text-[11px]">{l.code}</ITText>
                </ITFlex>
                <ITFlex align="center" gap={3}>
                  <ITText muted className="text-[11px]">{t("dirty.form.delivered")}: <b className="tabular-nums">{fmt(l.delivered)}</b></ITText>
                  <ITText className={`text-[12px] tabular-nums ${shortage > 0 ? "font-bold text-[var(--color-danger)]" : ""}`}>
                    {t("dirty.form.shortage")}: {fmt(shortage)}
                  </ITText>
                  {l.delivered === 0 && (
                    <ITButton variant="outlined" color="secondary" size="sm" title={t("dirty.form.removeLine")} onClick={() => setLines((list) => list.filter((x) => x.productId !== l.productId))}>
                      <FaTrash size={11} />
                    </ITButton>
                  )}
                </ITFlex>
              </ITFlex>
              <ITGrid container columns={10} spacing={3}>
                <ITGrid item xs={5} md={2}>
                  <ITInputNumber name={`dirtyReceived${index}`} label={t("dirty.form.receivedDirty")} decimals={0} min={0} value={l.receivedDirty} onChange={(v) => setReceived(l, v ?? null)} />
                </ITGrid>
                <ITGrid item xs={5} md={2}>
                  <ITInputNumber name={`dirtyInUse${index}`} label={t("dirty.form.stillInUse")} decimals={0} min={0} value={l.stillInUse} onChange={(v) => patch(l.productId, { stillInUse: v ?? null })} />
                </ITGrid>
                <ITGrid item xs={5} md={2}>
                  <ITInputNumber name={`dirtyGood${index}`} label={t("dirty.form.good")} decimals={0} min={0} value={l.good} onChange={(v) => patch(l.productId, { good: v ?? null })} />
                </ITGrid>
                <ITGrid item xs={5} md={2}>
                  <ITInputNumber name={`dirtyStained${index}`} label={t("dirty.form.stained")} decimals={0} min={0} value={l.stained} onChange={(v) => setStained(l, v ?? null)} />
                </ITGrid>
                <ITGrid item xs={5} md={2}>
                  <ITInputNumber name={`dirtyDamaged${index}`} label={t("dirty.form.damaged")} decimals={0} min={0} value={l.damaged} onChange={(v) => setDamaged(l, v ?? null)} />
                </ITGrid>
              </ITGrid>
              {!splitOk(l) && <ITAlert variant="warning">{t("dirty.form.splitMismatch", { n: fmt(n(l.receivedDirty)) })}</ITAlert>}
            </ITFlex>
          );
        })}

        {areaId && (
          <ITSearchSelect
            name="dirtyAddProduct"
            label={t("dirty.form.addItem")}
            options={addable.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }))}
            value=""
            onChange={(v) => v && addLine(String(v))}
          />
        )}
        {totalShortage > 0 && <ITAlert variant="warning">{t("dirty.form.shortageTotal", { n: fmt(totalShortage) })}</ITAlert>}
        <ITTextarea name="dirtyNotes" label={t("form.notes")} rows={2} value={notes} onChange={(e) => setNotes(e)} />
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onCancel} />
          <ITButton variant="filled" color="primary" label={t("dirty.form.save")} disabled={busy || !valid} onClick={() => void submit()} />
        </ITFlex>
      </ITFlex>
    </PanelCard>
  );
}
