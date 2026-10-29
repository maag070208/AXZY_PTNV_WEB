import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LuWrench } from "react-icons/lu";
import { dashboardApi } from "@entities/dashboard";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { useWidgetData } from "../../model/useWidgetData";
import { alarmTone } from "../../model/alarmTone";
import WidgetCard, { Metric, MetricGrid } from "../WidgetCard";

/** Lo que impide calcular bien la asistencia: números del reloj sin vincular, personal sin reloj o sin horario. */
export default function SetupGapsWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const canAssign = useCan("schedules.view");
  const { data, loading, error, reload } = useWidgetData(dashboardApi.setupGaps);
  return (
    <WidgetCard title={t("setup.title")} icon={<LuWrench size={16} />} loading={loading} error={error} onRetry={reload}>
      {data && (
        <MetricGrid>
          <Metric
            value={data.unlinkedClockNumbers}
            label={t("setup.unlinkedClockNumbers")}
            tone={alarmTone(data.unlinkedClockNumbers, "amber")}
            onClick={() => navigate("/hr/time-clock/employees")}
          />
          <Metric
            value={data.personalWithoutClock}
            label={t("setup.personalWithoutClock")}
            tone={alarmTone(data.personalWithoutClock, "amber")}
            onClick={() => navigate("/hr/time-clock/employees")}
          />
          <Metric
            value={data.personalWithoutSchedule}
            label={t("setup.personalWithoutSchedule")}
            tone={alarmTone(data.personalWithoutSchedule, "amber")}
            onClick={canAssign ? () => navigate("/schedules/assign") : undefined}
          />
        </MetricGrid>
      )}
    </WidgetCard>
  );
}
