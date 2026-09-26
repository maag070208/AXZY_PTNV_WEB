import { ITPage } from "@axzydev/axzy_ui_system";
import { FaHouseUser } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { AdminDashboard, useAdminDashboard } from "@features/home/admin-dashboard";

export default function HomePage() {
  const { t } = useTranslation("home");
  const showAdminDashboard = useCan("dashboard.view");
  const adminFx = useAdminDashboard(showAdminDashboard);

  return (
    <ITPage
      title={t("title")}
      description={t("description")}
      icon={<FaHouseUser size={20} />}
    >
      {showAdminDashboard && <AdminDashboard fx={adminFx} />}
    </ITPage>
  );
}