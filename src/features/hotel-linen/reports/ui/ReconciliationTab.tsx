import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITBadget, ITFlex } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { reportApi, type AreaReconciliationReport } from "@entities/hotel-linen";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { defaultFrom, fmt, fmtDay, todayStr } from "../lib";
import { ExportBar, PeriodFields, ReportTable, td, tdLeft, th, thLeft, type ExportPdf } from "./common";

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

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITFlex justify="between" align="end">
        <PeriodFields from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ExportBar doc={doc} fileName={`blancos-conciliacion-${from}-${to}`} exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <ReportTable
          empty={report.rows.length === 0 ? t("areaReconciliation.none") : null}
          head={
            <>
              <th className={thLeft}>{t("areaReconciliation.area")}</th>
              <th className={th}>{t("areaReconciliation.received")}</th>
              <th className={th}>{t("areaReconciliation.dirty")}</th>
              <th className={th}>{t("areaReconciliation.difference")}</th>
              <th className={th}>{t("areaReconciliation.loss")}</th>
              <th className={th}>{t("areaReconciliation.stock")}</th>
            </>
          }
        >
          {report.rows.map((r) => (
            <tr key={r.warehouse.id} className="border-b border-[var(--color-border)]">
              <td className={tdLeft}>{r.warehouse.name}</td>
              <td className={td}>{fmt(r.received)}</td>
              <td className={td}>{fmt(r.dirty)}</td>
              <td className={td}>
                <ITBadget color={Math.abs(r.difference) > Math.max(20, r.received * 0.1) ? "warning" : "info"} size="lg">
                  {r.difference > 0 ? "+" : ""}
                  {fmt(r.difference)}
                </ITBadget>
              </td>
              <td className={td}>{r.transferLoss ? fmt(r.transferLoss) : "—"}</td>
              <td className={td}>{fmt(r.stock)}</td>
            </tr>
          ))}
        </ReportTable>
      )}
    </ITFlex>
  );
}
