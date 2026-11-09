import { useEffect, useMemo, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInputNumber,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaMagic } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  hotelLinenApi,
  laundryApi,
  type HotelProduct,
  type HotelWarehouse,
} from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { AREA_KINDS, SHIFTS, dateStrToLocal, localToDateStr, todayStr } from "../lib";

interface Props {
  onDone: (id: string) => void;
  onCancel: () => void;
}

/** Nuevo pedido de área: área, salidas/ocupadas con sugerido y cantidades por artículo agrupadas por categoría. */
export default function SupplyRequestForm({ onDone, onCancel }: Props) {
  const { t } = useTranslation("hotel-linen-laundry");
  const tt = dyn(t);
  const [areas, setAreas] = useState<HotelWarehouse[]>([]);
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [areaId, setAreaId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [shift, setShift] = useState("");
  const [checkouts, setCheckouts] = useState<number | null>(0);
  const [occupied, setOccupied] = useState<number | null>(0);
  const [qty, setQty] = useState<Record<string, number | null>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
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

  // Artículos agrupados por categoría (orden alfabético; sin categoría al final).
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; items: HotelProduct[] }>();
    for (const p of products) {
      const key = p.category?.id ?? "";
      const group = map.get(key) ?? { name: p.category?.name ?? t("form.noCategory"), items: [] };
      group.items.push(p);
      map.set(key, group);
    }
    return [...map.entries()]
      .sort(([ka, a], [kb, b]) => (ka === "" ? 1 : kb === "" ? -1 : a.name.localeCompare(b.name)))
      .map(([key, g]) => ({ key, ...g, items: g.items.sort((a, b) => a.code.localeCompare(b.code)) }));
  }, [products, t]);

  const suggest = async () => {
    if (!areaId) return;
    setSuggesting(true);
    setError(null);
    setInfo(null);
    try {
      const s = await laundryApi.suggestion(areaId, checkouts ?? 0, occupied ?? 0);
      if (s.lines.length === 0) {
        setInfo(t("form.suggestEmpty"));
      } else {
        setQty((q) => ({ ...q, ...Object.fromEntries(s.lines.map((l) => [l.productId, l.quantity])) }));
        setInfo(t("form.suggestDone", { rooms: s.rooms }));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSuggesting(false);
    }
  };

  const chosen = Object.entries(qty).filter(([, n]) => n !== null && n > 0);
  const valid = !!areaId && chosen.length > 0;

  const save = async (andSubmit: boolean) => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const created = await laundryApi.createRequest({
        requestingWarehouseId: areaId,
        date,
        shift: shift || null,
        checkouts: checkouts ?? 0,
        occupied: occupied ?? 0,
        notes: notes.trim() || null,
        lines: chosen.map(([productId, n]) => ({ productId, requestedQty: n as number })),
      });
      if (andSubmit) await laundryApi.submitRequest(created.id);
      onDone(created.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelCard title={t("form.title")} description={t("form.description")}>
      <ITFlex direction="column" gap={4}>
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        {info && (
          <ITAlert variant="info" dismissible onDismiss={() => setInfo(null)}>
            {info}
          </ITAlert>
        )}
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITSelect
              name="requestArea"
              label={t("form.area")}
              options={areas.map((a) => ({ value: a.id, label: a.name }))}
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={6} md={2}>
            <ITDatePicker
              name="requestDate"
              label={t("form.date")}
              value={dateStrToLocal(date)}
              onChange={(e) => {
                const v = e.target.value;
                if (v instanceof Date) setDate(localToDateStr(v));
              }}
            />
          </ITGrid>
          <ITGrid item xs={6} md={2}>
            <ITSelect
              name="requestShift"
              label={t("form.shift")}
              options={[{ value: "", label: t("form.noShift") }, ...SHIFTS.map((s) => ({ value: s, label: tt(`shift.${s}`) }))]}
              value={shift}
              onChange={(e) => setShift(e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={4} md={1}>
            <ITInputNumber name="requestCheckouts" label={t("form.checkouts")} decimals={0} min={0} value={checkouts} onChange={(v) => setCheckouts(v ?? null)} />
          </ITGrid>
          <ITGrid item xs={4} md={1}>
            <ITInputNumber name="requestOccupied" label={t("form.occupied")} decimals={0} min={0} value={occupied} onChange={(v) => setOccupied(v ?? null)} />
          </ITGrid>
          <ITGrid item xs={4} md={2}>
            <ITButton
              variant="outlined"
              color="primary"
              size="lg"
              icon={<FaMagic size={12} />}
              label={t("form.suggest")}
              disabled={!areaId || suggesting}
              onClick={() => void suggest()}
            />
          </ITGrid>
        </ITGrid>

        {groups.length === 0 && <ITText muted>{t("form.noProducts")}</ITText>}
        {groups.map((g) => (
          <ITFlex key={g.key} direction="column" gap={2}>
            <ITText className="text-[12px] font-bold uppercase tracking-wide">{g.name}</ITText>
            <ITGrid container columns={12} spacing={3}>
              {g.items.map((p) => (
                <ITGrid key={p.id} item xs={12} md={4}>
                  <ITInputNumber
                    name={`requestQty-${p.id}`}
                    label={`${p.name}${p.size ? ` · ${p.size}` : ""}`}
                    decimals={0}
                    min={0}
                    value={qty[p.id] ?? null}
                    onChange={(v) => setQty((q) => ({ ...q, [p.id]: v ?? null }))}
                  />
                </ITGrid>
              ))}
            </ITGrid>
          </ITFlex>
        ))}

        <ITTextarea name="requestNotes" label={t("form.notes")} rows={2} value={notes} onChange={(e) => setNotes(e)} />
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onCancel} />
          <ITButton variant="outlined" color="primary" label={t("form.saveDraft")} disabled={busy || !valid} onClick={() => void save(false)} />
          <ITButton variant="filled" color="primary" label={t("form.saveSubmit")} disabled={busy || !valid} onClick={() => void save(true)} />
        </ITFlex>
      </ITFlex>
    </PanelCard>
  );
}
