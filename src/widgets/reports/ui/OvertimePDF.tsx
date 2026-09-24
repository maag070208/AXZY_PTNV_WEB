import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type {
  HorasExtraPdfMeta,
  HorasExtraRow,
  HorasExtraSummary,
} from "@entities/schedule";
import { PDF_COLORS, pdfTheme } from "@shared/pdf/theme";
import { formatMinutesAsHhMm, formatTimeInTZ } from "@shared/utils/dates";
import { dyn } from "@shared/i18n/dyn";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

interface Props {
  rows: HorasExtraRow[];
  summary: HorasExtraSummary;
  meta: HorasExtraPdfMeta;
  title?: string;
}

const styles = StyleSheet.create({
  rangeBand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: PDF_COLORS.band,
    borderRadius: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  rangeBandLabel: {
    fontSize: 6.3,
    color: "#bfe0f0",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rangeBandValue: { fontSize: 11, color: PDF_COLORS.white, fontFamily: "Helvetica-Bold" },
  rangeBandTz: { fontSize: 7.5, color: PDF_COLORS.white, fontFamily: "Helvetica-Bold" },

  kpiCard: {
    flex: 1,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: PDF_COLORS.border,
  },
  kpiValue: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  kpiLabel: {
    fontSize: 6.3,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  totalsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: PDF_COLORS.band,
    borderRadius: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  totalsItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  totalsLabel: {
    fontSize: 6.8,
    color: "#bfe0f0",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  totalsValue: { fontSize: 10.5, color: PDF_COLORS.white, fontFamily: "Helvetica-Bold" },
});

// Anchos en puntos; suman ~516 (folio LETTER − padding horizontal de 36×2).
const COL = {
  employee: 96,
  department: 68,
  schedule: 80,
  scheduled: 46,
  worked: 46,
  extra: 46,
  approved: 46,
  missing: 46,
  days: 42,
};

const fmtMinutes = formatMinutesAsHhMm;

const fmtDateTime = (iso: string, tz?: string): string => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy} ${formatTimeInTZ(iso, tz)}`;
};

/** Fecha civil `DD/MM/YYYY` de un instante en la zona horaria efectiva. */
const fmtDateInTZ = (iso: string, tz?: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));

/**
 * Día calendario anterior al instante dado, en la zona horaria efectiva.
 * `summary.range.end` es EXCLUSIVO (medianoche del día siguiente): para que el
 * rango se lea como `[start, end)` se resta un día civil al límite.
 */
const prevCivilDay = (iso: string, tz?: string): string => {
  const [dd, mm, yyyy] = fmtDateInTZ(iso, tz).split("/").map(Number);
  const prev = new Date(Date.UTC(yyyy, mm - 1, dd - 1));
  const pdd = String(prev.getUTCDate()).padStart(2, "0");
  const pmm = String(prev.getUTCMonth() + 1).padStart(2, "0");
  return `${pdd}/${pmm}/${prev.getUTCFullYear()}`;
};

export default function OvertimePDF({ rows, summary, meta, title }: Props) {
  const { t } = useTranslation("schedules");
  const reportTitle = title ?? t("overtime.pdf.title");
  const tz = summary.range.timezone || meta.timezone;
  const today = fmtDateTime(new Date().toISOString(), tz);

  const rangePeriod = summary.range.period || meta.period;
  const rangeLabel =
    rangePeriod === "DAY"
      ? fmtDateInTZ(summary.range.start, tz)
      : `${fmtDateInTZ(summary.range.start, tz)} — ${prevCivilDay(summary.range.end, tz)}`;

  const cards: Array<{ label: string; value: string | number; color: string; bg: string }> = [
    { label: t("overtime.withExtra"), value: summary.peopleWithExtra, color: PDF_COLORS.warning, bg: PDF_COLORS.warningBg },
    { label: t("overtime.totalExtra"), value: fmtMinutes(summary.totalExtraMinutes), color: PDF_COLORS.danger, bg: PDF_COLORS.dangerBg },
    { label: t("overtime.worked"), value: fmtMinutes(summary.totalWorkedMinutes), color: PDF_COLORS.band, bg: PDF_COLORS.light },
    { label: t("overtime.scheduled"), value: fmtMinutes(summary.totalScheduledMinutes), color: PDF_COLORS.gray, bg: PDF_COLORS.grayBg },
  ];

  // Paginación nativa de @react-pdf/renderer: se declara UNA sola `<Page>` y
  // todas las filas van en el flujo. La librería corta las páginas y el
  // membrete/pie toman los números reales vía render prop, así que el rótulo
  // "Página n de m" coincide siempre con las páginas físicas sin importar la
  // altura de cada fila (nombres de 1, 2, 3 o 4 líneas).
  return (
    <Document title={reportTitle} author="Puerto Nuevo Hotel y Villas">
      <Page size="LETTER" style={pdfTheme.page}>
        <View fixed>
          <PdfLetterhead title={reportTitle} generatedAt={today} />
        </View>

        <View style={pdfTheme.content}>
          <View style={pdfTheme.summaryRow}>
            {cards.map((c) => (
              <View key={c.label} style={[styles.kpiCard, { backgroundColor: c.bg }]}>
                <Text style={[styles.kpiValue, { color: c.color }]}>{c.value}</Text>
                <Text style={styles.kpiLabel}>{c.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.rangeBand}>
            <View>
              <Text style={styles.rangeBandLabel}>{dyn(t)(`overtime.periods.${rangePeriod}`)}</Text>
              <Text style={styles.rangeBandValue}>{rangeLabel}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rangeBandLabel}>{t("overtime.pdf.timezone")}</Text>
              <Text style={styles.rangeBandTz}>{summary.range.timezone}</Text>
            </View>
          </View>

          <View style={pdfTheme.tableHeader} fixed>
            <View style={{ width: COL.employee }}>
              <Text style={pdfTheme.tableHeaderText}>{t("overtime.employee")}</Text>
            </View>
            <View style={{ width: COL.department }}>
              <Text style={pdfTheme.tableHeaderText}>{t("overtime.department")}</Text>
            </View>
            <View style={{ width: COL.schedule }}>
              <Text style={pdfTheme.tableHeaderText}>{t("overtime.schedule")}</Text>
            </View>
            <View style={{ width: COL.scheduled }}>
              <Text style={pdfTheme.tableHeaderText}>{t("overtime.scheduled")}</Text>
            </View>
            <View style={{ width: COL.worked }}>
              <Text style={pdfTheme.tableHeaderText}>{t("overtime.worked")}</Text>
            </View>
            <View style={{ width: COL.extra }}>
              <Text style={pdfTheme.tableHeaderText}>{t("overtime.extra")}</Text>
            </View>
            <View style={{ width: COL.approved }}>
              <Text style={pdfTheme.tableHeaderText}>{t("overtime.approved")}</Text>
            </View>
            <View style={{ width: COL.missing }}>
              <Text style={pdfTheme.tableHeaderText}>{t("overtime.missing")}</Text>
            </View>
            <View style={{ width: COL.days }}>
              <Text style={pdfTheme.tableHeaderText}>{t("overtime.daysWithExtra")}</Text>
            </View>
          </View>

          {rows.map((r, i) => (
            <View
              key={r.userId + i}
              wrap={false}
              style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}
            >
              <View style={{ width: COL.employee }}>
                <Text style={pdfTheme.cellDescTitle}>{r.employeeName}</Text>
                <Text style={pdfTheme.cellDescSub}>
                  {r.numeroEmpleado ? `#${r.numeroEmpleado}` : "—"}
                </Text>
              </View>
              <View style={{ width: COL.department }}>
                <Text style={pdfTheme.cellMuted}>{r.departmentName ?? "—"}</Text>
              </View>
              <View style={{ width: COL.schedule }}>
                <Text style={r.horarioNombre ? pdfTheme.cell : pdfTheme.cellMuted}>
                  {r.horarioNombre ?? t("overtime.noSchedule")}
                </Text>
              </View>
              <View style={{ width: COL.scheduled }}>
                <Text style={pdfTheme.cell}>{fmtMinutes(r.programadasMin)}</Text>
              </View>
              <View style={{ width: COL.worked }}>
                <Text style={pdfTheme.cell}>{fmtMinutes(r.trabajadasMin)}</Text>
              </View>
              <View style={{ width: COL.extra }}>
                <Text
                  style={
                    r.extraMin > 0
                      ? [pdfTheme.cellBold, { color: PDF_COLORS.danger }]
                      : pdfTheme.cellMuted
                  }
                >
                  {fmtMinutes(r.extraMin)}
                </Text>
              </View>
              <View style={{ width: COL.approved }}>
                <Text style={r.aprobadoMin > 0 ? pdfTheme.cellBold : pdfTheme.cellMuted}>
                  {fmtMinutes(r.aprobadoMin)}
                </Text>
              </View>
              <View style={{ width: COL.missing }}>
                <Text style={pdfTheme.cellMuted}>{fmtMinutes(r.faltanteMin)}</Text>
              </View>
              <View style={{ width: COL.days }}>
                <Text style={pdfTheme.cell}>{r.diasConExtra}</Text>
              </View>
            </View>
          ))}

          <View style={styles.totalsBar} wrap={false}>
            <View style={styles.totalsItem}>
              <Text style={styles.totalsLabel}>{t("overtime.pdf.totalPeople")}</Text>
              <Text style={styles.totalsValue}>{summary.peopleTotal}</Text>
            </View>
            <View style={styles.totalsItem}>
              <Text style={styles.totalsLabel}>{t("overtime.pdf.totalExtra")}</Text>
              <Text style={styles.totalsValue}>{fmtMinutes(summary.totalExtraMinutes)}</Text>
            </View>
            <View style={styles.totalsItem}>
              <Text style={styles.totalsLabel}>{t("overtime.pdf.totalWorked")}</Text>
              <Text style={styles.totalsValue}>{fmtMinutes(summary.totalWorkedMinutes)}</Text>
            </View>
            <View style={styles.totalsItem}>
              <Text style={styles.totalsLabel}>{t("overtime.pdf.totalScheduled")}</Text>
              <Text style={styles.totalsValue}>{fmtMinutes(summary.totalScheduledMinutes)}</Text>
            </View>
          </View>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
