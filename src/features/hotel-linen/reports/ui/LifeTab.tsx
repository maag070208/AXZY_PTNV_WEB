import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITBadget, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { reportApi, type LaundryReport } from "@entities/hotel-linen";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { defaultFrom, fmt, fmtDay, productLabel, todayStr } from "../lib";
import { ExportBar, PeriodFields, ReportTable, td, tdLeft, th, thLeft, type ExportPdf } from "./common";

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

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITFlex justify="between" align="end">
        <PeriodFields from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ExportBar doc={doc} fileName={`blancos-vida-util-${from}-${to}`} exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <>
          <ITFlex direction="column" gap={2}>
            <ITText className="text-[13px] font-bold">{t("life.rateTitle")}</ITText>
            <ITText muted className="text-[11px]">{t("life.rateHint")}</ITText>
            <ReportTable
              empty={report.lines.every((l) => l.washed === 0) ? t("life.none") : null}
              head={
                <>
                  <th className={thLeft}>{t("life.item")}</th>
                  <th className={th}>{t("life.washes")}</th>
                  <th className={th}>{t("life.pieces")}</th>
                  <th className={th}>{t("life.rate")}</th>
                  <th className={th}>{t("life.life")}</th>
                  <th className={th}>{t("life.months")}</th>
                </>
              }
            >
              {report.lines
                .filter((l) => l.washed > 0)
                .sort((a, b) => b.rate - a.rate)
                .map((l) => (
                  <tr key={l.product.id} className="border-b border-[var(--color-border)]">
                    <td className={tdLeft}>{productLabel(l.product)}</td>
                    <td className={td}>{fmt(l.washed)}</td>
                    <td className={td}>{fmt(l.totalPieces)}</td>
                    <td className={td}>{l.rate ? l.rate.toFixed(1) : "—"}</td>
                    <td className={td}>{l.washLife ?? "—"}</td>
                    <td className={td}>{l.rate && l.washLife ? `${Math.round(l.washLife / l.rate)}` : "—"}</td>
                  </tr>
                ))}
            </ReportTable>
          </ITFlex>

          <ITFlex direction="column" gap={2}>
            <ITText className="text-[13px] font-bold">{t("life.lotsTitle")}</ITText>
            <ITText muted className="text-[11px]">{t("life.lotsHint")}</ITText>
            <ReportTable
              empty={report.lots.length === 0 ? t("life.noLots") : null}
              head={
                <>
                  <th className={thLeft}>{t("life.lot")}</th>
                  <th className={thLeft}>{t("life.received")}</th>
                  <th className={thLeft}>{t("life.item")}</th>
                  <th className={th}>{t("life.pieces")}</th>
                  <th className={th}>{t("life.age")}</th>
                  <th className={th}>{t("life.estWashes")}</th>
                  <th className={th}>{t("life.used")}</th>
                </>
              }
            >
              {report.lots.map((l) => (
                <tr key={l.id} className="border-b border-[var(--color-border)]">
                  <td className={`${tdLeft} font-mono`}>{l.code}</td>
                  <td className={tdLeft}>{fmtDay(l.receivedAt)}</td>
                  <td className={tdLeft}>{l.product ? productLabel(l.product) : "—"}</td>
                  <td className={td}>{fmt(l.initialQuantity)}</td>
                  <td className={td}>{l.ageMonths.toFixed(1)}</td>
                  <td className={td}>{l.estWashes === null ? "—" : Math.round(l.estWashes)}</td>
                  <td className={td}>
                    {l.pctLife === null ? (
                      "—"
                    ) : (
                      <ITBadget color={l.pctLife >= 1 ? "danger" : l.pctLife >= 0.8 ? "warning" : "success"} size="lg">
                        {pct(l.pctLife)}
                      </ITBadget>
                    )}
                  </td>
                </tr>
              ))}
            </ReportTable>
          </ITFlex>
        </>
      )}
    </ITFlex>
  );
}
