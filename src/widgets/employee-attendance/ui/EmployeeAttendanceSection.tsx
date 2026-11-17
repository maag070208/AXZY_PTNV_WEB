import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ITAlert, ITBadget, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { AccessReportPeriod, AccessReportSessionRow } from "@entities/access";
import { timeClockApi } from "@entities/time-clock";
import { useWeekStartDay } from "@entities/sys-config";
import { PunchTimeline } from "@features/access/report";
import { PanelCard } from "@shared/ui/panel-card";
import { PeriodPicker } from "@shared/ui/period-picker";
import { dateLocale } from "@shared/i18n";
import { periodRangeOf, shiftPeriod, toDateInput } from "@shared/lib/reportPeriod";
import { formatMinutesAsHhMm } from "@shared/utils/dates";

const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City";

const formatDay = (dayKey: string): string =>
  new Date(`${dayKey}T12:00:00Z`).toLocaleDateString(dateLocale(), {
    weekday: "long",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

/**
 * Asistencias de un empleado: por día, su entrada, la secuencia de salidas y
 * regresos, la salida final, lo trabajado y el tiempo fuera. Semana en curso
 * por defecto; usa el mismo reporte del reloj filtrado por empleado.
 */
export default function EmployeeAttendanceSection({ userId }: { userId: string }) {
  const { t } = useTranslation("access-report");
  const weekStart = useWeekStartDay();
  const [period, setPeriod] = useState<AccessReportPeriod>("WEEK");
  const [date, setDate] = useState<Date>(() => new Date());
  const [rows, setRows] = useState<AccessReportSessionRow[]>([]);
  const [timezone, setTimezone] = useState(BROWSER_TIMEZONE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => periodRangeOf(date, period, weekStart), [date, period, weekStart]);
  const dateKey = toDateInput(date);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    timeClockApi
      .reportExport({
        page: 1,
        limit: 100,
        filters: { period, date: dateKey, employeeId: userId, includeInactive: true },
        sort: { key: "entryAt", direction: "asc" },
      })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setTimezone(res.summary.range.timezone || BROWSER_TIMEZONE);
        setError(null);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : t("errors.load")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period, dateKey, userId, t]);

  const labels = useMemo(
    () => ({
      periods: {
        DAY: t("periodTabs.DAY"),
        WEEK: t("periodTabs.WEEK"),
        FORTNIGHT: t("periodTabs.FORTNIGHT"),
        MONTH: t("periodTabs.MONTH"),
      },
      date: t("filters.date"),
      previous: t("filters.previous"),
      next: t("filters.next"),
    }),
    [t]
  );

  return (
    <PanelCard title={t("timeline.title")}>
      <ITFlex direction="column" gap={3}>
        <PeriodPicker
          name="employeeAttendance"
          period={period}
          onPeriodChange={(p: AccessReportPeriod) => {
            setPeriod(p);
            setDate(new Date());
          }}
          date={date}
          range={range}
          onDateChange={setDate}
          onPrevious={() => setDate((d) => shiftPeriod(d, period, -1))}
          onNext={() => setDate((d) => shiftPeriod(d, period, 1))}
          labels={labels}
        />

        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}

        {!loading && rows.length === 0 && !error && (
          <ITText className="text-xs italic text-slate-400">{t("timeline.empty")}</ITText>
        )}

        {rows.map((r) => (
          <ITFlex
            key={r.id}
            direction="column"
            gap={1}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
              <ITText className="text-[12px] font-bold capitalize text-slate-700">{formatDay(r.date)}</ITText>
              <ITFlex align="center" gap={2}>
                {r.onSite && (
                  <ITBadget color="success" size="sm">
                    {t("state.onSite")}
                  </ITBadget>
                )}
                <ITText className="text-[11px] text-slate-500">
                  {t("columns.hours")}: {r.exitAt ? formatMinutesAsHhMm(r.workedMinutes) : "—"}
                  {" · "}
                  {t("timeline.away")}: {formatMinutesAsHhMm(r.awayMinutes ?? 0)}
                </ITText>
              </ITFlex>
            </ITFlex>
            <PunchTimeline
              entryAt={r.entryAt}
              exitAt={r.onSite ? null : r.exitAt}
              outings={r.outings}
              incompleteSequence={r.incompleteSequence}
              timezone={timezone}
            />
          </ITFlex>
        ))}
      </ITFlex>
    </PanelCard>
  );
}
