import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ITFlex } from "@axzydev/axzy_ui_system";
import { FaTools } from "react-icons/fa";
import { dashboardApi } from "@entities/dashboard";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { Metric } from "../WidgetCard";

/** Lo que impide calcular bien la asistencia: números del reloj sin vincular, personal sin reloj o sin horario. */
export default function SetupGapsWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const canAssign = useCan("schedules.view");
  const { data, loading, error, reload } = useWidgetData(dashboardApi.setupGaps);
  return (
    <WidgetCard title={t("setup.title")} icon={<FaTools size={13} />} iconClass="bg-yellow-600" loading={loading} error={error} onRetry={reload}>
      {data && (
        <ITFlex wrap="wrap" gap={2}>
          <Metric
            value={data.unlinkedClockNumbers}
            label={t("setup.unlinkedClockNumbers")}
            tone={data.unlinkedClockNumbers ? "text-yellow-700" : "text-emerald-700"}
            onClick={() => navigate("/hr/time-clock/employees")}
          />
          <Metric
            value={data.personalWithoutClock}
            label={t("setup.personalWithoutClock")}
            tone={data.personalWithoutClock ? "text-yellow-700" : "text-emerald-700"}
            onClick={() => navigate("/hr/time-clock/employees")}
          />
          <Metric
            value={data.personalWithoutSchedule}
            label={t("setup.personalWithoutSchedule")}
            tone={data.personalWithoutSchedule ? "text-yellow-700" : "text-emerald-700"}
            onClick={canAssign ? () => navigate("/schedules/assign") : undefined}
          />
        </ITFlex>
      )}
    </WidgetCard>
  );
}
