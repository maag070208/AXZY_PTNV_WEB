/**
 * Documento tabular simple que comparten los reportes de RH: columnas, filas y
 * un título. El PDF (widget `HrReportPdf`) y el CSV salen de la misma
 * definición, para que la descarga diga exactamente lo que dice la pantalla.
 */
export interface ReportDocColumn {
  /** Clave de la celda en cada fila. */
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

export interface ReportDocRow {
  [key: string]: string | number | null | undefined;
}

export interface ReportDoc {
  /** Título del documento ("Pre-nómina semanal"). */
  title: string;
  /** Línea de contexto bajo el título ("Semana 2 – 8 nov · 12 personas"). */
  subtitle?: string;
  columns: ReportDocColumn[];
  rows: ReportDocRow[];
}

const escapeCsv = (value: unknown): string => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * Descarga el documento como CSV (lo que el sistema llama "CSV" en el resto de
 * pantallas): BOM para que Excel respete los acentos y `\r\n` entre filas.
 */
export const downloadReportCsv = (doc: ReportDoc, fileName: string): void => {
  const header = doc.columns.map((column) => escapeCsv(column.label));
  const lines = doc.rows.map((row) => doc.columns.map((column) => escapeCsv(row[column.key])));
  const csv = [header, ...lines].map((row) => row.join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileName}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};
