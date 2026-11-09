import { useCallback, useEffect, useState } from "react";
import { ITAlert, ITDatePicker, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaExclamationTriangle, FaTshirt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { laundryApi, type DailyReconciliation } from "@entities/hotel-linen";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { dateStrToLocal, fmt, localToDateStr, todayStr } from "../lib";

const cell = "text-[12px] tabular-nums text-right";

/** Conciliación diaria: por área, entregado a piso vs. sucio recibido y en uso; el faltante en rojo. */
export default function ReconciliationView() {
  const { t } = useTranslation("hotel-linen-laundry");
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<DailyReconciliation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    laundryApi
      .reconciliation(date)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(load, [load]);

  const keys = ["delivered", "receivedDirty", "stillInUse", "shortage"] as const;
  const shortageCls = (n: number) => (n > 0 ? "font-bold text-[var(--color-danger)]" : "");

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={12} md={3}>
          <ITDatePicker
            name="reconciliationDate"
            label={t("reconciliation.date")}
            value={dateStrToLocal(date)}
            onChange={(e) => {
              const v = e.target.value;
              if (v instanceof Date) setDate(localToDateStr(v));
            }}
          />
        </ITGrid>
        <ITGrid item xs={6} md={4}>
          <KpiTile label={t("reconciliation.totals.receivedDirty")} value={fmt(data?.totals.receivedDirty ?? 0)} icon={<FaTshirt size={14} />} tone="sky" />
        </ITGrid>
        <ITGrid item xs={6} md={4}>
          <KpiTile
            label={t("reconciliation.totals.shortage")}
            value={fmt(data?.totals.shortage ?? 0)}
            icon={<FaExclamationTriangle size={14} />}
            tone={(data?.totals.shortage ?? 0) > 0 ? "rose" : "emerald"}
          />
        </ITGrid>
      </ITGrid>

      {!loading && data && data.areas.length === 0 && (
        <PanelCard title={t("reconciliation.title")}>
          <ITText muted>{t("reconciliation.empty")}</ITText>
        </PanelCard>
      )}

      {data?.areas.map((area) => (
        <PanelCard
          key={area.warehouse.id}
          title={area.warehouse.name}
          description={t("reconciliation.receipts", { count: area.receipts })}
        >
          <ITFlex direction="column" gap={2}>
            <ITGrid container columns={12} spacing={3}>
              <ITGrid item xs={4}><ITText muted className="text-[11px]">{t("detail.item")}</ITText></ITGrid>
              {keys.map((k) => (
                <ITGrid key={k} item xs={2}><ITText muted className="text-right text-[11px]">{t(`reconciliation.columns.${k}`)}</ITText></ITGrid>
              ))}
            </ITGrid>
            {area.lines.map((l) => (
              <ITGrid key={l.productId} container columns={12} spacing={3} className="items-center">
                <ITGrid item xs={4}>
                  <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
                  <ITText muted className="font-mono text-[11px]">{[l.product.code, l.product.size].filter(Boolean).join(" · ")}</ITText>
                </ITGrid>
                {keys.map((k) => (
                  <ITGrid key={k} item xs={2}>
                    <ITText className={`${cell} ${k === "shortage" ? shortageCls(l.shortage) : ""}`}>{fmt(l[k])}</ITText>
                  </ITGrid>
                ))}
              </ITGrid>
            ))}
            <ITGrid container columns={12} spacing={3} className="items-center border-t pt-2">
              <ITGrid item xs={4}><ITText className="text-[12px] font-bold">{t("detail.total")}</ITText></ITGrid>
              {keys.map((k) => (
                <ITGrid key={k} item xs={2}>
                  <ITText className={`${cell} font-bold ${k === "shortage" ? shortageCls(area.totals.shortage) : ""}`}>{fmt(area.totals[k])}</ITText>
                </ITGrid>
              ))}
            </ITGrid>
          </ITFlex>
        </PanelCard>
      ))}
    </ITFlex>
  );
}
