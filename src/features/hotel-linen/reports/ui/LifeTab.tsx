import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITChip, ITFlex } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { reportApi, type LaundryReport } from "@entities/hotel-linen";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { defaultFrom, fmt, fmtDay, productLabel, todayStr } from "../lib";
import { PanelCard } from "@shared/ui/panel-card";
import { ExportBar, PeriodFields, ReportTable, type ExportPdf, type ReportCol } from "./common";

const pct = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);

/** Lotes y vida útil: ritmo de lavado por artículo y % de vida usada por lote (ajuste demo v2). */
export default function LifeTab({ exportPdf }: { exportPdf: ExportPdf }) {
  const { t } = useTranslation("hotel-linen-report");
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
    const rateRows = report.lines
      .filter((l) => l.washed > 0)
      .sort((a, b) => b.rate - a.rate)
      .map((l) => ({
        item: productLabel(l.product),
        washes: fmt(l.washed),
        pieces: fmt(l.totalPieces),
        rate: l.rate ? l.rate.toFixed(1) : "—",
        life: l.washLife ?? "—",
        months: l.rate && l.washLife ? `${Math.round(l.washLife / l.rate)}` : "—",
      }));
    return {
      title: t("life.title"),
      subtitle: `${fmtDay(report.from)} – ${fmtDay(report.to)}`,
      columns: [
        { key: "item", label: t("life.item") },
        { key: "washes", label: t("life.washes"), align: "right" },
        { key: "pieces", label: t("life.pieces"), align: "right" },
        { key: "rate", label: t("life.rate"), align: "right" },
        { key: "life", label: t("life.life"), align: "right" },
        { key: "months", label: t("life.months"), align: "right" },
      ],
      rows: rateRows,
    };
  }, [report, t]);

  const rateRows = useMemo(
    () => (report ? report.lines.filter((l) => l.washed > 0).sort((a, b) => b.rate - a.rate) : []),
    [report]
  );
  const rateColumns: ReportCol<(typeof rateRows)[number]>[] = [
    { key: "item", label: t("life.item"), width: 240, value: (l) => productLabel(l.product) },
    { key: "washes", label: t("life.washes"), numeric: true, value: (l) => l.washed, render: (l) => fmt(l.washed) },
    { key: "pieces", label: t("life.pieces"), numeric: true, value: (l) => l.totalPieces, render: (l) => fmt(l.totalPieces) },
    { key: "rate", label: t("life.rate"), numeric: true, value: (l) => l.rate, render: (l) => (l.rate ? l.rate.toFixed(1) : "—") },
    { key: "life", label: t("life.life"), numeric: true, value: (l) => l.washLife ?? -1, render: (l) => l.washLife ?? "—" },
    {
      key: "months",
      label: t("life.months"),
      numeric: true,
      value: (l) => (l.rate && l.washLife ? Math.round(l.washLife / l.rate) : -1),
      render: (l) => (l.rate && l.washLife ? `${Math.round(l.washLife / l.rate)}` : "—"),
    },
  ];
  type Lot = LaundryReport["lots"][number];
  const lotColumns: ReportCol<Lot>[] = [
    { key: "code", label: t("life.lot"), width: 130, value: (l) => l.code },
    { key: "received", label: t("life.received"), width: 130, value: (l) => l.receivedAt, render: (l) => fmtDay(l.receivedAt) },
    { key: "item", label: t("life.item"), width: 220, value: (l) => (l.product ? productLabel(l.product) : "—") },
    { key: "pieces", label: t("life.pieces"), numeric: true, value: (l) => l.initialQuantity, render: (l) => fmt(l.initialQuantity) },
    { key: "age", label: t("life.age"), numeric: true, value: (l) => l.ageMonths, render: (l) => l.ageMonths.toFixed(1) },
    { key: "estWashes", label: t("life.estWashes"), numeric: true, value: (l) => l.estWashes ?? -1, render: (l) => (l.estWashes === null ? "—" : Math.round(l.estWashes)) },
    {
      key: "used",
      label: t("life.used"),
      numeric: true,
      value: (l) => l.pctLife ?? -1,
      render: (l) =>
        l.pctLife === null ? "—" : <ITChip size="sm" color={l.pctLife >= 1 ? "danger" : l.pctLife >= 0.8 ? "warning" : "success"} label={pct(l.pctLife)} />,
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITFlex justify="between" align="end">
        <PeriodFields from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ExportBar doc={doc} fileName={`blancos-vida-util-${from}-${to}`} exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <>
          <PanelCard title={t("life.rateTitle")} description={t("life.rateHint")}>
            <ReportTable rows={rateRows} empty={t("life.none")} columns={rateColumns} />
          </PanelCard>
          <PanelCard title={t("life.lotsTitle")} description={t("life.lotsHint")}>
            <ReportTable rows={report.lots} empty={t("life.noLots")} columns={lotColumns} />
          </PanelCard>
        </>
      )}
    </ITFlex>
  );
}
