import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@pages/auth/LoginPage";
import PrivateRoutes from "./guards/PrivateRoutes";
import RoleGuard from "./guards/RoleGuard";
import type { UserRole } from "@entities/user";
import AccessPage from "@pages/access/AccessPage";
import AccessReportPage from "@pages/access/AccessReportPage";
import ChecadorPage from "@pages/access/ChecadorPage";
import ChecadorReportPage from "@pages/access/ChecadorReportPage";
import ChecadorEmpleadosPage from "@pages/access/ChecadorEmpleadosPage";
import SchedulesPage from "@pages/schedules/SchedulesPage";
import ScheduleFormPage from "@pages/schedules/ScheduleFormPage";
import AssignSchedulesPage from "@pages/schedules/AssignSchedulesPage";
import OvertimePage from "@pages/schedules/OvertimePage";
import OvertimeApprovalPage from "@pages/overtime/OvertimeApprovalPage";
import HomePage from "@pages/home/HomePage";
import DashboardPage from "@pages/inventario/DashboardPage";
import DispositivosPage from "@pages/inventario/DispositivosPage";
import DispositivoFormPage from "@pages/inventario/DispositivoFormPage";
import EditDispositivoPage from "@pages/inventario/EditDispositivoPage";
import DispositivoDetailPage from "@pages/inventario/DispositivoDetailPage";
import TiposPage from "@pages/inventario/TiposPage";
import MovimientosPage from "@pages/inventario/MovimientosPage";
import NewMovimientoPage from "@pages/inventario/NewMovimientoPage";
import PrestamosPage from "@pages/inventario/PrestamosPage";
import NewPrestamoPage from "@pages/inventario/NewPrestamoPage";
import EditPrestamoPage from "@pages/inventario/EditPrestamoPage";
import PrestamoDetailPage from "@pages/inventario/PrestamoDetailPage";
import DevolucionesPage from "@pages/inventario/DevolucionesPage";
import NewDevolucionPage from "@pages/inventario/NewDevolucionPage";
import DepartmentsPage from "@pages/departments/DepartmentsPage";
import DepartmentDetailPage from "@pages/departments/DepartmentDetailPage";
import SubareasPage from "@pages/subareas/SubareasPage";
import EmployeesListPage from "@pages/employees/EmployeesListPage";
import EmployeeDetailPage from "@pages/employees/EmployeeDetailPage";
import EmployeeProfileEditPage from "@pages/employees/EmployeeProfileEditPage";
import ReportesPersonalPage from "@pages/employees/ReportesPersonalPage";
import ActaDetailPage from "@pages/employees/ActaDetailPage";
import DocumentCatalogPage from "@pages/employees/DocumentCatalogPage";
import ReportesPage from "@pages/reports/ReportesPage";
import UsersListPage from "@pages/users/UsersListPage";
import UserFormPage from "@pages/users/UserFormPage";
import UserHistoryPage from "@pages/users/UserHistoryPage";
import UserImportPage from "@pages/users/UserImportPage";
import TicketsListPage from "@pages/tickets/TicketsListPage";
import NewTicketPage from "@pages/tickets/NewTicketPage";
import TicketDetailPage from "@pages/tickets/TicketDetailPage";
import EditTicketPage from "@pages/tickets/EditTicketPage";
import KanbanPage from "@pages/tickets/KanbanPage";
import MisTareasPage from "@pages/tickets/MisTareasPage";
import AdminTareasPage from "@pages/tickets/AdminTareasPage";
import NotificationsPage from "@pages/notifications/NotificationsPage";
import CatalogPage from "@pages/catalog/CatalogPage";

/** Roles con acceso a la bitácora de accesos (ver ENTRADAS_SALIDAS.md §4). */
const ACCESS_READ_ROLES: UserRole[] = ["ADMIN", "GERENTE", "RECURSOS_HUMANOS"];
/** Roles que pueden aprobar tiempo extra. */
const OVERTIME_APPROVAL_ROLES: UserRole[] = ["ADMIN", "GERENTE"];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoutes />}>
        <Route path="/" element={<HomePage />} />

        <Route path="/inventario" element={<DashboardPage />} />
        <Route path="/inventario/dispositivos" element={<DispositivosPage />} />
        <Route path="/inventario/dispositivos/nuevo" element={<DispositivoFormPage />} />
        <Route path="/inventario/dispositivos/:id" element={<DispositivoDetailPage />} />
        <Route path="/inventario/dispositivos/:id/editar" element={<EditDispositivoPage />} />
        <Route path="/inventario/tipos" element={<TiposPage />} />
        <Route path="/inventario/movimientos" element={<MovimientosPage />} />
        <Route path="/inventario/movimientos/nuevo" element={<NewMovimientoPage />} />
        <Route path="/inventario/prestamos" element={<PrestamosPage />} />
        <Route path="/inventario/prestamos/nuevo" element={<NewPrestamoPage />} />
        <Route path="/inventario/prestamos/:id" element={<PrestamoDetailPage />} />
        <Route path="/inventario/prestamos/:id/editar" element={<EditPrestamoPage />} />
        <Route path="/inventario/devoluciones" element={<DevolucionesPage />} />
        <Route path="/inventario/devoluciones/nueva" element={<NewDevolucionPage />} />

        <Route path="/tickets" element={<TicketsListPage />} />
        <Route path="/tickets/kanban" element={<KanbanPage />} />
        <Route path="/tickets/mis-tareas" element={<MisTareasPage />} />
        <Route path="/tickets/tareas" element={<AdminTareasPage />} />
        <Route path="/tickets/nuevo" element={<NewTicketPage />} />
        <Route path="/tickets/:id/editar" element={<EditTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />

        <Route path="/departamentos" element={<DepartmentsPage />} />
        <Route path="/departamentos/:id" element={<DepartmentDetailPage />} />
        <Route path="/subareas" element={<SubareasPage />} />
        <Route path="/empleados" element={<EmployeesListPage />} />
        <Route path="/empleados/catalogos/documentos" element={<DocumentCatalogPage />} />
        <Route path="/empleados/:id/editar" element={<EmployeeProfileEditPage />} />
        <Route path="/empleados/reportes" element={<ReportesPersonalPage />} />
        <Route path="/empleados/reportes/:id" element={<ActaDetailPage />} />
        <Route path="/empleados/:id" element={<EmployeeDetailPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/usuarios" element={<UsersListPage />} />
        <Route path="/usuarios/nuevo" element={<UserFormPage />} />
        <Route path="/usuarios/:id/editar" element={<UserFormPage />} />
        <Route path="/usuarios/:id/historial" element={<UserHistoryPage />} />
        <Route path="/usuarios/importar" element={<UserImportPage />} />
        <Route path="/catalogos" element={<CatalogPage />} />
        <Route path="/notificaciones" element={<NotificationsPage />} />

        <Route
          path="/access"
          element={
            <RoleGuard roles={ACCESS_READ_ROLES}>
              <AccessPage />
            </RoleGuard>
          }
        />
        <Route
          path="/access/report"
          element={
            <RoleGuard roles={ACCESS_READ_ROLES}>
              <AccessReportPage />
            </RoleGuard>
          }
        />
        {/* Reloj checador Hikvision (solo lectura; ver CHECADOR.md). */}
        <Route
          path="/access/checador"
          element={
            <RoleGuard roles={ACCESS_READ_ROLES}>
              <ChecadorPage />
            </RoleGuard>
          }
        />
        <Route
          path="/access/checador/entradas-salidas"
          element={
            <RoleGuard roles={ACCESS_READ_ROLES}>
              <ChecadorReportPage />
            </RoleGuard>
          }
        />
        <Route
          path="/access/checador/empleados"
          element={
            <RoleGuard roles={ACCESS_READ_ROLES}>
              <ChecadorEmpleadosPage />
            </RoleGuard>
          }
        />

        <Route
          path="/horarios"
          element={
            <RoleGuard roles={ACCESS_READ_ROLES}>
              <SchedulesPage />
            </RoleGuard>
          }
        />
        <Route
          path="/horarios/nuevo"
          element={
            <RoleGuard roles={ACCESS_READ_ROLES}>
              <ScheduleFormPage />
            </RoleGuard>
          }
        />
        <Route
          path="/horarios/:id/editar"
          element={
            <RoleGuard roles={ACCESS_READ_ROLES}>
              <ScheduleFormPage />
            </RoleGuard>
          }
        />
        <Route
          path="/horarios/asignar"
          element={
            <RoleGuard roles={ACCESS_READ_ROLES}>
              <AssignSchedulesPage />
            </RoleGuard>
          }
        />
        <Route
          path="/horarios/horas-extra"
          element={
            <RoleGuard roles={ACCESS_READ_ROLES}>
              <OvertimePage />
            </RoleGuard>
          }
        />
        <Route
          path="/horarios/horas-extra/aprobacion"
          element={
            <RoleGuard roles={OVERTIME_APPROVAL_ROLES}>
              <OvertimeApprovalPage />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}