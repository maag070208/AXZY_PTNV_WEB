import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITChip, ITFlex } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { reportApi, type AreaReconciliationReport } from "@entities/hotel-linen";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { defaultFrom, fmt, fmtDay, todayStr } from "../lib";
import { PanelCard } from "@shared/ui/panel-card";
import { ExportBar, PeriodFields, ReportTable, type ExportPdf, type ReportCol } from "./common";

/** Conciliación por área: limpios recibidos vs sucios enviados a Lavandería (ajuste demo v2). */
export default function ReconciliationTab({ exportPdf }: { exportPdf: ExportPdf }) {
  const { t } = useTranslation("hotel-linen-report");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(todayStr());
  const [report, setReport] = useState<AreaReconciliationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportApi
      .areaReconciliation(from, to)
      .then((r) => {
        setReport(r);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [from, to]);

  const doc = useMemo<ReportDoc | null>(() => {
    if (!report) return null;
    return {
      title: t("areaReconciliation.title"),
      subtitle: `${fmtDay(report.from)} – ${fmtDay(report.to)}`,
      columns: [
        { key: "area", label: t("areaReconciliation.area") },
        { key: "received", label: t("areaReconciliation.received"), align: "right" },
        { key: "dirty", label: t("areaReconciliation.dirty"), align: "right" },
        { key: "difference", label: t("areaReconciliation.difference"), align: "right" },
        { key: "loss", label: t("areaReconciliation.loss"), align: "right" },
        { key: "stock", label: t("areaReconciliation.stock"), align: "right" },
      ],
      rows: report.rows.map((r) => ({
        area: r.warehouse.name,
        received: fmt(r.received),
        dirty: fmt(r.dirty),
        difference: fmt(r.difference),
        loss: fmt(r.transferLoss),
        stock: fmt(r.stock),
      })),
    };
  }, [report, t]);

  type Row = AreaReconciliationReport["rows"][number];
  const columns: ReportCol<Row>[] = [
    { key: "area", label: t("areaReconciliation.area"), width: 220, value: (r) => r.warehouse.name },
    { key: "received", label: t("areaReconciliation.received"), numeric: true, value: (r) => r.received, render: (r) => fmt(r.received) },
    { key: "dirty", label: t("areaReconciliation.dirty"), numeric: true, value: (r) => r.dirty, render: (r) => fmt(r.dirty) },
    {
      key: "difference",
      label: t("areaReconciliation.difference"),
      numeric: true,
      value: (r) => r.difference,
      render: (r) => (
        <ITChip size="sm" color={Math.abs(r.difference) > Math.max(20, r.received * 0.1) ? "warning" : "info"} label={`${r.difference > 0 ? "+" : ""}${fmt(r.difference)}`} />
      ),
    },
    { key: "loss", label: t("areaReconciliation.loss"), numeric: true, value: (r) => r.transferLoss, render: (r) => (r.transferLoss ? fmt(r.transferLoss) : "—") },
    { key: "stock", label: t("areaReconciliation.stock"), numeric: true, value: (r) => r.stock, render: (r) => fmt(r.stock) },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITFlex justify="between" align="end">
        <PeriodFields from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ExportBar doc={doc} fileName={`blancos-conciliacion-${from}-${to}`} exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <PanelCard title={t("areaReconciliation.title")}>
          <ReportTable rows={report.rows} empty={t("areaReconciliation.none")} columns={columns} />
        </PanelCard>
      )}
    </ITFlex>
  );
}
