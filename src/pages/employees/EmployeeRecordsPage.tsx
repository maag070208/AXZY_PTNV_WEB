import { ITPage } from "@axzydev/axzy_ui_system";
import { FaIdCard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmployeeRecordsBoard, useEmployeeRecords } from "@features/hr/employee-records-board";

/** Expedientes de empleados: documentos obligatorios, expediente y datos personales (RH). */
export default function EmployeeRecordsPage() {
  const { t } = useTranslation(["employees", "common"]);
  const navigate = useNavigate();
  const fx = useEmployeeRecords();
  return (
    <ITPage
      noPadding
      title={t("records.title")}
      description={t("records.description")}
      icon={<FaIdCard size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("records.menu") }]}
      backAction={() => navigate(-1)}
    >
      <EmployeeRecordsBoard fx={fx} />
    </ITPage>
  );
}
