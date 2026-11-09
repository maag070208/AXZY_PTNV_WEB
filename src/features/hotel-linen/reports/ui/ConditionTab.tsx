import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { CONDITION_GRADES, reportApi, type ConditionReport } from "@entities/hotel-linen";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { fmt, pct, productLabel } from "../lib";
import { ExportBar, ReportTable, td, tdLeft, th, thLeft, type ExportPdf } from "./common";

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

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITFlex justify="between" align="center">
        <ITText muted className="text-[12px]">{t("condition.description")}</ITText>
        <ExportBar doc={doc} fileName="blancos-estado-fisico" exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <ReportTable
          empty={report.products.length === 0 ? t("condition.none") : null}
          head={
            <>
              <th className={thLeft}>{t("condition.item")}</th>
              {CONDITION_GRADES.map((g) => <th key={g} className={th} colSpan={2}>{t(`condition.grade.${g}`)}</th>)}
              <th className={th}>{t("condition.total")}</th>
            </>
          }
        >
          {report.products.map((p) => (
            <tr key={p.product.id} className="border-b border-[var(--color-border)]">
              <td className={tdLeft}>{productLabel(p.product)}</td>
              {CONDITION_GRADES.map((g) => (
                <td key={g} className={td} colSpan={2}>{fmt(p[g])} <span className="opacity-60">({pct(p.pct[g])})</span></td>
              ))}
              <td className={`${td} font-bold`}>{fmt(p.total)}</td>
            </tr>
          ))}
          {report.products.length > 0 && (
            <tr className="font-bold">
              <td className={tdLeft}>{t("condition.totals")}</td>
              {CONDITION_GRADES.map((g) => (
                <td key={g} className={td} colSpan={2}>{fmt(report.totals[g])} <span className="opacity-60">({pct(report.totals.pct[g])})</span></td>
              ))}
              <td className={td}>{fmt(report.totals.total)}</td>
            </tr>
          )}
        </ReportTable>
      )}
    </ITFlex>
  );
}
