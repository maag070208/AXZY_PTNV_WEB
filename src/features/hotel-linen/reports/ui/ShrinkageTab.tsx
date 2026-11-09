import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITFlex, ITGrid } from "@axzydev/axzy_ui_system";
import { FaBalanceScale } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { SHRINKAGE_SOURCES, reportApi, type ShrinkageReport } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { KpiTile } from "@shared/ui/kpi-tile";
import { defaultFrom, fmt, fmtDay, money, productLabel, todayStr } from "../lib";
import { ExportBar, PeriodFields, ReportTable, td, tdLeft, th, thLeft, type ExportPdf } from "./common";

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

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITFlex justify="between" align="end">
        <PeriodFields from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ExportBar doc={doc} fileName={`blancos-merma-${from}-${to}`} exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <>
          <ITGrid container columns={12} spacing={3}>
            {SHRINKAGE_SOURCES.map((s) => (
              <ITGrid item xs={6} md={3} key={s}>
                <KpiTile
                  label={t(`shrinkage.source.${s}`)}
                  value={fmt(report.bySource[s].pieces)}
                  icon={<FaBalanceScale size={14} />}
                  tone={report.bySource[s].pieces > 0 ? SOURCE_TONE[s] : "neutral"}
                  hint={report.bySource[s].pieces > 0 ? money(report.bySource[s].amount) : t("allGood")}
                />
              </ITGrid>
            ))}
          </ITGrid>
          <ReportTable
            empty={report.products.length === 0 ? t("shrinkage.none") : null}
            head={
              <>
                <th className={thLeft}>{t("shrinkage.item")}</th>
                {SHRINKAGE_SOURCES.map((s) => <th key={s} className={th}>{t(`shrinkage.source.${s}`)}</th>)}
                <th className={th}>{t("shrinkage.pieces")}</th>
                <th className={th}>{t("shrinkage.amount")}</th>
              </>
            }
          >
            {report.products.map((p) => (
              <tr key={p.productId} className="border-b border-[var(--color-border)]">
                <td className={tdLeft}>{p.product ? productLabel(p.product) : p.productId}</td>
                {SHRINKAGE_SOURCES.map((s) => <td key={s} className={td}>{p.sources[s] ? fmt(p.sources[s]) : "—"}</td>)}
                <td className={`${td} font-bold`}>{fmt(p.pieces)}</td>
                <td className={td}>{money(p.amount)}</td>
              </tr>
            ))}
            {report.products.length > 0 && (
              <tr className="font-bold">
                <td className={tdLeft}>{t("shrinkage.totals")}</td>
                {SHRINKAGE_SOURCES.map((s) => <td key={s} className={td}>{fmt(report.bySource[s].pieces)}</td>)}
                <td className={td}>{fmt(report.total.pieces)}</td>
                <td className={td}>{money(report.total.amount)}</td>
              </tr>
            )}
          </ReportTable>
          {Object.keys(report.byReason).length > 0 && (
            <ReportTable
              head={
                <>
                  <th className={thLeft}>{t("shrinkage.reason")}</th>
                  <th className={th}>{t("shrinkage.pieces")}</th>
                  <th className={th}>{t("shrinkage.amount")}</th>
                </>
              }
            >
              {Object.entries(report.byReason).map(([code, v]) => (
                <tr key={code} className="border-b border-[var(--color-border)]">
                  <td className={tdLeft}>{code} · {tt(`shrinkage.reasonName.${code}`, { defaultValue: code })}</td>
                  <td className={td}>{fmt(v.pieces)}</td>
                  <td className={td}>{money(v.amount)}</td>
                </tr>
              ))}
            </ReportTable>
          )}
        </>
      )}
    </ITFlex>
  );
}
