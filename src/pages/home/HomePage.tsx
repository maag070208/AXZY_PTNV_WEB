import { ITPage } from "@axzydev/axzy_ui_system";
import { FaHouseUser } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import { AdminDashboard, useAdminDashboard } from "@features/home/admin-dashboard";

export default function HomePage() {
  const { t } = useTranslation("home");
  const user = useSelector((s: RootState) => s.auth.user);
  const showAdminDashboard = user?.role === "ADMIN" || user?.role === "GERENTE";
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