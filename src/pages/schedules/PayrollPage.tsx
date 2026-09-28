import { ITPage } from "@axzydev/axzy_ui_system";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWeeklyAttendance, WeeklyAttendancePanel } from "@features/schedule";
import { downloadWeeklyAttendancePdf } from "@widgets/reports";

/**
 * Nómina: el reporte semanal de asistencia (entradas, salidas, horas y tiempo
 * extra) por departamento, para el control de RH. La pantalla vive en Recursos
 * Humanos y se protege con `payroll.view`.
 */
export default function PayrollPage() {
  const { t } = useTranslation(["weekly-attendance", "common"]);
  const navigate = useNavigate();
  const fx = useWeeklyAttendance({ downloadPdf: downloadWeeklyAttendancePdf });

  return (
    <ITPage
      title={t("title")}
      description={t("description")}
      icon={<FaMoneyCheckAlt size={20} />}
      noPadding
      horizontalPadding={"px-0"}
      maxWidth="7xl"
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.hr"), onClick: () => navigate("/employees") },
        { label: t("title") },
      ]}
      backAction={() => navigate("/employees")}
    >
      <WeeklyAttendancePanel fx={fx} />
    </ITPage>
  );
}
