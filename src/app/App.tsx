import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@modules/auth/pages/LoginPage";
import PrivateRoutes from "./guards/PrivateRoutes";
import HomePage from "@modules/home/pages/HomePage";
import CartasListPage from "@pages/cartas/CartasListPage";
import CartaEditorPage from "@pages/cartas/CartaEditorPage";
import CartaDetailPage from "@pages/cartas/CartaDetailPage";
import DevolverCartaPage from "@pages/cartas/DevolverCartaPage";
import InventoryIndexPage from "@pages/inventory/InventoryIndexPage";
import InventoryMovementsPage from "@pages/inventory/InventoryMovementsPage";
import NewInventoryMovementPage from "@pages/inventory/NewInventoryMovementPage";
import LocationsPage from "@pages/inventory/LocationsPage";
import GenerarCartasPage from "@pages/cartas/GenerarCartasPage";
import DevicesListPage from "@pages/device-list/DevicesListPage";
import DeviceFormPage from "@modules/devices/pages/DeviceFormPage";
import DeviceDetailPage from "@modules/devices/pages/DeviceDetailPage";
import DeviceTypesListPage from "@modules/device-types/pages/DeviceTypesListPage";
import DeviceTypeFormPage from "@modules/device-types/pages/DeviceTypeFormPage";
import DeviceImportPage from "@modules/devices/pages/DeviceImportPage";
import DepartmentsPage from "@pages/departments/DepartmentsPage";
import DepartmentDetailPage from "@pages/departments/DepartmentDetailPage";
import EmployeesListPage from "@pages/employees/EmployeesListPage";
import EmployeeFormPage from "@pages/employees/EmployeeFormPage";
import ReportesPage from "@modules/reports/pages/ReportesPage";
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
import NotificationsPage from "@modules/notifications/pages/NotificationsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoutes />}>
        <Route path="/" element={<HomePage />} />

        <Route path="/cartas" element={<CartasListPage />} />
        <Route path="/cartas/nueva" element={<CartaEditorPage />} />
        <Route path="/cartas/generar" element={<GenerarCartasPage />} />
        <Route path="/cartas/:id" element={<CartaDetailPage />} />
        <Route path="/cartas/:id/devolver" element={<DevolverCartaPage />} />

        <Route path="/tickets" element={<TicketsListPage />} />
        <Route path="/tickets/kanban" element={<KanbanPage />} />
        <Route path="/tickets/mis-tareas" element={<MisTareasPage />} />
        <Route path="/tickets/tareas" element={<AdminTareasPage />} />
        <Route path="/tickets/nuevo" element={<NewTicketPage />} />
        <Route path="/tickets/:id/editar" element={<EditTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />

        <Route path="/dispositivos" element={<DevicesListPage />} />
        <Route path="/dispositivos/nuevo" element={<DeviceFormPage />} />
        <Route path="/dispositivos/importar" element={<DeviceImportPage />} />
        <Route path="/dispositivos/:id" element={<DeviceDetailPage />} />
        <Route path="/dispositivos/:id/editar" element={<DeviceFormPage />} />
        <Route path="/dispositivos/tipos" element={<DeviceTypesListPage />} />
        <Route path="/dispositivos/tipos/nuevo" element={<DeviceTypeFormPage />} />
        <Route path="/dispositivos/tipos/:id/editar" element={<DeviceTypeFormPage />} />

        <Route path="/inventario" element={<InventoryIndexPage />} />
        <Route path="/inventario/movimientos" element={<InventoryMovementsPage />} />
        <Route path="/inventario/movimientos/nuevo" element={<NewInventoryMovementPage />} />
        <Route path="/inventario/ubicaciones" element={<LocationsPage />} />

        <Route path="/departamentos" element={<DepartmentsPage />} />
        <Route path="/departamentos/:id" element={<DepartmentDetailPage />} />
        <Route path="/empleados" element={<EmployeesListPage />} />
        <Route path="/empleados/:id/editar" element={<EmployeeFormPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/usuarios" element={<UsersListPage />} />
        <Route path="/usuarios/nuevo" element={<UserFormPage />} />
        <Route path="/usuarios/:id/editar" element={<UserFormPage />} />
        <Route path="/usuarios/:id/historial" element={<UserHistoryPage />} />
        <Route path="/usuarios/importar" element={<UserImportPage />} />
        <Route path="/notificaciones" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
