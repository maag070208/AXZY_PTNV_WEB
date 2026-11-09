import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITChip, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaCoins, FaExclamationTriangle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { reportApi, type HotelStockLight, type ParReport } from "@entities/hotel-linen";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { KpiTile } from "@shared/ui/kpi-tile";
import { fmt, money, pct, productLabel } from "../lib";
import { ExportBar, ReportTable, td, tdLeft, th, thLeft, type ExportPdf } from "./common";

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

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITFlex justify="between" align="center">
        <ITText muted className="text-[12px]">{t("par.description")}</ITText>
        <ExportBar doc={doc} fileName="blancos-par-inversion" exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={6} md={3}><KpiTile label={t("par.kpi.subtotal")} value={money(report.totals.subtotal)} icon={<FaCoins size={14} />} tone="sky" hint={t("par.kpi.beforeTax")} /></ITGrid>
            <ITGrid item xs={6} md={3}><KpiTile label={t("par.kpi.total16")} value={money(report.totals.total16)} icon={<FaCoins size={14} />} tone="violet" hint={t("par.kpi.iva", { rate: 16 })} /></ITGrid>
            <ITGrid item xs={6} md={3}><KpiTile label={t("par.kpi.total8")} value={money(report.totals.total8)} icon={<FaCoins size={14} />} tone="emerald" hint={t("par.kpi.iva", { rate: 8 })} /></ITGrid>
            <ITGrid item xs={6} md={3}><KpiTile label={t("par.kpi.noCost")} value={report.withoutCost.length} icon={<FaExclamationTriangle size={14} />} tone={report.withoutCost.length > 0 ? "amber" : "neutral"} hint={report.withoutCost.length === 0 ? t("allGood") : undefined} /></ITGrid>
          </ITGrid>
          <ReportTable
            empty={report.lines.length === 0 ? t("par.none") : null}
            head={
              <>
                <th className={thLeft}>{t("par.item")}</th>
                {(["total", "par", "pct"] as const).map((k) => <th key={k} className={th}>{t(`par.${k}`)}</th>)}
                <th className={th}>{t("par.light")}</th>
                {(["shortfall", "cost", "subtotal", "total16", "total8"] as const).map((k) => <th key={k} className={th}>{t(`par.${k}`)}</th>)}
              </>
            }
          >
            {report.lines.map((l) => (
              <tr key={l.productId} className="border-b border-[var(--color-border)]">
                <td className={tdLeft}>{productLabel(l)}<span className="ml-2 font-mono text-[11px] opacity-60">{l.code}</span></td>
                <td className={td}>{fmt(l.total)}{l.inTransit > 0 && <span className="ml-1 text-[10px] opacity-60">({t("par.transit", { count: l.inTransit })})</span>}</td>
                <td className={td}>{fmt(l.par)}</td>
                <td className={td}>{pct(l.pct)}</td>
                <td className={td}><ITChip size="sm" color={LIGHT_COLOR[l.light]} label={t(`light.${l.light}`)} /></td>
                <td className={td}>{fmt(l.shortfall)}</td>
                <td className={td}>{l.lastCost === null ? "—" : money(l.lastCost)}</td>
                <td className={td}>{money(l.subtotal)}</td>
                <td className={td}>{money(l.total16)}</td>
                <td className={td}>{money(l.total8)}</td>
              </tr>
            ))}
            {report.lines.length > 0 && (
              <tr className="font-bold">
                <td className={tdLeft}>{t("par.totals")}</td>
                <td className={td} colSpan={4} />
                <td className={td}>{fmt(report.totals.shortfall)}</td>
                <td className={td} />
                <td className={td}>{money(report.totals.subtotal)}</td>
                <td className={td}>{money(report.totals.total16)}</td>
                <td className={td}>{money(report.totals.total8)}</td>
              </tr>
            )}
          </ReportTable>
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
