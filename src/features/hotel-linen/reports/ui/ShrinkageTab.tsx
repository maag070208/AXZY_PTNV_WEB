import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITFlex } from "@axzydev/axzy_ui_system";
import { FaBalanceScale } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { SHRINKAGE_SOURCES, reportApi, type ShrinkageReport } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { KpiTile } from "@shared/ui/kpi-tile";
import { defaultFrom, fmt, fmtDay, money, productLabel, todayStr } from "../lib";
import { PanelCard } from "@shared/ui/panel-card";
import { ExportBar, PeriodFields, ReportTable, type ExportPdf, type ReportCol } from "./common";

const SOURCE_TONE = { TRANSFER: "sky", COUNT: "violet", TOWEL: "amber", WRITEOFF: "rose" } as const;

/** Merma del periodo en piezas y pesos, por fuente y por producto. */
export default function ShrinkageTab({ exportPdf }: { exportPdf: ExportPdf }) {
  const { t } = useTranslation("hotel-linen-report");
  const tt = dyn(t);
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(todayStr());
  const [report, setReport] = useState<ShrinkageReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportApi
      .shrinkage(from, to)
      .then((r) => {
        setReport(r);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [from, to]);

  const doc = useMemo<ReportDoc | null>(() => {
    if (!report) return null;
    const rows = report.products.map((p) => ({
      item: p.product ? productLabel(p.product) : p.productId,
      ...Object.fromEntries(SHRINKAGE_SOURCES.map((s) => [s, fmt(p.sources[s])])),
      pieces: fmt(p.pieces),
      amount: money(p.amount),
    }));
    rows.push({
      item: t("shrinkage.totals"),
      ...Object.fromEntries(SHRINKAGE_SOURCES.map((s) => [s, `${fmt(report.bySource[s].pieces)} / ${money(report.bySource[s].amount)}`])),
      pieces: fmt(report.total.pieces),
      amount: money(report.total.amount),
    });
    return {
      title: t("shrinkage.title"),
      subtitle: `${fmtDay(report.from)} – ${fmtDay(report.to)}`,
      columns: [
        { key: "item", label: t("shrinkage.item") },
        ...SHRINKAGE_SOURCES.map((s) => ({ key: s, label: t(`shrinkage.source.${s}`), align: "right" as const })),
        { key: "pieces", label: t("shrinkage.pieces"), align: "right" },
        { key: "amount", label: t("shrinkage.amount"), align: "right" },
      ],
      rows,
    };
  }, [report, t]);

  type Row = ShrinkageReport["products"][number];
  const columns: ReportCol<Row>[] = [
    { key: "item", label: t("shrinkage.item"), width: 240, value: (p) => (p.product ? productLabel(p.product) : p.productId) },
    ...SHRINKAGE_SOURCES.map((s) => ({
      key: s,
      label: t(`shrinkage.source.${s}`),
      numeric: true,
      width: 110,
      value: (p: Row) => p.sources[s],
      render: (p: Row) => (p.sources[s] ? fmt(p.sources[s]) : "—"),
    })),
    { key: "pieces", label: t("shrinkage.pieces"), numeric: true, width: 100, value: (p) => p.pieces, render: (p) => fmt(p.pieces) },
    { key: "amount", label: t("shrinkage.amount"), numeric: true, width: 120, value: (p) => p.amount, render: (p) => money(p.amount) },
  ];
  const reasonRows = useMemo(
    () => Object.entries(report?.byReason ?? {}).map(([code, v]) => ({ code, pieces: v.pieces, amount: v.amount })),
    [report]
  );
  const reasonColumns: ReportCol<(typeof reasonRows)[number]>[] = [
    { key: "code", label: t("shrinkage.reason"), width: 260, value: (r) => `${r.code} · ${tt(`shrinkage.reasonName.${r.code}`, { defaultValue: r.code })}` },
    { key: "pieces", label: t("shrinkage.pieces"), numeric: true, value: (r) => r.pieces, render: (r) => fmt(r.pieces) },
    { key: "amount", label: t("shrinkage.amount"), numeric: true, value: (r) => r.amount, render: (r) => money(r.amount) },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITFlex justify="between" align="end">
        <PeriodFields from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ExportBar doc={doc} fileName={`blancos-merma-${from}-${to}`} exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <>
          <div className="grid !grid-cols-2 gap-4 md:!grid-cols-4">
            {SHRINKAGE_SOURCES.map((s) => (
              
                <KpiTile
                  label={t(`shrinkage.source.${s}`)}
                  value={fmt(report.bySource[s].pieces)}
                  icon={<FaBalanceScale size={14} />}
                  tone={report.bySource[s].pieces > 0 ? SOURCE_TONE[s] : "neutral"}
                  hint={report.bySource[s].pieces > 0 ? money(report.bySource[s].amount) : t("allGood")}
                />
              
            ))}
          </div>
          <PanelCard title={t("shrinkage.title")}>
            <ReportTable
              rows={report.products}
              empty={t("shrinkage.none")}
              columns={columns}
              totals={[
                { label: t("shrinkage.pieces"), value: fmt(report.total.pieces) },
                { label: t("shrinkage.amount"), value: money(report.total.amount) },
              ]}
            />
          </PanelCard>
          {reasonRows.length > 0 && (
            <PanelCard title={t("shrinkage.reason")}>
              <ReportTable rows={reasonRows} columns={reasonColumns} />
            </PanelCard>
          )}
        </>
      )}
    </ITFlex>
  );
}
