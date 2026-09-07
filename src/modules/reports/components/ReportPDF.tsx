import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReportRow } from "@core/api/reports.api";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@core/pdf/theme";
import PdfLetterhead from "@core/pdf/PdfLetterhead";
import PdfFooter from "@core/pdf/PdfFooter";

interface Props {
  rows: ReportRow[];
  title?: string;
  filters?: {
    start?: string;
    end?: string;
    department?: string;
    employee?: string;
  };
}

const styles = StyleSheet.create({
  badgePerdido: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.danger,
    backgroundColor: PDF_COLORS.dangerBg,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    textAlign: "center",
  },
});

const fmtDate = (d: Date | string | null): string => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const fmtFilterDate = (iso?: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const estadoBadge = (estado: string) =>
  estado === "ASIGNADO"
    ? badgeStyleFor("success")
    : estado === "DEVUELTO"
    ? badgeStyleFor("warning")
    : estado === "PERDIDO"
    ? styles.badgePerdido
    : badgeStyleFor("gray");

const COL = {
  fecha: 52,
  folio: 60,
  activo: 58,
  desc: 118,
  resp: 86,
  depto: 72,
  estado: 54,
};

export default function ReportPDF({ rows, title = "Reporte de Entregas de Activos", filters }: Props) {
  const today = fmtDate(new Date());

  const totalEntregas = rows.length;
  const asignados = rows.filter((r) => r.estado === "ASIGNADO").length;
  const devueltos = rows.filter((r) => r.estado === "DEVUELTO").length;
  const deptos = new Set(rows.map((r) => r.department)).size;

  const summary: Array<{ label: string; value: number; color: string }> = [
    { label: "Total registros", value: totalEntregas, color: PDF_COLORS.band },
    { label: "Asignados", value: asignados, color: PDF_COLORS.success },
    { label: "Devueltos", value: devueltos, color: PDF_COLORS.warning },
    { label: "Departamentos", value: deptos, color: PDF_COLORS.bandAccent },
  ];

  const hasFilters = filters && (filters.start || filters.end || filters.department || filters.employee);
  const filterParts: string[] = [];
  if (filters?.start || filters?.end) {
    const from = filters?.start ? fmtFilterDate(filters.start) : "…";
    const to = filters?.end ? fmtFilterDate(filters.end) : "…";
    filterParts.push(`Periodo: ${from} — ${to}`);
  }
  if (filters?.department) filterParts.push(`Departamento: ${filters.department}`);
  if (filters?.employee) filterParts.push(`Empleado: ${filters.employee}`);

  const ROWS_PER_PAGE = 28;
  const pages: ReportRow[][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document title={title} author="Puerto Nuevo Hotel y Villas">
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={pdfTheme.page}>
          <PdfLetterhead title={title} pageIndex={pageIdx} pageCount={pages.length} generatedAt={today} />

          <View style={pdfTheme.content}>
            {pageIdx === 0 && (
              <View style={pdfTheme.summaryRow}>
                {summary.map((s) => (
                  <View key={s.label} style={[pdfTheme.summaryCard, { borderTopColor: s.color }]}>
                    <Text style={[pdfTheme.summaryValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={pdfTheme.summaryLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {pageIdx === 0 && hasFilters && (
              <View style={pdfTheme.filterBox}>
                <Text style={pdfTheme.filterTitle}>Filtros aplicados</Text>
                <Text style={pdfTheme.filterText}>{filterParts.join("  ·  ")}</Text>
              </View>
            )}

            <View style={pdfTheme.tableHeader}>
              <View style={{ width: COL.fecha }}><Text style={pdfTheme.tableHeaderText}>Fecha</Text></View>
              <View style={{ width: COL.folio }}><Text style={pdfTheme.tableHeaderText}>Folio</Text></View>
              <View style={{ width: COL.activo }}><Text style={pdfTheme.tableHeaderText}>Activo</Text></View>
              <View style={{ width: COL.desc }}><Text style={pdfTheme.tableHeaderText}>Descripción</Text></View>
              <View style={{ width: COL.resp }}><Text style={pdfTheme.tableHeaderText}>Responsable</Text></View>
              <View style={{ width: COL.depto }}><Text style={pdfTheme.tableHeaderText}>Departamento</Text></View>
              <View style={{ width: COL.estado }}><Text style={pdfTheme.tableHeaderText}>Estado</Text></View>
            </View>

            {pageRows.map((r, i) => (
              <View key={r.id + i} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={{ width: COL.fecha }}><Text style={pdfTheme.cellMuted}>{fmtDate(r.fecha)}</Text></View>
                <View style={{ width: COL.folio }}><Text style={pdfTheme.cellBold}>{r.document_code}</Text></View>
                <View style={{ width: COL.activo }}><Text style={pdfTheme.cellBold}>{r.asset_code}</Text></View>
                <View style={{ width: COL.desc }}>
                  <Text style={pdfTheme.cellDescTitle}>{r.description}</Text>
                  {r.brand || r.model ? (
                    <Text style={pdfTheme.cellDescSub}>{[r.brand, r.model].filter(Boolean).join(" · ")}</Text>
                  ) : null}
                </View>
                <View style={{ width: COL.resp }}><Text style={pdfTheme.cell}>{r.responsible}</Text></View>
                <View style={{ width: COL.depto }}><Text style={pdfTheme.cellMuted}>{r.department}</Text></View>
                <View style={{ width: COL.estado }}>
                  <Text style={estadoBadge(r.estado)}>{r.estado}</Text>
                </View>
              </View>
            ))}
          </View>

          <PdfFooter pageIndex={pageIdx} pageCount={pages.length} />
        </Page>
      ))}
    </Document>
  );
}
