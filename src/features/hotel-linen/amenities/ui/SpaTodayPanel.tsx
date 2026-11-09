import { useCallback, useEffect, useState } from "react";
import { ITAlert, ITDatePicker, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaExclamationTriangle, FaHandHoldingHeart, FaTruck, FaUndo } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { amenityApi, type SpaDaily } from "@entities/hotel-linen";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { dateStrToLocal, fmt, localToDateStr, todayStr } from "../lib";

const cell = "text-[12px] tabular-nums text-right";

/** Toallas del Spa del día: entregadas, sucias devueltas, en uso y faltante. */
export default function SpaTodayPanel() {
  const { t } = useTranslation("hotel-linen-amenity");
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<SpaDaily | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    amenityApi
      .spaDaily(date)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);
  useEffect(load, [load]);

  const totals = data?.totals ?? { delivered: 0, returnedDirty: 0, inUse: 0, shortage: 0 };

  return (
    <PanelCard title={t("spa.title")} description={t("spa.description")}>
      <ITFlex direction="column" gap={4}>
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={3}>
            <ITDatePicker
              name="spaDate"
              label={t("spa.date")}
              value={dateStrToLocal(date)}
              onChange={(e) => {
                const v = e.target.value;
                if (v instanceof Date) setDate(localToDateStr(v));
              }}
            />
          </ITGrid>
        </ITGrid>
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={6} md={3}><KpiTile label={t("spa.delivered")} value={fmt(totals.delivered)} icon={<FaTruck size={14} />} tone="sky" /></ITGrid>
          <ITGrid item xs={6} md={3}><KpiTile label={t("spa.returned")} value={fmt(totals.returnedDirty)} icon={<FaUndo size={14} />} tone="violet" /></ITGrid>
          <ITGrid item xs={6} md={3}><KpiTile label={t("spa.inUse")} value={fmt(totals.inUse)} icon={<FaHandHoldingHeart size={14} />} tone="emerald" /></ITGrid>
          <ITGrid item xs={6} md={3}>
            <KpiTile label={t("spa.shortage")} value={fmt(totals.shortage)} icon={<FaExclamationTriangle size={14} />} tone={totals.shortage > 0 ? "rose" : "neutral"} />
          </ITGrid>
        </ITGrid>
        {!loading && data && !data.warehouse && <ITText muted>{t("spa.noSpa")}</ITText>}
        {!loading && data?.warehouse && data.rows.length === 0 && <ITText muted>{t("spa.none")}</ITText>}
        {data && data.rows.length > 0 && (
          <ITFlex direction="column" gap={2}>
            <ITGrid container columns={12} spacing={3}>
              <ITGrid item xs={4}><ITText muted className="text-[11px]">{t("spa.item")}</ITText></ITGrid>
              {(["delivered", "returned", "inUse", "shortage"] as const).map((k) => (
                <ITGrid key={k} item xs={2}><ITText muted className="text-right text-[11px]">{t(`spa.${k}`)}</ITText></ITGrid>
              ))}
            </ITGrid>
            {data.rows.map((r) => (
              <ITGrid key={r.product.id} container columns={12} spacing={3} className="items-center">
                <ITGrid item xs={4}>
                  <ITText className="text-[12px] font-bold">{r.product.name}</ITText>
                  <ITText muted className="font-mono text-[11px]">{r.product.code}</ITText>
                </ITGrid>
                <ITGrid item xs={2}><ITText className={cell}>{fmt(r.delivered)}</ITText></ITGrid>
                <ITGrid item xs={2}><ITText className={cell}>{fmt(r.returnedDirty)}</ITText></ITGrid>
                <ITGrid item xs={2}><ITText className={cell}>{fmt(r.inUse)}</ITText></ITGrid>
                <ITGrid item xs={2}>
                  <ITText className={`${cell} ${r.shortage > 0 ? "font-bold text-[var(--color-danger)]" : ""}`}>{fmt(r.shortage)}</ITText>
                </ITGrid>
              </ITGrid>
            ))}
          </ITFlex>
        )}
      </ITFlex>
    </PanelCard>
  );
}
