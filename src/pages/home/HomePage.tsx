import { ITPage, ITStack } from "@axzydev/axzy_ui_system";
import { FaHouseUser } from "react-icons/fa";
import {
  useHomeDashboard,
  DashboardModulesGrid,
} from "@features/home/dashboard";
import { AdminDashboard, useAdminDashboard } from "@features/home/admin-dashboard";

export default function HomePage() {
  const fx = useHomeDashboard();
  const showAdminDashboard = fx.user?.role === "ADMIN" || fx.user?.role === "GERENTE";
  const adminFx = useAdminDashboard(showAdminDashboard);

  return (
    <ITPage
      title={fx.t("home:title")}
      description={fx.t("home:description")}
      icon={<FaHouseUser size={20} />}
      maxWidth="6xl"
    >
      <ITStack direction="column" spacing={6}>
        {showAdminDashboard && <AdminDashboard fx={adminFx} />}
        <DashboardModulesGrid fx={fx} />
      </ITStack>
    </ITPage>
  );
}