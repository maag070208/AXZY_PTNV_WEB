import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@pages/auth/LoginPage";
import PrivateRoutes from "./guards/PrivateRoutes";
import RequiresPermission from "./guards/RequirePermission";
import AccessPage from "@pages/access/AccessPage";
import AccessReportPage from "@pages/access/AccessReportPage";
import TimeClockPage from "@pages/access/TimeClockPage";
import TimeClockReportPage from "@pages/access/TimeClockReportPage";
import TimeClockEmployeesPage from "@pages/access/TimeClockEmployeesPage";
import TimeClocksPage from "@pages/access/TimeClocksPage";
import SchedulesPage from "@pages/schedules/SchedulesPage";
import ScheduleFormPage from "@pages/schedules/ScheduleFormPage";
import AssignSchedulesPage from "@pages/schedules/AssignSchedulesPage";
import OvertimeApprovalPage from "@pages/overtime/OvertimeApprovalPage";
import HomePage from "@pages/home/HomePage";
import DashboardPage from "@pages/inventory/DashboardPage";
import DevicesPage from "@pages/inventory/DevicesPage";
import DeviceFormPage from "@pages/inventory/DeviceFormPage";
import EditDevicePage from "@pages/inventory/EditDevicePage";
import DeviceDetailPage from "@pages/inventory/DeviceDetailPage";
import DeviceTypesPage from "@pages/inventory/DeviceTypesPage";
import MovementsPage from "@pages/inventory/MovementsPage";
import NewMovementPage from "@pages/inventory/NewMovementPage";
import LoansPage from "@pages/inventory/LoansPage";
import NewLoanPage from "@pages/inventory/NewLoanPage";
import EditLoanPage from "@pages/inventory/EditLoanPage";
import LoanDetailPage from "@pages/inventory/LoanDetailPage";
import ReturnsPage from "@pages/inventory/ReturnsPage";
import NewLoanReturnPage from "@pages/inventory/NewLoanReturnPage";
import DepartmentsPage from "@pages/departments/DepartmentsPage";
import DepartmentDetailPage from "@pages/departments/DepartmentDetailPage";
import SubareasPage from "@pages/subareas/SubareasPage";
import EmployeesListPage from "@pages/employees/EmployeesListPage";
import EmployeeDetailPage from "@pages/employees/EmployeeDetailPage";
import EmployeeProfileEditPage from "@pages/employees/EmployeeProfileEditPage";
import HrReportsPage from "@pages/employees/HrReportsPage";
import DisciplinaryReportDetailPage from "@pages/employees/DisciplinaryReportDetailPage";
import DocumentCatalogPage from "@pages/employees/DocumentCatalogPage";
import ReportsPage from "@pages/reports/ReportsPage";
import UsersListPage from "@pages/users/UsersListPage";
import UserFormPage from "@pages/users/UserFormPage";
import UserHistoryPage from "@pages/users/UserHistoryPage";
import UserImportPage from "@pages/users/UserImportPage";
import TicketsListPage from "@pages/tickets/TicketsListPage";
import NewTicketPage from "@pages/tickets/NewTicketPage";
import TicketDetailPage from "@pages/tickets/TicketDetailPage";
import EditTicketPage from "@pages/tickets/EditTicketPage";
import KanbanPage from "@pages/tickets/KanbanPage";
import MyTasksPage from "@pages/tickets/MyTasksPage";
import AdminTasksPage from "@pages/tickets/AdminTasksPage";
import NotificationsPage from "@pages/notifications/NotificationsPage";
import CatalogPage from "@pages/catalog/CatalogPage";
import RolesPage from "@pages/roles/RolesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoutes />}>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/inventory"
          element={
            <RequiresPermission permission="devices.view">
              <DashboardPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/devices"
          element={
            <RequiresPermission permission="devices.view">
              <DevicesPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/devices/new"
          element={
            <RequiresPermission permission="devices.view">
              <DeviceFormPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/devices/:id"
          element={
            <RequiresPermission permission="devices.view">
              <DeviceDetailPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/devices/:id/edit"
          element={
            <RequiresPermission permission="devices.view">
              <EditDevicePage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/device-types"
          element={
            <RequiresPermission permission="devices.view">
              <DeviceTypesPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/movements"
          element={
            <RequiresPermission permission="devices.view">
              <MovementsPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/movements/new"
          element={
            <RequiresPermission permission="devices.view">
              <NewMovementPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/loans"
          element={
            <RequiresPermission permission="loans.view">
              <LoansPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/loans/new"
          element={
            <RequiresPermission permission="loans.view">
              <NewLoanPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/loans/:id"
          element={
            <RequiresPermission permission="loans.view">
              <LoanDetailPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/loans/:id/edit"
          element={
            <RequiresPermission permission="loans.view">
              <EditLoanPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/returns"
          element={
            <RequiresPermission permission="loans.view">
              <ReturnsPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/inventory/returns/new"
          element={
            <RequiresPermission permission="loans.view">
              <NewLoanReturnPage />
            </RequiresPermission>
          }
        />

        <Route path="/tickets" element={<TicketsListPage />} />
        <Route path="/tickets/kanban" element={<KanbanPage />} />
        <Route path="/tickets/my-tasks" element={<MyTasksPage />} />
        <Route
          path="/tickets/tasks"
          element={
            <RequiresPermission permission="tasks.complete">
              <AdminTasksPage />
            </RequiresPermission>
          }
        />
        <Route path="/tickets/new" element={<NewTicketPage />} />
        <Route
          path="/tickets/:id/edit"
          element={
            <RequiresPermission permission="tickets.edit">
              <EditTicketPage />
            </RequiresPermission>
          }
        />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />

        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/departments/:id" element={<DepartmentDetailPage />} />
        <Route path="/subareas" element={<SubareasPage />} />
        <Route
          path="/employees"
          element={
            <RequiresPermission permission="hr.records">
              <EmployeesListPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/employees/catalogs/documents"
          element={
            <RequiresPermission permission="hr.records">
              <DocumentCatalogPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/employees/:id/edit"
          element={
            <RequiresPermission permission="hr.records">
              <EmployeeProfileEditPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/employees/disciplinary-reports"
          element={
            <RequiresPermission permission="hr.records">
              <HrReportsPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/employees/disciplinary-reports/:id"
          element={
            <RequiresPermission permission="hr.records">
              <DisciplinaryReportDetailPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <RequiresPermission permission="hr.records">
              <EmployeeDetailPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/reports"
          element={
            <RequiresPermission permission="reports.view">
              <ReportsPage />
            </RequiresPermission>
          }
        />
        <Route path="/users" element={<UsersListPage />} />
        <Route path="/users/new" element={<UserFormPage />} />
        <Route path="/users/:id/edit" element={<UserFormPage />} />
        <Route path="/users/:id/history" element={<UserHistoryPage />} />
        <Route path="/users/import" element={<UserImportPage />} />
        <Route
          path="/catalogs"
          element={
            <RequiresPermission permission="catalogs.manage">
              <CatalogPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/roles"
          element={
            <RequiresPermission permission="roles.manage">
              <RolesPage />
            </RequiresPermission>
          }
        />
        <Route path="/notifications" element={<NotificationsPage />} />

        <Route
          path="/access"
          element={
            <RequiresPermission permission="access.log">
              <AccessPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/access/report"
          element={
            <RequiresPermission permission="access.log">
              <AccessReportPage />
            </RequiresPermission>
          }
        />
        {/* Reloj checador Hikvision (solo lectura; ver CHECADOR.md). */}
        <Route
          path="/access/time-clock"
          element={
            <RequiresPermission permission="time_clock.view">
              <TimeClockPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/access/time-clock/entries-exits"
          element={
            <RequiresPermission permission="time_clock.view">
              <TimeClockReportPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/access/time-clock/employees"
          element={
            <RequiresPermission permission="time_clock.view">
              <TimeClockEmployeesPage />
            </RequiresPermission>
          }
        />
        {/* Relojes checadores (Configuración): alta, baja y configuración en vivo. */}
        <Route
          path="/time-clocks"
          element={
            <RequiresPermission permission="time_clocks.manage">
              <TimeClocksPage />
            </RequiresPermission>
          }
        />

        <Route
          path="/schedules"
          element={
            <RequiresPermission permission="schedules.view">
              <SchedulesPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/schedules/new"
          element={
            <RequiresPermission permission="schedules.view">
              <ScheduleFormPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/schedules/:id/edit"
          element={
            <RequiresPermission permission="schedules.view">
              <ScheduleFormPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/schedules/assign"
          element={
            <RequiresPermission permission="schedules.view">
              <AssignSchedulesPage />
            </RequiresPermission>
          }
        />
        <Route
          path="/schedules/overtime/approval"
          element={
            <RequiresPermission permission="overtime.view">
              <OvertimeApprovalPage />
            </RequiresPermission>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
