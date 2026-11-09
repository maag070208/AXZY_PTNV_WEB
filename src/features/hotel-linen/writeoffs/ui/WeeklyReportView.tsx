import { useCallback, useEffect, useState } from "react";
import { ITAlert, ITButton, ITDatePicker, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaFilePdf } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { WRITEOFF_REASONS, writeoffApi, type WeeklyWriteoffReport } from "@entities/hotel-linen";
import { fmt, dateStrToLocal, localToDateStr, money, mondayOf } from "../lib";

const head = "px-2 py-2 text-[11px] font-bold uppercase text-right";
const cell = "px-2 py-1.5 text-[12px] tabular-nums text-right";

/** Reporte semanal (formato pág. 15): artículo × motivo con total y costo, solo bajas autorizadas. */
interface Props {
  /** Descarga el PDF del reporte (lo provee la página: las features no importan widgets). */
  onDownloadPdf: (report: WeeklyWriteoffReport) => void;
}

export default function WeeklyReportView({ onDownloadPdf }: Props) {
  const { t } = useTranslation("hotel-linen-writeoff");
  const monday = mondayOf(new Date());
  const [from, setFrom] = useState(localToDateStr(monday));
  const [to, setTo] = useState(localToDateStr(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)));
  const [report, setReport] = useState<WeeklyWriteoffReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    writeoffApi
      .weekly(from, to)
      .then((r) => {
        setReport(r);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(load, [load]);

  const picker = (name: string, label: string, value: string, set: (v: string) => void) => (
    <ITDatePicker
      name={name}
      label={label}
      value={dateStrToLocal(value)}
      onChange={(e) => {
        const v = e.target.value;
        if (v instanceof Date) set(localToDateStr(v));
      }}
    />
  );

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      <ITGrid container columns={12} spacing={3} className="items-end">
        <ITGrid item xs={6} md={3}>{picker("weeklyFrom", t("writeoffs.weekly.from"), from, setFrom)}</ITGrid>
        <ITGrid item xs={6} md={3}>{picker("weeklyTo", t("writeoffs.weekly.to"), to, setTo)}</ITGrid>
        <ITGrid item xs={12} md={3}>
          <ITButton
            variant="outlined"
            color="primary"
            icon={<FaFilePdf size={12} />}
            label={t("writeoffs.weekly.pdf")}
            disabled={!report || report.rows.length === 0}
            onClick={() => report && onDownloadPdf(report)}
          />
        </ITGrid>
      </ITGrid>

      {loading && !report ? (
        <ITText muted>{t("common.loading")}</ITText>
      ) : !report || report.rows.length === 0 ? (
        <ITText muted>{t("writeoffs.weekly.empty")}</ITText>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className={`${head} text-left`}>{t("writeoffs.weekly.item")}</th>
                {WRITEOFF_REASONS.map((c) => (
                  <th key={c} className={head} title={t(`writeoffs.reason.${c}`)}>{c}</th>
                ))}
                <th className={head}>{t("writeoffs.weekly.total")}</th>
                <th className={head}>{t("writeoffs.weekly.cost")}</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.productId} className="border-b border-[var(--color-border)]">
                  <td className="px-2 py-1.5 text-[12px] font-semibold">
                    {r.name}
                    {r.size ? <span className="text-[11px] font-normal opacity-70"> · {r.size}</span> : null}
                  </td>
                  {WRITEOFF_REASONS.map((c) => (
                    <td key={c} className={cell}>{r.byReason[c] ? fmt(r.byReason[c]) : "—"}</td>
                  ))}
                  <td className={`${cell} font-bold`}>{fmt(r.total)}</td>
                  <td className={cell}>{money(r.cost)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="px-2 py-2 text-[12px]">{t("writeoffs.weekly.totals")}</td>
                {WRITEOFF_REASONS.map((c) => (
                  <td key={c} className={cell}>{fmt(report.totals.byReason[c])}</td>
                ))}
                <td className={cell}>{fmt(report.totals.total)}</td>
                <td className={cell}>{money(report.totals.cost)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </ITFlex>
  );
}
