import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITFlex, ITGrid } from "@axzydev/axzy_ui_system";
import { FaTshirt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { reportApi, type LaundryReport } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { KpiTile } from "@shared/ui/kpi-tile";
import { defaultFrom, fmt, fmtDay, productLabel, todayStr } from "../lib";
import { ExportBar, PeriodFields, ReportTable, td, tdLeft, th, thLeft, type ExportPdf } from "./common";

/** Lavandería: piezas lavadas en el periodo, ciclos promedio por lote, existencia por etapa y cuarentena. */
export default function LaundryTab({ exportPdf }: { exportPdf: ExportPdf }) {
  const { t } = useTranslation("hotel-linen-report");
  const tt = dyn(t);
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(todayStr());
  const [report, setReport] = useState<LaundryReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportApi
      .laundry(from, to)
      .then((r) => {
        setReport(r);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [from, to]);

  const doc = useMemo<ReportDoc | null>(() => {
    if (!report) return null;
    const stageCols = report.stages.map((s) => ({ key: s, label: tt(`laundry.stage.${s}`), align: "right" as const }));
    const rows = report.lines.map((l) => ({
      item: productLabel(l.product),
      washed: fmt(l.washed),
      avgCycles: fmt(l.avgCycles),
      rate: l.rate ? l.rate.toFixed(1) : "—",
      life: l.washLife ?? "—",
      ...Object.fromEntries(report.stages.map((s) => [s, fmt(l.stages[s] ?? 0)])),
    }));
    rows.push({
      item: t("laundry.totals"),
      washed: fmt(report.totals.washed),
      avgCycles: fmt(report.totals.avgCycles),
      rate: "—",
      life: "—",
      ...Object.fromEntries(report.stages.map((s) => [s, fmt(report.totals.stages[s] ?? 0)])),
    });
    return {
      title: t("laundry.title"),
      subtitle: `${fmtDay(report.from)} – ${fmtDay(report.to)}`,
      columns: [
        { key: "item", label: t("laundry.item") },
        { key: "washed", label: t("laundry.washed"), align: "right" },
        { key: "avgCycles", label: t("laundry.avgCycles"), align: "right" },
        { key: "rate", label: t("laundry.rate"), align: "right" },
        { key: "life", label: t("laundry.life"), align: "right" },
        ...stageCols,
      ],
      rows,
    };
  }, [report, t, tt]);

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITFlex justify="between" align="end">
        <PeriodFields from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ExportBar doc={doc} fileName={`blancos-lavanderia-${from}-${to}`} exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={6} md={3}><KpiTile label={t("laundry.washed")} value={fmt(report.totals.washed)} icon={<FaTshirt size={14} />} tone="sky" /></ITGrid>
            <ITGrid item xs={6} md={3}><KpiTile label={t("laundry.avgCycles")} value={fmt(report.totals.avgCycles)} icon={<FaTshirt size={14} />} tone="violet" hint={t("laundry.perLot")} /></ITGrid>
            <ITGrid item xs={6} md={3}>
              <KpiTile label={t("laundry.stage.QUARANTINE")} value={fmt(report.totals.quarantine)} icon={<FaTshirt size={14} />} tone={report.totals.quarantine > 0 ? "amber" : "neutral"} hint={report.totals.quarantine > 0 ? undefined : t("allGood")} />
            </ITGrid>
          </ITGrid>
          <ReportTable
            empty={report.lines.length === 0 ? t("laundry.none") : null}
            head={
              <>
                <th className={thLeft}>{t("laundry.item")}</th>
                <th className={th}>{t("laundry.washed")}</th>
                <th className={th}>{t("laundry.avgCycles")}</th>
                <th className={th}>{t("laundry.rate")}</th>
                <th className={th}>{t("laundry.life")}</th>
                {report.stages.map((s) => <th key={s} className={th}>{tt(`laundry.stage.${s}`)}</th>)}
              </>
            }
          >
            {report.lines.map((l) => (
              <tr key={l.product.id} className="border-b border-[var(--color-border)]">
                <td className={tdLeft}>{productLabel(l.product)}</td>
                <td className={td}>{fmt(l.washed)}</td>
                <td className={td}>{fmt(l.avgCycles)}</td>
                <td className={td}>{l.rate ? l.rate.toFixed(1) : "—"}</td>
                <td className={td}>{l.washLife ?? "—"}</td>
                {report.stages.map((s) => <td key={s} className={td}>{fmt(l.stages[s] ?? 0)}</td>)}
              </tr>
            ))}
          </ReportTable>
        </>
      )}
    </ITFlex>
  );
}
