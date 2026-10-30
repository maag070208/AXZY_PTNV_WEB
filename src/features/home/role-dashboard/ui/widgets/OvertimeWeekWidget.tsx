import { useTranslation } from "react-i18next";
import { ITBadget } from "@axzydev/axzy_ui_system";
import { LuTimer } from "react-icons/lu";
import { dashboardApi } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { CHART_STATUS, StackedBar } from "@shared/ui/charts";
import { formatMinutesAsHhMm } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { EmptyText, ListRow, Metric, MetricGrid, RowList, SectionLabel } from "../WidgetCard";

/** Horas extra de la semana: calculadas contra aprobadas contra no aprobadas (lo que compara RH). */
export default function OvertimeWeekWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const { data, loading, error, reload } = useWidgetData(dashboardApi.overtimeWeek);
  const hours = (min: number) => formatMinutesAsHhMm(min);

  return (
    <WidgetCard
      title={t("overtime.title")}
      icon={<LuTimer size={16} />}
      to="/schedules/overtime/approval"
      toLabel={t("overtime.review")}
      loading={loading}
      error={error}
      onRetry={reload}
    >
      {data && (
        <>
          <MetricGrid>
            <Metric value={hours(data.extraMin)} label={t("overtime.calculated")} tone="sky" />
            <Metric
              value={hours(data.approvedExtraMin)}
              label={t("overtime.approved")}
              tone="emerald"
              ratio={data.extraMin > 0 ? data.approvedExtraMin / data.extraMin : undefined}
            />
            <Metric
              value={hours(data.pendingExtraMin)}
              label={t("overtime.notApproved")}
              tone="amber"
              ratio={data.extraMin > 0 ? data.pendingExtraMin / data.extraMin : undefined}
            />
            <Metric value={hours(data.rejectedExtraMin)} label={t("overtime.rejected")} tone="rose" />
          </MetricGrid>
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
            <EmptyText>{t("empty")}</EmptyText>
          ) : (
            <RowList>
              {data.topPending.map((p) => (
                <ListRow
                  key={p.userId}
                  avatarName={p.name}
                  title={p.name}
                  subtitle={p.departmentName ?? "—"}
                  right={
                    <ITBadget color="warning" size="sm">
                      {hours(p.pendingExtraMin)}
                    </ITBadget>
                  }
                />
              ))}
            </RowList>
          )}
        </>
      )}
    </WidgetCard>
  );
}
