import { useTranslation } from "react-i18next";
import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaBusinessTime } from "react-icons/fa";
import { dashboardApi } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { CHART_STATUS, StackedBar } from "@shared/ui/charts";
import { formatMinutesAsHhMm } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { Metric, SectionLabel } from "../WidgetCard";

/** Horas extra de la semana: calculadas contra aprobadas contra no aprobadas (lo que compara RH). */
export default function OvertimeWeekWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const { data, loading, error, reload } = useWidgetData(dashboardApi.overtimeWeek);
  const hours = (min: number) => formatMinutesAsHhMm(min);

  return (
    <WidgetCard
      title={t("overtime.title")}
      icon={<FaBusinessTime size={14} />}
      iconClass="bg-emerald-700"
      to="/schedules/overtime/approval"
      toLabel={t("overtime.review")}
      loading={loading}
      error={error}
      onRetry={reload}
    >
      {data && (
        <>
          <ITFlex wrap="wrap" gap={2}>
            <Metric value={hours(data.extraMin)} label={t("overtime.calculated")} />
            <Metric value={hours(data.approvedExtraMin)} label={t("overtime.approved")} tone="text-emerald-700" />
            <Metric value={hours(data.pendingExtraMin)} label={t("overtime.notApproved")} tone="text-amber-600" />
            <Metric value={hours(data.rejectedExtraMin)} label={t("overtime.rejected")} tone="text-rose-600" />
          </ITFlex>
          <SectionLabel>{t("overtime.chartTitle")}</SectionLabel>
          <StackedBar
            segments={[
              { label: t("overtime.approved"), value: data.approvedExtraMin, display: hours(data.approvedExtraMin), color: CHART_STATUS.good },
              { label: t("overtime.notApproved"), value: data.pendingExtraMin, display: hours(data.pendingExtraMin), color: CHART_STATUS.warning },
              { label: t("overtime.rejected"), value: data.rejectedExtraMin, display: hours(data.rejectedExtraMin), color: CHART_STATUS.critical },
            ]}
          />
          <SectionLabel>{t("overtime.topPending")}</SectionLabel>
          {data.topPending.length === 0 ? (
            <ITText className="text-[11px] text-slate-400">{t("empty")}</ITText>
          ) : (
            data.topPending.map((p) => (
              <ITFlex key={p.userId} justify="between" className="border-b border-slate-100 py-1">
                <div>
                  <div className="text-[11px] font-bold text-slate-800">{p.name}</div>
                  <div className="text-[9px] uppercase text-slate-400">{p.departmentName ?? "—"}</div>
                </div>
                <ITText className="text-[11px] font-black text-amber-600">{hours(p.pendingExtraMin)}</ITText>
              </ITFlex>
            ))
          )}
        </>
      )}
    </WidgetCard>
  );
}
