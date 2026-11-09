import type { ReactNode } from "react";
import { ITButton, ITDatePicker, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaFileCsv, FaFilePdf } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { downloadReportCsv, type ReportDoc } from "@shared/lib/reportDoc";
import { dateStrToLocal, localToDateStr } from "../lib";

/** Función que la página provee para descargar el PDF (las features no importan widgets). */
export type ExportPdf = (doc: ReportDoc, fileName: string) => void | Promise<void>;

interface ExportBarProps {
  doc: ReportDoc | null;
  fileName: string;
  exportPdf: ExportPdf;
}

/** Botones PDF y CSV de una pestaña: ambos salen del mismo `ReportDoc`. */
export function ExportBar({ doc, fileName, exportPdf }: ExportBarProps) {
  const { t } = useTranslation("hotel-linen-report");
  return (
    <ITFlex gap={2}>
      <ITButton variant="outlined" color="secondary" icon={<FaFilePdf size={12} />} label={t("export.pdf")} disabled={!doc} onClick={() => doc && void exportPdf(doc, fileName)} />
      <ITButton variant="outlined" color="secondary" icon={<FaFileCsv size={12} />} label={t("export.csv")} disabled={!doc} onClick={() => doc && downloadReportCsv(doc, fileName)} />
    </ITFlex>
  );
}

interface PeriodProps {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}

/** Selector de periodo (desde / hasta). */
export function PeriodFields({ from, to, onFrom, onTo }: PeriodProps) {
  const { t } = useTranslation("hotel-linen-report");
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
    <ITGrid container columns={12} spacing={3}>
      <ITGrid item xs={6} md={3}>{picker("reportFrom", t("period.from"), from, onFrom)}</ITGrid>
      <ITGrid item xs={6} md={3}>{picker("reportTo", t("period.to"), to, onTo)}</ITGrid>
    </ITGrid>
  );
}

export const th = "px-2 py-2 text-[11px] font-bold uppercase text-right";
export const thLeft = "px-2 py-2 text-[11px] font-bold uppercase text-left";
export const td = "px-2 py-1.5 text-[12px] tabular-nums text-right";
export const tdLeft = "px-2 py-1.5 text-[12px] text-left";

/** Tabla simple desplazable (como el reporte semanal de bajas). */
export function ReportTable({ head, children, empty }: { head: ReactNode; children: ReactNode; empty?: string | null }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)]">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <ITText muted className="py-3 text-[12px]">{empty}</ITText>}
    </div>
  );
}
