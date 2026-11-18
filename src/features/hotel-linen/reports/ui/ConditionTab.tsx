import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITFlex } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { CONDITION_GRADES, reportApi, type ConditionReport } from "@entities/hotel-linen";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { fmt, pct, productLabel } from "../lib";
import { PanelCard } from "@shared/ui/panel-card";
import { ExportBar, ReportTable, type ExportPdf, type ReportCol } from "./common";

/** Estado físico A–E por producto, del último conteo aplicado de cada almacén. */
export default function ConditionTab({ exportPdf }: { exportPdf: ExportPdf }) {
  const { t } = useTranslation("hotel-linen-report");
  const [report, setReport] = useState<ConditionReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportApi.condition().then(setReport).catch((e: Error) => setError(e.message));
  }, []);

  const doc = useMemo<ReportDoc | null>(() => {
    if (!report) return null;
    const rows = report.products.map((p) => ({
      item: productLabel(p.product),
      ...Object.fromEntries(CONDITION_GRADES.flatMap((g) => [[g, fmt(p[g])], [`${g}pct`, pct(p.pct[g])]])),
      total: fmt(p.total),
    }));
    rows.push({
      item: t("condition.totals"),
      ...Object.fromEntries(CONDITION_GRADES.flatMap((g) => [[g, fmt(report.totals[g])], [`${g}pct`, pct(report.totals.pct[g])]])),
      total: fmt(report.totals.total),
    });
    return {
      title: t("condition.title"),
      columns: [
        { key: "item", label: t("condition.item") },
        ...CONDITION_GRADES.flatMap((g) => [
          { key: g, label: t(`condition.grade.${g}`), align: "right" as const },
          { key: `${g}pct`, label: "%", align: "right" as const },
        ]),
        { key: "total", label: t("condition.total"), align: "right" },
      ],
      rows,
    };
  }, [report, t]);

  const columns: ReportCol<ConditionReport["products"][number]>[] = [
    { key: "item", label: t("condition.item"), width: 240, value: (p) => productLabel(p.product) },
    ...CONDITION_GRADES.map((g) => ({
      key: g,
      label: t(`condition.grade.${g}`),
      numeric: true,
      width: 120,
      value: (p: ConditionReport["products"][number]) => p[g],
      render: (p: ConditionReport["products"][number]) => `${fmt(p[g])} (${pct(p.pct[g])})`,
    })),
    { key: "total", label: t("condition.total"), numeric: true, width: 100, value: (p) => p.total, render: (p) => fmt(p.total) },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      {report && (
        <PanelCard
          title={t("condition.title")}
          description={t("condition.description")}
          actions={<ExportBar doc={doc} fileName="blancos-estado-fisico" exportPdf={exportPdf} />}
        >
          <ReportTable
            rows={report.products}
            empty={t("condition.none")}
            columns={columns}
            totals={[
              ...CONDITION_GRADES.map((g) => ({ label: t(`condition.grade.${g}`), value: `${fmt(report.totals[g])} (${pct(report.totals.pct[g])})` })),
              { label: t("condition.totals"), value: fmt(report.totals.total) },
            ]}
          />
        </PanelCard>
      )}
    </ITFlex>
  );
}
