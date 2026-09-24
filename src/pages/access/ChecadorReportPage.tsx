import { ITFlex, ITPage } from "@axzydev/axzy_ui_system";
import { FaUserClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AccessReportTab, useAccessReport, type AccessReportSource } from "@features/access/report";
import { VinculosResumen } from "@features/access/checador-empleados";
import { checadorApi } from "@entities/checador";
import { downloadChecadorReportPDF } from "@widgets/reports";

/** El mismo reporte de entradas/salidas, alimentado por las checadas del reloj. */
const CHECADOR_SOURCE: AccessReportSource = {
  report: checadorApi.report,
  reportExport: checadorApi.reportExport,
  csvPrefix: "checador",
};

export default function ChecadorReportPage() {
  const { t } = useTranslation(["checador", "common"]);
  const navigate = useNavigate();
  const fx = useAccessReport({ download: downloadChecadorReportPDF, source: CHECADOR_SOURCE });

  return (
    <ITPage
      title={t("reporte.title")}
      description={t("reporte.description")}
      icon={<FaUserClock size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.access"), onClick: () => navigate("/access") },
        { label: t("reporte.title") },
      ]}
      backAction={() => navigate("/access/checador")}
    >
      <ITFlex direction="column" gap={4}>
        <VinculosResumen onIrAVincular={() => navigate("/access/checador/empleados")} />
        <AccessReportTab fx={fx} />
      </ITFlex>
    </ITPage>
  );
}
