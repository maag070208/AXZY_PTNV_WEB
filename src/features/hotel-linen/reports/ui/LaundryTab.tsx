import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITFlex } from "@axzydev/axzy_ui_system";
import { FaTshirt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { reportApi, type LaundryReport } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { KpiTile } from "@shared/ui/kpi-tile";
import { defaultFrom, fmt, fmtDay, productLabel, todayStr } from "../lib";
import { PanelCard } from "@shared/ui/panel-card";
import { ExportBar, PeriodFields, ReportTable, type ExportPdf, type ReportCol } from "./common";

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

  type Row = LaundryReport["lines"][number];
  const columns: ReportCol<Row>[] = report
    ? [
        { key: "item", label: t("laundry.item"), width: 240, value: (l) => productLabel(l.product) },
        { key: "washed", label: t("laundry.washed"), numeric: true, width: 100, value: (l) => l.washed, render: (l) => fmt(l.washed) },
        { key: "avgCycles", label: t("laundry.avgCycles"), numeric: true, width: 110, value: (l) => l.avgCycles, render: (l) => fmt(l.avgCycles) },
        { key: "rate", label: t("laundry.rate"), numeric: true, width: 90, value: (l) => l.rate, render: (l) => (l.rate ? l.rate.toFixed(1) : "—") },
        { key: "life", label: t("laundry.life"), numeric: true, width: 90, value: (l) => l.washLife ?? -1, render: (l) => l.washLife ?? "—" },
        ...report.stages.map((s) => ({
          key: `stage-${s}`,
          label: tt(`laundry.stage.${s}`),
          numeric: true,
          width: 110,
          value: (l: Row) => l.stages[s] ?? 0,
          render: (l: Row) => fmt(l.stages[s] ?? 0),
        })),
      ]
    : [];

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITFlex justify="between" align="end">
        <PeriodFields from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ExportBar doc={doc} fileName={`blancos-lavanderia-${from}-${to}`} exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <>
          <div className="grid !grid-cols-2 gap-4 md:!grid-cols-3">
            <KpiTile label={t("laundry.washed")} value={fmt(report.totals.washed)} icon={<FaTshirt size={14} />} tone="sky" />
            <KpiTile label={t("laundry.avgCycles")} value={fmt(report.totals.avgCycles)} icon={<FaTshirt size={14} />} tone="violet" hint={t("laundry.perLot")} />
            <KpiTile label={t("laundry.stage.QUARANTINE")} value={fmt(report.totals.quarantine)} icon={<FaTshirt size={14} />} tone={report.totals.quarantine > 0 ? "amber" : "neutral"} hint={report.totals.quarantine > 0 ? undefined : t("allGood")} />
          </div>
          <PanelCard title={t("laundry.title")}>
            <ReportTable rows={report.lines} empty={t("laundry.none")} columns={columns} />
          </PanelCard>
        </>
      )}
    </ITFlex>
  );
}
