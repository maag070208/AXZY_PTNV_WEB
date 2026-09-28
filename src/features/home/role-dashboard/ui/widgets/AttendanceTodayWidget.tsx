import { useTranslation } from "react-i18next";
import { ITBadget, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaUserClock } from "react-icons/fa";
import { dashboardApi, type AttendanceTodayRow, type TodayStatus } from "@entities/dashboard";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { CHART_STATUS, DonutChart } from "@shared/ui/charts";
import { formatTimeInTZ } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { Metric, SectionLabel } from "../WidgetCard";

const STATUS_TONE: Record<TodayStatus, string> = {
  PRESENT: "text-emerald-700",
  LATE: "text-amber-600",
  NOT_ARRIVED: "text-rose-600",
  NOT_YET: "text-slate-500",
  REST: "text-slate-500",
  NO_SCHEDULE: "text-slate-500",
  UNLINKED: "text-yellow-700",
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
      <ITText className="text-[11px] text-slate-400">{t("empty")}</ITText>
    ) : (
      <div className="max-h-[180px] overflow-auto">
        {rows.map((r) => (
          <ITFlex key={r.userId} align="center" justify="between" className="border-b border-slate-100 py-1">
            <div>
              <div className="text-[11px] font-bold text-slate-800">{r.name}</div>
              <div className="text-[9px] uppercase text-slate-400">{r.departmentName ?? "—"}</div>
            </div>
            <ITText className="text-[10px] font-bold text-slate-600">{detail(r)}</ITText>
          </ITFlex>
        ))}
      </div>
    );

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
      icon={<FaUserClock size={14} />}
      iconClass="bg-emerald-600"
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
            <ITFlex wrap="wrap" gap={2}>
              {METRICS.map((s) => (
                <Metric key={s} value={data.counts[s]} label={t(`attendance.status.${s}`)} tone={STATUS_TONE[s]} />
              ))}
              <Metric value={data.counts.onSite} label={t("attendance.onSite")} tone="text-[#0D5777]" />
            </ITFlex>
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
