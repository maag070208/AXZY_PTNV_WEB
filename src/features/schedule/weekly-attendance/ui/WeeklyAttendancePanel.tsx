import {
  ITAlert,
  ITButton,
  ITCard,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaBusinessTime,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaExclamationTriangle,
  FaFileExcel,
  FaFilePdf,
  FaHourglassHalf,
  FaUserSlash,
  FaUsers,
} from "react-icons/fa";
import { LottieLoader } from "@shared/ui/lottie-loader";
import { dyn } from "@shared/i18n/dyn";
import {
  WEEKLY_LEGEND,
  WEEKLY_OVERTIME_COLOR,
  WEEKLY_STATUS_COLORS,
  dayLabel,
  hoursDecimal,
} from "@entities/schedule";
import type { UseWeeklyAttendance } from "../model/useWeeklyAttendance";
import WeeklyAttendanceGrid from "./WeeklyAttendanceGrid";

/** Filtros, resumen de la semana, simbología y la cuadrícula del reporte. */
export default function WeeklyAttendancePanel({ fx }: { fx: UseWeeklyAttendance }) {
  const t = dyn(fx.t);
  const report = fx.report;
  const summaryKpis = report?.summary;

  const handleRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (Array.isArray(value) && value[0]) fx.setWeekDate(value[0]);
  };

  const kpis = summaryKpis
    ? [
        { key: "people", value: String(summaryKpis.people), tint: "bg-slate-100", icon: <FaUsers className="text-slate-600" size={15} /> },
        { key: "worked", value: hoursDecimal(summaryKpis.workedMin), tint: "bg-sky-50", icon: <FaClock className="text-sky-600" size={15} /> },
        { key: "overtime", value: hoursDecimal(summaryKpis.extraMin), tint: "bg-emerald-50", icon: <FaBusinessTime className="text-emerald-600" size={15} /> },
        { key: "approved", value: hoursDecimal(summaryKpis.approvedExtraMin), tint: "bg-emerald-50", icon: <FaCheckCircle className="text-emerald-600" size={15} /> },
        { key: "notApproved", value: hoursDecimal(summaryKpis.pendingExtraMin), tint: "bg-amber-50", icon: <FaHourglassHalf className="text-amber-600" size={15} /> },
        { key: "absences", value: String(summaryKpis.absences), tint: "bg-orange-50", icon: <FaUserSlash className="text-orange-500" size={15} /> },
        { key: "incomplete", value: String(summaryKpis.incompleteDays), tint: "bg-red-50", icon: <FaExclamationTriangle className="text-red-500" size={15} /> },
      ]
    : [];

  return (
    <ITFlex direction="column" gap={4}>
      <ITCard className="!p-5 border border-slate-200">
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={5}>
            <ITFlex align="end" gap={2}>
              <ITButton variant="outlined" color="secondary" onClick={fx.previousWeek} title={t("filters.previousWeek")}>
                <FaChevronLeft size={12} />
              </ITButton>
              <div className="min-w-0 flex-1">
                <ITDatePicker
                  name="weeklyAttendanceWeek"
                  label={t("filters.week")}
                  range
                  value={fx.rangeValue}
                  onChange={handleRange}
                  className="w-full min-w-0"
                />
              </div>
              <ITButton variant="outlined" color="secondary" onClick={fx.nextWeek} title={t("filters.nextWeek")}>
                <FaChevronRight size={12} />
              </ITButton>
              <ITButton variant="text" color="gray" onClick={fx.thisWeek}>
                <ITText className="font-bold text-[11px]">{t("filters.thisWeek")}</ITText>
              </ITButton>
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITSearchSelect
              name="weeklyAttendanceDepartment"
              label={t("filters.department")}
              options={[
                { value: "", label: t("filters.allDepartments") },
                ...fx.departments.data.map((d) => ({ value: d.id, label: d.name })),
              ]}
              value={fx.departmentId}
              onChange={(value) => fx.setDepartmentId(String(value))}
              className="w-full min-w-0"
            />
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITInput
              name="weeklyAttendanceSearch"
              label={t("filters.search")}
              placeholder={t("filters.searchPlaceholder")}
              value={fx.search}
              onChange={(e) => fx.setSearch(e.target.value)}
            />
          </ITGrid>
        </ITGrid>
        {report && (
          <ITFlex align="center" justify="between" wrap="wrap" gap={2} className="mt-3">
            <ITText className="text-[12px] font-black text-slate-700">
              {t("range", { from: dayLabel(report.range.days[0]), to: dayLabel(report.range.days[6]) })}
              <span className="ml-2 text-[10px] font-bold text-slate-400">{t("timezone", { tz: report.range.timezone })}</span>
            </ITText>
            <ITFlex gap={2}>
              <ITButton variant="outlined" color="primary" onClick={fx.exportPdf} disabled={!!fx.exporting || report.rows.length === 0}>
                <ITFlex align="center" gap={1}>
                  <FaFilePdf className="text-red-600" size={13} />
                  <ITText className="font-bold text-[11px]">{fx.exporting === "pdf" ? t("exporting") : t("exportPdf")}</ITText>
                </ITFlex>
              </ITButton>
              <ITButton variant="outlined" color="primary" onClick={fx.exportExcel} disabled={!!fx.exporting || report.rows.length === 0}>
                <ITFlex align="center" gap={1}>
                  <FaFileExcel className="text-emerald-700" size={13} />
                  <ITText className="font-bold text-[11px]">{fx.exporting === "excel" ? t("exporting") : t("exportExcel")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>
        )}
      </ITCard>

      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      {kpis.length > 0 && (
        <ITFlex wrap="wrap" gap={3}>
          {kpis.map((k) => (
            <ITFlex
              key={k.key}
              grow={1}
              basis="170px"
              align="center"
              gap={3}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <ITFlex
                align="center"
                justify="center"
                className={`h-10 w-10 shrink-0 rounded-xl ${k.tint}`}
              >
                {k.icon}
              </ITFlex>
              <ITFlex direction="column" gap={0} className="min-w-0">
                <ITText className="text-xl font-black leading-none text-slate-800">{k.value}</ITText>
                <ITText className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {t(`kpis.${k.key}`)}
                </ITText>
              </ITFlex>
            </ITFlex>
          ))}
        </ITFlex>
      )}

      {summaryKpis && summaryKpis.unlinked > 0 && (
        <ITAlert variant="warning" dismissible={false}>{t("unlinkedHint", { count: summaryKpis.unlinked })}</ITAlert>
      )}
      {summaryKpis && summaryKpis.withoutSchedule > 0 && (
        <ITAlert variant="info" dismissible={false}>{t("withoutScheduleHint", { count: summaryKpis.withoutSchedule })}</ITAlert>
      )}

      <ITFlex align="center" wrap="wrap" gap={2}>
        <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("legend")}</ITText>
        {WEEKLY_LEGEND.map((status) => (
          <span
            key={status}
            className="rounded border border-slate-300 px-2 py-0.5 text-[10px] font-bold"
            style={{
              backgroundColor: status === "OVERTIME" ? WEEKLY_OVERTIME_COLOR : WEEKLY_STATUS_COLORS[status].background,
              color: WEEKLY_STATUS_COLORS[status].text,
            }}
          >
            {t(`status.${status}`)}
          </span>
        ))}
      </ITFlex>

      {fx.loading && !report ? (
        <ITFlex justify="center" className="py-16">
          <LottieLoader size="lg" />
        </ITFlex>
      ) : report && report.rows.length > 0 ? (
        <div className={fx.loading ? "opacity-60 transition-opacity" : undefined}>
          <WeeklyAttendanceGrid report={report} groupByDepartment={!fx.departmentId} t={fx.t} />
        </div>
      ) : (
        !fx.loading && (
          <ITCard className="!p-8 border border-slate-200 text-center">
            <ITText className="text-[12px] font-bold text-slate-500">{t("empty")}</ITText>
          </ITCard>
        )
      )}
    </ITFlex>
  );
}
