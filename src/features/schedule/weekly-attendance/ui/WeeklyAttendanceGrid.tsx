import { Fragment } from "react";
import type { TFunction } from "i18next";
import {
  WEEKLY_APPROVAL_COLORS,
  WEEKLY_MERGED_STATUSES,
  WEEKLY_OVERTIME_COLOR,
  WEEKLY_STATUS_COLORS,
  dayHeader,
  dayLabel,
  hoursDecimal,
  punchTime,
  workedTime,
  type WeeklyAttendanceDay,
  type WeeklyAttendanceReport,
} from "@entities/schedule";
import { dyn } from "@shared/i18n/dyn";

interface Props {
  report: WeeklyAttendanceReport;
  /** Con un departamento elegido no se repite su encabezado de grupo. */
  groupByDepartment: boolean;
  t: TFunction<any>;
}

const DAY_FIELDS = ["entry", "exit", "workedTime", "hours", "overtime"] as const;
const WEEK_FIELDS = ["hours", "overtime", "approved", "absences"] as const;

const cell = "border border-slate-200 px-1.5 py-1 text-center whitespace-nowrap";
const headCell = "border border-[#0b4a65] bg-[#0D5777] px-1.5 py-1 text-center font-bold text-white whitespace-nowrap";

/**
 * Cuadrícula del reporte semanal: el mismo acomodo que el control de RH en
 * Excel (código, empleado y por día Entrada / Salida / T.T / Hrs / HE), con la
 * decisión de cada tiempo extra bajo su número y el detalle del día al pasar el
 * mouse (checadas, horario, faltante).
 */
export default function WeeklyAttendanceGrid({ report, groupByDepartment, t: translate }: Props) {
  const t = dyn(translate);
  const { days, timezone } = report.range;

  const tooltip = (day: WeeklyAttendanceDay) =>
    [
      `${dayLabel(day.date)} · ${t(`status.${day.status}`)}`,
      day.shift ? t("tooltip.shift", { shift: day.shift }) : t("tooltip.noShift"),
      day.scheduledMin > 0 ? t("tooltip.scheduled", { hours: workedTime(day.scheduledMin) }) : null,
      day.workedMin > 0 ? t("tooltip.worked", { hours: workedTime(day.workedMin) }) : null,
      day.missingMin > 0 ? t("tooltip.missing", { hours: workedTime(day.missingMin) }) : null,
      day.approvedExtraMin > 0 ? t("tooltip.approvedMinutes", { hours: workedTime(day.approvedExtraMin) }) : null,
      ...(day.sessions.length > 0 ? [`${t("tooltip.sessions")}:`] : []),
      ...day.sessions.map(
        (s) =>
          `  ${punchTime(s.entryAt, day.date, timezone)} → ${punchTime(s.exitAt, day.date, timezone)}` +
          (s.incident ? ` (${t(`incidents.${s.incident}`)})` : "")
      ),
    ]
      .filter(Boolean)
      .join("\n");

  const renderDay = (day: WeeklyAttendanceDay) => {
    const colors = WEEKLY_STATUS_COLORS[day.status];
    const style = { backgroundColor: colors.background, color: colors.text };
    const title = day.status === "FUTURE" ? undefined : tooltip(day);
    if (WEEKLY_MERGED_STATUSES.includes(day.status)) {
      return (
        <td key={day.date} colSpan={DAY_FIELDS.length} className={`${cell} font-bold uppercase`} style={style} title={title}>
          {day.status === "FUTURE" ? "" : t(`status.${day.status}`)}
        </td>
      );
    }
    const approval = day.approval;
    return (
      <Fragment key={day.date}>
        <td className={cell} style={style} title={title}>{punchTime(day.entryAt, day.date, timezone)}</td>
        <td className={cell} style={style} title={title}>{punchTime(day.exitAt, day.date, timezone)}</td>
        <td className={`${cell} text-right`} style={style} title={title}>{workedTime(day.workedMin)}</td>
        <td className={`${cell} text-right`} style={style} title={title}>{hoursDecimal(day.workedMin)}</td>
        <td
          className={`${cell} text-right font-bold`}
          style={day.extraMin > 0 ? { ...style, backgroundColor: WEEKLY_OVERTIME_COLOR } : style}
          title={title}
        >
          {day.extraMin > 0 ? hoursDecimal(day.extraMin) : "0.00"}
          {day.extraMin > 0 && approval && (
            <div className="text-[8px] font-black uppercase leading-tight" style={{ color: WEEKLY_APPROVAL_COLORS[approval] }}>
              {t(`approval.${approval}`)}
            </div>
          )}
        </td>
      </Fragment>
    );
  };

  let lastDepartment: string | null | undefined;
  const totalColumns = 2 + days.length * DAY_FIELDS.length + WEEK_FIELDS.length;

  return (
    <div className="max-h-[68vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-max border-collapse text-[10px] text-slate-700">
        <thead className="sticky top-0 z-20">
          <tr>
            <th rowSpan={2} className={`${headCell} sticky left-0 z-30 w-[70px] min-w-[70px]`}>{t("columns.code")}</th>
            <th rowSpan={2} className={`${headCell} sticky left-[70px] z-30 min-w-[230px] text-left`}>{t("columns.employee")}</th>
            {days.map((day) => (
              <th key={day} colSpan={DAY_FIELDS.length} className={headCell}>{dayHeader(day)}</th>
            ))}
            <th colSpan={WEEK_FIELDS.length} className={`${headCell} bg-[#1e293b]`}>{t("columns.week")}</th>
          </tr>
          <tr>
            {days.map((day) =>
              DAY_FIELDS.map((field) => (
                <th key={`${day}-${field}`} className={`${headCell} bg-[#16698f] text-[9px]`}>{t(`columns.${field}`)}</th>
              ))
            )}
            {WEEK_FIELDS.map((field) => (
              <th key={field} className={`${headCell} bg-[#334155] text-[9px]`}>{t(`columns.${field}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => {
            const group =
              groupByDepartment && row.departmentName !== lastDepartment ? (
                <tr key={`group-${row.departmentId ?? "none"}`}>
                  <td colSpan={totalColumns} className="sticky left-0 border border-slate-300 bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                    {row.departmentName ?? "—"}
                  </td>
                </tr>
              ) : null;
            lastDepartment = row.departmentName;
            return (
              <Fragment key={row.userId}>
                {group}
                <tr className="hover:brightness-95">
                  <td className={`${cell} sticky left-0 z-10 bg-[#cffafe] font-black text-slate-800`}>
                    {row.clockNumbers.join(", ") || row.employeeNumber || "—"}
                  </td>
                  <td className={`${cell} sticky left-[70px] z-10 bg-[#cffafe] text-left`}>
                    <div className="font-bold uppercase text-slate-800">{row.name}</div>
                    {(!row.linked || row.withoutSchedule) && (
                      <div className="text-[8px] font-bold uppercase text-amber-700">
                        {!row.linked ? t("unlinked") : t("withoutSchedule")}
                      </div>
                    )}
                  </td>
                  {row.days.map(renderDay)}
                  <td className={`${cell} bg-slate-50 text-right font-black`}>{hoursDecimal(row.totals.workedMin)}</td>
                  <td className={`${cell} bg-slate-50 text-right font-black`} style={row.totals.extraMin > 0 ? { backgroundColor: WEEKLY_OVERTIME_COLOR } : undefined}>
                    {hoursDecimal(row.totals.extraMin)}
                  </td>
                  <td className={`${cell} bg-slate-50 text-right font-black`} style={{ color: WEEKLY_APPROVAL_COLORS.APPROVED }}>
                    {hoursDecimal(row.totals.approvedExtraMin)}
                  </td>
                  <td
                    className={`${cell} bg-slate-50 font-black`}
                    style={row.totals.absences > 0 ? { backgroundColor: WEEKLY_STATUS_COLORS.ABSENCE.background } : undefined}
                  >
                    {row.totals.absences}
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
