import { useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaBell,
  FaBusinessTime,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaFilePdf,
  FaInfoCircle,
  FaUserSlash,
  FaUsers,
} from "react-icons/fa";
import { LottieLoader } from "@shared/ui/lottie-loader";
import { dyn } from "@shared/i18n/dyn";
import { WEEKLY_LEGEND, WEEKLY_STATUS_BADGE, dayLabel, hoursDecimal } from "@entities/schedule";
import type { UseWeeklyAttendance, WeeklyAttendanceMode } from "../model/useWeeklyAttendance";
import WeeklyAttendanceTable from "./WeeklyAttendanceTable";

/** Filtros, resumen de la semana, simbología y la tabla del reporte. */
export default function WeeklyAttendancePanel({ fx }: { fx: UseWeeklyAttendance }) {
  const t = dyn(fx.t);
  const report = fx.report;
  const summaryKpis = report?.summary;
  const [noticesOpen, setNoticesOpen] = useState(false);

  // Avisos de la semana (antes eran dos bandas fijas): ahora viven en el ícono.
  const notices: string[] = [];
  if (summaryKpis?.unlinked) notices.push(t("unlinkedHint", { count: summaryKpis.unlinked }));
  if (summaryKpis?.withoutSchedule) notices.push(t("withoutScheduleHint", { count: summaryKpis.withoutSchedule }));
  const noticesCount = (summaryKpis?.unlinked ?? 0) + (summaryKpis?.withoutSchedule ?? 0);

  const handleRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (Array.isArray(value) && value[0]) fx.setWeekDate(value[0]);
  };

  // Totales clave de la semana (una sola franja, íconos sutiles).
  const stats = summaryKpis
    ? [
        { key: "people", value: String(summaryKpis.people), icon: <FaUsers size={16} /> },
        { key: "worked", value: hoursDecimal(summaryKpis.workedMin), icon: <FaClock size={16} /> },
        { key: "overtime", value: hoursDecimal(summaryKpis.extraMin), icon: <FaBusinessTime size={16} /> },
        { key: "approved", value: hoursDecimal(summaryKpis.approvedExtraMin), icon: <FaCheckCircle size={16} /> },
        { key: "absences", value: String(summaryKpis.absences), icon: <FaUserSlash size={16} /> },
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
            <ITFlex align="center" gap={2}>
              {noticesCount > 0 && (
                <ITButton
                  variant="raised-text"
                  color="secondary"
                  onClick={() => setNoticesOpen(true)}
                  title={t("notices.title")}
                >
                  <ITFlex align="center" gap={1}>
                    <FaBell className="text-amber-500" size={13} />
                    <ITBadget color="warning" size="sm">
                      {noticesCount}
                    </ITBadget>
                  </ITFlex>
                </ITButton>
              )}
              <ITButton variant="raised-text" color="primary" onClick={fx.exportPdf} disabled={fx.exporting || report.rows.length === 0}>
                <ITFlex align="center" gap={1}>
                  <FaFilePdf className="text-red-600" size={13} />
                  <ITText className="font-bold text-[11px]">{fx.exporting ? t("exporting") : t("exportPdf")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>
        )}

        {stats.length > 0 && (
          <ITFlex wrap="wrap" align="center" gap={6} className="mt-4 border-t border-slate-100 pt-4">
            {stats.map((s) => (
              <ITFlex key={s.key} align="center" gap={2}>
                <span className="text-slate-400">{s.icon}</span>
                <ITFlex direction="column" gap={0}>
                  <ITText className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {t(`kpis.${s.key}`)}
                  </ITText>
                  <ITText className="text-lg font-black leading-none text-slate-800">{s.value}</ITText>
                </ITFlex>
              </ITFlex>
            ))}
          </ITFlex>
        )}
      </ITCard>

      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <ITFlex align="center" justify="between" wrap="wrap" gap={3}>
        <ITSearchSelect
          name="weeklyAttendanceMode"
          label={t("view.label")}
          options={[
            { value: "SUMMARY", label: t("view.summary") },
            { value: "DETAIL", label: t("view.detail") },
          ]}
          value={fx.mode}
          onChange={(value) => fx.setMode(String(value) as WeeklyAttendanceMode)}
          className="min-w-[200px]"
        />
        <ITFlex align="center" wrap="wrap" gap={2}>
          <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("legend")}</ITText>
          {WEEKLY_LEGEND.map((status) => (
            <ITBadget key={status} color={WEEKLY_STATUS_BADGE[status]} size="sm">
              {t(`status.${status}`)}
            </ITBadget>
          ))}
        </ITFlex>
      </ITFlex>

      {fx.loading && !report ? (
        <ITFlex justify="center" className="py-16">
          <LottieLoader size="lg" />
        </ITFlex>
      ) : report && report.rows.length > 0 ? (
        <div className={fx.loading ? "opacity-60 transition-opacity" : undefined}>
          <WeeklyAttendanceTable
            report={report}
            mode={fx.mode}
            groupByDepartment={!fx.departmentId}
            t={fx.t}
            onParamsChange={fx.setTableParams}
            reloadTrigger={fx.reportVersion}
            queryKey={fx.queryKey}
          />
        </div>
      ) : (
        !fx.loading && (
          <ITCard className="!p-8 border border-slate-200 text-center">
            <ITText className="text-[12px] font-bold text-slate-500">{t("empty")}</ITText>
          </ITCard>
        )
      )}

      <ITDialog isOpen={noticesOpen} onClose={() => setNoticesOpen(false)} title={t("notices.title")}>
        <ITFlex direction="column" gap={3}>
          {notices.map((notice, i) => (
            <ITFlex key={i} align="start" gap={2}>
              <FaInfoCircle className="mt-0.5 shrink-0 text-amber-500" size={13} />
              <ITText className="text-[12px] font-bold text-slate-600">{notice}</ITText>
            </ITFlex>
          ))}
        </ITFlex>
      </ITDialog>
    </ITFlex>
  );
}
