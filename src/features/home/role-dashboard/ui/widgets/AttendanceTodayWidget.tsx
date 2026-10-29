import { useTranslation } from "react-i18next";
import { ITBadget, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { LuUserCheck } from "react-icons/lu";
import { dashboardApi, type AttendanceTodayRow, type TodayStatus } from "@entities/dashboard";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { CHART_STATUS, DonutChart } from "@shared/ui/charts";
import { formatTimeInTZ } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import type { KpiTone } from "@shared/ui/kpi-tile";
import { alarmTone } from "../../model/alarmTone";
import WidgetCard, { EmptyText, ListRow, Metric, MetricGrid, RowList, SectionLabel } from "../WidgetCard";

/** Tono por estado; los que son alarma (tarde, sin llegar, sin vínculo) van neutrales en cero. */
const STATUS_TONE: Record<TodayStatus, KpiTone> = {
  PRESENT: "emerald",
  LATE: "amber",
  NOT_ARRIVED: "rose",
  NOT_YET: "neutral",
  REST: "neutral",
  NO_SCHEDULE: "neutral",
  UNLINKED: "amber",
};

const METRICS: TodayStatus[] = ["PRESENT", "LATE", "NOT_ARRIVED", "NOT_YET", "UNLINKED"];

/**
 * Asistencia de hoy con el alcance de `attendance.view`: RH/gerencia ven a
 * todos, el jefe de área a su departamento y el empleado solo su día.
 */
export default function AttendanceTodayWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const canPayroll = useCan("payroll.view");
  const { data, loading, error, reload } = useWidgetData(dashboardApi.attendanceToday);
  const tz = data?.timezone;
  const time = (iso: string | null) => (iso && tz ? formatTimeInTZ(iso, tz) : "—");

  const title = !data || data.scope === "ALL" ? t("attendance.title") : data.scope === "AREA" ? t("attendance.titleArea") : t("attendance.titleOwn");

  const list = (rows: AttendanceTodayRow[], detail: (r: AttendanceTodayRow) => string) =>
    rows.length === 0 ? (
      <EmptyText>{t("empty")}</EmptyText>
    ) : (
      <RowList maxHeight={200}>
        {rows.map((r) => (
          <ListRow key={r.userId} avatarName={r.name} title={r.name} subtitle={r.departmentName ?? "—"} right={detail(r)} />
        ))}
      </RowList>
    );

  // Proporción real del día: quienes ya llegaron entre quienes se esperaban a esta hora.
  const expected = data ? data.counts.PRESENT + data.counts.LATE + data.counts.NOT_ARRIVED + data.counts.NOT_YET : 0;

  // Vista del propio empleado: su día en una línea.
  const own = data && data.scope === "OWN" ? data.rows[0] : null;
  const ownMessage = (r: AttendanceTodayRow) => {
    switch (r.status) {
      case "PRESENT":
      case "LATE":
        return t("attendance.ownPresent", { time: time(r.entryAt) }) + (r.lateMin > 0 ? ` · ${t("attendance.late", { minutes: r.lateMin })}` : "");
      case "NOT_ARRIVED":
        return t("attendance.ownNotArrived", { time: time(r.scheduledStartAt) });
      case "NOT_YET":
        return t("attendance.ownNotYet", { time: time(r.scheduledStartAt) });
      case "REST":
        return t("attendance.ownRest");
      case "UNLINKED":
        return t("attendance.ownUnlinked");
      default:
        return t("attendance.noSchedule");
    }
  };

  return (
    <WidgetCard
      title={title}
      icon={<LuUserCheck size={16} />}
      to={canPayroll ? "/schedules/payroll" : undefined}
      toLabel={t("attendance.viewReport")}
      loading={loading}
      error={error}
      onRetry={reload}
    >
      {own ? (
        <ITFlex direction="column" gap={2}>
          <ITBadget color={own.status === "LATE" || own.status === "NOT_ARRIVED" ? "warning" : "success"} size="lg">
            {t(`attendance.status.${own.status}`)}
          </ITBadget>
          <ITText className="text-[13px] font-bold text-slate-700">{ownMessage(own)}</ITText>
          {own.shift && <ITText className="text-[11px] text-slate-500">{t("attendance.shift", { shift: own.shift })}</ITText>}
        </ITFlex>
      ) : (
        data && (
          <>
            <MetricGrid>
              {METRICS.map((s) => (
                <Metric
                  key={s}
                  value={data.counts[s]}
                  label={t(`attendance.status.${s}`)}
                  tone={s === "PRESENT" ? "emerald" : alarmTone(data.counts[s], STATUS_TONE[s])}
                  ratio={s === "PRESENT" && expected > 0 ? data.counts.PRESENT / expected : undefined}
                  hint={s === "PRESENT" && expected > 0 ? t("attendance.ofExpected", { total: expected }) : undefined}
                />
              ))}
              <Metric value={data.counts.onSite} label={t("attendance.onSite")} tone="sky" />
            </MetricGrid>
            <SectionLabel>{t("attendance.chartTitle")}</SectionLabel>
            <DonutChart
              size={110}
              segments={[
                { label: t("attendance.status.PRESENT"), value: data.counts.PRESENT, color: CHART_STATUS.good },
                { label: t("attendance.status.LATE"), value: data.counts.LATE, color: CHART_STATUS.warning },
                { label: t("attendance.status.NOT_ARRIVED"), value: data.counts.NOT_ARRIVED, color: CHART_STATUS.critical },
                { label: t("attendance.status.NOT_YET"), value: data.counts.NOT_YET, color: CHART_STATUS.info },
              ]}
            />
            <SectionLabel>{t("attendance.notArrivedList")}</SectionLabel>
            {list(
              data.rows.filter((r) => r.status === "NOT_ARRIVED"),
              (r) => t("attendance.shift", { shift: r.shift ?? "—" })
            )}
            <SectionLabel>{t("attendance.lateList")}</SectionLabel>
            {list(
              data.rows.filter((r) => r.status === "LATE").sort((a, b) => b.lateMin - a.lateMin),
              (r) => `${t("attendance.entry", { time: time(r.entryAt) })} · ${t("attendance.late", { minutes: r.lateMin })}`
            )}
          </>
        )
      )}
    </WidgetCard>
  );
}
