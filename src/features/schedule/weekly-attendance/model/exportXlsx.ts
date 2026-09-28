import type { TFunction } from "i18next";
import { saveAs } from "file-saver";
import {
  WEEKLY_MERGED_STATUSES,
  dayHeader,
  dayLabel,
  hoursDecimal,
  punchTime,
  workedTime,
  type WeeklyAttendanceApproval,
  type WeeklyAttendanceDayStatus,
  type WeeklyAttendanceReport,
} from "@entities/schedule";
import { dyn } from "@shared/i18n/dyn";
import { fileName } from "@shared/i18n/format";

const DAY_COLUMNS = 5;
const WEEK_COLUMNS = 5;
const HEADER_FILL = "0D5777";

/**
 * Paleta NEUTRA para el Excel: en pantalla el color saturado ayuda a leer, pero
 * impreso se ve "chillón". Aquí los fondos son tenues y el texto oscuro.
 */
const XLSX_FILL: Partial<Record<WeeklyAttendanceDayStatus, string>> = {
  ABSENCE: "#f4e2d3",
  INCOMPLETE: "#f1dede",
  REST: "#e9edf2",
  REST_WORKED: "#d8e6ef",
  NO_INFO: "#f4efcd",
};
const XLSX_TEXT: Record<WeeklyAttendanceDayStatus, string> = {
  WORKED: "#334155",
  OVERTIME: "#334155",
  ABSENCE: "#7c2d12",
  INCOMPLETE: "#7f1d1d",
  REST: "#475569",
  REST_WORKED: "#1e293b",
  NO_INFO: "#713f12",
  FUTURE: "#94a3b8",
};
const XLSX_OVERTIME_FILL = "#dbe8db";
const XLSX_APPROVAL_TEXT: Record<WeeklyAttendanceApproval, string> = {
  APPROVED: "#3f6212",
  PENDING: "#78350f",
  REJECTED: "#7f1d1d",
};

/** "#fdba74" → "FFFDBA74" (ARGB de exceljs). */
const argb = (hex: string) => `FF${hex.replace("#", "").toUpperCase()}`;

/**
 * Excel del reporte semanal con el acomodo del control de RH: código, empleado
 * y, por día, Entrada / Salida / T.T / Hrs / HE (con los mismos colores que la
 * pantalla); al final el total de la semana contra lo aprobado. Las horas van
 * como número para poder sumarlas. `exceljs` se carga solo al exportar.
 */
export const exportWeeklyAttendanceXlsx = async (
  report: WeeklyAttendanceReport,
  { departmentName, t: translate }: { departmentName: string | null; t: TFunction<any> }
): Promise<void> => {
  const { default: ExcelJS } = await import("exceljs");
  const t = dyn(translate);
  const { days, timezone } = report.range;
  const totalColumns = 2 + days.length * DAY_COLUMNS + WEEK_COLUMNS;

  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet(t("sheetName"), {
    views: [{ state: "frozen", xSplit: 2, ySplit: 5 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  sheet.addRow([t("pdf.company")]).font = { bold: true, size: 14 };
  sheet.addRow([t("pdf.title")]).font = { bold: true };
  sheet.addRow([
    `${t("pdf.department")}: ${departmentName ?? t("filters.allDepartments")}`,
    "",
    t("range", { from: dayLabel(days[0]), to: dayLabel(days[6]) }),
    "",
    "",
    "",
    "",
    t("timezone", { tz: timezone }),
  ]);

  const header1: string[] = [t("columns.code"), t("columns.employee")];
  const header2: string[] = ["", ""];
  for (const day of days) {
    header1.push(dayHeader(day), ...Array(DAY_COLUMNS - 1).fill(""));
    header2.push(t("columns.entry"), t("columns.exit"), t("columns.workedTime"), t("columns.hours"), t("columns.overtime"));
  }
  header1.push(t("columns.week"), ...Array(WEEK_COLUMNS - 1).fill(""));
  header2.push(t("columns.hours"), t("columns.overtime"), t("columns.approved"), t("approval.PENDING"), t("columns.absences"));
  const h1 = sheet.addRow(header1);
  const h2 = sheet.addRow(header2);
  sheet.mergeCells(h1.number, 1, h2.number, 1);
  sheet.mergeCells(h1.number, 2, h2.number, 2);
  days.forEach((_, i) => {
    const c = 3 + i * DAY_COLUMNS;
    sheet.mergeCells(h1.number, c, h1.number, c + DAY_COLUMNS - 1);
  });
  const weekStart = 3 + days.length * DAY_COLUMNS;
  sheet.mergeCells(h1.number, weekStart, h1.number, weekStart + WEEK_COLUMNS - 1);
  for (const row of [h1, h2]) {
    row.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${HEADER_FILL}` } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
  }

  let lastDepartment: string | null | undefined;
  for (const row of report.rows) {
    if (!departmentName && row.departmentName !== lastDepartment) {
      lastDepartment = row.departmentName;
      const group = sheet.addRow(["", row.departmentName ?? ""]);
      // Banda del departamento de ancho completo, en gris claro con texto
      // oscuro (alto contraste; antes el fondo oscuro dejaba el texto ilegible).
      for (let c = 1; c <= totalColumns; c++) {
        const cell = group.getCell(c);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7EBF0" } };
        cell.font = { bold: true, size: 10, color: { argb: "FF1E293B" } };
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    }

    const values: Array<string | number> = [row.clockNumbers.join(", ") || row.employeeNumber || "", row.name];
    for (const day of row.days) {
      if (WEEKLY_MERGED_STATUSES.includes(day.status)) {
        values.push(day.status === "FUTURE" ? "" : t(`status.${day.status}`), "", "", "", "");
      } else {
        values.push(
          punchTime(day.entryAt, day.date, timezone),
          punchTime(day.exitAt, day.date, timezone),
          workedTime(day.workedMin),
          Number(hoursDecimal(day.workedMin)),
          Number(hoursDecimal(day.extraMin))
        );
      }
    }
    values.push(
      Number(hoursDecimal(row.totals.workedMin)),
      Number(hoursDecimal(row.totals.extraMin)),
      Number(hoursDecimal(row.totals.approvedExtraMin)),
      Number(hoursDecimal(row.totals.pendingExtraMin)),
      row.totals.absences
    );
    const line = sheet.addRow(values);
    line.font = { size: 9 };
    // Código y nombre del empleado con fondo blanco y texto oscuro (para que la
    // banda oscura del departamento no contamine esas celdas).
    for (const c of [1, 2]) {
      const cell = line.getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    }
    line.getCell(1).font = { size: 9, color: { argb: "FF475569" } };
    line.getCell(2).font = { size: 9, bold: true, color: { argb: "FF1E293B" } };

    row.days.forEach((day, i) => {
      const first = 3 + i * DAY_COLUMNS;
      const fill = XLSX_FILL[day.status];
      if (WEEKLY_MERGED_STATUSES.includes(day.status)) sheet.mergeCells(line.number, first, line.number, first + DAY_COLUMNS - 1);
      for (let c = first; c < first + DAY_COLUMNS; c++) {
        const cell = line.getCell(c);
        cell.alignment = { horizontal: "center" };
        cell.font = { size: 9, color: { argb: argb(XLSX_TEXT[day.status]) } };
        if (fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(fill) } };
      }
      if (day.extraMin > 0) {
        const he = line.getCell(first + DAY_COLUMNS - 1);
        he.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(XLSX_OVERTIME_FILL) } };
        he.font = { size: 9, bold: true, color: { argb: argb(day.approval ? XLSX_APPROVAL_TEXT[day.approval] : "#1e293b") } };
        if (day.approval) he.note = t(`approval.${day.approval}`);
      }
      line.getCell(first + 3).numFmt = "0.00";
      line.getCell(first + 4).numFmt = "0.00";
    });
    for (let c = weekStart; c < weekStart + WEEK_COLUMNS - 1; c++) line.getCell(c).numFmt = "0.00";
    line.getCell(weekStart).font = { size: 9, bold: true };
  }

  sheet.getColumn(1).width = 11;
  sheet.getColumn(2).width = 32;
  for (let c = 3; c <= totalColumns; c++) sheet.getColumn(c).width = 8.5;
  sheet.eachRow((row, n) => {
    if (n < 4) return;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });
  });

  const buffer = await book.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${fileName("weeklyAttendance")}_${days[0]}.xlsx`
  );
};
