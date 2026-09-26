import { ITPage } from "@axzydev/axzy_ui_system";
import { FaLink } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChecadorEmpleadosTab, useChecadorEmpleados } from "@features/access/checador-empleados";

export default function ChecadorEmpleadosPage() {
  const { t } = useTranslation(["checador", "common"]);
  const navigate = useNavigate();
  const fx = useChecadorEmpleados();

  return (
    <ITPage
      title={t("empleados.title")}
      description={t("empleados.description")}
      icon={<FaLink size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.access"), onClick: () => navigate("/access") },
        { label: t("empleados.title") },
      ]}
      backAction={() => navigate("/access/checador")}
    >
      <ChecadorEmpleadosTab fx={fx} />
    </ITPage>
  );
}
