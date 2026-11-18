import { useMemo, type ReactNode } from "react";
import { ITButton, ITDataTable, ITDatePicker, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaFileCsv, FaFilePdf, FaInbox } from "react-icons/fa";
import { makeClientTableFetch, type ClientFields } from "@shared/api/clientTable";
import { KpiTile } from "@shared/ui/kpi-tile";
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

export interface ReportCol<T> {
  key: string;
  label: string;
  width?: number;
  /** Numérica: ordena por número y alinea el filtro como número. */
  numeric?: boolean;
  /** Valor para filtrar y ordenar (default: texto del render no disponible, usa la propiedad `key`). */
  value?: (row: T) => unknown;
  render?: (row: T) => ReactNode;
  /** Muestra el filtro de columna (por defecto solo en columnas de texto). */
  filter?: boolean;
}

interface ReportTableProps<T> {
  columns: ReportCol<T>[];
  rows: T[];
  /** Totales: pares etiqueta/valor que se muestran en una franja bajo la tabla. */
  totals?: { label: string; value: string }[];
  /** Mensaje cuando no hay renglones (estado vacío centrado). */
  empty?: string | null;
}

/** Tabla de reporte: `ITDataTable` client-side con filtro y orden por columna; los totales van en una franja aparte. */
export function ReportTable<T>({ columns, rows, totals, empty }: ReportTableProps<T>) {
  const fetchData = useMemo(() => {
    const fields: ClientFields<T> = Object.fromEntries(
      columns.filter((c) => c.value).map((c) => [c.key, { value: c.value }])
    );
    return makeClientTableFetch<T>(async () => rows, fields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  const tableColumns: Column<T>[] = columns.map((c) => ({
    key: c.key,
    label: c.label,
    type: c.numeric ? "number" : "string",
    width: c.width,
    filter: c.filter ?? !c.numeric,
    render: (r: T) => {
      const cell = c.render ? c.render(r) : String(c.value?.(r) ?? "");
      if (typeof cell !== "string" && typeof cell !== "number") return cell;
      return <ITText className={`text-[12px] ${c.numeric ? "tabular-nums" : ""}`}>{cell}</ITText>;
    },
  }));
  if (rows.length === 0 && empty) {
    return (
      <ITFlex direction="column" align="center" gap={2} className="py-8">
        <FaInbox size={22} className="opacity-40" />
        <ITText muted className="text-[12px]">{empty}</ITText>
      </ITFlex>
    );
  }
  return (
    <ITFlex direction="column" gap={3}>
      <ITDataTable
        showViewToggle={false}
        columns={tableColumns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchData as never}
        size="lg"
        defaultItemsPerPage={25}
        itemsPerPageOptions={[25, 50, 100]}
        layout="fixed"
        density="compact"
        rowHeight={48}
      />
      {totals && totals.length > 0 && (
        <ITGrid container columns={12} spacing={2}>
          {totals.map((x) => (
            <ITGrid item xs={6} md={3} key={x.label}>
              <KpiTile size="sm" label={x.label} value={x.value} />
            </ITGrid>
          ))}
        </ITGrid>
      )}
    </ITFlex>
  );
}
