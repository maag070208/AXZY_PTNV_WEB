import { ITPage } from "@axzydev/axzy_ui_system";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import { useCan } from "@entities/user";
import { AdminDashboard, useAdminDashboard } from "@features/home/admin-dashboard";
import { RoleDashboard, type WidgetId } from "@features/home/role-dashboard";
import { EmployeeRecordsBoard, useEmployeeRecords } from "@features/hr/employee-records-board";
import { formatLongDate } from "@shared/utils/dates";

export default function HomePage() {
  const { t, i18n } = useTranslation("home");
  const showOperations = useCan("dashboard.view");
  const adminFx = useAdminDashboard(showOperations);
  const showRecords = useCan("hr.records");
  const fullName = useSelector((s: RootState) => s.auth.user?.name);

  // Saludo con el primer nombre y fecha larga de hoy (primera letra en mayúscula).
  const firstName = fullName?.trim().split(/\s+/)[0] ?? "";
  const today = formatLongDate(new Date(), i18n.language);
  const dateLabel = today.charAt(0).toUpperCase() + today.slice(1);

  const slots: Partial<Record<WidgetId, React.ReactNode>> = {};
  if (showOperations) slots.operations = <AdminDashboard fx={adminFx} />;
  if (showRecords) slots.hrRecords = <RecordsBoardSlot />;

  return (
    <ITPage
      noPadding
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      title={firstName ? t("greeting", { name: firstName }) : t("title")}
      description={`${dateLabel} · ${t("hotel")}`}
    >
      <RoleDashboard slots={slots} />
    </ITPage>
  );
}

/** Expedientes en el inicio (el hook solo corre si la persona tiene `hr.records`). */
function RecordsBoardSlot() {
  const fx = useEmployeeRecords();
  return <EmployeeRecordsBoard fx={fx} />;
}
