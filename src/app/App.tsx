import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@pages/auth/LoginPage";
import PrivateRoutes from "./guards/PrivateRoutes";
import RequierePermiso from "./guards/RequierePermiso";
import AccessPage from "@pages/access/AccessPage";
import AccessReportPage from "@pages/access/AccessReportPage";
import ChecadorPage from "@pages/access/ChecadorPage";
import ChecadorReportPage from "@pages/access/ChecadorReportPage";
import ChecadorEmpleadosPage from "@pages/access/ChecadorEmpleadosPage";
import ChecadorRelojesPage from "@pages/access/ChecadorRelojesPage";
import SchedulesPage from "@pages/schedules/SchedulesPage";
import ScheduleFormPage from "@pages/schedules/ScheduleFormPage";
import AssignSchedulesPage from "@pages/schedules/AssignSchedulesPage";
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
import RolesPage from "@pages/roles/RolesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoutes />}>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/inventario"
          element={
            <RequierePermiso permiso="dispositivos.ver">
              <DashboardPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/dispositivos"
          element={
            <RequierePermiso permiso="dispositivos.ver">
              <DispositivosPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/dispositivos/nuevo"
          element={
            <RequierePermiso permiso="dispositivos.ver">
              <DispositivoFormPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/dispositivos/:id"
          element={
            <RequierePermiso permiso="dispositivos.ver">
              <DispositivoDetailPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/dispositivos/:id/editar"
          element={
            <RequierePermiso permiso="dispositivos.ver">
              <EditDispositivoPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/tipos"
          element={
            <RequierePermiso permiso="dispositivos.ver">
              <TiposPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/movimientos"
          element={
            <RequierePermiso permiso="dispositivos.ver">
              <MovimientosPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/movimientos/nuevo"
          element={
            <RequierePermiso permiso="dispositivos.ver">
              <NewMovimientoPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/prestamos"
          element={
            <RequierePermiso permiso="prestamos.ver">
              <PrestamosPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/prestamos/nuevo"
          element={
            <RequierePermiso permiso="prestamos.ver">
              <NewPrestamoPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/prestamos/:id"
          element={
            <RequierePermiso permiso="prestamos.ver">
              <PrestamoDetailPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/prestamos/:id/editar"
          element={
            <RequierePermiso permiso="prestamos.ver">
              <EditPrestamoPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/devoluciones"
          element={
            <RequierePermiso permiso="prestamos.ver">
              <DevolucionesPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/inventario/devoluciones/nueva"
          element={
            <RequierePermiso permiso="prestamos.ver">
              <NewDevolucionPage />
            </RequierePermiso>
          }
        />

        <Route path="/tickets" element={<TicketsListPage />} />
        <Route path="/tickets/kanban" element={<KanbanPage />} />
        <Route path="/tickets/mis-tareas" element={<MisTareasPage />} />
        <Route
          path="/tickets/tareas"
          element={
            <RequierePermiso permiso="tareas.completar">
              <AdminTareasPage />
            </RequierePermiso>
          }
        />
        <Route path="/tickets/nuevo" element={<NewTicketPage />} />
        <Route
          path="/tickets/:id/editar"
          element={
            <RequierePermiso permiso="tickets.editar">
              <EditTicketPage />
            </RequierePermiso>
          }
        />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />

        <Route path="/departamentos" element={<DepartmentsPage />} />
        <Route path="/departamentos/:id" element={<DepartmentDetailPage />} />
        <Route path="/subareas" element={<SubareasPage />} />
        <Route
          path="/empleados"
          element={
            <RequierePermiso permiso="personal.expediente">
              <EmployeesListPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/empleados/catalogos/documentos"
          element={
            <RequierePermiso permiso="personal.expediente">
              <DocumentCatalogPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/empleados/:id/editar"
          element={
            <RequierePermiso permiso="personal.expediente">
              <EmployeeProfileEditPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/empleados/reportes"
          element={
            <RequierePermiso permiso="personal.expediente">
              <ReportesPersonalPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/empleados/reportes/:id"
          element={
            <RequierePermiso permiso="personal.expediente">
              <ActaDetailPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/empleados/:id"
          element={
            <RequierePermiso permiso="personal.expediente">
              <EmployeeDetailPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/reportes"
          element={
            <RequierePermiso permiso="reportes.ver">
              <ReportesPage />
            </RequierePermiso>
          }
        />
        <Route path="/usuarios" element={<UsersListPage />} />
        <Route path="/usuarios/nuevo" element={<UserFormPage />} />
        <Route path="/usuarios/:id/editar" element={<UserFormPage />} />
        <Route path="/usuarios/:id/historial" element={<UserHistoryPage />} />
        <Route path="/usuarios/importar" element={<UserImportPage />} />
        <Route
          path="/catalogos"
          element={
            <RequierePermiso permiso="catalogos.administrar">
              <CatalogPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/roles"
          element={
            <RequierePermiso permiso="roles.administrar">
              <RolesPage />
            </RequierePermiso>
          }
        />
        <Route path="/notificaciones" element={<NotificationsPage />} />

        <Route
          path="/access"
          element={
            <RequierePermiso permiso="acceso.bitacora">
              <AccessPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/access/report"
          element={
            <RequierePermiso permiso="acceso.bitacora">
              <AccessReportPage />
            </RequierePermiso>
          }
        />
        {/* Reloj checador Hikvision (solo lectura; ver CHECADOR.md). */}
        <Route
          path="/access/checador"
          element={
            <RequierePermiso permiso="checador.ver">
              <ChecadorPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/access/checador/entradas-salidas"
          element={
            <RequierePermiso permiso="checador.ver">
              <ChecadorReportPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/access/checador/empleados"
          element={
            <RequierePermiso permiso="checador.ver">
              <ChecadorEmpleadosPage />
            </RequierePermiso>
          }
        />
        {/* Relojes checadores (Configuración): alta, baja y configuración en vivo. */}
        <Route
          path="/relojes"
          element={
            <RequierePermiso permiso="relojes.administrar">
              <ChecadorRelojesPage />
            </RequierePermiso>
          }
        />

        <Route
          path="/horarios"
          element={
            <RequierePermiso permiso="horarios.ver">
              <SchedulesPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/horarios/nuevo"
          element={
            <RequierePermiso permiso="horarios.ver">
              <ScheduleFormPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/horarios/:id/editar"
          element={
            <RequierePermiso permiso="horarios.ver">
              <ScheduleFormPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/horarios/asignar"
          element={
            <RequierePermiso permiso="horarios.ver">
              <AssignSchedulesPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/horarios/horas-extra/aprobacion"
          element={
            <RequierePermiso permiso="horas_extra.ver">
              <OvertimeApprovalPage />
            </RequierePermiso>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
