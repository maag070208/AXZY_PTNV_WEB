import { ITBentoLive, ITPage } from "@axzydev/axzy_ui_system";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import { useCan } from "@entities/user";
import { AdminDashboard, useAdminDashboard } from "@features/home/admin-dashboard";
import { RoleDashboard, useWidgetData, type WidgetGroup, type WidgetId } from "@features/home/role-dashboard";
import { dashboardApi } from "@entities/dashboard";
import PersonalDashboard from "@features/home/personal-dashboard/ui/PersonalDashboard";
import ClockDashboard from "@features/home/clock-dashboard/ui/ClockDashboard";
import SystemDashboard from "@features/home/system-dashboard/ui/SystemDashboard";
import { EmployeeRecordsBoard, useEmployeeRecords } from "@features/hr/employee-records-board";
import { formatLongDate } from "@shared/utils/dates";

export default function HomePage() {
  const { t, i18n } = useTranslation("home");
  const showOperations = useCan("dashboard.view");
  const adminFx = useAdminDashboard(showOperations);
  const showRecords = useCan("hr.records");
  const showSystem = useCan("system.configure");
  const fullName = useSelector((s: RootState) => s.auth.user?.name);

  // Saludo con el primer nombre y fecha larga de hoy (primera letra en mayúscula).
  const firstName = fullName?.trim().split(/\s+/)[0] ?? "";
  const today = formatLongDate(new Date(), i18n.language);
  const dateLabel = today.charAt(0).toUpperCase() + today.slice(1);

  // Los temas con tablero propio se dibujan como mosaico bento (igual que Operación).
  const panels: Partial<Record<WidgetGroup, React.ReactNode>> = {};
  if (showOperations) panels.ops = <AdminDashboard fx={adminFx} />;
  if (showRecords) panels.people = <PersonalPanel />;
  panels.clock = <ClockPanel />;
  if (showSystem) panels.system = <SystemPanel />;
  const slots: Partial<Record<WidgetId, React.ReactNode>> = {};

  return (
    <ITPage
      noPadding
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      title={firstName ? t("greeting", { name: firstName }) : t("title")}
      description={`${dateLabel} · ${t("hotel")}`}
    >
      <RoleDashboard
        slots={slots}
        panels={panels}
        live={showOperations ? <ITBentoLive label={t("adminDashboard.live")} /> : undefined}
      />
    </ITPage>
  );
}

/** Pestaña Sistema: salud, correos, auditor y relojes. */
function SystemPanel() {
  const health = useWidgetData(dashboardApi.systemHealth);
  return <SystemDashboard health={health.data} />;
}

/** Pestaña Reloj y accesos: pendientes de configuración + accesos del día. */
function ClockPanel() {
  const access = useWidgetData(dashboardApi.accessToday);
  const setup = useWidgetData(dashboardApi.setupGaps);
  return <ClockDashboard access={access.data} setup={setup.data} />;
}

/**
 * Pestaña Personal: el mosaico (asistencia, horas extra, expedientes) y debajo
 * el tablero de expedientes. La página es quien compone las dos features.
 */
function PersonalPanel() {
  const fx = useEmployeeRecords();
  const attendance = useWidgetData(dashboardApi.attendanceToday);
  const overtime = useWidgetData(dashboardApi.overtimeWeek);
  return (
    <PersonalDashboard recordsCounts={fx.counts} attendance={attendance.data} overtime={overtime.data}>
      <EmployeeRecordsBoard fx={fx} hideKpis />
    </PersonalDashboard>
  );
}
