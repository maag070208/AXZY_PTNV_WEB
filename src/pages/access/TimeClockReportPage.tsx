import { ITFlex, ITPage } from "@axzydev/axzy_ui_system";
import { FaUserClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AccessReportTab, useAccessReport, type AccessReportSource } from "@features/access/report";
import { LinksSummary } from "@features/access/time-clock-employees";
import { timeClockApi } from "@entities/time-clock";
import { downloadTimeClockReportPdf } from "@widgets/reports";

/** El mismo reporte de entradas/salidas, alimentado por las checadas del reloj. */
const TIME_CLOCK_SOURCE: AccessReportSource = {
  report: timeClockApi.report,
  reportExport: timeClockApi.reportExport,
  csvFile: "timeClock",
};

export default function TimeClockReportPage() {
  const { t } = useTranslation(["time-clock", "common"]);
  const navigate = useNavigate();
  const fx = useAccessReport({ download: downloadTimeClockReportPdf, source: TIME_CLOCK_SOURCE });

  return (
    <ITPage
      title={t("report.title")}
      description={t("report.description")}
      icon={<FaUserClock size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.access"), onClick: () => navigate("/access") },
        { label: t("report.title") },
      ]}
      backAction={() => navigate("/access/time-clock")}
    >
      <ITFlex direction="column" gap={4}>
        <LinksSummary onGoToLink={() => navigate("/access/time-clock/employees")} />
        <AccessReportTab fx={fx} />
      </ITFlex>
    </ITPage>
  );
}
