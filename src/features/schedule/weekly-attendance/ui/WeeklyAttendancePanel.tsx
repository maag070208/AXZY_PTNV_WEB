import { useMemo, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITBentoGauge,
  ITBentoGrid,
  ITBentoTile,
  ITBentoWaves,
  ITBentoWeekBars,
  ITButton,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITInput,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  LuBell,
  LuBriefcaseBusiness,
  LuCalendarDays,
  LuChartColumn,
  LuChevronLeft,
  LuChevronRight,
  LuCircleCheck,
  LuClock,
  LuFileText,
  LuInfo,
  LuUserX,
  LuUsers,
} from "react-icons/lu";
import { dyn } from "@shared/i18n/dyn";
import { dateLocale } from "@shared/i18n";
import { DialogHeader } from "@shared/ui/dialog-header";
import { FilterPills } from "@shared/ui/filter-pills";
import { InsightNote, Num } from "@shared/ui/bento-bits";
import { LangostinState } from "@shared/ui/langostin";
import { PanelCard } from "@shared/ui/panel-card";
import { seriesColor } from "@shared/ui/charts";
import { WEEKLY_LEGEND, WEEKLY_STATUS_BADGE, hoursDecimal, toDayKey } from "@entities/schedule";
import type { UseWeeklyAttendance, WeeklyAttendanceMode } from "../model/useWeeklyAttendance";
import WeeklyAttendanceTable from "./WeeklyAttendanceTable";

/**
 * Reporte semanal de pre nómina.
 *
 * Plantilla P6: filtros + acciones (una fila), mosaicos con los totales de la
 * semana, la gráfica de horas extra por día y por departamento, y el reporte
 * con su selector de vista. La simbología se muestra
 * solo si se pide: antes competía con los filtros y confundía.
 */
export default function WeeklyAttendancePanel({ fx }: { fx: UseWeeklyAttendance }) {
  const t = dyn(fx.t);
  const report = fx.report;
  const summary = report?.summary;
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  // Avisos de la semana: solo se muestran si hay algo que atender.
  const notices: string[] = [];
  if (summary?.unlinked) notices.push(t("unlinkedHint", { count: summary.unlinked }));
  if (summary?.withoutSchedule) notices.push(t("withoutScheduleHint", { count: summary.withoutSchedule }));
  const noticesCount = (summary?.unlinked ?? 0) + (summary?.withoutSchedule ?? 0);

  const handleRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } },
  ) => {
    const value = e.target.value;
    if (Array.isArray(value) && value[0]) fx.setWeekDate(value[0]);
  };

  // Horas extra calculadas por día y por departamento (sumas de las filas del reporte).
  const { extraByDay, extraByDepartment } = useMemo(() => {
    const days = report?.range.days ?? [];
    const todayKey = toDayKey(new Date());
    const byDay = days.map((day, i) => {
      let minutes = 0;
      for (const row of report?.rows ?? []) minutes += row.days[i]?.extraMin ?? 0;
      return {
        label: new Date(`${day}T12:00:00Z`)
          .toLocaleDateString(dateLocale(), { weekday: "narrow", timeZone: "UTC" })
          .toUpperCase(),
        value: Math.round((minutes / 60) * 10) / 10,
        tone: day === todayKey ? ("today" as const) : day > todayKey ? ("future" as const) : ("past" as const),
      };
    });
    const deptMinutes = new Map<string, number>();
    for (const row of report?.rows ?? []) {
      if (row.totals.extraMin <= 0) continue;
      const key = row.departmentName ?? "—";
      deptMinutes.set(key, (deptMinutes.get(key) ?? 0) + row.totals.extraMin);
    }
    const byDept = [...deptMinutes.entries()]
      .map(([label, minutes], i) => ({ label, minutes, color: seriesColor(i) }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);
    return { extraByDay: byDay, extraByDepartment: byDept };
  }, [report]);
  const extraTotalMin = summary?.extraMin ?? 0;
  const deptMax = Math.max(1, ...extraByDepartment.map((d) => d.minutes));
  const topIndex = extraByDay.reduce((best, d, i) => (d.value > (extraByDay[best]?.value ?? 0) ? i : best), 0);
  const topDay = {
    value: extraByDay[topIndex]?.value ?? 0,
    label: report?.range.days[topIndex]
      ? new Date(`${report.range.days[topIndex]}T12:00:00Z`).toLocaleDateString(dateLocale(), {
          weekday: "long",
          timeZone: "UTC",
        })
      : "",
  };

  return (
    <ITFlex direction="column" gap={4}>
      {/* Filtros de la semana y acciones, en una sola fila */}
      <PanelCard>
        <div className="grid gap-3 lg:!grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-end">
          <ITFlex align="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={fx.previousWeek} title={t("filters.previousWeek")}>
              <LuChevronLeft size={14} />
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
              <LuChevronRight size={14} />
            </ITButton>
          </ITFlex>

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

          <ITInput
            name="weeklyAttendanceSearch"
            label={t("filters.search")}
            placeholder={t("filters.searchPlaceholder")}
            value={fx.search}
            onChange={(e) => fx.setSearch(e.target.value)}
          />

          <ITFlex align="center" gap={1} className="lg:pb-0.5">
            {noticesCount > 0 && (
              <ITButton variant="outlined" color="warning" onClick={() => setNoticesOpen(true)} title={t("notices.title")}>
                <ITFlex align="center" gap={1}>
                  <LuBell size={14} />
                  <ITText className="text-[11px] font-bold">{noticesCount}</ITText>
                </ITFlex>
              </ITButton>
            )}
            <ITButton variant="filled" color="primary" onClick={fx.exportPdf} disabled={fx.exporting || !report || report.rows.length === 0}>
              <ITFlex align="center" gap={1}>
                <LuFileText size={14} />
                <ITText className="text-[11px] font-bold">{fx.exporting ? t("exporting") : t("exportPdf")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </div>

      </PanelCard>

      {summary && (
        <ITBentoGrid>
          <ITBentoTile
            cols={2}
            rows={2}
            icon={<LuUsers size={15} />}
            label={t("kpis.people")}
            value={<Num value={summary.people} />}
            caption={t("context.people", { linked: summary.people - summary.unlinked, total: summary.people })}
          />
          <ITBentoTile
            tone="sea"
            cols={3}
            rows={2}
            icon={<LuClock size={15} />}
            label={t("kpis.worked")}
            value={`${hoursDecimal(summary.workedMin)} ${t("hoursShort")}`}
            caption={t("context.worked", { scheduled: `${hoursDecimal(summary.scheduledMin)} ${t("hoursShort")}` })}
          >
            {summary.scheduledMin > 0 && (
              <div className="relative z-[1] my-1 flex min-h-0 flex-1 items-center justify-center">
                <ITBentoGauge
                  value={Math.min(1, summary.workedMin / summary.scheduledMin)}
                  color="var(--color-warning)"
                  trackColor="rgb(255 255 255 / 0.14)"
                  size={150}
                />
              </div>
            )}
          </ITBentoTile>
          <ITBentoTile
            tone="sun"
            cols={3}
            rows={2}
            icon={<LuBriefcaseBusiness size={15} />}
            label={t("kpis.overtime")}
            value={`${hoursDecimal(summary.extraMin)} ${t("hoursShort")}`}
            caption={t("context.overtime", { worked: `${hoursDecimal(summary.workedMin)} ${t("hoursShort")}` })}
          />
          <ITBentoTile
            tone="mint"
            cols={2}
            rows={2}
            icon={<LuCircleCheck size={15} />}
            label={t("kpis.approved")}
            value={`${hoursDecimal(summary.approvedExtraMin)} ${t("hoursShort")}`}
            caption={t("context.approved", {
              pct: summary.extraMin > 0 ? Math.round((summary.approvedExtraMin / summary.extraMin) * 100) : 0,
            })}
          >
            {summary.extraMin > 0 && summary.approvedExtraMin > 0 && (
              <ITBentoWaves level={summary.approvedExtraMin / summary.extraMin} color="var(--color-success)" />
            )}
          </ITBentoTile>
          <ITBentoTile
            tone={summary.absences > 0 ? "lavender" : "plain"}
            cols={2}
            rows={2}
            icon={<LuUserX size={15} />}
            label={t("kpis.absences")}
            value={<Num value={summary.absences} />}
            caption={t("context.absences", { total: summary.people })}
          />

          {/* Horas extra por día de la semana */}
          <ITBentoTile cols={7} rows={3} wide icon={<LuChartColumn size={15} />} label={t("charts.extraByDay")}>
            <div className="mt-2 min-h-0 flex-1">
              <ITBentoWeekBars items={extraByDay} color="var(--color-primary-500)" todayColor="var(--color-warning)" />
            </div>
            <InsightNote className="mt-2">
              {topDay.value > 0 ? t("charts.dayNote", { hours: topDay.value, day: topDay.label }) : t("charts.noExtra")}
            </InsightNote>
          </ITBentoTile>

          {/* Horas extra por departamento */}
          <ITBentoTile cols={5} rows={3} wide icon={<LuCalendarDays size={15} />} label={t("charts.extraByDepartment")}>
            {extraByDepartment.length === 0 ? (
              <p className="m-0 mt-3 text-[12px] font-semibold opacity-60">{t("charts.noExtra")}</p>
            ) : (
              <div className="it-bento-bars mt-3 flex-1 content-around">
                {extraByDepartment.map((row) => (
                  <div key={row.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 text-[12.5px] font-medium">
                    <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: row.color }} />
                    <span className="truncate">{row.label}</span>
                    <span>
                      {hoursDecimal(row.minutes)} {t("hoursShort")}{" "}
                      <span className="opacity-60">{Math.round((row.minutes / Math.max(1, extraTotalMin)) * 100)}%</span>
                    </span>
                    <div className="it-bento-bar col-span-3">
                      <i style={{ "--it-bento-w": `${(row.minutes / deptMax) * 100}%`, background: row.color } as React.CSSProperties} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ITBentoTile>
        </ITBentoGrid>
      )}

      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      {/* Vista del reporte y simbología (a pedido) */}
      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <FilterPills
          items={[
            { id: "SUMMARY" as WeeklyAttendanceMode, label: t("view.summary") },
            { id: "DETAIL" as WeeklyAttendanceMode, label: t("view.detail") },
          ]}
          value={fx.mode}
          onChange={fx.setMode}
        />
        <ITButton variant="raised-text" color="secondary" onClick={() => setLegendOpen((open) => !open)}>
          <ITFlex align="center" gap={1}>
            <LuInfo size={13} />
            <ITText className="text-[11px] font-bold">{t("legend")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      {legendOpen && (
        <PanelCard>
          <ITFlex align="center" wrap="wrap" gap={2}>
            {WEEKLY_LEGEND.map((status) => (
              <ITBadget key={status} color={WEEKLY_STATUS_BADGE[status]} size="sm">
                {t(`status.${status}`)}
              </ITBadget>
            ))}
            {report && (
              <ITText className="ml-auto text-[11px] font-semibold text-slate-400">
                {t("timezone", { tz: report.range.timezone })}
              </ITText>
            )}
          </ITFlex>
        </PanelCard>
      )}

      {fx.loading && !report ? (
        <LangostinState kind="loading" />
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
          <PanelCard>
            <LangostinState kind="noResults" title={t("empty")} description={t("emptyHint")} />
          </PanelCard>
        )
      )}

      <ITDialog isOpen={noticesOpen} onClose={() => setNoticesOpen(false)}>
        <DialogHeader icon={<LuBell />} tone="warning" title={t("notices.title")} subtitle={t("notices.subtitle")} />
        <ITFlex direction="column" gap={3}>
          {notices.map((notice, i) => (
            <ITFlex key={i} align="start" gap={2}>
              <LuInfo className="mt-0.5 shrink-0 text-[color:var(--color-warning)]" size={14} />
              <ITText className="text-[12px] font-bold text-slate-600">{notice}</ITText>
            </ITFlex>
          ))}
        </ITFlex>
      </ITDialog>
    </ITFlex>
  );
}
