import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITChip, ITFlex } from "@axzydev/axzy_ui_system";
import { FaCoins, FaExclamationTriangle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { reportApi, type HotelStockLight, type ParReport } from "@entities/hotel-linen";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { KpiTile } from "@shared/ui/kpi-tile";
import { fmt, money, pct, productLabel } from "../lib";
import { PanelCard } from "@shared/ui/panel-card";
import { ExportBar, ReportTable, type ExportPdf, type ReportCol } from "./common";

const LIGHT_COLOR: Record<HotelStockLight, "success" | "warning" | "danger" | "gray"> = { green: "success", yellow: "warning", red: "danger", none: "gray" };

/** Par e inversión: existencia contra el par, faltante e inversión para llegar al par con IVA 16 % y 8 %. */
export default function ParTab({ exportPdf }: { exportPdf: ExportPdf }) {
  const { t } = useTranslation("hotel-linen-report");
  const [report, setReport] = useState<ParReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportApi.par().then(setReport).catch((e: Error) => setError(e.message));
  }, []);

  const doc = useMemo<ReportDoc | null>(() => {
    if (!report) return null;
    const rows = report.lines.map((l) => ({
      item: productLabel(l),
      total: fmt(l.total),
      par: fmt(l.par),
      pct: pct(l.pct),
      light: t(`light.${l.light}`),
      shortfall: fmt(l.shortfall),
      cost: l.lastCost === null ? "—" : money(l.lastCost),
      subtotal: money(l.subtotal),
      total16: money(l.total16),
      total8: money(l.total8),
    }));
    rows.push({ item: t("par.totals"), total: "", par: "", pct: "", light: "", shortfall: fmt(report.totals.shortfall), cost: "", subtotal: money(report.totals.subtotal), total16: money(report.totals.total16), total8: money(report.totals.total8) });
    return {
      title: t("par.title"),
      subtitle: t("par.subtitle", { count: report.withoutCost.length }),
      columns: [
        { key: "item", label: t("par.item") },
        { key: "total", label: t("par.total"), align: "right" },
        { key: "par", label: t("par.par"), align: "right" },
        { key: "pct", label: t("par.pct"), align: "right" },
        { key: "light", label: t("par.light"), align: "center" },
        { key: "shortfall", label: t("par.shortfall"), align: "right" },
        { key: "cost", label: t("par.cost"), align: "right" },
        { key: "subtotal", label: t("par.subtotal"), align: "right" },
        { key: "total16", label: t("par.total16"), align: "right" },
        { key: "total8", label: t("par.total8"), align: "right" },
      ],
      rows,
    };
  }, [report, t]);

  const parColumns: ReportCol<ParReport["lines"][number]>[] = [
    { key: "name", label: t("par.item"), width: 240, value: (l) => productLabel(l), render: (l) => `${productLabel(l)} · ${l.code}` },
    {
      key: "total",
      label: t("par.total"),
      numeric: true,
      width: 110,
      value: (l) => l.total,
      render: (l) => `${fmt(l.total)}${l.inTransit > 0 ? ` (${t("par.transit", { count: l.inTransit })})` : ""}`,
    },
    { key: "par", label: t("par.par"), numeric: true, width: 90, value: (l) => l.par, render: (l) => fmt(l.par) },
    { key: "pct", label: t("par.pct"), numeric: true, width: 90, value: (l) => l.pct ?? -1, render: (l) => pct(l.pct) },
    {
      key: "light",
      label: t("par.light"),
      width: 110,
      filter: false,
      value: (l) => l.light,
      render: (l) => <ITChip size="sm" color={LIGHT_COLOR[l.light]} label={t(`light.${l.light}`)} />,
    },
    { key: "shortfall", label: t("par.shortfall"), numeric: true, width: 110, value: (l) => l.shortfall, render: (l) => fmt(l.shortfall) },
    { key: "cost", label: t("par.cost"), numeric: true, width: 110, value: (l) => l.lastCost ?? -1, render: (l) => (l.lastCost === null ? "—" : money(l.lastCost)) },
    { key: "subtotal", label: t("par.subtotal"), numeric: true, width: 120, value: (l) => l.subtotal, render: (l) => money(l.subtotal) },
    { key: "total16", label: t("par.total16"), numeric: true, width: 120, value: (l) => l.total16, render: (l) => money(l.total16) },
    { key: "total8", label: t("par.total8"), numeric: true, width: 120, value: (l) => l.total8, render: (l) => money(l.total8) },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      {report && (
        <>
          <div className="grid !grid-cols-2 gap-4 md:!grid-cols-4">
            <KpiTile label={t("par.kpi.subtotal")} value={money(report.totals.subtotal)} icon={<FaCoins size={14} />} tone="sky" hint={t("par.kpi.beforeTax")} />
            <KpiTile label={t("par.kpi.total16")} value={money(report.totals.total16)} icon={<FaCoins size={14} />} tone="violet" hint={t("par.kpi.iva", { rate: 16 })} />
            <KpiTile label={t("par.kpi.total8")} value={money(report.totals.total8)} icon={<FaCoins size={14} />} tone="emerald" hint={t("par.kpi.iva", { rate: 8 })} />
            <KpiTile label={t("par.kpi.noCost")} value={report.withoutCost.length} icon={<FaExclamationTriangle size={14} />} tone={report.withoutCost.length > 0 ? "amber" : "neutral"} hint={report.withoutCost.length === 0 ? t("allGood") : undefined} />
          </div>
          <PanelCard title={t("par.title")} description={t("par.description")} actions={<ExportBar doc={doc} fileName="blancos-par-inversion" exportPdf={exportPdf} />}>
            <ReportTable
              rows={report.lines}
              empty={t("par.none")}
              columns={parColumns}
              totals={[
                { label: t("par.shortfall"), value: fmt(report.totals.shortfall) },
                { label: t("par.subtotal"), value: money(report.totals.subtotal) },
                { label: t("par.total16"), value: money(report.totals.total16) },
                { label: t("par.total8"), value: money(report.totals.total8) },
              ]}
            />
          </PanelCard>
          {report.withoutCost.length > 0 && (
            <ITAlert variant="warning">
              {t("par.withoutCost", { items: report.withoutCost.map((p) => productLabel(p)).join(", ") })}
            </ITAlert>
          )}
        </>
      )}
    </ITFlex>
  );
}
