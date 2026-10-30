import { useMemo, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITBentoStatStrip,
  ITBentoWeekBars,
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
  LuBell,
  LuChartColumn,
  LuChevronLeft,
  LuChevronRight,
  LuFileText,
  LuInfo,
} from "react-icons/lu";
import { dyn } from "@shared/i18n/dyn";
import { dateLocale } from "@shared/i18n";
import { DialogHeader } from "@shared/ui/dialog-header";
import { FilterPills } from "@shared/ui/filter-pills";
import { Num } from "@shared/ui/bento-bits";
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
      {/* Cifras de la semana: la tira del mosaico, como en Asistencias */}
      {summary && (
        <ITBentoStatStrip
          stack
          items={[
            {
              id: "people",
              label: t("kpis.people"),
              value: <Num value={summary.people} />,
              caption: t("short.linked", { linked: summary.people - summary.unlinked }),
              tone: "sea",
              color: "var(--color-primary-500)",
            },
            {
              id: "worked",
              label: t("kpis.worked"),
              value: hoursDecimal(summary.workedMin),
              caption: t("short.scheduled", { hours: hoursDecimal(summary.scheduledMin) }),
              tone: "plain",
              color: "var(--color-primary-500)",
            },
            {
              id: "overtime",
              label: t("kpis.overtime"),
              value: hoursDecimal(summary.extraMin),
              caption: t("short.worked", { hours: hoursDecimal(summary.workedMin) }),
              tone: "sun",
              color: "var(--color-warning)",
            },
            {
              id: "approved",
              label: t("kpis.approved"),
              value: hoursDecimal(summary.approvedExtraMin),
              caption: t("short.calculated", {
                pct: summary.extraMin > 0 ? Math.round((summary.approvedExtraMin / summary.extraMin) * 100) : 0,
              }),
              tone: "mint",
              color: "var(--color-success)",
            },
            {
              id: "absences",
              label: t("kpis.absences"),
              value: <Num value={summary.absences} />,
              caption: t("short.people", { total: summary.people }),
              tone: summary.absences > 0 ? "lavender" : "plain",
              color: summary.absences > 0 ? "var(--color-danger)" : "var(--color-text-muted)",
            },
          ]}
          stackItems={[
            { id: "worked", label: t("kpis.worked"), value: summary.workedMin, color: "var(--color-primary-500)" },
            { id: "overtime", label: t("kpis.overtime"), value: summary.extraMin, color: "var(--color-warning)" },
            { id: "absences", label: t("kpis.absences"), value: summary.absences, color: "var(--color-danger)" },
          ]}
        />
      )}

      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      {/* Igual que Asistencias: una sola tarjeta con el título, la vista, los
          filtros debajo en una fila y el reporte. */}
      <ITCard contentClassName="!p-0">
        <ITFlex align="center" justify="between" wrap="wrap" gap={2} className="px-5 py-3">
          <ITFlex align="center" gap={2} className="min-w-0">
            <ITText className="!text-[14px] font-bold">{t("reportTitle")}</ITText>
            {report && (
              <ITText as="span" className="rounded-full bg-[color-mix(in_srgb,currentColor_7%,transparent)] px-2 py-0.5 !text-[11px] font-bold tabular-nums">
                {report.rows.length}
              </ITText>
            )}
          </ITFlex>
          <ITFlex align="center" gap={2}>
            <FilterPills
              items={[
                { id: "SUMMARY" as WeeklyAttendanceMode, label: t("view.summary") },
                { id: "DETAIL" as WeeklyAttendanceMode, label: t("view.detail") },
              ]}
              value={fx.mode}
              onChange={fx.setMode}
            />
            <ITButton variant="raised-text" color="secondary" size="sm" onClick={() => setLegendOpen((open) => !open)}>
              <ITFlex align="center" gap={1}>
                <LuInfo size={12} />
                <ITText className="text-[11px] font-bold">{t("legend")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>

        {legendOpen && (
          <ITFlex align="center" wrap="wrap" gap={2} className="  px-5 py-2.5">
            {WEEKLY_LEGEND.map((status) => (
              <ITBadget key={status} color={WEEKLY_STATUS_BADGE[status]} size="sm">
                {t(`status.${status}`)}
              </ITBadget>
            ))}
            {report && (
              <ITText muted className="ml-auto !text-[11px]">
                {t("timezone", { tz: report.range.timezone })}
              </ITText>
            )}
          </ITFlex>
        )}

        {/* Filtros: semana con anterior/siguiente, departamento, buscar y PDF */}
        <ITFlex wrap="wrap" align="end" gap={3} className="  px-5 py-3">
          <ITFlex align="end" gap={1.5} className="min-w-[250px] flex-[1.3]">
            <ITButton variant="outlined" color="secondary" size="sm" onClick={fx.previousWeek} title={t("filters.previousWeek")}>
              <LuChevronLeft size={13} />
            </ITButton>
            <ITFlex className="min-w-0 flex-1">
              <ITDatePicker
                name="weeklyAttendanceWeek"
                label={t("filters.week")}
                range
                value={fx.rangeValue}
                onChange={handleRange}
                className="w-full min-w-0"
              />
            </ITFlex>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={fx.nextWeek} title={t("filters.nextWeek")}>
              <LuChevronRight size={13} />
            </ITButton>
          </ITFlex>

          <ITFlex className="min-w-[180px] flex-1">
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
          </ITFlex>

          <ITFlex className="min-w-[170px] flex-1">
            <ITInput
              name="weeklyAttendanceSearch"
              label={t("filters.search")}
              placeholder={t("filters.searchPlaceholder")}
              value={fx.search}
              onChange={(e) => fx.setSearch(e.target.value)}
              className="w-full min-w-0"
            />
          </ITFlex>

          <ITFlex align="center" gap={1.5} className="shrink-0">
            {noticesCount > 0 && (
              <ITButton variant="outlined" color="warning" size="sm" onClick={() => setNoticesOpen(true)} title={t("notices.title")}>
                <ITFlex align="center" gap={1}>
                  <LuBell size={13} />
                  <ITText className="text-[11px] font-bold">{noticesCount}</ITText>
                </ITFlex>
              </ITButton>
            )}
            <ITButton variant="filled" color="primary" size="sm" onClick={fx.exportPdf} disabled={fx.exporting || !report || report.rows.length === 0}>
              <ITFlex align="center" gap={1}>
                <LuFileText size={13} />
                <ITText className="text-[11px] font-bold">{fx.exporting ? t("exporting") : t("exportPdf")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>

        <div className=" ">
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
            !fx.loading && <LangostinState kind="noResults" title={t("empty")} description={t("emptyHint")} />
          )}
        </div>
      </ITCard>

      {/* Horas extra de la semana: por día y por departamento */}
      {summary && (
        <PanelCard
          title={t("charts.weekTitle")}
          icon={<LuChartColumn size={16} />}
          actions={
            <ITText muted className="!text-[12px] font-semibold tabular-nums">
              {t("charts.total", { hours: hoursDecimal(summary.extraMin) })}
            </ITText>
          }
        >
          {extraTotalMin === 0 ? (
            <ITText muted className="!text-[12.5px]">
              {t("charts.noExtra")}
            </ITText>
          ) : (
            <ITGrid container columns={12} spacing={5}>
              <ITGrid item xs={12} lg={7} className="min-w-0">
                <ITText muted className="!text-[11px] font-bold uppercase tracking-[0.05em]">
                  {t("charts.extraByDay")}
                </ITText>
                <div className="mt-2 h-[104px]">
                  <ITBentoWeekBars items={extraByDay} color="var(--color-primary-500)" todayColor="var(--color-warning)" />
                </div>
                {topDay.value > 0 && (
                  <ITText muted className="mt-2 block !text-[11.5px]">
                    {t("charts.dayNote", { hours: topDay.value, day: topDay.label })}
                  </ITText>
                )}
              </ITGrid>
              <ITGrid item xs={12} lg={5} className="min-w-0">
                <ITText muted className="!text-[11px] font-bold uppercase tracking-[0.05em]">
                  {t("charts.extraByDepartment")}
                </ITText>
                <div className="mt-2 flex flex-col gap-2">
                  {extraByDepartment.map((row) => (
                    <div key={row.label} className="grid grid-cols-[9px_minmax(0,1fr)_auto] items-center gap-x-2.5 text-[12.5px] font-medium">
                      <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: row.color }} />
                      <ITText as="span" className="truncate">{row.label}</ITText>
                      <ITText as="span" className="whitespace-nowrap">
                        {hoursDecimal(row.minutes)} {t("hoursShort")}{" "}
                        <ITText as="span" className="opacity-60">
                          {Math.round((row.minutes / Math.max(1, extraTotalMin)) * 100)}%
                        </ITText>
                      </ITText>
                    </div>
                  ))}
                </div>
              </ITGrid>
            </ITGrid>
          )}
        </PanelCard>
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
