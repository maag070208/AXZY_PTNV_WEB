import { ITPage } from "@axzydev/axzy_ui_system";
import { FaHouseUser } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { AdminDashboard, useAdminDashboard } from "@features/home/admin-dashboard";
import { RoleDashboard } from "@features/home/role-dashboard";

export default function HomePage() {
  const { t } = useTranslation("home");
  const showOperations = useCan("dashboard.view");
  const adminFx = useAdminDashboard(showOperations);

  return (
    <ITPage title={t("title")} description={t("description")} icon={<FaHouseUser size={20} />}>
      <RoleDashboard slots={showOperations ? { operations: <AdminDashboard fx={adminFx} /> } : {}} />
    </ITPage>
  );
}
