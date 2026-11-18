import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITFlex, ITGrid, ITSegmentedControl, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaClipboardList, FaExclamationTriangle, FaTruck, FaWarehouse } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, restockApi, RESTOCK_FACTORS, type HotelWarehouse, type RestockResult } from "@entities/hotel-linen";
import { KpiTile } from "@shared/ui/kpi-tile";

interface Props {
  /** Lleva al pedido de área creado. */
  onCreated: (requestId: string) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
const th = "px-2 py-2 text-[11px] font-bold uppercase text-right";
const td = "px-2 py-1.5 text-[12px] tabular-nums text-right";

/** Reposición por dotación: déficit = objetivo (dotación x factor) - (tiene + en camino) de una ropería de zona. */
export default function RestockBoard({ onCreated }: Props) {
  const { t } = useTranslation("hotel-linen-restock");
  const [areas, setAreas] = useState<HotelWarehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [factor, setFactor] = useState(1);
  const [result, setResult] = useState<RestockResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hotelLinenApi
      .warehouses()
      .then((all) => {
        const zones = all.filter((w) => w.kind === "ZONE" && w.zoneId && w.active);
        setAreas(zones);
        if (zones.length === 1) setWarehouseId(zones[0].id);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!warehouseId) {
      setResult(null);
      return;
    }
    let active = true;
    setError(null);
    restockApi
      .compute(warehouseId, factor)
      .then((r) => active && setResult(r))
      .catch((e: Error) => active && (setResult(null), setError(e.message)));
    return () => {
      active = false;
    };
  }, [warehouseId, factor]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await restockApi.request(warehouseId, factor);
      onCreated(created.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITFlex align="end" gap={4} wrap="wrap">
        <div className="min-w-[260px]">
          <ITSelect
            name="restockArea"
            label={t("area")}
            options={areas.map((a) => ({ value: a.id, label: `${a.code} · ${a.name}` }))}
            value={warehouseId}
            onChange={(e) => setWarehouseId(String(e.target.value))}
          />
        </div>
        <div>
          <ITText muted className="mb-1 text-[11px]">{t("factor")}</ITText>
          <ITSegmentedControl
            size="sm"
            value={String(factor)}
            onChange={(v) => setFactor(Number(v))}
            options={RESTOCK_FACTORS.map((f) => ({ value: String(f), label: `x${f}` }))}
          />
        </div>
        <ITButton
          variant="filled"
          color="primary"
          icon={<FaClipboardList size={12} />}
          label={t("generate")}
          disabled={!result || result.totals.deficit === 0 || busy}
          onClick={() => void generate()}
        />
      </ITFlex>
      <ITText muted className="text-[12px]">{t("formula")}</ITText>

      {!warehouseId && <ITText muted className="text-[12px]">{t("pick")}</ITText>}
      {result && (
        <>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={6} md={3}><KpiTile label={t("target")} value={fmt(result.totals.target)} icon={<FaBoxOpen size={14} />} tone="sky" hint={t("rooms", { count: result.rooms })} /></ITGrid>
            <ITGrid item xs={6} md={3}><KpiTile label={t("onHand")} value={fmt(result.totals.onHand)} icon={<FaWarehouse size={14} />} tone="emerald" /></ITGrid>
            <ITGrid item xs={6} md={3}><KpiTile label={t("incoming")} value={fmt(result.totals.incoming)} icon={<FaTruck size={14} />} tone="violet" /></ITGrid>
            <ITGrid item xs={6} md={3}><KpiTile label={t("deficit")} value={fmt(result.totals.deficit)} icon={<FaExclamationTriangle size={14} />} tone={result.totals.deficit > 0 ? "amber" : "neutral"} hint={result.totals.deficit === 0 ? t("noDeficit") : undefined} /></ITGrid>
          </ITGrid>
          {result.lines.length === 0 ? (
            <ITText muted className="py-3 text-[12px]">{t("noPar")}</ITText>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-2 py-2 text-[11px] font-bold uppercase text-left">{t("item")}</th>
                    {(["target", "onHand", "incoming", "deficit"] as const).map((k) => <th key={k} className={th}>{t(k)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {result.lines.map((l) => (
                    <tr key={l.productId} className="border-b border-[var(--color-border)]">
                      <td className="px-2 py-1.5 text-[12px] text-left">{l.name}{l.size ? ` · ${l.size}` : ""}<span className="ml-2 font-mono text-[11px] opacity-60">{l.code}</span></td>
                      <td className={td}>{fmt(l.target)}</td>
                      <td className={td}>{fmt(l.onHand)}</td>
                      <td className={td}>{fmt(l.incoming)}</td>
                      <td className={`${td} font-bold`}>{fmt(l.deficit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </ITFlex>
  );
}
