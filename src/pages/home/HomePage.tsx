import { ITPage } from "@axzydev/axzy_ui_system";
import { FaHouseUser } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { AdminDashboard, useAdminDashboard } from "@features/home/admin-dashboard";
import { RoleDashboard, type WidgetId } from "@features/home/role-dashboard";
import { EmployeeRecordsBoard, useEmployeeRecords } from "@features/hr/employee-records-board";

export default function HomePage() {
  const { t } = useTranslation("home");
  const showOperations = useCan("dashboard.view");
  const adminFx = useAdminDashboard(showOperations);
  const showRecords = useCan("hr.records");

  const slots: Partial<Record<WidgetId, React.ReactNode>> = {};
  if (showOperations) slots.operations = <AdminDashboard fx={adminFx} />;
  if (showRecords) slots.hrRecords = <RecordsBoardSlot />;

  return (
    <ITPage
      noPadding title={t("title")} description={t("description")} icon={<FaHouseUser size={20} />}>
      <RoleDashboard slots={slots} />
    </ITPage>
  );
}

/** Expedientes en el inicio (el hook solo corre si la persona tiene `hr.records`). */
function RecordsBoardSlot() {
  const fx = useEmployeeRecords();
  return <EmployeeRecordsBoard fx={fx} />;
}
