import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import {
  WEEKLY_MERGED_STATUSES,
  WEEKLY_STATUS_COLORS,
  dayHeader,
  hoursDecimal,
  type WeeklyAttendanceDay,
  type WeeklyAttendanceReport,
} from "@entities/schedule";
import { PDF_COLORS, pdfTheme } from "@shared/pdf/theme";
import { dyn } from "@shared/i18n/dyn";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

interface Props {
  report: WeeklyAttendanceReport;
  meta: { departmentName: string | null };
}

const styles = StyleSheet.create({
  band: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: PDF_COLORS.band,
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  bandLabel: {
    fontSize: 6.3,
    color: "#bfe0f0",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bandValue: { fontSize: 10, color: PDF_COLORS.white, fontFamily: "Helvetica-Bold" },
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  kpiCard: {
    flex: 1,
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 5,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: PDF_COLORS.border,
  },
  kpiValue: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  kpiLabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  dayCell: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.border,
    alignItems: "center",
  },
  dayText: { fontSize: 6.5, fontFamily: "Helvetica-Bold" },
});

// Anchos en puntos (LETTER apaisado ≈ 720 útiles). Deben sumar ≈ 720.
const COL = {
  code: 48,
  employee: 120,
  day: 52,
  hours: 46,
  extra: 42,
  approved: 46,
  absences: 36,
};

export default function WeeklyAttendancePdf({ report, meta }: Props) {
  const { t } = useTranslation("weekly-attendance");
  const tt = dyn(t);
  const { days, timezone } = report.range;
  const title = t("pdf.title");
  const department = meta.departmentName ?? t("filters.allDepartments");
  const week = `${days[0]} — ${days[6]}`;

  const s = report.summary;
  const cards = [
    { label: t("kpis.people"), value: String(s.people), color: PDF_COLORS.band, bg: PDF_COLORS.light },
    { label: t("kpis.worked"), value: hoursDecimal(s.workedMin), color: "#334155", bg: PDF_COLORS.light },
    { label: t("kpis.overtime"), value: hoursDecimal(s.extraMin), color: PDF_COLORS.success, bg: PDF_COLORS.successBg },
    { label: t("kpis.approved"), value: hoursDecimal(s.approvedExtraMin), color: PDF_COLORS.success, bg: PDF_COLORS.successBg },
    { label: t("kpis.absences"), value: String(s.absences), color: PDF_COLORS.warning, bg: PDF_COLORS.warningBg },
    { label: t("kpis.incomplete"), value: String(s.incompleteDays), color: PDF_COLORS.danger, bg: PDF_COLORS.dangerBg },
  ];

  const renderDay = (day: WeeklyAttendanceDay) => {
    const colors = WEEKLY_STATUS_COLORS[day.status];
    const merged = WEEKLY_MERGED_STATUSES.includes(day.status);
    const text = merged
      ? day.status === "FUTURE"
        ? ""
        : day.status === "ABSENCE"
          ? "F"
          : day.status === "REST"
            ? "D"
            : "S/I"
      : hoursDecimal(day.workedMin);
    return (
      <View key={day.date} style={[styles.dayCell, { width: COL.day, backgroundColor: colors.background }]}>
        <Text style={[styles.dayText, { color: colors.text }]}>{text}</Text>
      </View>
    );
  };

  return (
    <Document title={title} author="Puerto Nuevo Hotel y Villas">
      <Page size="LETTER" orientation="landscape" style={pdfTheme.page}>
        <View fixed>
          <PdfLetterhead title={title} generatedAt={new Date().toLocaleString("es-MX")} />
        </View>

        <View style={pdfTheme.content}>
          <View style={styles.kpiRow}>
            {cards.map((c) => (
              <View key={c.label} style={[styles.kpiCard, { backgroundColor: c.bg }]}>
                <Text style={[styles.kpiValue, { color: c.color }]}>{c.value}</Text>
                <Text style={styles.kpiLabel}>{c.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.band}>
            <View>
              <Text style={styles.bandLabel}>{t("pdf.department")}</Text>
              <Text style={styles.bandValue}>{department}</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.bandLabel}>{t("pdf.week")}</Text>
              <Text style={styles.bandValue}>{week}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.bandLabel}>{t("timezone", { tz: timezone }).split(":")[0]}</Text>
              <Text style={styles.bandValue}>{timezone}</Text>
            </View>
          </View>

          <View style={pdfTheme.tableHeader} fixed>
            <View style={{ width: COL.code }}>
              <Text style={pdfTheme.tableHeaderText}>{t("columns.code")}</Text>
            </View>
            <View style={{ width: COL.employee }}>
              <Text style={pdfTheme.tableHeaderText}>{t("columns.employee")}</Text>
            </View>
            {days.map((day) => (
              <View key={day} style={{ width: COL.day }}>
                <Text style={[pdfTheme.tableHeaderText, { textAlign: "center" }]}>{dayHeader(day)}</Text>
              </View>
            ))}
            <View style={{ width: COL.hours }}>
              <Text style={[pdfTheme.tableHeaderText, { textAlign: "right" }]}>{t("columns.hours")}</Text>
            </View>
            <View style={{ width: COL.extra }}>
              <Text style={[pdfTheme.tableHeaderText, { textAlign: "right" }]}>{t("columns.overtime")}</Text>
            </View>
            <View style={{ width: COL.approved }}>
              <Text style={[pdfTheme.tableHeaderText, { textAlign: "right" }]}>{t("columns.approved")}</Text>
            </View>
            <View style={{ width: COL.absences }}>
              <Text style={[pdfTheme.tableHeaderText, { textAlign: "center" }]}>{t("columns.absences")}</Text>
            </View>
          </View>

          {report.rows.map((row, i) => (
            <View key={row.userId} wrap={false} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
              <View style={{ width: COL.code }}>
                <Text style={pdfTheme.cellMuted}>{row.clockNumbers.join(", ") || row.employeeNumber || "—"}</Text>
              </View>
              <View style={{ width: COL.employee }}>
                <Text style={pdfTheme.cellDescTitle}>{row.name}</Text>
                {(!row.linked || row.withoutSchedule) && (
                  <Text style={pdfTheme.cellDescSub}>
                    {!row.linked ? t("unlinked") : t("withoutSchedule")}
                  </Text>
                )}
              </View>
              {row.days.map((day) => renderDay(day))}
              <View style={{ width: COL.hours }}>
                <Text style={[pdfTheme.cellBold, { textAlign: "right" }]}>{hoursDecimal(row.totals.workedMin)}</Text>
              </View>
              <View style={{ width: COL.extra }}>
                <Text
                  style={[
                    pdfTheme.cellBold,
                    { textAlign: "right", color: row.totals.extraMin > 0 ? PDF_COLORS.success : PDF_COLORS.muted },
                  ]}
                >
                  {hoursDecimal(row.totals.extraMin)}
                </Text>
              </View>
              <View style={{ width: COL.approved }}>
                <Text style={[pdfTheme.cellBold, { textAlign: "right", color: PDF_COLORS.success }]}>
                  {hoursDecimal(row.totals.approvedExtraMin)}
                </Text>
              </View>
              <View style={{ width: COL.absences }}>
                <Text style={[pdfTheme.cellBold, { textAlign: "center" }]}>{row.totals.absences}</Text>
              </View>
            </View>
          ))}

          <Text style={{ marginTop: 10, fontSize: 6.5, color: PDF_COLORS.muted }}>
            {tt("legend")}: {days.map((d) => dayHeader(d)).join("  ")} · F = {t("status.ABSENCE")} · D = {t("status.REST")} · S/I = {t("status.NO_INFO")}
          </Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
